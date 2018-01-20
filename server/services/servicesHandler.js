const HistoryService = require('./historyService');
const NotificationService = require('./notificationService');
const TaxonomyService = require('./taxonomyService');
const TorrentService = require('./torrentService');

const historyServices = new Map();
const notificationServices = new Map();
const taxonomyServices = new Map();
const torrentServices = new Map();

module.exports.getHistoryService =  function getHistoryService(userId) {
  let historyService = historyServices.get(userId);
  if (!historyService) {
    console.log("empty HS");
    historyService = new HistoryService(userId);
    historyServices.set(userId, historyService);
  }

  return historyService;
};

module.exports.getNotificationService =  function getNotificationService(userId) {
  let notificationService = notificationServices.get(userId);
  if (!notificationService) {
    console.log("empty NS");
    notificationService = new NotificationService(userId);
    notificationServices.set(userId, notificationService);
  }

  return notificationService;
};

module.exports.getTaxonomyService =  function getTaxonomyService(userId) {
  let taxonomyService = taxonomyServices.get(userId);
  if (!taxonomyService) {
    console.log("empty XS");
    taxonomyService = new TaxonomyService(userId);
    taxonomyServices.set(userId, taxonomyService);
  }

  return taxonomyService;
};

module.exports.getTorrentService =  function getTorrentService(userId) {
  let torrentService = torrentServices.get(userId);
  if (!torrentService) {
    console.log("empty TS");
    torrentService = new TorrentService(userId);
    torrentServices.set(userId, torrentService);
  }

  return torrentService;
};
