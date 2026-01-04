// server.js (Finalized with Router Integration)

// CRITICAL: Load environment variables first
require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// --- Import Logic ---
// 1. Import the controller (needed to pass the 'io' instance)
const sensorController = require('./controllers/sensorController'); 
// 2. Import the new router file
const sensorRoutes = require('./routes/sensorRoute'); // <--- IMPORTANT: Assume 'routes' folder

// --- 1. CONFIGURATION: Use process.env ---
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

if (!DB_URI) {
    console.error('❌ FATAL ERROR: MONGO_URI is not defined in the environment or .env file.');
    process.exit(1); 
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
mongoose.connect(DB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 4. SOCKET.IO INTEGRATION ---
// Inject the Socket.io instance into the controller
sensorController.setSocketIo(io); 

io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);
});

// --- 5. MIDDLEWARE & ROUTER USE ---
app.use(express.json()); 

// REMOVALS: Remove the old direct route definitions!
// app.post('/api/sensor-data', sensorController.postSensorData); // <-- REMOVE THIS LINE
// app.get('/api/history', sensorController.getHistoricalData);    // <-- REMOVE THIS LINE

// ADDITION: Use the imported router under the '/api' base path
app.use('/api', sensorRoutes); // <--- NEW WAY TO DEFINE ROUTES

// --- 6. START THE SERVER ---
server.listen(PORT, () => {
    console.log(`🚀 Server and Socket.io listening on http://localhost:${PORT}`);
});