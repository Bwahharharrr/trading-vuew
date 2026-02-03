import { createApp } from 'vue'
import App from './App.vue'

function debug(...argv) {
    fetch('/debug?argv=' + JSON.stringify(argv))
}

// MOB_DEBUG=true npm run test - Enables mobile debugging
// (sending console output to the webpack terminal)
if (typeof MOB_DEBUG !== 'undefined' && MOB_DEBUG) {
    console.log = debug
    console.error = debug
    console.warn = debug
}

// Global window error handler for uncaught errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Window Error:', message)
    console.error('Source:', source, 'Line:', lineno, 'Col:', colno)
    if (error) console.error('Error object:', error)
    return true // Prevent default error handling
}

// Global unhandled promise rejection handler
window.onunhandledrejection = function(event) {
    console.error('Unhandled Promise Rejection:', event.reason)
    event.preventDefault()
}

const app = createApp(App)

// Vue 3 global error handler to catch and log errors
app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err?.message || err)
    console.error('Error Info:', info)
    if (instance && instance.$options) {
        console.error('Component:', instance.$options.name || 'Unknown')
    }
    // Don't re-throw - just log
}

// Suppress Vue warnings in production
app.config.warnHandler = (msg, instance, trace) => {
    // Only log if not a known harmless warning
    if (!msg.includes('Invalid prop') && !msg.includes('Extraneous non-props')) {
        console.warn('Vue Warning:', msg)
    }
}

app.mount('#app')
