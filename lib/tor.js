var spawn   = require('child_process').spawn;
var Promise = require('bluebird');

/**
 * A wrapper for the tor process containing its ChildProcess, port number
 * and data directory.
 *
 * @param {ChildProcess} child
 * @param {int}          port
 * @param {string}       dir
 */
function Tor(child, port, dir) {
  this.process = child;
  this.port    = port;
  this.dir     = dir;
}

/**
 * Given a port number and directory path, spawns a Tor process. Returns a
 * promise that resolves with an instance of the Tor class. Since it's using
 * a new DataDirectory with no cached microdescriptors or any other state,
 * it can take a bit for it to start up. An optional retryTimeout will have
 * the spawn function kill the child process after that number of milliseconds,
 * and retry. The Tor process is killed when node exits.
 *
 * @returns {Promise}
 */
Tor.spawn = function(port, dir, retryTimeout) {
  return new Promise(function(resolve, reject) {
    var child = spawn('tor', ['--SOCKSPort', port, '--DataDirectory', dir]);
    var active = false;

    if (retryTimeout) {
      var timeout = setTimeout(function() {
        if (active) return;
        child.removeAllListeners();
        child.kill('SIGINT');

        // Let tor exit gracefully, since we try to bind on
        // the same port
        setTimeout(function() {
          resolve(Tor.spawn(port, dir, retryTimeout));
        }, 1000);
      }, retryTimeout);
    }

    var listener = function(data) {
      if (data.toString('utf8').indexOf('Done') === -1) return;

      child.stdout.removeListener('data', listener);
      clearTimeout(timeout);
      active = true;

      process.on('exit', function() {
        child.kill('SIGINT');
      });

      resolve(new Tor(child, port, dir));
    };

    child.stdout.on('data', listener);

    child.on('close', function(code) {
      if (!active) reject();
    });
  });
};

/**
 * Rotates the IP address used by Tor by sending a SIGHUP.
 *
 * @returns {Promise}
 */
Tor.prototype.rotateAddress = function() {
  return this.signalWait('SIGHUP', 'Received reload signal');
};

/**
 * Sends a SIGINT to Tor, waiting for it to exit.
 *
 * @returns {Promise}
 */
Tor.prototype.destroy = function() {
  return this.signalWait('SIGINT', 'exiting cleanly').delay(1000);
};

/**
 * Sends the given signal to the child process, and returns a promise that
 * resolves once the given msg has been written to its stdout.
 *
 * @returns {Promise}
 */
Tor.prototype.signalWait = function(signal, msg) {
  var child = this.process;

  return new Promise(function(resolve) {
    var listener = function(data) {
      if (data.toString('utf8').indexOf(msg) === -1) return;
      child.stdout.removeListener('data', listener);
      resolve();
    };

    child.stdout.on('data', listener)
    child.kill(signal);
  });
}

module.exports = Tor;
