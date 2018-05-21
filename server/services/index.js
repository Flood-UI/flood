const ClientRequestService = require('./clientRequestService');
const ClientRequestManager = require('./clientRequestManager');
const FeedService = require('./feedService');
const HistoryService = require('./historyService');
const NotificationService = require('./notificationService');
const TaxonomyService = require('./taxonomyService');
const TorrentService = require('./torrentService');
const Users = require('../models/Users');

const clientRequestManagers = new Map();
const clientRequestServices = new Map();
const feedServices = new Map();
const historyServices = new Map();
const notificationServices = new Map();
const taxonomyServices = new Map();
const torrentServices = new Map();
const allServiceMaps = [
  clientRequestManagers,
  clientRequestServices,
  feedServices,
  historyServices,
  notificationServices,
  taxonomyServices,
  torrentServices
];

const getService = ({servicesMap, service, user}) => {
  let serviceInstance = servicesMap.get(user._id);
  if (!serviceInstance) {
    serviceInstance = new service(user, getAllServices(user));
    servicesMap.set(user._id, serviceInstance);
  }

  return serviceInstance;
};

const getClientRequestManager = user => {
  return getService({servicesMap: clientRequestManagers, service: ClientRequestManager, user});
};

const getClientRequestService = user => {
  return getService({servicesMap: clientRequestServices, service: ClientRequestService, user});
};

const getFeedService = user => {
  return getService({servicesMap: feedServices, service: FeedService, user});
};

const getHistoryService = user => {
  return getService({servicesMap: historyServices, service: HistoryService, user});
};

const getNotificationService = user => {
  return getService({servicesMap: notificationServices, service: NotificationService, user});
};

const getTaxonomyService = user => {
  return getService({servicesMap: taxonomyServices, service: TaxonomyService, user});
};

const getTorrentService = user => {
  return getService({servicesMap: torrentServices, service: TorrentService, user});
};

const bootstrapUserServices = () => {
  Users.listUsers(users => {
    if (users && users.length) {
      users.forEach(user => {
        getClientRequestManager(user);
        getClientRequestService(user);
        getFeedService(user);
        getHistoryService(user);
        getNotificationService(user);
        getTaxonomyService(user);
        getTorrentService(user);
      });
    }
  });
};

const destroyUserServices = user => {
  allServiceMaps.forEach(serviceMap => {
    const currentService = serviceMap.get(user._id);

    if (currentService && currentService.destroy) {
      currentService.destroy();
    }

    serviceMap.delete(user._id);
  });
};

const getAllServices = user => {
  return {
    get clientRequestManager() {
      return getClientRequestManager(user);
    },

    get clientRequestService() {
      return getClientRequestService(user);
    },

    get feedService() {
      return getFeedService(user);
    },

    get historyService() {
      return getHistoryService(user);
    },

    get notificationService() {
      return getNotificationService(user);
    },

    get taxonomyService() {
      return getTaxonomyService(user);
    },

    get torrentService() {
      return getTorrentService(user);
    }
  };
};

module.exports = {
  bootstrapUserServices,
  destroyUserServices,
  getAllServices,
  getClientRequestManager,
  getClientRequestService,
  getHistoryService,
  getNotificationService,
  getTaxonomyService,
  getTorrentService
};