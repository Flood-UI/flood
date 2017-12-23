'use strict';

const RTORRENT_USER_DATA_KEY = Symbol.for('flood.rTorrentUserData');

let globalSymbols = Object.getOwnPropertySymbols(global);
let hasSymbol = (globalSymbols.indexOf(RTORRENT_USER_DATA_KEY) > -1);

if (!hasSymbol){
  global[RTORRENT_USER_DATA_KEY] = {
    rTorrentData: {},
    getrTorrentData: (userId) => {
      return global[RTORRENT_USER_DATA_KEY].rTorrentData[userId];
    },
    addrTorrentData: (userId, rtorrentData) => {
      global[RTORRENT_USER_DATA_KEY].rTorrentData[userId] = rtorrentData;
    },
    removerTorrentData: (userId) => {
      global[RTORRENT_USER_DATA_KEY].rTorrentData[userId];
    }
  };
}


let rTorrentUserData = {};

Object.defineProperty(rTorrentUserData, 'instance', {
  get: function(){
    return global[RTORRENT_USER_DATA_KEY];
  }
});

Object.freeze(rTorrentUserData);

module.exports = rTorrentUserData.instance;

