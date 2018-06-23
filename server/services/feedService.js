'use strict';
const _ = require('lodash');
const Datastore = require('nedb');

const client = require('../models/client');
const config = require('../../config');
const Feed = require('../models/Feed');
const notificationService = require('./notificationService');

class FeedService {
  constructor() {
    this.feeds = [];
    this.isDBReady = false;
    this.rules = {};
    this.db = this.loadDatabase();

    this.init();
  }

  addFeed(feed, callback) {
    this.addItem('feed', feed, (newFeed) => {
      this.startNewFeed(newFeed);
      callback(newFeed);
    });
  }

  modifyFeed(id, feed, callback) {
    let modifiedFeed = this.feeds.find( (feed) => {
      return feed.options._id === id;
    });
    modifiedFeed.stopReader();
    modifiedFeed.modify(feed);
    this.modifyItem(id, feed, (err) => {
      callback(err);
    });
  }

  addItem(type, item, callback) {
    if (!this.isDBReady) {
      return;
    }

    this.db.insert(Object.assign(item, {type}), (err, newDoc) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(newDoc);
    });
  }

  modifyItem(id, newItem, callback) {
    if (!this.isDBReady) {
      return;
    }

    this.db.update({_id: id}, {$set: newItem}, {}, (err) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(null);
    });
  }

  addRule(rule, callback) {
    this.addItem('rule', rule, (newRule, error) => {
      if (error) {
        callback(null, error);
        return;
      }

      callback(newRule);

      if (this.rules[newRule.feedID] == null) {
        this.rules[newRule.feedID] = [];
      }

      this.rules[newRule.feedID].push(newRule);

      const associatedFeed = this.feeds.find((feed) => {
        return feed.options._id === newRule.feedID;
      });

      if (associatedFeed) {
        this.handleNewItems({
          feed: associatedFeed.options,
          items: associatedFeed.getItems()
        });
      }
    });
  }

  getAll(query, callback) {
    query = query || {};

    this.db.find({}, (err, docs) => {
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

  getFeeds(query, callback) {
    this.queryItem('feed', query, callback);
  }

  getItems(query, callback) {
    let feed = this.feeds.find((feed)=>{
      return (feed.options._id===query.id);
    });

    if (feed){
      if (query.search){
        callback(feed.getItems().filter( (item) => {
          return (item.title.toLowerCase().indexOf(query.search.toLowerCase()) !== -1);
        }));
      } else {
        callback(feed.getItems());
      }
    } else {
      callback(null);
    }
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

  getPreviouslyMatchedUrls() {
    return new Promise((resolve, reject) => {
      this.db.find({type: 'matchedTorrents'}, (err, docs) => {
        if (err) {
          reject(err);
        }

        resolve(docs.reduce((matchedUrls, doc) => matchedUrls.concat(doc.urls), []));
      });
    });
  }

  getRules(query, callback) {
    this.queryItem('rule', query, callback);
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

    // If we've got a Object of enclosures, use url key
    if (feedItem.enclosure && feedItem.enclosure.url) {
      return [feedItem.enclosure.url];
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

  handleNewItems({items: feedItems, feed}) {
    this.getPreviouslyMatchedUrls()
      .then(previouslyMatchedUrls => {
        const applicableRules = this.rules[feed._id];
        if (!applicableRules) return;

        const itemsMatchingRules = this.getItemsMatchingRules(feedItems, applicableRules, feed);
        const itemsToDownload = itemsMatchingRules.filter(item => {
          return item.urls.some(url => !previouslyMatchedUrls.includes(url));
        });

        const lastAddUrlCallback = () => {
          const urlsToAdd = this.getUrlsFromItems(itemsToDownload);

          this.db.update(
            {type: 'matchedTorrents'},
            {$push: {urls: {$each: urlsToAdd}}},
            {upsert: true}
          );

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

              this.db.update(
                {_id: item.ruleID},
                {$inc: {count: 1}},
                {upsert: true}
              );

              this.db.update(
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

  init() {
    this.db.find({}, (err, docs) => {
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
        if (this.rules[rule.feedID] == null) {
          this.rules[rule.feedID] = [];
        }

        this.rules[rule.feedID].push(rule);
      });

      // Initiate all feeds.
      feedsSummary.feeds.forEach((feed) => {
        this.startNewFeed(feed);
      });
    });
  }

  isAlreadyDownloaded(torrentURLs, downloadedTorrents) {
    torrentURLs = _.castArray(torrentURLs);

    return downloadedTorrents.urls && downloadedTorrents.urls.some(url => {
      return torrentURLs.includes(url);
    });
  }

  loadDatabase() {
    let db = new Datastore({
      autoload: true,
      filename: `${config.dbPath}settings/feeds.db`
    });

    this.isDBReady = true;
    return db;
  }

  queryItem(type, query, callback) {
    query = query || {};

    this.db.find(Object.assign(query, {type}), (err, docs) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(docs);
    });
  }

  removeItem(id, callback) {
    let indexToRemove = -1;
    let itemToRemove = this.feeds.find((feed, index) => {
      indexToRemove = index;
      return feed.options._id === id;
    });

    if (itemToRemove != null) {
      itemToRemove.stopReader();
      this.feeds.splice(indexToRemove, 1);
    }

    this.db.remove({_id: id}, {}, (err, docs) => {
      if (err) {
        callback(null, err);
        return;
      }

      callback(docs);
    });
  }

  startNewFeed(feedConfig) {
    feedConfig.onNewItems = this.handleNewItems.bind(this);
    this.feeds.push(new Feed(feedConfig));
  }
}

module.exports = new FeedService();
