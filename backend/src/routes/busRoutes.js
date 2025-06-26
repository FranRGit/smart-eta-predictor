const express = require('express');
const router = express.Router();
const busController = require('../controllers/bus.controller');

router.post('/arrive', busController.busArrival);
router.post('/updateLocation', busController.updateBusLocation);
router.get('/getBuses', busController.getAllBuses)
router.get('/getBus/:id', busController.getBusByID);
router.post('/addBus', busController.addBus);

module.exports = router;