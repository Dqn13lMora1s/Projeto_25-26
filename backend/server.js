// CRITICAL: Load environment variables first
require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// Import controllers (assuming they are correctly defined)
const sensorController = require('./controllers/sensorController'); 

// --- 1. CONFIGURATION: Use process.env ---
// Get values from .env file, providing a default if not found
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

if (!DB_URI) {
    console.error('❌ FATAL ERROR: MONGO_URI is not defined in the environment or .env file.');
    process.exit(1); // Exit the process if the connection string is missing
}

// --- 2. INITIALIZE SERVER COMPONENTS ---
const app = express();
const server = http.createServer(app); 
const io = socketIo(server, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    }
});

// --- 3. DATABASE CONNECTION ---
// Use the DB_URI from the environment
mongoose.connect(DB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 4. SOCKET.IO INTEGRATION ---
sensorController.setSocketIo(io); 

io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);
});

// --- 5. MIDDLEWARE & ROUTES ---
app.use(express.json()); 
app.post('/api/sensor-data', sensorController.postSensorData);
app.get('/api/history', sensorController.getHistoricalData);

// --- 6. START THE SERVER ---
// Use the PORT from the environment
server.listen(PORT, () => {
    console.log(`🚀 Server and Socket.io listening on http://localhost:${PORT}`);
});