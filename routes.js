'use strict';
var express = require('express');
var router = express.Router();

// var DocumentsController = require('./controllers/DocumentsController');
// var ParsersController = require('./controllers/ParsersController');
// router.get('/', function(req, res, next) {
//     console.log('first middleware');
//     next();
// }, function(req, res, next) {
//     console.log('second middleware');
//     next();
// }, function(req, res, next) {
//     console.log('third middleware');
//     next();
// }, function (req, res) {
//     res.send('Hello MedlexAI!!!');
// });

// router.get('/documents', DocumentsController.get_documents);
// router.get('/documents/get_stats', DocumentsController.get_documents_stats);
// router.get('/documents/:document_id/get_pages', DocumentsController.get_pages);
// router.post('/documents/upload', upload.single('file'), DocumentsController.upload_file)
// router.get('/documents/:id', DocumentsController.get_document);
// router.post('/documents/:document_id/save_boundaries', DocumentsController.save_boundaries);
// router.get('/documents/:document_id/extract_data', DocumentsController.extract_data);
// router.get('/documents/:document_id/export', DocumentsController.export);

// router.get('/parsers', ParsersController.get_parsers);
// router.post('/parsers', ParsersController.create_parser);
// router.get('/parsers/:id', ParsersController.get_parser);
// router.post('/parsers/:id', ParsersController.update_parser);

var DashboardController = require('./controllers/DashboardController');

router.get('/', DashboardController.home);
router.get('/authorize', DashboardController.authorize);
router.get('/get-token', DashboardController.get_token);
router.get('/list-files', DashboardController.list_files);
router.post('/update-folder', DashboardController.update_folder);
router.get('/categorization', DashboardController.categorization);

module.exports = router;
