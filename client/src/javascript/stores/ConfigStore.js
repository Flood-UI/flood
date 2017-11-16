import BaseStore from './BaseStore';
import userConfig from '../../../../config';

class ConfigStoreClass extends BaseStore {
  constructor() {
    super();

    this.storeUserConfig();
  }

  getBaseURI() {
    return '';
  }

  getPollInterval() {
    return this.userConfig.pollInterval || 5000;
  }

  storeUserConfig() {
    if (!userConfig) {
      throw new Error('Global Flood config was not found.');
    }

    this.userConfig = Object.keys(userConfig).reduce((accumulator, key) => {
      return userConfig[key];
    }, {});
  }
}

export default new ConfigStoreClass();
