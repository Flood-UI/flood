const Deserializer = require('xmlrpc/lib/deserializer');
const net = require('net');
const Serializer = require('xmlrpc/lib/serializer');

const nullChar = String.fromCharCode(0);

class ClientRequestManager {
  constructor(user) {
    this.user = user;
    this.isRequestPending = false;
    this.lastResponseTimestamp = 0;
    this.pendingRequests = [];

    this.sendDefferedMethodCall = this.sendDefferedMethodCall.bind(this);
    this.sendMethodCall = this.sendMethodCall.bind(this);
    this.methodCall = this.methodCall.bind(this);
  }

  sendDefferedMethodCall() {
    if (this.pendingRequests.length > 0) {
      this.isRequestPending = true;

      const nextRequest = this.pendingRequests.shift();

      this.sendMethodCall(nextRequest.methodName, nextRequest.parameters)
        .then(nextRequest.resolve)
        .catch(nextRequest.reject);
    }
  }

  sendMethodCall(methodName, parameters) {
    return new Promise((resolve, reject) => {
      const connectMethod = this.user.socket
        ? {path: this.user.socketPath}
        : {port: this.user.port, host: this.user.host};

      const deserializer = new Deserializer('utf8');
      const stream = net.connect(connectMethod);
      const xml = Serializer.serializeMethodCall(methodName, parameters);
      const xmlLength = Buffer.byteLength(xml, 'utf8');

      stream.setEncoding('UTF8');

      const headerItems = [
        `CONTENT_LENGTH${nullChar}${xmlLength}${nullChar}`,
        `SCGI${nullChar}1${nullChar}`
      ];

      const headerLength = headerItems.reduce((accumulator, headerItem) => {
        return accumulator += headerItem.length;
      }, 0);

      stream.write(`${headerLength}:${headerItems.join('')},${xml}`);

      deserializer.deserializeMethodResponse(stream, (error, response) => {
        this.isRequestPending = false;

        // We avoid initiating any deffered requests until at least 250ms have
        // since the previous response.
        const currentTimestamp = Date.now();
        const timeSinceLastResponse = currentTimestamp - this.lastResponseTimestamp;

        if (timeSinceLastResponse <= 250) {
          const delay = 250 - timeSinceLastResponse;
          setTimeout(this.sendDefferedMethodCall, delay);
          this.lastResponseTimestamp = currentTimestamp + delay;
        } else {
          this.sendDefferedMethodCall();
          this.lastResponseTimestamp = currentTimestamp;
        }

        if (error) {
          reject(error);
        }

        resolve(response);
      });
    });
  }

  methodCall(methodName, parameters) {
    // We only allow one request at a time.
    if (this.isRequestPending) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({methodName, parameters, resolve, reject});
      });
    } else {
      this.isRequestPending = true;
      return this.sendMethodCall(methodName, parameters);
    }
  }
}

module.exports = ClientRequestManager;
