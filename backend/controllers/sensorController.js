const SensorReading = require('../models/sensorModel'); // Your Mongoose model
// We need the Socket.io instance to broadcast the new data.
// In a typical setup, you would pass the 'io' instance from server.js to the controller.
// For this example, we assume the 'io' instance is available globally or passed in.

// --- ⚠️ Placeholder for Socket.io instance ⚠️ ---
// You will need to make sure your main server.js file passes the 'io' object here 
// or includes these functions directly if the project is small.
// For now, let's assume 'io' is available:
let io;

// Function to set the Socket.io instance, called from server.js after initialization
const setSocketIo = (socketIoInstance) => {
    io = socketIoInstance;
};

// --- 1. POST Handler: Receives data from ESP32, saves, and broadcasts ---
// This handles the route: POST /api/sensor-data
const postSensorData = async (req, res) => {
    const data = req.body;
    
    // 1. Validation and Data Preparation
    if (!data.temperature || !data.moisture || !data.ph) {
        return res.status(400).send({ message: 'Missing sensor data in payload.' });
    }
    
    // Use the SensorReading model to create a document
    const reading = new SensorReading({
        temperature: parseFloat(data.temperature),
        moisture: parseFloat(data.moisture),
        ph: parseFloat(data.ph),
        timestamp: new Date() // CRITICAL: Assign the server's timestamp
    });

    try {
        // 2. Save to Database (for historical viewing)
        await reading.save();
        
        // 3. Broadcast Data (for real-time chart update)
        if (io) {
            // We emit the saved reading (which now includes the clean server timestamp)
            io.emit('new-data', reading);
        }

        // 4. Send Confirmation back to ESP32
        res.status(200).send({ message: 'Data accepted and broadcasted.' });
    } catch (error) {
        console.error("Database or Socket broadcast error:", error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

// --- 2. GET Handler: Serves historical data to the frontend on page load ---
// This handles the route: GET /api/history
const getHistoricalData = async (req, res) => {
    const MAX_POINTS = 100; // Define how many historical points to fetch

    try {
        // Query database: sort by timestamp descending (-1), limit the result.
        const history = await SensorReading.find({})
            .sort({ timestamp: -1 }) 
            .limit(MAX_POINTS)
            .lean() // Better performance for reading
            .exec();

        // Reverse the array so the frontend chart receives data in chronological order (oldest to newest)
        res.status(200).json(history.reverse());
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

module.exports = {
    postSensorData,
    getHistoricalData,
    setSocketIo // Export function to inject the Socket.io instance
};