// js/controller.js - Simplified controller focused on iOS compatibility

/**
 * Controller module - Handles the ultrasound probe controller functionality
 */
const Controller = {
    // DOM elements
    elements: {
        connectionIndicator: null,
        connectionText: null,
        accelData: null,
        gyroData: null,
        orientationData: null,
        freezeButton: null,
        calibrateButton: null,
        permissions: null,
        grantPermissionButton: null,
        visualFeedback: null,
        controllerArea: null
    },
    
    // State
    state: {
        sessionId: '',
        isFrozen: false,
        isConnected: false,
        isPermissionGranted: false,
        lastPosition: { x: 0, y: 0, z: 0 },
        sendInterval: null
    },
    
    /**
     * Initialize the controller with a session ID
     * @param {string} sessionId - Session ID to connect to
     */
    init(sessionId) {
        // Store session ID
        this.state.sessionId = sessionId;
        
        // Initialize DOM elements
        this.initElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Connect to simulator
        this.connect();
    },
    
    /**
     * Initialize DOM elements
     */
    initElements() {
        this.elements.connectionIndicator = document.getElementById('controllerConnectionIndicator');
        this.elements.connectionText = document.getElementById('controllerConnectionText');
        this.elements.accelData = document.getElementById('accelData');
        this.elements.gyroData = document.getElementById('gyroData');
        this.elements.orientationData = document.getElementById('orientationData');
        this.elements.freezeButton = document.getElementById('freezeButton');
        this.elements.calibrateButton = document.getElementById('calibrateButton');
        this.elements.permissions = document.getElementById('permissions');
        this.elements.grantPermissionButton = document.getElementById('grantPermissionButton');
        this.elements.visualFeedback = document.getElementById('visualFeedback');
        this.elements.controllerArea = document.getElementById('controllerArea');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const self = this;
        
        // Freeze button
        this.elements.freezeButton.addEventListener('click', function() {
            self.toggleFreeze();
        });
        
        // Calibrate button
        this.elements.calibrateButton.addEventListener('click', function() {
            // Reset position to center
            self.state.lastPosition = { x: 0, y: 0, z: 0 };
            alert('Position reset to center');
        });
        
        // Grant permission button
        this.elements.grantPermissionButton.addEventListener('click', function() {
            self.requestSensorPermission();
        });
        
        // Show permissions panel
        this.elements.permissions.classList.remove('hidden');
    },
    
    /**
     * Connect to simulator
     */
    async connect() {
        this.elements.connectionText.textContent = 'Connecting...';
        
        try {
            // Send a test message
            const result = await DweetIO.send(this.state.sessionId, 'controller', {
                type: 'connect',
                timestamp: Date.now()
            });
            
            if (result && result.this === 'succeeded') {
                // Update connection status
                this.elements.connectionIndicator.classList.add('connected');
                this.elements.connectionText.textContent = 'Connected to Session: ' + this.state.sessionId;
                this.state.isConnected = true;
            } else {
                alert('Failed to connect to session');
                this.elements.connectionText.textContent = 'Connection failed';
            }
        } catch (error) {
            console.error('Error connecting to session:', error);
            this.elements.connectionText.textContent = 'Connection failed';
            alert('Error connecting to session: ' + error.message);
        }
    },
    
    /**
     * Request permission to access device sensors
     */
    async requestSensorPermission() {
        const self = this;
        console.log('Requesting sensor permissions...');
        
        try {
            let permissionGranted = false;
            
            // Handle iOS devices
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                const orientationResponse = await DeviceOrientationEvent.requestPermission();
                console.log("Orientation permission:", orientationResponse);
                
                if (orientationResponse === 'granted') {
                    permissionGranted = true;
                } else {
                    alert('Permission to access orientation was denied');
                    return;
                }
            } else {
                // For Android/desktop - no permission needed
                permissionGranted = true;
            }
            
            if (permissionGranted) {
                this.elements.permissions.classList.add('hidden');
                this.state.isPermissionGranted = true;
                
                // Simple event handlers with function
                function handleOrientation(event) {
                    if (self.state.isFrozen) return;
                    
                    // Display orientation data
                    const alpha = event.alpha || 0;
                    const beta = event.beta || 0;
                    const gamma = event.gamma || 0;
                    self.elements.orientationData.textContent = `α: ${alpha.toFixed(1)}° β: ${beta.toFixed(1)}° γ: ${gamma.toFixed(1)}°`;
                    
                    // Simple mapping of orientation to position
                    self.state.lastPosition = {
                        x: gamma / 90, // -1 to 1 based on gamma (-90° to 90°)
                        y: beta / 180,  // -1 to 1 based on beta (-180° to 180°)
                        z: 0
                    };
                    
                    // Create a quaternion from Euler angles
                    const rad = Math.PI / 180;
                    const cy = Math.cos(alpha * rad / 2);
                    const sy = Math.sin(alpha * rad / 2);
                    const cp = Math.cos(beta * rad / 2);
                    const sp = Math.sin(beta * rad / 2);
                    const cr = Math.cos(gamma * rad / 2);
                    const sr = Math.sin(gamma * rad / 2);
                    
                    self.state.lastPosition.quaternion = {
                        x: sr * cp * cy - cr * sp * sy,
                        y: cr * sp * cy + sr * cp * sy,
                        z: cr * cp * sy - sr * sp * cy,
                        w: cr * cp * cy + sr * sp * sy
                    };
                }
                
                function handleMotion(event) {
                    if (self.state.isFrozen) return;
                    
                    // Display acceleration data
                    const accel = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
                    self.elements.accelData.textContent = `X: ${accel.x ? accel.x.toFixed(2) : 0} Y: ${accel.y ? accel.y.toFixed(2) : 0} Z: ${accel.z ? accel.z.toFixed(2) : 0}`;
                    
                    // Display rotation rate
                    const rate = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
                    self.elements.gyroData.textContent = `X: ${rate.beta ? rate.beta.toFixed(2) : 0} Y: ${rate.gamma ? rate.gamma.toFixed(2) : 0} Z: ${rate.alpha ? rate.alpha.toFixed(2) : 0}`;
                }
                
                // Add event listeners
                window.addEventListener('deviceorientation', handleOrientation);
                window.addEventListener('devicemotion', handleMotion);
                
                // Start sending data
                this.startSendingData();
                
                // Log success
                console.log("Sensors initialized successfully");
                alert("Sensor access granted! Move your device to control the ultrasound.");
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
            alert('Error accessing device sensors: ' + error.message);
        }
    },
    
    /**
     * Start sending sensor data to the simulator
     */
    startSendingData() {
        const self = this;
        
        // Clear any existing interval
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
        }
        
        // Set up interval to send data
        this.state.sendInterval = setInterval(function() {
            if (!self.state.isFrozen && self.state.isConnected && self.state.isPermissionGranted) {
                // Prepare data to send
                const data = {
                    type: 'imu-data',
                    position: self.state.lastPosition,
                    quaternion: self.state.lastPosition.quaternion || { x: 0, y: 0, z: 0, w: 1 },
                    timestamp: Date.now()
                };
                
                // Send IMU data
                DweetIO.send(self.state.sessionId, 'controller', data)
                    .then(function(result) {
                        if (result && result.this === 'succeeded') {
                            // Data sent successfully
                        }
                    })
                    .catch(function(error) {
                        console.error('Error sending data:', error);
                    });
            }
        }, 100); // 10 times per second
    },
    
    /**
     * Toggle freeze mode
     */
    toggleFreeze() {
        this.state.isFrozen = !this.state.isFrozen;
        this.elements.freezeButton.textContent = this.state.isFrozen ? 'Unfreeze' : 'Freeze';
        this.elements.freezeButton.classList.toggle('freeze-active', this.state.isFrozen);
    },
    
    /**
     * Clean up controller resources
     */
    cleanup() {
        // Stop sending data
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
            this.state.sendInterval = null;
        }
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
    }
};