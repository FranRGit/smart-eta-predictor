const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataControllers');

router.get('/export-dataset', dataController.exportDataset);

//aca va la nueva ruta para enviar datos al firebase

//aca una ruta para traer datos del firebase
module.exports = router;