const Native = {
    sendMessage: (message) => {
        return browser.runtime.sendNativeMessage("application.id", message);
    },
    
    getConfig: async () => {
        try {
            const response = await Native.sendMessage({ action: "getConfig" });
            return response;
        } catch (e) {
            console.error("Failed to get native config:", e);
            return { isDebug: false };
        }
    }
};

// Debug-aware logging
let DEBUG = false;

const log = (...args) => {
    if (DEBUG) console.log('[shorts-control]', ...args);
};

// Initialize on load
Native.getConfig().then((config) => {
    DEBUG = config.isDebug;
    log('Config loaded:', config);
});