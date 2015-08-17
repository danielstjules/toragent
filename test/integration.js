var expect   = require('chai').expect;
var TorAgent = require('../lib/agent');
var Promise  = require('bluebird');
var request  = Promise.promisify(require('request'));

describe('toragent', function() {
  var agent;

  before(function() {
    this.timeout(90000);
    return TorAgent.create().then(function(res) {
      agent = res;
    });
  });

  it('can be used with request', function() {
    this.timeout(10000);
    return request({
      url: 'https://www.google.com',
      agent: agent,
    }).spread(function(resp, body) {
      expect(resp.statusCode).to.equal(200);
    });
  });
});
