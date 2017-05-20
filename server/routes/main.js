'use strict';
let config = require('../../config');
let express = require('express');

let router = express.Router();
var os = require("os");
var hostname = os.hostname();

router.get('*', (req, res) => {
  res.render(
    'index',
    {
      title: `Flood @ ${hostname}`,
      baseURI: config.baseURI || '/',
      maxHistoryStates: config.maxHistoryStates || 30,
      pollInterval: config.pollInterval || 1000 * 5
    }
  );
});

module.exports = router;
