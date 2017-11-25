'use strict';

const _ = require('lodash');
const Datastore = require('nedb');

const client = require('../models/client');
const config = require('../../config');
const Feed = require('../models/Feed');
const NotificationService = require('./notificationService');

class FeedService {
  constructor() {
    this.db = {};
    this.feeds = {};
    this.isDBReady = new Set();
    this.rules = {};
  }

  addFeed(userId, feed, callback) {
    this.addItem(userId, 'feed', feed, (newFeed) => {
      this.startNewFeed(userId, newFeed);
      callback(newFeed);
    });
  }

  addItem(userId, type, item, callback) {
    this.loadDatabase(userId);

    if (!this.isDBReady.has(userId)) {
      return;
    }

    this.db[userId].insert(Object.assign(item, {type}), (err, newDoc) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(newDoc);
    });
  }

  addRule(userId, rule, callback) {
    this.addItem(userId, 'rule', rule, (newRule, error) => {
      if (error) {
        callback(null, error);
        return;
      }

      callback(newRule);

      if (this.rules[userId][newRule.feedID] == null) {
        this.rules[userId][newRule.feedID] = [];
      }

      this.rules[userId][newRule.feedID].push(newRule);

      const associatedFeed = this.feeds[userId].find((feed) => {
        return feed.options._id === newRule.feedID;
      });

      if (associatedFeed) {
        this.handleNewItems(userId, {
          feed: associatedFeed.options,
          items: associatedFeed.getItems()
        });
      }
    });
  }

  getAll(userId, query, callback) {
    this.loadDatabase(userId);

    query = query || {};

    this.db[userId].find({}, (err, docs) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(docs.reduce((memo, item) => {
        let type = `${item.type}s`;

        if (memo[type] == null) {
          memo[type] = [];
        }

        memo[type].push(item);

        return memo;
      }, {}));
    });
  }

  getFeeds(userId, query, callback) {
    this.queryItem(userId, 'feed', query, callback);
  }

  getItemsMatchingRules(feedItems, rules, feed) {
    return feedItems.reduce(
      (matchedItems, feedItem) => {
        rules.forEach(rule => {
          const isMatched = (new RegExp(rule.match, 'gi')).test(feedItem[rule.field]);
          const isExcluded = rule.exclude !== '' && (new RegExp(rule.exclude, 'gi')).test(feedItem[rule.field]);

          if (isMatched && !isExcluded) {
            const torrentUrls = this.getTorrentUrlsFromItem(feedItem);
            const isAlreadyDownloaded = matchedItems.some(matchedItem => {
              return torrentUrls.every(url => matchedItem.urls.includes(url));
            });

            if (!isAlreadyDownloaded) {
              matchedItems.push({
                urls: torrentUrls,
                tags: rule.tags,
                feedID: rule.feedID,
                feedLabel: feed.label,
                matchTitle: feedItem.title,
                ruleID: rule._id,
                ruleLabel: rule.label,
                destination: rule.destination,
                startOnLoad: rule.startOnLoad
              });
            }
          }
        });

        return matchedItems;
      },
      []
    );
  }

  getPreviouslyMatchedUrls(userId) {
    return new Promise((resolve, reject) => {
      this.db[userId].find({type: 'matchedTorrents'}, (err, docs) => {
        if (err) {
          reject(err);
        }

        resolve(docs.reduce((matchedUrls, doc) => matchedUrls.concat(doc.urls), []));
      });
    });
  }

  getRules(userId, query, callback) {
    this.queryItem(userId, 'rule', query, callback);
  }

  // TODO: Allow users to specify which key contains the URLs.
  getTorrentUrlsFromItem(feedItem) {
    // If we've got an Array of enclosures, we'll iterate over the values and
    // look for the url key.
    if (feedItem.enclosures && Array.isArray(feedItem.enclosures)) {
      return feedItem.enclosures.reduce(
        (urls, enclosure) => {
          if (enclosure.url) {
            urls.push(enclosure.url);
          }

          return urls;
        },
        []
      );
    }

    // If there are no enclosures, then use the link tag instead
    if (feedItem.link) {
      return [feedItem.link];
    }

    return [];
  }

  getUrlsFromItems(feedItems) {
    return feedItems.reduce((urls, feedItem) => urls.concat(feedItem.urls), []);
  }

  handleNewItems(userId, {items: feedItems, feed}) {
    this.getPreviouslyMatchedUrls(userId)
      .then(previouslyMatchedUrls => {
        const applicableRules = this.rules[userId][feed._id];
        if (!applicableRules) return;

        const itemsMatchingRules = this.getItemsMatchingRules(feedItems, applicableRules, feed);
        const itemsToDownload = itemsMatchingRules.filter(item => {
          return item.urls.some(url => !previouslyMatchedUrls.includes(url));
        });

        const lastAddUrlCallback = () => {
          const urlsToAdd = this.getUrlsFromItems(itemsToDownload);

          this.db[userId].update(
            {type: 'matchedTorrents'},
            {$push: {urls: {$each: urlsToAdd}}},
            {upsert: true}
          );

          const notificationService = new NotificationService(userId);
          notificationService.addNotification(itemsToDownload.map(item => {
            return {
              id: 'notification.feed.downloaded.torrent',
              data: {
                feedLabel: item.feedLabel,
                ruleLabel: item.ruleLabel,
                title: item.matchTitle
              }
            };
          }));
        };

        itemsToDownload.forEach((item, index) => {
          client.addUrls(
            userId,
            {
              urls: item.urls,
              destination: item.destination,
              start: item.startOnLoad,
              tags: item.tags
            },
            () => {
              if (index === itemsToDownload.length - 1) {
                lastAddUrlCallback();
              }

              this.db[userId].update(
                {_id: item.ruleID},
                {$inc: {count: 1}},
                {upsert: true}
              );

              this.db[userId].update(
                {_id: item.feedID},
                {$inc: {count: 1}},
                {upsert: true}
              );
            }
          );
        });
      })
      .catch(console.error);
  }

  init(userId) {
    this.feeds[userId] = [];
    this.rules[userId] = {};
    this.db[userId].find({}, (err, docs) => {
      if (err) {
        return;
      }

      // Create two arrays, one for feeds and one for rules.
      const feedsSummary = docs.reduce((accumulator, doc) => {
        if (doc.type === 'feed' || doc.type === 'rule') {
          accumulator[`${doc.type}s`].push(doc);
        }

        return accumulator;
      }, {feeds: [], rules: []});

      // Add all download rules to the local state.
      feedsSummary.rules.forEach((rule) => {
        if (this.rules[userId][rule.feedID] == null) {
          this.rules[userId][rule.feedID] = [];
        }

        this.rules[userId][rule.feedID].push(rule);
      });

      // Initiate all feeds.
      feedsSummary.feeds.forEach((feed) => {
        this.startNewFeed(userId, feed);
      });
    });
  }

  isAlreadyDownloaded(torrentURLs, downloadedTorrents) {
    torrentURLs = _.castArray(torrentURLs);

    return downloadedTorrents.urls && downloadedTorrents.urls.some(url => {
      return torrentURLs.includes(url);
    });
  }

  loadDatabase(userId) {
    if (this.isDBReady.has(userId)) {
      return;
    }

    let dbPath = `${config.dbPath}${userId}/`;

    let db = new Datastore({
      autoload: true,
      filename: `${dbPath}settings/feeds.db`
    });

    this.db[userId] = db;

    this.isDBReady.add(userId);

    this.init(userId);
  }

  queryItem(userId, type, query, callback) {
    this.loadDatabase(userId);

    query = query || {};

    this.db[userId].find(Object.assign(query, {type}), (err, docs) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(docs);
    });
  }

  removeItem(userId, id, callback) {
    this.loadDatabase(userId);

    let indexToRemove = -1;
    let itemToRemove = this.feeds[userId].find((feed, index) => {
      indexToRemove = index;
      return feed.options._id === id;
    });

    if (itemToRemove != null) {
      itemToRemove.stopReader();
      this.feeds[userId].splice(indexToRemove, 1);
    }

    this.db[userId].remove({_id: id}, {}, (err, docs) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(docs);
    });
  }

  startNewFeed(userId, feedConfig) {
    feedConfig.onNewItems = this.handleNewItems.bind(this);
    this.feeds[userId].push(new Feed(userId, feedConfig));
  }
}

module.exports = new FeedService();
