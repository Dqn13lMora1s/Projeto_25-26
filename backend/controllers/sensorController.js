const SensorReading = require('../models/sensorModel'); 

let io; // Socket.IO instance

const setSocketIo = (socketIoInstance) => {
    io = socketIoInstance;
};

// POST /api/sensor-data
const postSensorData = async (req, res) => {
    const data = req.body;
    
    if (!data.temperature || !data.moisture || !data.ph) {
        return res.status(400).send({ message: 'Missing sensor data in payload.' });
    }
    
    const reading = new SensorReading({
        temperature: parseFloat(data.temperature),
        moisture: parseFloat(data.moisture),
        ph: parseFloat(data.ph),
        timestamp: new Date()
    });

    try {
        await reading.save();
        if (io) io.emit('new-data', reading);
        res.status(200).send({ message: 'Data accepted and broadcasted.' });
    } catch (error) {
        console.error("Database or Socket broadcast error:", error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

// GET /api/history
const getHistoricalData = async (req, res) => {
    const MAX_POINTS = 100;
    const { date } = req.query;

    try {
        let query = {};

        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            query.timestamp = {
                $gte: start,
                $lt: end
            };
        }

        const history = await SensorReading.find(query)
            .sort({ timestamp: 1 })
            .limit(MAX_POINTS)
            .lean();

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

module.exports = {
    postSensorData,
    getHistoricalData,
    setSocketIo
};