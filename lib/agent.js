var http        = require('http');
var tls         = require('tls');
var inherits    = require('util').inherits;
var socksClient = require('socks5-client');
var Promise     = require('bluebird');
var openports   = require('openports');
var tmp         = Promise.promisifyAll(require('tmp'));
var Tor         = require('./tor');

/**
 * An HTTP Agent for proxying requests through Tor using SOCKS5.
 *
 * @param {object} opts
 */
function TorAgent(opts) {
  if (!(this instanceof TorAgent)) {
    return new TorAgent();
  }

  http.Agent.call(this, opts);

  this.socksHost   = opts.socksHost || 'localhost';
  this.socksPort   = opts.socksPort || 9050;
  this.defaultPort = 80;

  // Used when invoking TorAgent.create
  this.tor = opts.tor;

  // Prevent protocol check, wrap destroy
  this.protocol = null;
  this.defaultDestroy = this.destroy;
  this.destroy = this.destroyWrapper;
}

inherits(TorAgent, http.Agent);

/**
 * Spawns a Tor process listening on a random unused port, and creates an
 * agent for use with HTTP(S) requests. The optional verbose param will enable
 * console output while initializing Tor. Accepts an optional callback,
 * otherwise it returns a promise that resolves with an instance of TorAgent.
 * Note that since the Tor process is using a new DataDirectory with no cached
 * microdescriptors or any other state, bootstrapping can take between 15 - 60s.
 * The resulting child process is automatically killed when node exits.
 *
 * @param   {boolean}  [verbose] Whether or not to enable console output
 * @param   {function} [fn]      Optional callback to invoke
 * @returns {Promise}  A promise that resoles with the TorAgent
 */
TorAgent.create = function(verbose, fn) {
  var port;

  return openports(1).then(function(ports) {
    port = ports[0];
    return tmp.dirAsync({template: '/tmp/toragent-XXXXXX'});
  }).then(function(res) {
    if (verbose) {
      console.log('Spawning Tor');
    }
    return Tor.spawn(port, res[0], 30000);
  }).then(function(tor) {
    if (verbose) {
      console.log('Tor spawned with pid', tor.process.pid,
        'listening on', tor.port);
    }

    return new TorAgent({
      socksHost: 'localhost',
      socksPort: port,
      tor:       tor
    });
  }).nodeify(fn);
};

/**
 * Rotates the IP address used by Tor by sending a SIGHUP. Returns a promise
 * that resolves when complete.
 *
 * @returns {Promise}
 */
TorAgent.prototype.rotateAddress = function() {
  return this.tor.rotateAddress();
};

/**
 * Closes all sockets handled by the agent, and closes the Tor process. Returns
 * a promise that resolves when the Tor process has closed.
 *
 * @returns {Promise}
 */
TorAgent.prototype.destroyWrapper = function() {
  this.defaultDestroy();
  return this.tor.destroy();
};

/**
 * Creates a TCP connection through the specified SOCKS5 server. Updates the
 * request options object to handle both HTTP and HTTPs.
 *
 * @param   {object}             opts Options object, as passed by addRequest
 * @returns {Socks5ClientSocket} The SOCKS5 connection
 */
TorAgent.prototype.createConnection = function(opts) {
  // Change protocol if https
  if (opts.uri.protocol === 'https:') {
    opts.port = (opts.port === 80) ? 443 : opts.port;
  } else {
  // If not https, use socksClient default
    return socksClient.createConnection(opts);
  }

  var socksSocket = socksClient.createConnection(opts);
  var connectHandler = socksSocket.handleSocksConnectToHost;

  socksSocket.handleSocksConnectToHost = function() {
    opts.socket = socksSocket.socket;
    opts.servername = opts.hostname;

    socksSocket.socket = tls.connect(opts, function() {
      socksSocket.authorized = socksSocket.socket.authorized;
      connectHandler.call(socksSocket);
    }).on('error', function(err) {
      socksSocket.emit('error', err);
    });
  };

  return socksSocket;
}

module.exports = TorAgent;
