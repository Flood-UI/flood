import BaseStore from './BaseStore';

class ConfigStoreClass extends BaseStore {
  static getBaseURI() {
    return process.env.BASE_URI;
  }

  static getPollInterval() {
    return process.env.POLL_INTERVAL || 5000;
  }
}

export default new ConfigStoreClass();
