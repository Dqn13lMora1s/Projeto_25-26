// server.js

require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors'); // ✅ Added

// --- Import Logic ---
const sensorController = require('./controllers/sensorController'); 
const sensorRoutes = require('./routes/sensorRoute'); 

// --- 1. CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

if (!DB_URI) {
    console.error('❌ FATAL ERROR: MONGO_URI is not defined.');
    process.exit(1); 
}

// --- 2. INITIALIZE SERVER COMPONENTS ---
const app = express();
const server = http.createServer(app); 
const io = socketIo(server, { 
    cors: { 
        origin: [
            "http://localhost:3000",
            "https://projeto-25-26.vercel.app"
        ],
        methods: ["GET", "POST"]
    }
});

// --- 3. DATABASE CONNECTION ---
mongoose.connect(DB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 4. SOCKET.IO INTEGRATION ---
sensorController.setSocketIo(io); 

io.on('connection', (socket) => {
    console.log(`[Socket.io] User connected: ${socket.id}`);
});

// --- 5. MIDDLEWARE & ROUTES ---
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://projeto-25-26.vercel.app"
  ],
  methods: ["GET", "POST"]
}));
app.use(express.json());   // Parse JSON bodies
app.get('/test', (req, res) => {
  res.send('Backend is alive');
});
app.use('/api', sensorRoutes); // Use router

// --- 6. START THE SERVER ---
server.listen(PORT, () => {
    console.log(`🚀 Server and Socket.io listening on http://localhost:${PORT}`);
});