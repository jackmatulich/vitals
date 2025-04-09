// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dicomProcessor = require('./dicomProcessor');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/controller', express.static(path.join(__dirname, 'public/controller')));

// Store active connections and session data
const sessions = {};
const connectionCodes = {};

// Track volumes loaded by clients
const clientVolumes = {};

// Load DICOM data on startup
let volumeData = null;
(async () => {
  try {
    console.log('Loading DICOM dataset...');
    volumeData = await dicomProcessor.loadDicomDataset(path.join(__dirname, 'dicom_data'));
    console.log('DICOM dataset loaded successfully');
  } catch (error) {
    console.error('Failed to load DICOM dataset:', error);
  }
})();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle main client connections (simulator display)
  socket.on('initialize-simulator', async () => {
    console.log('Initializing simulator for client:', socket.id);
    
    // If volume data is loaded, send volume metadata
    if (volumeData) {
      socket.emit('volume-metadata', {
        dimensions: volumeData.dimensions,
        spacing: volumeData.spacing
      });
      
      // Store reference to this client's volume
      clientVolumes[socket.id] = volumeData;
    } else {
      socket.emit('error', { message: 'DICOM volume data not available' });
    }
  });
  
  // Handle connection code requests (for pairing phone controllers)
  socket.on('request-connection-code', () => {
    // Generate a unique code for this client
    const code = uuidv4().substring(0, 6);
    connectionCodes[code] = {
      mainClientId: socket.id,
      timestamp: Date.now()
    };
    
    socket.emit('connection-code', { code });
    console.log('Generated connection code for client:', socket.id, code);
    
    // Clean up old codes after 10 minutes
    setTimeout(() => {
      if (connectionCodes[code]) {
        delete connectionCodes[code];
      }
    }, 10 * 60 * 1000);
  });
  
  // Handle phone controller connection
  socket.on('connect-controller', ({ code }) => {
    if (!connectionCodes[code]) {
      socket.emit('error', { message: 'Invalid connection code' });
      return;
    }
    
    const { mainClientId } = connectionCodes[code];
    
    // Link this controller to the main client
    sessions[socket.id] = {
      type: 'controller',
      mainClientId,
      lastUpdate: Date.now()
    };
    
    if (!sessions[mainClientId]) {
      sessions[mainClientId] = {
        type: 'main',
        controllerIds: []
      };
    }
    
    sessions[mainClientId].controllerIds.push(socket.id);
    
    // Notify both sides of connection
    socket.emit('controller-connected', { success: true });
    io.to(mainClientId).emit('phone-connected');
    
    console.log('Controller connected:', socket.id, 'to main client:', mainClientId);
    
    // Clean up the used code
    delete connectionCodes[code];
  });
  
  // Handle IMU data from controller
  socket.on('imu-data', (data) => {
    if (!sessions[socket.id] || sessions[socket.id].type !== 'controller') {
      return;
    }
    
    const mainClientId = sessions[socket.id].mainClientId;
    
    // Update last seen timestamp
    sessions[socket.id].lastUpdate = Date.now();
    
    // Forward IMU data to the main client
    io.to(mainClientId).emit('probe-position', data);
    
    // If volume data exists for this client, generate ultrasound simulation
    if (clientVolumes[mainClientId]) {
      // Process the IMU data to determine probe position and orientation
      const probePosition = [
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      ];
      
      const probeOrientation = [
        data.quaternion.x || 0,
        data.quaternion.y || 0,
        data.quaternion.z || 0,
        data.quaternion.w || 1
      ];
      
      // Process session settings (or use defaults)
      const settings = sessions[mainClientId]?.settings || {
        depth: 15,
        gain: 50,
        preset: 'abdomen',
        width: 800,
        height: 600,
        speckleIntensity: 0.5,
        speckleAmount: 30,
        scanLines: true
      };
      
      // Generate ultrasound image
      try {
        const imageBuffer = dicomProcessor.simulateUltrasound(
          clientVolumes[mainClientId],
          probePosition,
          probeOrientation,
          settings
        );
        
        // Send image to main client
        io.to(mainClientId).emit('ultrasound-image', {
          imageData: imageBuffer.toString('base64')
        });
      } catch (error) {
        console.error('Error generating ultrasound image:', error);
      }
    }
  });
  
  // Handle settings updates from main client
  socket.on('update-settings', (settings) => {
    if (!sessions[socket.id]) {
      sessions[socket.id] = {
        type: 'main',
        controllerIds: [],
        settings: {}
      };
    }
    
    // Update settings
    sessions[socket.id].settings = {
      ...sessions[socket.id].settings,
      ...settings
    };
    
    console.log('Updated settings for client:', socket.id, settings);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (sessions[socket.id]) {
      if (sessions[socket.id].type === 'controller') {
        // Notify main client that controller disconnected
        const mainClientId = sessions[socket.id].mainClientId;
        if (mainClientId && sessions[mainClientId]) {
          io.to(mainClientId).emit('phone-disconnected');
          
          // Remove this controller from the main client's list
          sessions[mainClientId].controllerIds = sessions[mainClientId].controllerIds.filter(
            id => id !== socket.id
          );
        }
      } else if (sessions[socket.id].type === 'main') {
        // Notify all connected controllers that main client disconnected
        sessions[socket.id].controllerIds.forEach(controllerId => {
          io.to(controllerId).emit('main-disconnected');
          
          // Clean up controller sessions
          delete sessions[controllerId];
        });
        
        // Clean up volume data
        if (clientVolumes[socket.id]) {
          delete clientVolumes[socket.id];
        }
      }
      
      // Clean up session
      delete sessions[socket.id];
    }
  });
});

// Clean up inactive sessions periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  Object.keys(sessions).forEach(sessionId => {
    if (sessions[sessionId].lastUpdate && now - sessions[sessionId].lastUpdate > 10 * 60 * 1000) {
      delete sessions[sessionId];
    }
  });
}, 5 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});