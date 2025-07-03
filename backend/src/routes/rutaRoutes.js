const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/ruta.controller');

router.post('/add', rutaController.addRuta);
router.post('/addParaderos', rutaController.addParaderos);
router.get('/', rutaController.getAllRutas);

module.exports = router;