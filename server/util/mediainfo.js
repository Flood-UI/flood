'use strict';

let child_process = require('child_process');

const ServicesHandler = require('../services/servicesHandler');

module.exports = {
  getMediainfo(userId, options, callback) {
    const torrentService = ServicesHandler.getTorrentService(userId);
    torrentService.fetchTorrentList().then(
      () => {
        let hash = options.hash;

        if (hash == null) {
          callback(null, {error: 'Hash must be defined'});
          return;
        }
        const selectedTorrent = torrentService.getTorrent(hash);
        try {
          child_process.execFile(
            'mediainfo', [selectedTorrent.basePath], {maxBuffer: 1024 * 2000}, function(error, stdout, stderr) {
              if (error) {
                callback(null, {error});
                return;
              }

              if (stderr) {
                callback(null, {error: stderr});
                return;
              }

              callback({output: stdout});
            }
          );
        } catch (childProcessError) {
          callback(null, {error: childProcessError});
        }
      }
    ).catch();
  }
};
