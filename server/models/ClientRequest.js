/**
 * This file is deprecated in favor of clientGatewayService.
 */
const mkdirp = require('mkdirp');
const mv = require('mv');
const path = require('path');
const util = require('util');

const clientSettingsMap = require('../../shared/constants/clientSettingsMap');
const rTorrentPropMap = require('../util/rTorrentPropMap');
const torrentStatusMap = require('../../shared/constants/torrentStatusMap');

class ClientRequest {
  constructor(user, services, options) {
    options = options || {};

    this.services = services;
    this.user = user;
    this.clientRequestManager = this.services.clientRequestManager;

    this.onCompleteFn = null;
    this.postProcessFn = null;
    this.requests = [];

    if (options.onComplete) {
      this.onCompleteFn = options.onComplete;
    }

    if (options.postProcess) {
      this.postProcessFn = options.postProcess;
    }

    if (options.name) {
      this.name = options.name;
    }
  }

  addTagsToRequest(tagsArr, requestParameters) {
    if (tagsArr && tagsArr.length) {
      const tags = tagsArr
        .reduce((accumulator, currentTag) => {
          const tag = encodeURIComponent(currentTag.trim());

          if (tag !== '' && accumulator.indexOf(tag) === -1) {
            accumulator.push(tag);
          }

          return accumulator;
        }, [])
        .join(',');

      requestParameters.push(`d.custom1.set="${tags}"`);
    }

    return requestParameters;
  }

  clearRequestQueue() {
    this.requests = [];
  }

  getEnsuredArray(item) {
    if (!util.isArray(item)) {
      return [item];
    }
    return item;
  }

  getMethodCall(methodName, params) {
    params = params || [];
    return {methodName, params};
  }

  handleError(error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(
        `Connection refused at ${error.address}${error.port ? `:${error.port}` : ''}. ` +
          'Check these values in config.js and ensure that rTorrent is running.',
      );
    }

    this.clearRequestQueue();

    if (this.onCompleteFn) {
      this.onCompleteFn(null, error);
    }
  }

  handleSuccess(data) {
    let response = data;

    this.clearRequestQueue();

    if (this.postProcessFn) {
      response = this.postProcessFn(data);
    }

    if (this.onCompleteFn) {
      this.onCompleteFn(response);
    }
  }

  onComplete(fn) {
    this.onCompleteFn = fn;
  }

  postProcess(fn) {
    this.postProcessFn = fn;
  }

  send() {
    const handleSuccess = this.handleSuccess.bind(this);
    const handleError = this.handleError.bind(this);

    this.clientRequestManager
      .methodCall('system.multicall', [this.requests])
      .then(handleSuccess)
      .catch(handleError);
  }

  // TODO: Separate these and add support for additional clients.
  // rTorrent method calls.
  addFiles(options) {
    const files = this.getEnsuredArray(options.files);
    const path = options.path;
    const isBasePath = options.isBasePath;
    const start = options.start;
    const tagsArr = options.tags;

    files.forEach(file => {
      let methodCall = 'load.raw_start';
      let parameters = ['', file.buffer];
      const timeAdded = Math.floor(Date.now() / 1000);

      if (path) {
        if (isBasePath) {
          parameters.push(`d.directory_base.set="${path}"`);
        } else {
          parameters.push(`d.directory.set="${path}"`);
        }
      }

      parameters = this.addTagsToRequest(tagsArr, parameters);

      parameters.push(`d.custom.set=x-filename,${file.originalname}`);
      parameters.push(`d.custom.set=addtime,${timeAdded}`);

      // The start value is a string because it was appended to a FormData
      // object.
      if (start === 'false') {
        methodCall = 'load.raw';
      }

      this.requests.push(this.getMethodCall(methodCall, parameters));
    });
  }

  addURLs(options) {
    const path = options.path;
    const isBasePath = options.isBasePath;
    const start = options.start;
    const tagsArr = options.tags;
    const urls = this.getEnsuredArray(options.urls);

    urls.forEach(url => {
      let methodCall = 'load.start';
      let parameters = ['', url];
      const timeAdded = Math.floor(Date.now() / 1000);

      if (path) {
        if (isBasePath) {
          parameters.push(`d.directory_base.set="${path}"`);
        } else {
          parameters.push(`d.directory.set="${path}"`);
        }
      }

      parameters = this.addTagsToRequest(tagsArr, parameters);

      parameters.push(`d.custom.set=addtime,${timeAdded}`);

      if (!start) {
        methodCall = 'load.normal';
      }

      this.requests.push(this.getMethodCall(methodCall, parameters));
    });
  }

  checkHash(options) {
    const torrentService = this.services.torrentService;
    const hashes = this.getEnsuredArray(options.hashes);
    const stoppedHashes = hashes.filter(hash =>
      torrentService.getTorrent(hash).status.includes(torrentStatusMap.stopped),
    );

    const hashesToStart = [];

    this.stopTorrents({hashes});

    hashes.forEach(hash => {
      this.requests.push(this.getMethodCall('d.check_hash', [hash]));

      if (!stoppedHashes.includes(hash)) {
        hashesToStart.push(hash);
      }
    });

    if (hashesToStart.length) {
      this.startTorrents({hashes: hashesToStart});
    }
  }

  createDirectory(options) {
    if (options.path) {
      mkdirp(options.path, error => {
        if (error) {
          console.trace('Error creating directory.', error);
        }
      });
    }
  }

  fetchSettings(options) {
    let requestedSettings = [];

    if (options.requestedSettings) {
      requestedSettings = options.requestedSettings;
    } else {
      requestedSettings = clientSettingsMap.defaults.map(settingsKey => clientSettingsMap[settingsKey]);
    }

    // Ensure client's response gets mapped to the correct requested keys.
    if (options.setRequestedKeysArr) {
      options.setRequestedKeysArr(requestedSettings);
    }

    requestedSettings.forEach(settingsKey => {
      this.requests.push(this.getMethodCall(settingsKey));
    });
  }

  getTorrentDetails(options) {
    const peerParams = [options.hash, ''].concat(options.peerProps);
    const fileParams = [options.hash, ''].concat(options.fileProps);
    const trackerParams = [options.hash, ''].concat(options.trackerProps);

    this.requests.push(this.getMethodCall('p.multicall', peerParams));
    this.requests.push(this.getMethodCall('f.multicall', fileParams));
    this.requests.push(this.getMethodCall('t.multicall', trackerParams));
  }

  getTorrentList(options) {
    this.requests.push(this.getMethodCall('d.multicall2', options.props));
  }

  getTransferData(options) {
    Object.keys(rTorrentPropMap.transferData).forEach(key => {
      this.requests.push(this.getMethodCall(rTorrentPropMap.transferData[key]));
    });
  }

  listMethods(options) {
    const args = this.getEnsuredArray(options.args);
    this.requests.push(this.getMethodCall(options.method, [args]));
  }

  moveTorrents(options) {
    const destinationPath = options.destinationPath;
    const filenames = this.getEnsuredArray(options.filenames);
    const sourcePaths = this.getEnsuredArray(options.sourcePaths);

    sourcePaths.forEach((source, index) => {
      let callback = () => {};
      const destination = `${destinationPath}${path.sep}${filenames[index]}`;
      const isLastRequest = index + 1 === sourcePaths.length;

      if (isLastRequest) {
        callback = this.handleSuccess.bind(this);
      }

      if (source !== destination) {
        mv(source, destination, {mkdirp: true}, callback);
      } else if (isLastRequest) {
        callback();
      }
    });
  }

  setDownloadPath(options) {
    const hashes = this.getEnsuredArray(options.hashes);

    let pathMethod;
    if (options.isBasePath) {
      pathMethod = 'd.directory_base.set';
    } else {
      pathMethod = 'd.directory.set';
    }

    hashes.forEach(hash => {
      this.requests.push(this.getMethodCall(pathMethod, [hash, options.path]));
      this.requests.push(this.getMethodCall('d.open', [hash]));
      this.requests.push(this.getMethodCall('d.close', [hash]));
    });
  }

  setFilePriority(options) {
    const fileIndices = this.getEnsuredArray(options.fileIndices);
    const hashes = this.getEnsuredArray(options.hashes);

    hashes.forEach(hash => {
      fileIndices.forEach(fileIndex => {
        this.requests.push(this.getMethodCall('f.priority.set', [`${hash}:f${fileIndex}`, options.priority]));
      });
      this.requests.push(this.getMethodCall('d.update_priorities', [hash]));
    });
  }

  setPriority(options) {
    const hashes = this.getEnsuredArray(options.hashes);

    hashes.forEach(hash => {
      this.requests.push(this.getMethodCall('d.priority.set', [hash, options.priority]));
      this.requests.push(this.getMethodCall('d.update_priorities', [hash]));
    });
  }

  setSettings(options) {
    const settings = this.getEnsuredArray(options.settings);

    settings.forEach(setting => {
      if (setting.overrideLocalSetting) {
        this.requests.push(this.getMethodCall(setting.id, setting.data));
      } else {
        this.requests.push(this.getMethodCall(`${clientSettingsMap[setting.id]}.set`, ['', setting.data]));
      }
    });
  }

  setTaxonomy(options) {
    const methodName = 'd.custom1.set';

    const tags = options.tags
      .reduce((memo, currentTag) => {
        const tag = encodeURIComponent(currentTag.trim());

        if (tag !== '' && memo.indexOf(tag) === -1) {
          memo.push(tag);
        }

        return memo;
      }, [])
      .join(',');

    this.getEnsuredArray(options.hashes).forEach(hash => {
      this.requests.push(this.getMethodCall(methodName, [hash, tags]));
    });
  }

  setThrottle(options) {
    let methodName = 'throttle.global_down.max_rate.set';
    if (options.direction === 'upload') {
      methodName = 'throttle.global_up.max_rate.set';
    }
    this.requests.push(this.getMethodCall(methodName, ['', options.throttle]));
  }

  startTorrents(options) {
    if (!options.hashes) {
      console.error("startTorrents requires key 'hashes'.");
      return;
    }

    this.getEnsuredArray(options.hashes).forEach(hash => {
      this.requests.push(this.getMethodCall('d.open', [hash]));
      this.requests.push(this.getMethodCall('d.start', [hash]));
    });
  }

  stopTorrents(options) {
    if (!options.hashes) {
      console.error("stopTorrents requires key 'hashes'.");
      return;
    }

    this.getEnsuredArray(options.hashes).forEach(hash => {
      this.requests.push(this.getMethodCall('d.stop', [hash]));
      this.requests.push(this.getMethodCall('d.close', [hash]));
    });
  }
}

module.exports = ClientRequest;
