const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/ruta.controller');

router.post('/addRuta', rutaController.addRuta);
router.get('/getRutas', rutaController.getAllRutas);

module.exports = router;