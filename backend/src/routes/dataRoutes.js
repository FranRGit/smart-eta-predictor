const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataControllers');

router.get('/export-dataset', dataController.exportDataset);

module.exports = router;