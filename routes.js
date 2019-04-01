'use strict';
var express = require('express');
var router = express.Router();

var DashboardController = require('./controllers/DashboardController');
var AuthController = require('./controllers/AuthController');

var policies = require('./policies');

router.use(policies.common);

router.get('/', DashboardController.home);
router.get('/authorize', DashboardController.authorize);
router.get('/get-token', DashboardController.get_token);
router.get('/list-files', DashboardController.list_files);
router.post('/update-folder', DashboardController.update_folder);
router.get('/categorization', DashboardController.categorization);

router.post('/update-rule', DashboardController.update_rule);
router.post('/create-rule', DashboardController.create_rule);
router.post('/delete-rule', DashboardController.delete_rule);
router.post('/move-rule-up', DashboardController.move_rule_up);
router.post('/move-rule-down', DashboardController.move_rule_down);

router.all('/login', AuthController.login);
router.get('/logout', AuthController.logout);

module.exports = router;
