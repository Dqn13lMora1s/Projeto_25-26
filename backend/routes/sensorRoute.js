const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/history', sensorController.getHistoricalData);
router.post('/sensor-data', sensorController.postSensorData);

module.exports = router;
