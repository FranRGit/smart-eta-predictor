const express = require('express');
const router = express.Router();
const busController = require('../controllers/bus.controller');

router.post('/arrive', busController.busArrival);
router.post('/updateLocation', busController.updateBusLocation);
router.get('/', busController.getAllBuses)
router.get('/:id', busController.getBusByID);
router.post('/add', busController.addBus);

module.exports = router;