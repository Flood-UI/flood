'use strict';

let child_process = require('child_process');

const TorrentService = require('../services/torrentService');

module.exports = {
  getMediainfo(userId, options, callback) {
    const torrentService = new TorrentService(userId, false);
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
