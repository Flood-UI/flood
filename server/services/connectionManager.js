const BaseService = require('./BaseService');

class ConnectionManager extends BaseService {
  constructor() {
    super(...arguments);
    this.connections = 0;
  }

  connect() {
    this.connections++;
  }

  disconnect() {
    this.connections--;
  }

  hasConnections() {
    return this.connections > 0;
  }
}

module.exports = ConnectionManager;
