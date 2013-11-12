js_kickoff
==========

Kickoff modules for pages from scratch

I have written this pieces of code so often to decide to put them in a repo.

----------------

Used libraries:
 
 * RequireJS
 * Underscore
 * jQuery


This repo not intended to provide another framework or library, 
just approach to write js code and some useful parts.

## Core thoughts

* Try to separate all code parts to modules - RequireJS can do this
* Try to separate logic of modules - some kind of pub/sub can help, IoC in general - too
* Try to separate logic and representation - `_.template` can help with this
* If you can use websockets - use it
* If you can write some parts easily and fast without using
  frameworks/big libraries - write it, but DRY and make them reusable
* Do not write over-complicated things
* Change rules if you need


## Description

Current components:

* router.js - pub/sub realization
* ws.js - websocket worker
* ws_indicator.js - websocket indication widget
* tables.js - bunch of table drawing helpers