// js/controller.js - Auto-request permissions on mobile devices UPDATED!!!

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
        sendInterval: null,
        hasRequestedPermission: false
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
        
        // Detect if it's a mobile device and auto-request permissions
        if (this.isMobileDevice()) {
            console.log("Mobile device detected - auto-requesting permissions");
            // Wait a bit for the UI to initialize
            setTimeout(() => {
                this.requestSensorPermission();
            }, 1000);
        } else {
            console.log("Not a mobile device - waiting for manual permission request");
        }
    },
    
    /**
     * Check if the current device is a mobile device
     * @returns {boolean} True if it's a mobile device
     */
    isMobileDevice() {
        return (
            /Android/i.test(navigator.userAgent) ||
            /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
            /IEMobile/i.test(navigator.userAgent) ||
            /BlackBerry/i.test(navigator.userAgent) ||
            /Opera Mini/i.test(navigator.userAgent)
        );
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
        // Prevent multiple requests
        if (this.state.hasRequestedPermission) {
            return;
        }
        
        this.state.hasRequestedPermission = true;
        
        console.log('Requesting sensor permissions...');
        const alertShown = document.createElement('div');
        alertShown.textContent = 'Attempting to access device sensors...';
        alertShown.style.position = 'fixed';
        alertShown.style.top = '10px';
        alertShown.style.left = '10px';
        alertShown.style.right = '10px';
        alertShown.style.backgroundColor = 'rgba(52, 152, 219, 0.8)';
        alertShown.style.color = 'white';
        alertShown.style.padding = '10px';
        alertShown.style.borderRadius = '5px';
        alertShown.style.zIndex = '1000';
        document.body.appendChild(alertShown);
        
        setTimeout(() => document.body.removeChild(alertShown), 3000);
        
        const self = this;
        
        try {
            // Try to add a listener first to see if permission is already granted
            let hasIOS = false;
            let permissionGranted = false;
            
            // Check if it's iOS and needs explicit permission
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                hasIOS = true;
                
                try {
                    // Request permission for device orientation
                    const orientationPermission = await DeviceOrientationEvent.requestPermission();
                    console.log("DeviceOrientationEvent permission result:", orientationPermission);
                    
                    if (orientationPermission === 'granted') {
                        permissionGranted = true;
                    } else {
                        alert('Permission denied for orientation sensors');
                        return;
                    }
                } catch (err) {
                    console.error("Error requesting orientation permission:", err);
                    alert('Failed to access orientation sensors: ' + err.message);
                    return;
                }
            } else {
                // Non-iOS device - permission is implicitly granted
                permissionGranted = true;
            }
            
            if (permissionGranted) {
                this.elements.permissions.classList.add('hidden');
                this.state.isPermissionGranted = true;
                
                // Define handlers as named functions so they can be referenced
                this.handleOrientation = function(event) {
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
                    
                    // Create visual dot based on orientation
                    self.createVisualFeedback(event);
                };
                
                this.handleMotion = function(event) {
                    if (self.state.isFrozen) return;
                    
                    // Display acceleration data
                    const accel = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
                    self.elements.accelData.textContent = `X: ${accel.x ? accel.x.toFixed(2) : 0} Y: ${accel.y ? accel.y.toFixed(2) : 0} Z: ${accel.z ? accel.z.toFixed(2) : 0}`;
                    
                    // Display rotation rate
                    const rate = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
                    self.elements.gyroData.textContent = `X: ${rate.beta ? rate.beta.toFixed(2) : 0} Y: ${rate.gamma ? rate.gamma.toFixed(2) : 0} Z: ${rate.alpha ? rate.alpha.toFixed(2) : 0}`;
                };
                
                // Add event listeners
                window.addEventListener('deviceorientation', this.handleOrientation, true);
                window.addEventListener('devicemotion', this.handleMotion, true);
                
                // Start sending data
                this.startSendingData();
                
                // Log success
                console.log("Sensors initialized successfully");
                const successAlert = document.createElement('div');
                successAlert.textContent = 'Sensor access granted! Move your device to control.';
                successAlert.style.position = 'fixed';
                successAlert.style.top = '10px';
                successAlert.style.left = '10px';
                successAlert.style.right = '10px';
                successAlert.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
                successAlert.style.color = 'white';
                successAlert.style.padding = '10px';
                successAlert.style.borderRadius = '5px';
                successAlert.style.zIndex = '1000';
                document.body.appendChild(successAlert);
                
                setTimeout(() => document.body.removeChild(successAlert), 3000);
            }
        } catch (error) {
            console.error('Error in requestSensorPermission:', error);
            alert('Error accessing device sensors: ' + error.message);
            this.state.hasRequestedPermission = false;
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
     * Create visual feedback based on orientation
     */
    createVisualFeedback(event) {
        // Clear previous dots
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Get orientation data
        const gamma = event.gamma || 0; // Left/right tilt (-90 to 90)
        const beta = event.beta || 0;   // Front/back tilt (-180 to 180)
        
        // Scale gamma and beta to screen coordinates
        const screenX = this.elements.controllerArea.offsetWidth / 2 + (gamma / 90) * (this.elements.controllerArea.offsetWidth / 2);
        const screenY = this.elements.controllerArea.offsetHeight / 2 + (beta / 180) * (this.elements.controllerArea.offsetHeight / 2);
        
        // Create a dot to represent the orientation
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${screenX}px`;
        dot.style.top = `${screenY}px`;
        
        // Make dot size proportional to tilt magnitude
        const magnitude = Math.sqrt(gamma*gamma + beta*beta) / 100;
        const size = Math.max(20, Math.min(50, 20 + magnitude * 30));
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        
        this.elements.visualFeedback.appendChild(dot);
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
        
        // Remove event listeners
        if (this.handleOrientation) {
            window.removeEventListener('deviceorientation', this.handleOrientation);
        }
        if (this.handleMotion) {
            window.removeEventListener('devicemotion', this.handleMotion);
        }
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
    }
};