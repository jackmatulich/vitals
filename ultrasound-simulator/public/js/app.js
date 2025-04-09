// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const ultrasoundCanvas = document.getElementById('ultrasoundCanvas');
    const ctx = ultrasoundCanvas.getContext('2d');
    const connectPhoneButton = document.getElementById('connectPhone');
    const depthControl = document.getElementById('depthControl');
    const gainControl = document.getElementById('gainControl');
    const depthValue = document.getElementById('depthValue');
    const gainValue = document.getElementById('gainValue');
    const presetSelect = document.getElementById('presetSelect');
    const scanLinesToggle = document.getElementById('scanLinesToggle');
    const freezeBtn = document.getElementById('freezeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const serverStatus = document.getElementById('serverStatus');
    const phoneStatus = document.getElementById('phoneStatus');
    const probeX = document.getElementById('probeX');
    const probeY = document.getElementById('probeY');
    const probeZ = document.getElementById('probeZ');
    const probeAngle = document.getElementById('probeAngle');
    const timestamp = document.getElementById('timestamp');
    const connectionModal = document.getElementById('connectionModal');
    const closeButton = document.querySelector('.close-button');
    const qrcodeElement = document.getElementById('qrcode');
    const connectionUrl = document.getElementById('connectionUrl');
    
    // Set canvas size with higher resolution for better quality
    ultrasoundCanvas.width = 800;
    ultrasoundCanvas.height = 600;
    
    // State variables
    let isFrozen = false;
    let lastImageData = null;
    
    // Initialize Socket.io connection
    const socket = io();
    
    // Update timestamp every second
    function updateTimestamp() {
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString();
    }
    setInterval(updateTimestamp, 1000);
    updateTimestamp();
    
    // Connection status handling
    socket.on('connect', () => {
        console.log('Connected to server');
        serverStatus.textContent = 'Connected';
        serverStatus.className = 'status-value connected';
        
        // Initialize simulator
        socket.emit('initialize-simulator');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        serverStatus.textContent = 'Disconnected';
        serverStatus.className = 'status-value disconnected';
        phoneStatus.textContent = 'Disconnected';
        phoneStatus.className = 'status-value disconnected';
    });
    
    socket.on('error', (data) => {
        console.error('Server error:', data.message);
        alert(`Error: ${data.message}`);
    });
    
    // Phone controller connection handling
    socket.on('phone-connected', () => {
        console.log('Phone controller connected');
        phoneStatus.textContent = 'Connected';
        phoneStatus.className = 'status-value connected';
        connectionModal.style.display = 'none';
    });
    
    socket.on('phone-disconnected', () => {
        console.log('Phone controller disconnected');
        phoneStatus.textContent = 'Disconnected';
        phoneStatus.className = 'status-value disconnected';
    });
    
    // Handle connection code for phone pairing
    socket.on('connection-code', (data) => {
        const url = `${window.location.origin}/controller?code=${data.code}`;
        connectionUrl.textContent = url;
        
        // Clear previous QR code
        qrcodeElement.innerHTML = '';
        
        // Generate new QR code
        new QRCode(qrcodeElement, {
            text: url,
            width: 200,
            height: 200
        });
        
        connectionModal.style.display = 'block';
    });
    
    // Handle ultrasound image updates
    socket.on('ultrasound-image', (data) => {
        if (isFrozen) return;
        
        const image = new Image();
        image.onload = () => {
            ctx.clearRect(0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
            ctx.drawImage(image, 0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
            
            // Store last image data for freeze/save functionality
            lastImageData = data.imageData;
        };
        image.src = `data:image/png;base64,${data.imageData}`;
    });
    
    // Handle probe position updates
    socket.on('probe-position', (data) => {
        // Update probe position display
        probeX.textContent = data.position.x.toFixed(2);
        probeY.textContent = data.position.y.toFixed(2);
        probeZ.textContent = data.position.z.toFixed(2);
        
        // Calculate and display angle (simplified)
        const q = data.quaternion;
        const angle = 2 * Math.acos(q.w) * 180 / Math.PI;
        probeAngle.textContent = angle.toFixed(2);
    });
    
    // Volume metadata received
    socket.on('volume-metadata', (data) => {
        console.log('Volume metadata received:', data);
        // Here you could update UI with volume information if needed
    });
    
    // Connect phone button
    connectPhoneButton.addEventListener('click', () => {
        socket.emit('request-connection-code');
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
        connectionModal.style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
        if (event.target === connectionModal) {
            connectionModal.style.display = 'none';
        }
    });
    
    // Freeze/unfreeze button
    freezeBtn.addEventListener('click', () => {
        isFrozen = !isFrozen;
        freezeBtn.textContent = isFrozen ? 'Unfreeze' : 'Freeze';
        
        if (!isFrozen) {
            // Request a new image immediately when unfreezing
            updateSettings();
        }
    });
    
    // Save button
    saveBtn.addEventListener('click', () => {
        if (!lastImageData) return;
        
        const link = document.createElement('a');
        link.download = `ultrasound_${new Date().toISOString().replace(/:/g, '-')}.png`;
        link.href = `data:image/png;base64,${lastImageData}`;
        link.click();
    });
    
    // Settings controls
    depthControl.addEventListener('input', () => {
        depthValue.textContent = depthControl.value;
        updateSettings();
    });
    
    gainControl.addEventListener('input', () => {
        gainValue.textContent = gainControl.value;
        updateSettings();
    });
    
    presetSelect.addEventListener('change', updateSettings);
    scanLinesToggle.addEventListener('change', updateSettings);
    
    // Update settings function
    function updateSettings() {
        socket.emit('update-settings', {
            depth: parseInt(depthControl.value),
            gain: parseInt(gainControl.value),
            preset: presetSelect.value,
            scanLines: scanLinesToggle.checked,
            width: ultrasoundCanvas.width,
            height: ultrasoundCanvas.height
        });
    }
    
    // Initial settings update
    updateSettings();
    
    // Draw placeholder image when first loaded
    function drawPlaceholderImage() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
        
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.beginPath();
        ctx.moveTo(ultrasoundCanvas.width / 2, 0);
        ctx.lineTo(0, ultrasoundCanvas.height);
        ctx.lineTo(ultrasoundCanvas.width, ultrasoundCanvas.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Connect phone controller to begin', ultrasoundCanvas.width / 2, ultrasoundCanvas.height / 2);
        
        // Draw scale on the side
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(ultrasoundCanvas.width - 30, 0);
        ctx.lineTo(ultrasoundCanvas.width - 30, ultrasoundCanvas.height);
        ctx.stroke();
        
        for (let i = 0; i <= 10; i++) {
            const y = i * ultrasoundCanvas.height / 10;
            ctx.beginPath();
            ctx.moveTo(ultrasoundCanvas.width - 40, y);
            ctx.lineTo(ultrasoundCanvas.width - 30, y);
            ctx.stroke();
            
            if (i % 2 === 0) {
                ctx.fillText(`${i * 2}cm`, ultrasoundCanvas.width - 60, y + 5);
            }
        }
    }
    
    // Draw initial placeholder
    drawPlaceholderImage();
});// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const ultrasoundCanvas = document.getElementById('ultrasoundCanvas');
    const ctx = ultrasoundCanvas.getContext('2d');
    const connectPhoneButton = document.getElementById('connectPhone');
    const depthControl = document.getElementById('depthControl');
    const gainControl = document.getElementById('gainControl');
    const depthValue = document.getElementById('depthValue');
    const gainValue = document.getElementById('gainValue');
    const presetSelect = document.getElementById('presetSelect');
    const scanLinesToggle = document.getElementById('scanLinesToggle');
    const freezeBtn = document.getElementById('freezeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const serverStatus = document.getElementById('serverStatus');
    const phoneStatus = document.getElementById('phoneStatus');
    const probeX = document.getElementById('probeX');
    const probeY = document.getElementById('probeY');
    const probeZ = document.getElementById('probeZ');
    const probeAngle = document.getElementById('probeAngle');
    const timestamp = document.getElementById('timestamp');
    const connectionModal = document.getElementById('connectionModal');
    const closeButton = document.querySelector('.close-button');
    const qrcodeElement = document.getElementById('qrcode');
    const connectionUrl = document.getElementById('connectionUrl');
    
    // Set canvas size with higher resolution for better quality
    ultrasoundCanvas.width = 800;
    ultrasoundCanvas.height = 600;
    
    // State variables
    let isFrozen = false;
    let lastImageData = null;
    
    // Initialize Socket.io connection
    const socket = io();
    
    // Update timestamp every second
    function updateTimestamp() {
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString();
    }
    setInterval(updateTimestamp, 1000);
    updateTimestamp();
    
    // Connection status handling
    socket.on('connect', () => {
        console.log('Connected to server');
        serverStatus.textContent = 'Connected';
        serverStatus.className = 'status-value connected';
        
        // Initialize simulator
        socket.emit('initialize-simulator');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        serverStatus.textContent = 'Disconnected';
        serverStatus.className = 'status-value disconnected';
        phoneStatus.textContent = 'Disconnected';
        phoneStatus.className = 'status-value disconnected';
    });
    
    socket.on('error', (data) => {
        console.error('Server error:', data.message);
        alert(`Error: ${data.message}`);
    });
    
    // Phone controller connection handling
    socket.on('phone-connected', () => {
        console.log('Phone controller connected');
        phoneStatus.textContent = 'Connected';
        phoneStatus.className = 'status-value connected';
        connectionModal.style.display = 'none';
    });
    
    socket.on('phone-disconnected', () => {
        console.log('Phone controller disconnected');
        phoneStatus.textContent = 'Disconnected';
        phoneStatus.className = 'status-value disconnected';
    });
    
    // Handle connection code for phone pairing
    socket.on('connection-code', (data) => {
        const url = `${window.location.origin}/controller?code=${data.code}`;
        connectionUrl.textContent = url;
        
        // Clear previous QR code
        qrcodeElement.innerHTML = '';
        
        // Generate new QR code
        new QRCode(qrcodeElement, {
            text: url,
            width: 200,
            height: 200
        });
        
        connectionModal.style.display = 'block';
    });
    
    // Handle ultrasound image updates
    socket.on('ultrasound-image', (data) => {
        if (isFrozen) return;
        
        const image = new Image();
        image.onload = () => {
            ctx.clearRect(0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
            ctx.drawImage(image, 0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
            
            // Store last image data for freeze/save functionality
            lastImageData = data.imageData;
        };
        image.src = `data:image/png;base64,${data.imageData}`;
    });
    
    // Handle probe position updates
    socket.on('probe-position', (data) => {
        // Update probe position display
        probeX.textContent = data.position.x.toFixed(2);
        probeY.textContent = data.position.y.toFixed(2);
        probeZ.textContent = data.position.z.toFixed(2);
        
        // Calculate and display angle (simplified)
        const q = data.quaternion;
        const angle = 2 * Math.acos(q.w) * 180 / Math.PI;
        probeAngle.textContent = angle.toFixed(2);
    });
    
    // Volume metadata received
    socket.on('volume-metadata', (data) => {
        console.log('Volume metadata received:', data);
        // Here you could update UI with volume information if needed
    });
    
    // Connect phone button
    connectPhoneButton.addEventListener('click', () => {
        socket.emit('request-connection-code');
    });
    
    // Close modal
    closeButton.addEventListener('click', () => {
        connectionModal.style.display = 'none';
    });
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
        if (event.target === connectionModal) {
            connectionModal.style.display = 'none';
        }
    });
    
    // Freeze/unfreeze button
    freezeBtn.addEventListener('click', () => {
        isFrozen = !isFrozen;
        freezeBtn.textContent = isFrozen ? 'Unfreeze' : 'Freeze';
        
        if (!isFrozen) {
            // Request a new image immediately when unfreezing
            updateSettings();
        }
    });
    
    // Save button
    saveBtn.addEventListener('click', () => {
        if (!lastImageData) return;
        
        const link = document.createElement('a');
        link.download = `ultrasound_${new Date().toISOString().replace(/:/g, '-')}.png`;
        link.href = `data:image/png;base64,${lastImageData}`;
        link.click();
    });
    
    // Settings controls
    depthControl.addEventListener('input', () => {
        depthValue.textContent = depthControl.value;
        updateSettings();
    });
    
    gainControl.addEventListener('input', () => {
        gainValue.textContent = gainControl.value;
        updateSettings();
    });
    
    presetSelect.addEventListener('change', updateSettings);
    scanLinesToggle.addEventListener('change', updateSettings);
    
    // Update settings function
    function updateSettings() {
        socket.emit('update-settings', {
            depth: parseInt(depthControl.value),
            gain: parseInt(gainControl.value),
            preset: presetSelect.value,
            scanLines: scanLinesToggle.checked,
            width: ultrasoundCanvas.width,
            height: ultrasoundCanvas.height
        });
    }
    
    // Initial settings update
    updateSettings();
    
    // Draw placeholder image when first loaded
    function drawPlaceholderImage() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, ultrasoundCanvas.width, ultrasoundCanvas.height);
        
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.beginPath();
        ctx.moveTo(ultrasoundCanvas.width / 2, 0);
        ctx.lineTo(0, ultrasoundCanvas.height);
        ctx.lineTo(ultrasoundCanvas.width, ultrasoundCanvas.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Connect phone controller to begin', ultrasoundCanvas.width / 2, ultrasoundCanvas.height / 2);
        
        // Draw scale on the side
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(ultrasoundCanvas.width - 30, 0);
        ctx.lineTo(ultrasoundCanvas.width - 30, ultrasoundCanvas.height);
        ctx.stroke();
        
        for (let i = 0; i <= 10; i++) {
            const y = i * ultrasoundCanvas.height / 10;
            ctx.beginPath();
            ctx.moveTo(ultrasoundCanvas.width - 40, y);
            ctx.lineTo(ultrasoundCanvas.width - 30, y);
            ctx.stroke();
            
            if (i % 2 === 0) {
                ctx.fillText(`${i * 2}cm`, ultrasoundCanvas.width - 60, y + 5);
            }
        }
    }
    
    // Draw initial placeholder
    drawPlaceholderImage();
});