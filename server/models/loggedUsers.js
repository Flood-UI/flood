'use strict';

const LOGGED_USER_KEY = Symbol.for('flood.loggedUser');

let globalSymbols = Object.getOwnPropertySymbols(global);
let hasFoo = (globalSymbols.indexOf(LOGGED_USER_KEY) > -1);

if (!hasFoo){
  global[LOGGED_USER_KEY] = {
    loggedUsers: null,
    getLoggedUsers: () => {
      if (!this.loggedUsers) {
        this.loggedUsers = new Set();
      }

      return this.loggedUsers;
    },
    addLoggedUser: (userId) => {
      if (!this.loggedUsers) {
        this.loggedUsers = new Set();
      }

      this.loggedUsers.add(userId);
    },
    removeLoggedUser: (userId) => {
      if (!this.loggedUsers) {
        this.loggedUsers = new Set();
      }

      this.loggedUsers.delete(userId);
    }
  };
}

let loggedUser = {};

Object.defineProperty(loggedUser, 'instance', {
  get: function(){
    return global[LOGGED_USER_KEY];
  }
});

Object.freeze(loggedUser);

module.exports = loggedUser.instance;

