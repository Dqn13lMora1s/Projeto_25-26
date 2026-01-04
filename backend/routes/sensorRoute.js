const express = require('express');
const router = express.Router();
// IMPORTANT: Adjust the path below if your controller file is not one directory up!
const sensorController = require('../controllers/sensorController');

// --- ROUTE DEFINITIONS ---

// 1. GET route: To fetch historical data for the chart initialization
// The frontend will call: GET /api/history
router.get('/history', sensorController.getHistoricalData);

// 2. POST route: To receive new data from the ESP32 and broadcast it
// The ESP32 will call: POST /api/sensor-data
router.post('/sensor-data', sensorController.postSensorData);

module.exports = router;