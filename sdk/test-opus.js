import Opus from './opus.js';

// 1. Initialize the SDK
Opus.init({
    apiKey: 'test_api_key_node', // Demo Key
    endpoint: 'http://localhost:5000', // Ensure backend is running
    service: 'node-backend-worker',
    env: 'dev',
    debug: true // Enables console logs
});

console.log("🛡️ OpusGuard SDK Initialized in Node.js\n");

// 2. Demo: Manual Error Capture
async function processPayment() {
    console.log("Processing payment...");
    try {
        throw new Error("Insufficient funds for transaction.");
    } catch (error) {
        console.log("Caught an error, sending to OpusGuard...");
        await Opus.captureError(error, {
            severity: 'high',
            tags: ['billing', 'nodejs'],
            metadata: { userId: '10293' }
        });
    }
}

// 3. Demo: using withErrorBoundary wrapper
const riskyTask = async () => {
    console.log("Running risky task...");
    throw new Error("Database connection dropped!");
};

const safeTask = Opus.withErrorBoundary(riskyTask, {
    severity: 'critical',
    operation: 'riskyTask'
});

// Run demos
(async () => {
    await processPayment();

    console.log("\n-------------------\n");

    try {
        await safeTask();
    } catch (e) {
        console.log("safeTask failed, but OpusGuard captured it!");
    }
})();
