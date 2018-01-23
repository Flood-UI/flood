const HistoryService = require('./historyService');
const NotificationService = require('./notificationService');
const TaxonomyService = require('./taxonomyService');
const TorrentService = require('./torrentService');

const servicesPurgeInterval = 1000 * 600;

const historyServices = new Map();
const notificationServices = new Map();
const taxonomyServices = new Map();
const torrentServices = new Map();

const historyServicesInterval = new Map();
const notificationServicesInterval = new Map();
const taxonomyServicesInterval = new Map();
const torrentServicesInterval = new Map();

module.exports.getHistoryService = function getHistoryService(userId) {
  let historyService = historyServices.get(userId);
  if (!historyService) {
    historyService = new HistoryService(userId);
    historyServices.set(userId, historyService);
    if (!historyServicesInterval.get(userId)) {
      historyServicesInterval.set(userId,
        setInterval(() => historyServices.delete(userId), servicesPurgeInterval)
      );
    }
  }

  return historyService;
};

module.exports.getNotificationService = function getNotificationService(userId) {
  let notificationService = notificationServices.get(userId);
  if (!notificationService) {
    notificationService = new NotificationService(userId);
    notificationServices.set(userId, notificationService);
    if (!notificationServicesInterval.get(userId)) {
      notificationServicesInterval.set(userId,
        setInterval(() => notificationServices.delete(userId), servicesPurgeInterval)
      );
    }
  }

  return notificationService;
};

module.exports.getTaxonomyService = function getTaxonomyService(userId) {
  let taxonomyService = taxonomyServices.get(userId);
  if (!taxonomyService) {
    taxonomyService = new TaxonomyService(userId);
    taxonomyServices.set(userId, taxonomyService);
    if (!taxonomyServicesInterval.get(userId)) {
      taxonomyServicesInterval.set(userId,
        setInterval(() => taxonomyServices.delete(userId), servicesPurgeInterval)
      );
    }
  }

  return taxonomyService;
};

module.exports.getTorrentService = function getTorrentService(userId) {
  let torrentService = torrentServices.get(userId);
  if (!torrentService) {
    torrentService = new TorrentService(userId);
    torrentServices.set(userId, torrentService);
    if (!torrentServicesInterval.get(userId)) {
      torrentServicesInterval.set(userId,
        setInterval(() => torrentServices.delete(userId), servicesPurgeInterval)
      );
    }
  }

  return torrentService;
};
