const express = require('express');
const router = express.Router();
const modeloController = require('../controllers/modelController');

router.post('/predecir', modeloController.predecirPrueba);

module.exports = router;