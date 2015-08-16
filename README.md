# toragent

Easily manage HTTP(S) requests through Tor. TorAgent spawns Tor processes,
handles both HTTP and HTTPS requests, and offers easy IP address rotation.
Compatible with `http.request` and libraries like `request`.

``` javascript
var TorAgent = require('toragent');
var request  = require('request');

TorAgent.create().then(function(agent) {
  request({
    url: 'https://www.google.com',
    agent: agent,
  }, function(err, res) {
    console.log(err || res.body);
  });
});
```
