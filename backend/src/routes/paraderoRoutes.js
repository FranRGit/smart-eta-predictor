const express = require('express');
const router = express.Router();
const paraderoController = require('../controllers/paradero.controller');

router.post('/addParadero', paraderoController.addParadero);
router.get('/getParaderos', paraderoController.getAllParaderos);
router.get('/get/:id/rutas', paraderoController.getRutasPorParadero);


module.exports = router;