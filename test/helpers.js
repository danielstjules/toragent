var Promise = require('bluebird');
var exec    = Promise.promisify(require('child_process').exec);

exports.isProcessRunning = function(pid) {
  var cmd = 'ps -p ' + pid;
  var opts = {encoding: 'utf8', maxBuffer: 1000 * 1024};

  return exec(cmd, opts).spread(function(stdout, sterr) {
    return stdout.indexOf(pid) !== -1;
  }).catch(function(err) {
    return false;
  });
}
