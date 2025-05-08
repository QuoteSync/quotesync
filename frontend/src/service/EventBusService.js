import { ref } from 'vue';

// Simple event bus implementation
const listeners = {};

export const EventBus = {
  // Subscribe to an event
  on(event, callback) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
    
    // Return a function to unsubscribe
    return () => {
      this.off(event, callback);
    };
  },
  
  // Unsubscribe from an event
  off(event, callback) {
    if (!listeners[event]) return;
    
    const index = listeners[event].indexOf(callback);
    if (index > -1) {
      listeners[event].splice(index, 1);
    }
  },
  
  // Emit an event with data
  emit(event, data) {
    if (!listeners[event]) return;
    
    listeners[event].forEach(callback => {
      callback(data);
    });
  }
}; 