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
  TorAgent.create(function(err, agent) {
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
