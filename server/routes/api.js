'use strict';

const express = require('express');
const passport = require('passport');
const router = express.Router();

const ajaxUtil = require('../util/ajaxUtil');
const client = require('../models/client');
const clientRoutes = require('./client');
const clientActivityStream = require('../middleware/clientActivityStream');
const eventStream = require('../middleware/eventStream');
const feedService = require('../services/feedService');
const ServicesHandler = require('../services/servicesHandler');
const Filesystem = require('../models/Filesystem');
const mediainfo = require('../util/mediainfo');
const settings = require('../models/settings');

router.use('/', passport.authenticate('jwt', {session: false}));

router.use('/client', clientRoutes);

router.get('/activity-stream', eventStream, clientActivityStream);

router.get('/download', (req, res, next) => {
  client.downloadFiles(req.user._id, req.query.hash, req.query.files, res);
});

router.delete('/feed-monitor/:id', (req, res, next) => {
  feedService.removeItem(req.user._id, req.params.id, ajaxUtil.getResponseFn(res));
});

router.get('/feed-monitor', (req, res, next) => {
  feedService.getAll(req.user._id, req.body.query, ajaxUtil.getResponseFn(res));
});

router.get('/feed-monitor/feeds', (req, res, next) => {
  feedService.getFeeds(req.user._id, req.body.query, ajaxUtil.getResponseFn(res));
});

router.put('/feed-monitor/feeds', (req, res, next) => {
  feedService.addFeed(req.user._id, req.body, ajaxUtil.getResponseFn(res));
});

router.get('/feed-monitor/rules', (req, res, next) => {
  feedService.getRules(req.user._id, req.body.query, ajaxUtil.getResponseFn(res));
});

router.put('/feed-monitor/rules', (req, res, next) => {
  feedService.addRule(req.user._id, req.body, ajaxUtil.getResponseFn(res));
});

router.get('/directory-list', (req, res, next) => {
  Filesystem.getDirectoryList(req.query, ajaxUtil.getResponseFn(res));
});

router.get('/history', (req, res, next) => {
  const historyService = ServicesHandler.getHistoryService(req.user._id);
  historyService.getHistory(req.query, ajaxUtil.getResponseFn(res));
});

router.get('/mediainfo', (req, res, next) => {
  mediainfo.getMediainfo(req.user._id, req.query, ajaxUtil.getResponseFn(res));
});

router.get('/notifications', (req, res, next) => {
  const notificationService = ServicesHandler.getNotificationService(req.user._id);
  notificationService.getNotifications(req.query, ajaxUtil.getResponseFn(res));
});

router.delete('/notifications', (req, res, next) => {
  const notificationService = ServicesHandler.getNotificationService(req.user._id);
  notificationService.clearNotifications(req.query, ajaxUtil.getResponseFn(res));
});

router.get('/settings', (req, res, next) => {
  settings.get(req.user._id, req.query, ajaxUtil.getResponseFn(res));
});

router.patch('/settings', (req, res, next) => {
  settings.set(req.user._id, req.body, ajaxUtil.getResponseFn(res));
});

router.get('/stats', (req, res, next) => {
  client.getTransferStats(ajaxUtil.getResponseFn(res));
});

module.exports = router;
