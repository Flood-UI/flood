const express = require('express');
const multer = require('multer');

const ajaxUtil = require('../util/ajaxUtil');
const booleanCoerce = require('../middleware/booleanCoerce');
const client = require('../models/client');

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: {fileSize: 10000000},
  storage: multer.memoryStorage(),
});

router.get('/connection-test', (req, res, next) => {
  req.services.clientGatewayService
    .testGateway()
    .then(response => {
      res.status(200).json({isConnected: true});
    })
    .catch(error => {
      res.status(500).json({isConnected: false});
    });
});

router.post('/connection-test', (req, res, next) => {
  req.services.clientGatewayService
    .testGateway(req.body)
    .then(response => {
      res.status(200).json({isConnected: true});
    })
    .catch(error => {
      res.status(500).json({isConnected: false});
    });
});

router.post('/add', (req, res, next) => {
  client.addUrls(req.user, req.services, req.body, ajaxUtil.getResponseFn(res));
});

router.post('/add-files', upload.array('torrents'), booleanCoerce('isBasePath'), (req, res, next) => {
  client.addFiles(req.user, req.services, req, ajaxUtil.getResponseFn(res));
});

router.get('/settings', (req, res, next) => {
  client.getSettings(req.user, req.services, req.query, ajaxUtil.getResponseFn(res));
});

router.patch('/settings', (req, res, next) => {
  client.setSettings(req.user, req.services, req.body, ajaxUtil.getResponseFn(res));
});

router.put('/settings/speed-limits', (req, res, next) => {
  client.setSpeedLimits(req.user, req.services, req.body, ajaxUtil.getResponseFn(res));
});

router.post('/start', (req, res, next) => {
  client.startTorrent(req.user, req.services, req.body.hashes, ajaxUtil.getResponseFn(res));
});

router.post('/stop', (req, res, next) => {
  client.stopTorrent(req.user, req.services, req.body.hashes, ajaxUtil.getResponseFn(res));
});

router.post('/torrent-details', (req, res, next) => {
  client.getTorrentDetails(req.user, req.services, req.body.hash, ajaxUtil.getResponseFn(res));
});

router.patch('/torrents/:hash/priority', (req, res, next) => {
  client.setPriority(req.user, req.services, req.params.hash, req.body, ajaxUtil.getResponseFn(res));
});

router.patch('/torrents/:hash/file-priority', (req, res, next) => {
  client.setFilePriority(req.user, req.services, req.params.hash, req.body, ajaxUtil.getResponseFn(res));
});

router.post('/torrents/check-hash', (req, res, next) => {
  client.checkHash(req.user, req.services, req.body.hash, ajaxUtil.getResponseFn(res));
});

router.post('/torrents/move', (req, res, next) => {
  client.moveTorrents(req.user, req.services, req.body, ajaxUtil.getResponseFn(res));
});

router.post('/torrents/delete', (req, res, next) => {
  const {deleteData, hash: hashes} = req.body;
  const callback = ajaxUtil.getResponseFn(res);

  req.services.clientGatewayService
    .removeTorrents({hashes, deleteData})
    .then(callback)
    .catch(err => {
      callback(null, err);
    });
});

router.patch('/torrents/taxonomy', (req, res, next) => {
  client.setTaxonomy(req.user, req.services, req.body, ajaxUtil.getResponseFn(res));
});

router.get('/methods.json', (req, res, next) => {
  const type = req.query.type;
  const args = req.query.args;
  let method = 'system.listMethods';

  if (type === 'help') {
    method = 'system.methodHelp';
  } else if (type === 'signature') {
    method = 'system.methodSignature';
  }

  client.listMethods(req.user, req.services, method, args, ajaxUtil.getResponseFn(res));
});

module.exports = router;
