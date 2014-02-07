About
=====

This is my *r*estify-based *a*pp *sk*eleton framework. It bounds some common frameworks and tools together, and gives (mostly me) us a production ready web app framework.

Hey! Do you know there is another *great* framework out there?
===================================================

Yes, but why bother there is another one? 

Since this one already setup following things

1. Restify (Dtrace!)
2. Log4js
3. Comment enhanced JSON conf files (auto parsing)
4. Cookies and Session support
5. Fully customizable static file serving  
6. Ready to use client classes (enhanced restify client classes)

Usage
=====

First

```bash
npm install --save git://github.com/liyu1981/rask.git
```

Second
```bash
cp -r node_modules/reskeleton/example/* .
node main.js
```

Then goto http://localhost:12345 for the raskapp.

App dir layout
===========

```
etc/      <= for JSON conf files
 + log.json       => access with rask.conf.get('log') 
 + server.json    => access with rask.conf.get('server')
log/      <= for log files (auto-create)
main.js <= app main
```

main.js
======

```javascript
require('rask')
  .server({
      // server options here, details in server.js
      serveStatic: false
    })
  .route(function(server) {
      // usual restify route registration here, you can
      //     server.get(/.*/, function(req, res, next) { });
      // or more common
      //     require('./myapi').register(server);
    })
  .start();
```
