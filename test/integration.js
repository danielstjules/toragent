var Promise  = require('bluebird');
var expect   = require('chai').expect;
var TorAgent = require('../lib/agent');
var helpers  = require('./helpers');
var exec     = Promise.promisify(require('child_process').exec);
var request  = Promise.promisify(require('request'));

describe('toragent', function() {
  var agent;

  before(function() {
    this.timeout(120000);
    return TorAgent.create().then(function(res) {
      agent = res;
    });
  });

  it('spawns a tor process', function() {
    var pid = agent.tor.process.pid;
    return helpers.isProcessRunning(pid).then(function(running) {
      expect(running).to.be.true;
    });
  });

  it('can be used with request', function() {
    this.timeout(10000);
    return request({
      url: 'https://www.google.com',
      agent: agent,
    }).spread(function(res, body) {
      // Could be blocked
      expect(res.statusCode === 200 || res.statusCode === 503).to.be.ok;
    });
  });

  it('closes the tor process when calling destroy', function() {
    var pid;
    this.timeout(120000);

    return TorAgent.create().then(function(agent) {
      pid = agent.tor.process.pid;
      return agent.destroy();
    }).then(function() {
      return helpers.isProcessRunning(pid);
    }).then(function(running) {
      expect(running).to.be.false;
    });
  });
});