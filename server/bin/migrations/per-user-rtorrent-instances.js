const chalk = require('chalk');
const config = require('../../../config');
const Users = require('../../models/Users');

const log = data => {
  if (process.env.DEBUG) {
    console.log(data);
  }
}

const migrate = () => {
  log(chalk.green('Migrating data: moving rTorrent connection information to users database'));

  return new Promise((resolve, reject) => {
    if (config.scgi == null) {
      reject(new Error('No `scgi` key in config object.'));
    }

    Users.listUsers((users, error) => {
      if (error) return reject(error);
      resolve(
        Promise.all(
          users.map(user => new Promise(
            (resolve, reject) => {
              if (user.socket == null) {
                log(chalk.yellow(`Migrating user ${user.username}`));
                const userPatch = {
                  host: config.scgi.host,
                  port: config.scgi.port,
                  socket: config.scgi.socket === true,
                };

                if (userPatch.socket && config.scgi.socketPath) {
                  userPatch.socketPath = config.scgi.socketPath;
                }

                Users.updateUser(user.username, userPatch, (response, error) => {
                  if (error) reject(error);
                  resolve(response);
                });
              }

              resolve(user);
            }
          ))
        )
      );
    });
  });
};

module.exports = migrate;