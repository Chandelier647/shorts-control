// ============================================
// Debug & Logging
// ============================================

export let DEBUG = false;

export const log = (...args) => {
    if (DEBUG) console.log('[shorts-control]', ...args);
};

// ============================================
// Native Messaging
// ============================================

export const Native = {
    sendMessage: (message) => {
        return chrome.runtime.sendMessage(
            {
                type: "native",
                message: message,
            }
        );
    },

    getConfig: async () => {
        try {
            return await Native.sendMessage({ action: "getConfig" });
        } catch (e) {
            console.error("Native messaging failed:", e);
            return { isDebug: false };
        }
    },

    init: async () => {
        const config = await Native.getConfig();
        DEBUG = config.isDebug;
        log("Initialized, debug:", DEBUG);
    },

    getSettings: async () => {
        try {
            const response = await Native.sendMessage({ action: "getSettings" });
            return response.settings || {};
        } catch (e) {
            console.error("Failed to get settings:", e);
            return {};
        }
    },

    getSetting: async (key) => {
        try {
            const response = await Native.sendMessage({ action: "getSetting", key });
            return response.value;
        } catch (e) {
            console.error("Failed to get setting:", e);
            return null;
        }
    },

    setSetting: async (key, value) => {
        try {
            const response = await Native.sendMessage({ action: "setSetting", key, value });
            return response.success;
        } catch (e) {
            console.error("Failed to set setting:", e);
            return false;
        }
    }
};