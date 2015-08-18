# toragent

Easily manage HTTP(S) requests through Tor. TorAgent spawns Tor processes,
handles both HTTP and HTTPS requests, and offers easy IP address rotation.
Compatible with `http.request` and libraries like `request`.

[![Build Status](https://travis-ci.org/danielstjules/toragent.svg?branch=master)](https://travis-ci.org/danielstjules/toragent)

## Installation

Requires Node >= 0.12 or iojs.

```
npm install --save toragent
```

## Overview

Works with promises.

``` javascript
var TorAgent = require('toragent');
var Promise  = require('bluebird');
var request  = Promise.promisify(require('request'));

function printGoogleHome() {
  return TorAgent.create().then(function(agent) {
    return request({
      url: 'https://www.google.com',
      agent: agent,
    });
  }).spread(function(res, body) {
    console.log(body);
  });
}
```

And callbacks too!

``` javascript
var TorAgent = require('toragent');
var request  = require('request');

function printGoogleHome(fn) {
  TorAgent.create(false, function(err, agent) {
    if (err) return fn(err);

    request({
      url: 'https://www.google.com',
      agent: agent,
    }, function(err, res, body) {
      if (err) return fn(err);

      console.log(body);
      fn();
    });
  });
}
```

## TorAgent

An HTTP Agent for proxying requests through Tor using SOCKS5. In the following
examples, `agent` refers to an instance of `TorAgent`.

#### TorAgent.create(verbose, [fn])

Spawns a Tor process listening on a random unused port, and creates an
agent for use with HTTP(S) requests. The optional verbose param will enable
console output while initializing Tor. Accepts an optional callback,
otherwise it returns a promise that resolves with an instance of TorAgent.
Note that since the Tor process is using a new DataDirectory with no cached
microdescriptors or any other state, bootstrapping can take between 15 - 60s.
The resulting child process is automatically killed when node exits.

``` javascript
TorAgent.create(true).then(function(agent) {
  // Spawning Tor
  // Tor spawned with pid 42776 listening on 55683
});
```

#### agent.rotateAddress()

Rotates the IP address used by Tor by sending a SIGHUP. Returns a promise
that resolves when complete.

``` javascript
TorAgent.create().then(function(agent) {
  return agent.rotateAddress();
});
```

#### agent.destroy()

Closes all sockets handled by the agent, and closes the Tor process. Returns
a promise that resolves when the Tor process has closed.

``` javascript
TorAgent.create().then(function(agent) {
  return agent.destroy();
});
```
