'use strict';

let extractJWT = require('passport-jwt').ExtractJwt;
let jwtStrategy = require('passport-jwt').Strategy;

let config = require('../../config');
let rTorrentUserData = require('../models/rTorrentUserData');
let Users = require('../models/Users');

// Setup work and export for the JWT passport strategy.
module.exports = (passport) => {
  let options = {
    jwtFromRequest: (req) => {
      let token = null;

      if (req && req.cookies) {
        token = req.cookies['jwt'];
      }

      return token;
    },
    secretOrKey: config.secret
  };

  passport.use(new jwtStrategy(options, (jwtPayload, callback) => {
    Users.lookupUser({username: jwtPayload.username}, (err, user) => {
      if (err) {
        return callback(err, false);
      }

      if (user) {
        rTorrentUserData.addrTorrentData(user._id,
          {
            socket: user.socket,
            socketPath: user.socketPath,
            port: user.port,
            host: user.host
          });

        return callback(null, user);
      }

      return callback(null, false);
    });
  }));
};
