const deepEqual = require('deep-equal');
const EventEmitter = require('events');

const clientRequestService = require('./clientRequestService');
const clientRequestServiceEvents = require('../constants/clientRequestServiceEvents');
const config = require('../../config');
const formatUtil = require('../../shared/util/formatUtil');
const methodCallUtil = require('../util/methodCallUtil');
const ServicesHandler = require('./servicesHandler');
const serverEventTypes = require('../../shared/constants/serverEventTypes');
const torrentListPropMap = require('../constants/torrentListPropMap');
const torrentServiceEvents = require('../constants/torrentServiceEvents');
const torrentStatusMap = require('../../shared/constants/torrentStatusMap');

const torrentListMethodCallConfig = methodCallUtil
  .getMethodCallConfigFromPropMap(torrentListPropMap);

class TorrentService extends EventEmitter {
  constructor(userId, ...args) {
    super(...args);

    this.userId = userId;
    this.enableDefer = false;

    this.errorCount = 0;
    this.pollTimeout = null;
    this.torrentListSummary = {torrents: {}};

    this.fetchTorrentList = this.fetchTorrentList.bind(this);
    this.handleTorrentProcessed = this.handleTorrentProcessed.bind(this);
    this.handleTorrentsRemoved = this.handleTorrentsRemoved.bind(this);

    clientRequestService.addTorrentListReducer({
      key: 'status',
      reduce: this.getTorrentStatusFromDetails
    });

    clientRequestService.addTorrentListReducer({
      key: 'percentComplete',
      reduce: this.getTorrentPercentCompleteFromDetails
    });

    clientRequestService.addTorrentListReducer({
      key: 'eta',
      reduce: this.getTorrentETAFromDetails
    });

    clientRequestService.on(
      clientRequestServiceEvents.PROCESS_TORRENT,
      this.handleTorrentProcessed
    );

    clientRequestService.on(
      clientRequestServiceEvents.TORRENTS_REMOVED,
      this.handleTorrentsRemoved
    );
  }

  assignDeletedTorrentsToDiff(diff, nextTorrentListSummary, options = {}) {
    const {newTorrentCount = 0} = options;

    // We need to look for deleted torrents in two scenarios:
    // 1. the next list length is less than than the current length
    // 2. at least one new torrent was added and the next list length is
    //    equal to or greater than the current list length.
    //
    // We definitely don't need to look for deleted torrents if the number
    // of new torrents is equal to the difference between next torrent list
    // length and previous torrent list length.
    let shouldLookForDeletedTorrents = nextTorrentListSummary.length <
      this.torrentListSummary.length;

    if (newTorrentCount > 0) {
      if (nextTorrentListSummary.length >= this.torrentListSummary.length) {
        shouldLookForDeletedTorrents = true;
      }

      if (
        newTorrentCount === nextTorrentListSummary.length -
          this.torrentListSummary.length
      ) {
        shouldLookForDeletedTorrents = false;
      }
    }

    if (shouldLookForDeletedTorrents) {
       Object.keys(this.torrentListSummary.torrents).forEach(
        (hash) => {
          if (nextTorrentListSummary.torrents[hash] == null) {
            diff[hash] = {
              action: serverEventTypes.TORRENT_LIST_ACTION_TORRENT_DELETED
            };
          }
        },
        {}
      );
    }
  }

  deferFetchTorrentList(
    interval = (config.torrentClientPollInterval || 2000)
  ) {
    if (!this.enableDefer) {
      return;
    }

    this.pollTimeout = setTimeout(this.fetchTorrentList.bind(this), interval);
  }

  setEnableDefer(flag) {
    this.enableDefer = flag;
  }

  fetchTorrentList() {
    if (this.pollTimeout != null) {
      clearTimeout(this.pollTimeout);
    }

    return clientRequestService
      .fetchTorrentList(this.userId, torrentListMethodCallConfig)
      .then(this.handleFetchTorrentListSuccess.bind(this))
      .catch(this.handleFetchTorrentListError.bind(this));
  }

  getTorrentETAFromDetails(torrentDetails) {
    const {downRate, bytesDone, sizeBytes} = torrentDetails;

    if (downRate > 0) {
      return formatUtil.secondsToDuration((sizeBytes - bytesDone) / downRate);
    }

    return Infinity;
  }

  getTorrentPercentCompleteFromDetails(torrentDetails) {
    const percentComplete = (
      torrentDetails.bytesDone / torrentDetails.sizeBytes * 100
    );

    if (percentComplete > 0 && percentComplete < 10) {
      return Number(percentComplete.toFixed(2));
    } else if (percentComplete > 10 && percentComplete < 100) {
      return Number(percentComplete.toFixed(1));
    }

    return percentComplete;
  }

  getTorrentStatusFromDetails(torrentDetails) {
    const {
      isHashChecking,
      isComplete,
      isOpen,
      upRate,
      downRate,
      state,
      message
    } = torrentDetails;

    const torrentStatus = [];

    if (isHashChecking) {
      torrentStatus.push(torrentStatusMap.checking);
    } else if (isComplete && isOpen && state === '1') {
      torrentStatus.push(torrentStatusMap.complete);
      torrentStatus.push(torrentStatusMap.seeding);
    } else if (isComplete && isOpen && state === '0') {
      torrentStatus.push(torrentStatusMap.stopped);
    } else if (isComplete && !isOpen) {
      torrentStatus.push(torrentStatusMap.stopped);
      torrentStatus.push(torrentStatusMap.complete);
    } else if (!isComplete && isOpen && state === '1') {
      torrentStatus.push(torrentStatusMap.downloading);
    } else if (!isComplete && isOpen && state === '0') {
      torrentStatus.push(torrentStatusMap.stopped);
    } else if (!isComplete && !isOpen) {
      torrentStatus.push(torrentStatusMap.stopped);
    }

    if (message.length) {
      torrentStatus.push(torrentStatusMap.error);
    }

    if (upRate !== 0) {
      torrentStatus.push(torrentStatusMap.activelyUploading);
    }

    if (downRate !== 0) {
      torrentStatus.push(torrentStatusMap.activelyDownloading);
    }

    if (upRate !== 0 || downRate !== 0) {
      torrentStatus.push(torrentStatusMap.active);
    } else {
      torrentStatus.push(torrentStatusMap.inactive);
    }

    return torrentStatus;
  }

  getTorrent(hash) {
    return this.torrentListSummary.torrents[hash];
  }

  getTorrentList() {
    return this.torrentListSummary;
  }

  getTorrentListDiff(nextTorrentListSummary) {
    let newTorrentCount = 0;

    // Get the diff...
    const diff = Object.keys(nextTorrentListSummary.torrents).reduce(
      (accumulator, hash) => {
        const currentTorrentDetails = this.torrentListSummary.torrents[hash];
        const nextTorrentDetails = nextTorrentListSummary.torrents[hash];

        // If the current torrent list doesn't contain any details for this
        // hash, then it's a brand new torrent, so every detail is part of the
        // diff.
        if (currentTorrentDetails == null) {
          accumulator[hash] = {
            action: serverEventTypes.TORRENT_LIST_ACTION_TORRENT_ADDED,
            data: nextTorrentDetails
          };

          // Track the number of new torrents added.
          newTorrentCount++;
        } else {
          Object.keys(nextTorrentDetails).forEach((propKey) => {
            // If one of the details is inequal, we need to add it to the diff.
            if (!deepEqual(
                currentTorrentDetails[propKey],
                nextTorrentDetails[propKey]
              )) {
              // Initialize with an empty object when this is the first known
              // inequal property.
              if (accumulator[hash] == null) {
                accumulator[hash] = {
                  action: (
                    serverEventTypes.TORRENT_LIST_ACTION_TORRENT_DETAIL_UPDATED
                  ),
                  data: {}
                };
              }

              // Add the diff details.
              accumulator[hash].data[propKey] = nextTorrentDetails[propKey];
            }
          });
        }

        return accumulator;
      },
      {}
    );

    this.assignDeletedTorrentsToDiff(
      diff,
      nextTorrentListSummary,
      {newTorrentCount}
    );

    return diff;
  }

  handleFetchTorrentListError(error) {
    let nextInterval = config.torrentClientPollInterval || 2000;

    // If more than consecutive errors have occurred, then we delay the next
    // request.
    if (++this.errorCount >= 3) {
      nextInterval = Math.max(
        nextInterval + this.errorCount * nextInterval / 4,
        1000 * 60
      );
    }

    this.deferFetchTorrentList(nextInterval);

    this.emit(torrentServiceEvents.FETCH_TORRENT_LIST_ERROR);
  }

  getTorrentListSummary() {
    if (!this.torrentListSummary) {
      this.torrentListSummary = {torrents: {}};
    }

    return this.torrentListSummary;
  }

  handleFetchTorrentListSuccess(nextTorrentListSummary) {
    const diff = this.getTorrentListDiff(nextTorrentListSummary);
    if (Object.keys(diff).length > 0) {
      this.emit(
        torrentServiceEvents.TORRENT_LIST_DIFF_CHANGE,
        {diff, id: nextTorrentListSummary.id}
      );
    }

    this.torrentListSummary = nextTorrentListSummary;

    this.deferFetchTorrentList();

    this.errorCount = 0;
    this.emit(torrentServiceEvents.FETCH_TORRENT_LIST_SUCCESS);
  }

  handleTorrentProcessed(userId, nextTorrentDetails) {
    if (userId !== this.userId) {
      return;
    }

    const prevTorrentDetails = (
      this.torrentListSummary.torrents[nextTorrentDetails.hash]
    );

    if (this.hasTorrentFinished(prevTorrentDetails, nextTorrentDetails)) {
      const notificationService = ServicesHandler.getNotificationService(this.userId);
      notificationService.addNotification({
        id: 'notification.torrent.finished',
        data: {name: nextTorrentDetails.name}
      });
    }
  }

  hasTorrentFinished(prevData = {}, nextData = {}) {
    const {status = []} = prevData;

    return (
      !(status.includes(torrentStatusMap.checking))
      && prevData.percentComplete < 100
      && nextData.percentComplete === 100
    );
  }

  handleTorrentsRemoved(userId) {
    if (userId !== this.userId) {
      return;
    }

    this.fetchTorrentList();
  }
}

module.exports = TorrentService;
