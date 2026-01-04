//
//  native.js
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//

// shared.js — load this first in manifest

let DEBUG = false;

const log = (...args) => {
    if (DEBUG) console.log('[shorts-control]', ...args);
};

const Native = {
    sendMessage: (message) => {
        return browser.runtime.sendNativeMessage(
            "com.chandelier647.shorts-control",
            message
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
    }
};
