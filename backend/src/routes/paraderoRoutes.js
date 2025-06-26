const express = require('express');
const router = express.Router();
const paraderoController = require('../controllers/paradero.controller');

router.post('/add', paraderoController.addParadero);
router.get('/', paraderoController.getAllParaderos);
router.get('/:id/rutas', paraderoController.getRutasPorParadero);


module.exports = router;