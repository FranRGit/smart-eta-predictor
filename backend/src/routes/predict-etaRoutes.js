const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predict-eta.controller');

router.get('/', predictController.predictETA);

module.exports = router;