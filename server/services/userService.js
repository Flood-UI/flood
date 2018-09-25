const BaseService = require('./BaseService');

class UserService extends BaseService {
  createUser(Users, credentials, callback) {
    if (this.user.isAdmin) {
      return Users.createUser(credentials, callback);
    }

    return callback(null, 'User is not admin.');
  }

  removeUser(Users, username, callback) {
    if (this.user.isAdmin) {
      return Users.removeUser(username, callback);
    }

    return callback(null, 'User is not admin.');
  }

  patchUser(Users, username, userRecordPatch, callback) {
    if (this.user.isAdmin) {
      return Users.updateUser(username, userRecordPatch, callback);
    }

    return callback(null, 'User is not admin.');
  }

  listUsers(Users, callback) {
    if (this.user.isAdmin) {
      return Users.listUsers(callback);
    }

    return callback(null, 'User is not admin.');
  }
}

module.exports = UserService;
