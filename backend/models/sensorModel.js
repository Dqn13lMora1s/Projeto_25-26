const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    // REMOVED: Redundant 'id' field

    temperature: {
        type: Number,
        required: true,
        min: -50,
        max: 100
    },
    moisture: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    ph: {
        type: Number,
        required: true,
        min: 0, 
        max: 14 // Added a max validation for pH
        // REMOVED index from here and added to timestamp
    },
    // ADDED: CRITICAL TIMESTAMP FIELD
    timestamp: {
        type: Date,
        required: true,
        index: true // Indexing this for fast historical queries
    }
}, {
    timestamps: false, // Prevents Mongoose adding its own timestamps
    collection: 'Sensor_Readings' // Explicit collection name
});

const SensorReading = mongoose.model('SensorReading', sensorSchema);

module.exports = SensorReading;