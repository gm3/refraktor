// src/modules/eventBus.js

const events = {};

/**
 * Subscribes to an event.
 * @param {string} eventName - The name of the event to subscribe to.
 * @param {Function} listener - The callback function to execute when the event is emitted.
 */
export function on(eventName, listener) {
    if (!events[eventName]) {
        events[eventName] = [];
    }
    events[eventName].push(listener);
}

/**
 * Emits an event, calling all subscribed listeners.
 * @param {string} eventName - The name of the event to emit.
 * @param {*} data - The data to pass to the listeners.
 */
export function emit(eventName, data) {
    if (events[eventName]) {
        for (const listener of events[eventName]) {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in listener for event '${eventName}':`, error);
            }
        }
    }
} 