#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Virtual Mouse Controller - Ultra High Precision Edition
Project 01001101 01100001 01101001 01100100 00100000 01100010 01111001 00100000 01000001 01111001 01100001 01101110 00100000 01001101 01101111 01101110 01100100 01100001 01101100 00100000 00101100 00110111 00110100 00110011 00110011 00110100 00111001 00101100 01110111 01100101 01110011 01110100 01100010 01100101 01101110 01100111 01100001 01101100 00101100 00110111 00110000 00110110 00110011 00110111 00110110 00111000 00110110 00110001 00110110
"""

import json
import logging
import threading
import time
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import pyautogui
import numpy as np
from scipy import interpolate
import cv2

# Configure PyAutoGUI for maximum accuracy and speed
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.001  # Ultra-fast response
pyautogui.MINIMUM_DURATION = 0.01
pyautogui.MINIMUM_SLEEP = 0.001

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ultra_precision_mouse_2024'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global mouse controller state
class MouseController:
    def __init__(self):
        self.screen_width, self.screen_height = pyautogui.size()
        self.sensitivity = 2.5
        self.smoothing_buffer = []
        self.buffer_size = 5
        self.acceleration_curve = self._create_acceleration_curve()
        self.last_position = None
        self.velocity_smoothing = []
        self.gesture_threshold = 0.1
        self.click_debounce = {}
        self.scroll_accumulator = 0.0
        self.precision_mode = True
        
    def _create_acceleration_curve(self):
        """Create smooth acceleration curve for natural mouse movement"""
        x = np.linspace(0, 1, 100)
        y = np.power(x, 1.2)  # Slight acceleration curve
        return interpolate.interp1d(x, y, kind='cubic', bounds_error=False, fill_value=(0, 1))
    
    def smooth_coordinates(self, x, y):
        """Apply sophisticated smoothing algorithm"""
        current_time = time.time()
        
        # Add to smoothing buffer
        self.smoothing_buffer.append((x, y, current_time))
        if len(self.smoothing_buffer) > self.buffer_size:
            self.smoothing_buffer.pop(0)
        
        if len(self.smoothing_buffer) < 2:
            return x, y
        
        # Weighted average with recent positions having more weight
        weights = np.exp(np.linspace(-2, 0, len(self.smoothing_buffer)))
        weights /= weights.sum()
        
        smooth_x = sum(pos[0] * weight for pos, weight in zip(self.smoothing_buffer, weights))
        smooth_y = sum(pos[1] * weight for pos, weight in zip(self.smoothing_buffer, weights))
        
        return smooth_x, smooth_y
    
    def calculate_velocity(self, x, y):
        """Calculate movement velocity for acceleration"""
        if self.last_position is None:
            self.last_position = (x, y)
            return 0
        
        dx = x - self.last_position[0]
        dy = y - self.last_position[1]
        velocity = np.sqrt(dx*dx + dy*dy)
        
        self.velocity_smoothing.append(velocity)
        if len(self.velocity_smoothing) > 3:
            self.velocity_smoothing.pop(0)
        
        smooth_velocity = np.mean(self.velocity_smoothing)
        self.last_position = (x, y)
        
        return smooth_velocity
    
    def apply_acceleration(self, dx, dy, velocity):
        """Apply acceleration curve based on velocity"""
        if velocity == 0:
            return dx, dy
        
        normalized_velocity = min(velocity / 50.0, 1.0)
        acceleration_factor = float(self.acceleration_curve(normalized_velocity))
        
        return dx * acceleration_factor * self.sensitivity, dy * acceleration_factor * self.sensitivity
    
    def move_cursor(self, x, y):
        """Ultra-precise cursor movement"""
        try:
            # Smooth coordinates
            smooth_x, smooth_y = self.smooth_coordinates(x, y)
            
            # Calculate velocity
            velocity = self.calculate_velocity(smooth_x, smooth_y)
            
            # Convert normalized coordinates to screen coordinates
            screen_x = int(smooth_x * self.screen_width)
            screen_y = int(smooth_y * self.screen_height)
            
            # Apply boundaries
            screen_x = max(0, min(screen_x, self.screen_width - 1))
            screen_y = max(0, min(screen_y, self.screen_height - 1))
            
            # Move cursor with sub-pixel precision simulation
            pyautogui.moveTo(screen_x, screen_y, duration=0, _pause=False)
            
        except Exception as e:
            logging.error(f"Cursor movement error: {e}")
    
    def click(self, button='left'):
        """Debounced precise clicking"""
        current_time = time.time()
        
        if button in self.click_debounce:
            if current_time - self.click_debounce[button] < 0.1:  # 100ms debounce
                return
        
        self.click_debounce[button] = current_time
        
        try:
            if button == 'left':
                pyautogui.click(button='left', duration=0.05, _pause=False)
            elif button == 'right':
                pyautogui.click(button='right', duration=0.05, _pause=False)
        except Exception as e:
            logging.error(f"Click error: {e}")
    
    def scroll(self, delta_y):
        """Smooth scrolling with accumulation"""
        try:
            # Accumulate small scroll movements
            self.scroll_accumulator += delta_y * 3
            
            if abs(self.scroll_accumulator) >= 1.0:
                scroll_amount = int(self.scroll_accumulator)
                pyautogui.scroll(scroll_amount, _pause=False)
                self.scroll_accumulator -= scroll_amount
        except Exception as e:
            logging.error(f"Scroll error: {e}")

# Initialize mouse controller
mouse_controller = MouseController()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/screen_info')
def screen_info():
    return jsonify({
        'width': mouse_controller.screen_width,
        'height': mouse_controller.screen_height,
        'sensitivity': mouse_controller.sensitivity
    })

@socketio.on('mouse_move')
def handle_mouse_move(data):
    x = float(data.get('x', 0))
    y = float(data.get('y', 0))
    mouse_controller.move_cursor(x, y)

@socketio.on('mouse_click')
def handle_mouse_click(data):
    button = data.get('button', 'left')
    mouse_controller.click(button)

@socketio.on('mouse_scroll')
def handle_mouse_scroll(data):
    delta_y = float(data.get('deltaY', 0))
    mouse_controller.scroll(delta_y)

@socketio.on('sensitivity_change')
def handle_sensitivity_change(data):
    new_sensitivity = float(data.get('sensitivity', 2.5))
    mouse_controller.sensitivity = max(0.1, min(new_sensitivity, 10.0))
    emit('sensitivity_updated', {'sensitivity': mouse_controller.sensitivity})

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    print("🖱️  Ultra-Precision Virtual Mouse Starting...")
    print(f"Screen Resolution: {mouse_controller.screen_width}x{mouse_controller.screen_height}")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
