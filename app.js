/**
 * Ultra-Precision Virtual Mouse Controller
 * Advanced touch processing with gesture recognition and performance optimization
 */

class UltraPrecisionMouse {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        
        // Performance tracking
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.performanceMetrics = {
            latency: 0,
            accuracy: 100,
            smoothness: 95
        };
        
        // Touch processing
        this.touchData = {
            isActive: false,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            pressure: 1.0
        };
        
        // Smoothing and filtering
        this.smoothingBuffer = [];
        this.bufferSize = 8;
        this.kalmanFilter = new KalmanFilter();
        this.gestureRecognizer = new GestureRecognizer();
        
        // Settings
        this.settings = {
            sensitivity: 2.5,
            precisionMode: true,
            smoothing: true,
            gestureEnabled: true,
            showTrails: true,
            hapticFeedback: true
        };
        
        // Elements
        this.elements = {};
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initSocket();
        this.initEventListeners();
        this.initPerformanceMonitoring();
        this.startAnimationLoop();
        
        // Hide loading screen after initialization
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 2000);
    }
    
    initElements() {
        this.elements = {
            touchpad: document.getElementById('touchpad'),
            cursorIndicator: document.getElementById('cursorIndicator'),
            gestureTrails: document.getElementById('gestureTrails'),
            touchFeedback: document.getElementById('touchFeedback'),
            leftClick: document.getElementById('leftClick'),
            rightClick: document.getElementById('rightClick'),
            scrollZone: document.getElementById('scrollZone'),
            sensitivitySlider: document.getElementById('sensitivitySlider'),
            sensitivityValue: document.getElementById('sensitivityValue'),
            precisionToggle: document.getElementById('precisionToggle'),
            statsToggle: document.getElementById('statsToggle'),
            statsContent: document.getElementById('statsContent'),
            connectionStatus: document.getElementById('connectionStatus'),
            connectionText: document.getElementById('connectionText'),
            loadingScreen: document.getElementById('loadingScreen'),
            latencyValue: document.getElementById('latencyValue'),
            latencyBar: document.getElementById('latencyBar'),
            accuracyValue: document.getElementById('accuracyValue'),
            accuracyBar: document.getElementById('accuracyBar'),
            smoothnessValue: document.getElementById('smoothnessValue'),
            smoothnessBar: document.getElementById('smoothnessBar')
        };
    }
    
    initSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            console.log('🔗 Connected to mouse server');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            console.log('❌ Disconnected from mouse server');
        });
        
        this.socket.on('sensitivity_updated', (data) => {
            this.settings.sensitivity = data.sensitivity;
            this.elements.sensitivityValue.textContent = `${data.sensitivity}x`;
        });
        
        // Latency measurement
        this.socket.on('pong', (timestamp) => {
            const latency = Date.now() - timestamp;
            this.updateLatency(latency);
        });
        
        // Ping server periodically for latency measurement
        setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('ping', Date.now());
            }
        }, 1000);
    }
    
    initEventListeners() {
        // Touchpad events
        this.initTouchpadEvents();
        
        // Button events
        this.initButtonEvents();
        
        // Control events
        this.initControlEvents();
        
        // Keyboard shortcuts
        this.initKeyboardShortcuts();
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    initTouchpadEvents() {
        const touchpad = this.elements.touchpad;
        
        // Mouse events
        touchpad.addEventListener('mousedown', (e) => this.handleTouchStart(e));
        touchpad.addEventListener('mousemove', (e) => this.handleTouchMove(e));
        touchpad.addEventListener('mouseup', (e) => this.handleTouchEnd(e));
        touchpad.addEventListener('mouseleave', (e) => this.handleTouchEnd(e));
        
        // Touch events
        touchpad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e.touches[0]);
        }, { passive: false });
        
        touchpad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e.touches[0]);
        }, { passive: false });
        
        touchpad.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e.changedTouches[0]);
        }, { passive: false });
        
        // Wheel events for scroll
        touchpad.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleScroll(e);
        }, { passive: false });
    }
    
    initButtonEvents() {
        // Left click button
        this.elements.leftClick.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleClick('left');
            this.addClickEffect(this.elements.leftClick);
        });
        
        this.elements.leftClick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick('left');
            this.addClickEffect(this.elements.leftClick);
        }, { passive: false });
        
        // Right click button
        this.elements.rightClick.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleClick('right');
            this.addClickEffect(this.elements.rightClick);
        });
        
        this.elements.rightClick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick('right');
            this.addClickEffect(this.elements.rightClick);
        }, { passive: false });
        
        // Scroll zone
        let scrollStartY = 0;
        let isScrolling = false;
        
        this.elements.scrollZone.addEventListener('mousedown', (e) => {
            isScrolling = true;
            scrollStartY = e.clientY;
            this.elements.scrollZone.classList.add('scrolling');
        });
        
        this.elements.scrollZone.addEventListener('mousemove', (e) => {
            if (isScrolling) {
                const deltaY = (e.clientY - scrollStartY) * 0.1;
                this.handleScrollDelta(deltaY);
                scrollStartY = e.clientY;
            }
        });
        
        this.elements.scrollZone.addEventListener('mouseup', () => {
            isScrolling = false;
            this.elements.scrollZone.classList.remove('scrolling');
        });
        
        this.elements.scrollZone.addEventListener('mouseleave', () => {
            isScrolling = false;
            this.elements.scrollZone.classList.remove('scrolling');
        });
    }
    
    initControlEvents() {
        // Sensitivity slider
        this.elements.sensitivitySlider.addEventListener('input', (e) => {
            const sensitivity = parseFloat(e.target.value);
            this.settings.sensitivity = sensitivity;
            this.elements.sensitivityValue.textContent = `${sensitivity}x`;
            
            if (this.isConnected) {
                this.socket.emit('sensitivity_change', { sensitivity });
            }
        });
        
        // Precision toggle
        this.elements.precisionToggle.addEventListener('click', () => {
            this.settings.precisionMode = !this.settings.precisionMode;
            this.elements.precisionToggle.classList.toggle('active');
        });
        
        // Stats toggle
        this.elements.statsToggle.addEventListener('click', () => {
            this.elements.statsToggle.classList.toggle('active');
            this.elements.statsContent.classList.toggle('hidden');
        });
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.handleClick('left');
                        break;
                    case '2':
                        e.preventDefault();
                        this.handleClick('right');
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.adjustSensitivity(0.1);
                        break;
                    case '-':
                        e.preventDefault();
                        this.adjustSensitivity(-0.1);
                        break;
                }
            }
        });
    }
    
    handleTouchStart(event) {
        const rect = this.elements.touchpad.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        
        this.touchData.isActive = true;
        this.touchData.startPosition = { x, y };
        this.touchData.currentPosition = { x, y };
        this.touchData.pressure = event.force || 1.0;
        
        this.updateCursorPosition(x, y);
        this.showTouchFeedback(event.clientX - rect.left, event.clientY - rect.top);
        
        // Initialize gesture recognition
        this.gestureRecognizer.startGesture(x, y);
    }
    
    handleTouchMove(event) {
        if (!this.touchData.isActive) return;
        
        const rect = this.elements.touchpad.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        
        // Calculate velocity and acceleration
        const deltaTime = performance.now() - this.lastFrameTime;
        if (deltaTime > 0) {
            const deltaX = x - this.touchData.currentPosition.x;
            const deltaY = y - this.touchData.currentPosition.y;
            
            this.touchData.velocity.x = deltaX / deltaTime * 1000;
            this.touchData.velocity.y = deltaY / deltaTime * 1000;
        }
        
        this.touchData.currentPosition = { x, y };
        this.touchData.pressure = event.force || 1.0;
        
        // Apply filtering and smoothing
        const filteredPosition = this.processPosition(x, y);
        
        this.updateCursorPosition(filteredPosition.x, filteredPosition.y);
        
        if (this.settings.showTrails) {
            this.addTrailPoint(event.clientX - rect.left, event.clientY - rect.top);
        }
        
        // Send to server
        if (this.isConnected) {
            this.socket.emit('mouse_move', filteredPosition);
        }
        
        // Update gesture recognition
        this.gestureRecognizer.updateGesture(x, y);
        
        this.lastFrameTime = performance.now();
    }
    
    handleTouchEnd(event) {
        this.touchData.isActive = false;
        
        // Process gesture
        const gesture = this.gestureRecognizer.endGesture();
        this.processGesture(gesture);
        
        // Reset velocity
        this.touchData.velocity = { x: 0, y: 0 };
        this.smoothingBuffer = [];
    }
    
    processPosition(x, y) {
        // Add to smoothing buffer
        this.smoothingBuffer.push({ x, y, timestamp: performance.now() });
        if (this.smoothingBuffer.length > this.bufferSize) {
            this.smoothingBuffer.shift();
        }
        
        if (!this.settings.smoothing || this.smoothingBuffer.length < 3) {
            return { x, y };
        }
        
        // Apply Kalman filtering
        const filtered = this.kalmanFilter.filter(x, y);
        
        // Apply precision mode
        if (this.settings.precisionMode) {
            return this.applyPrecisionZone(filtered.x, filtered.y);
        }
        
        return filtered;
    }
    
    applyPrecisionZone(x, y) {
        // Determine which precision zone the cursor is in
        let multiplier = 1.0;
        
        if (x >= 0.3 && x <= 0.7 && y >= 0.3 && y <= 0.7) {
            multiplier = 0.3; // High precision zone
        } else if (x >= 0.2 && x <= 0.8 && y >= 0.2 && y <= 0.8) {
            multiplier = 0.6; // Medium precision zone
        }
        
        return { x, y, multiplier };
    }
    
    handleClick(button) {
        if (this.isConnected) {
            this.socket.emit('mouse_click', { button });
            
            // Haptic feedback
            if (this.settings.hapticFeedback && navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }
    
    handleScroll(event) {
        const deltaY = event.deltaY * 0.01;
        this.handleScrollDelta(deltaY);
    }
    
    handleScrollDelta(deltaY) {
        if (this.isConnected) {
            this.socket.emit('mouse_scroll', { deltaY });
        }
    }
    
    processGesture(gesture) {
        if (!this.settings.gestureEnabled || !gesture) return;
        
        switch(gesture.type) {
            case 'tap':
                if (gesture.duration < 200) {
                    this.handleClick('left');
                }
                break;
            case 'longPress':
                this.handleClick('right');
                break;
            case 'swipe':
                if (gesture.direction === 'up' || gesture.direction === 'down') {
                    const deltaY = gesture.direction === 'up' ? -3 : 3;
                    this.handleScrollDelta(deltaY);
                }
                break;
        }
    }
    
    updateCursorPosition(x, y) {
        const rect = this.elements.touchpad.getBoundingClientRect();
        const pixelX = x * rect.width - 6; // Center the cursor
        const pixelY = y * rect.height - 6;
        
        this.elements.cursorIndicator.style.transform = 
            `translate(${pixelX}px, ${pixelY}px)`;
    }
    
    showTouchFeedback(x, y) {
        const feedback = this.elements.touchFeedback;
        feedback.style.left = `${x - 10}px`;
        feedback.style.top = `${y - 10}px`;
        feedback.style.opacity = '1';
        
        // Trigger animation
        feedback.style.animation = 'none';
        feedback.offsetHeight; // Force reflow
        feedback.style.animation = 'touchPulse 0.3s ease-out';
    }
    
    addTrailPoint(x, y) {
        const trail = document.createElement('div');
        trail.className = 'trail-point';
        trail.style.left = `${x - 2}px`;
        trail.style.top = `${y - 2}px`;
        
        this.elements.gestureTrails.appendChild(trail);
        
        // Remove trail point after animation
        setTimeout(() => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
        }, 500);
    }
    
    addClickEffect(button) {
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 600);
    }
    
    adjustSensitivity(delta) {
        const newSensitivity = Math.max(0.1, Math.min(10.0, this.settings.sensitivity + delta));
        this.settings.sensitivity = newSensitivity;
        this.elements.sensitivitySlider.value = newSensitivity;
        this.elements.sensitivityValue.textContent = `${newSensitivity}x`;
        
        if (this.isConnected) {
            this.socket.emit('sensitivity_change', { sensitivity: newSensitivity });
        }
    }
    
    updateConnectionStatus(connected) {
        const statusDot = this.elements.connectionStatus;
        const statusText = this.elements.connectionText;
        
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }
    
    updateLatency(latency) {
        this.performanceMetrics.latency = latency;
        this.elements.latencyValue.textContent = `${latency}ms`;
        
        // Update latency bar (lower is better)
        const percentage = Math.max(0, 100 - (latency / 100 * 100));
        this.elements.latencyBar.style.width = `${percentage}%`;
    }
    
    initPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 1000);
    }
    
    updatePerformanceMetrics() {
        // Calculate FPS-based smoothness
        const currentTime = Date.now();
        const deltaTime = currentTime - this.startTime;
        const fps = (this.frameCount / deltaTime) * 1000;
        
        this.performanceMetrics.smoothness = Math.min(100, (fps / 60) * 100);
        this.elements.smoothnessValue.textContent = 
            `${Math.round(this.performanceMetrics.smoothness)}%`;
        this.elements.smoothnessBar.style.width = 
            `${this.performanceMetrics.smoothness}%`;
        
        // Reset frame counter
        this.frameCount = 0;
        this.startTime = currentTime;
    }
    
    startAnimationLoop() {
        const animate = () => {
            this.frameCount++;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    handleResize() {
        // Recalibrate touch areas
        this.kalmanFilter.reset();
        this.smoothingBuffer = [];
    }
    
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Kalman Filter for position smoothing
class KalmanFilter {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = { pos: 0, vel: 0 };
        this.y = { pos: 0, vel: 0 };
        this.initialized = false;
    }
    
    filter(x, y) {
        if (!this.initialized) {
            this.x.pos = x;
            this.y.pos = y;
            this.initialized = true;
            return { x, y };
        }
        
        // Simple Kalman filter implementation
        const alpha = 0.7; // Smoothing factor
        
        this.x.pos = alpha * this.x.pos + (1 - alpha) * x;
        this.y.pos = alpha * this.y.pos + (1 - alpha) * y;
        
        return { x: this.x.pos, y: this.y.pos };
    }
}

// Gesture Recognition System
class GestureRecognizer {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.points = [];
        this.startTime = 0;
        this.isActive = false;
    }
    
    startGesture(x, y) {
        this.reset();
        this.points.push({ x, y, time: Date.now() });
        this.startTime = Date.now();
        this.isActive = true;
    }
    
    updateGesture(x, y) {
        if (!this.isActive) return;
        
        this.points.push({ x, y, time: Date.now() });
        
        // Keep only recent points to save memory
        if (this.points.length > 50) {
            this.points.shift();
        }
    }
    
    endGesture() {
        if (!this.isActive || this.points.length < 2) {
            this.reset();
            return null;
        }
        
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        const gesture = this.analyzeGesture(duration);
        
        this.reset();
        return gesture;
    }
    
    analyzeGesture(duration) {
        const firstPoint = this.points[0];
        const lastPoint = this.points[this.points.length - 1];
        
        const deltaX = lastPoint.x - firstPoint.x;
        const deltaY = lastPoint.y - firstPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Tap gesture
        if (distance < 0.05 && duration < 300) {
            return { type: 'tap', duration };
        }
        
        // Long press
        if (distance < 0.05 && duration > 500) {
            return { type: 'longPress', duration };
        }
        
        // Swipe gesture
        if (distance > 0.1) {
            const angle = Math.atan2(deltaY, deltaX);
            let direction;
            
            if (Math.abs(angle) < Math.PI / 4) {
                direction = 'right';
            } else if (Math.abs(angle) > 3 * Math.PI / 4) {
                direction = 'left';
            } else if (angle > 0) {
                direction = 'down';
            } else {
                direction = 'up';
            }
            
            return { 
                type: 'swipe', 
                direction, 
                distance, 
                duration 
            };
        }
        
        return null;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.virtualMouse = new UltraPrecisionMouse();
    
    // Add some visual flair
    createFloatingParticles();
});

// Create floating particles for visual enhancement
function createFloatingParticles() {
    const particleCount = 20;
    const container = document.querySelector('.floating-particles');
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: cyan;
            border-radius: 50%;
            box-shadow: 0 0 5px cyan;
            animation: particleFloat ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${0.3 + Math.random() * 0.7};
        `;
        
        container.appendChild(particle);
    }
}

// Add particle animation styles
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.3;
        }
        25% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
            opacity: 0.8;
        }
        50% {
            transform: translateY(-10px) translateX(-5px) scale(0.8);
            opacity: 1;
        }
        75% {
            transform: translateY(5px) translateX(-10px) scale(1.1);
            opacity: 0.6;
        }
    }
`;
document.head.appendChild(particleStyles);
