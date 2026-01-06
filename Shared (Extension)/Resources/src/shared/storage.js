// Promisified storage helpers
export const storage = {
    local: {
        get: (keys) => chrome.storage.local.get(keys),
        set: (items) => chrome.storage.local.set(items),
    },
    sync: {
        get: (keys) => chrome.storage.sync.get(keys),
        set: (items) => chrome.storage.sync.set(items),
    },
};

// Settings helper with defaults and change listener
export const createSettings = (keys, defaults = {}) => {
    let settings = { ...defaults };
    let listeners = [];

    // Load initial settings
    const load = async () => {
        const result = await storage.sync.get(keys);
        settings = { ...defaults, ...result };
        return settings;
    };

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;

        let updated = false;
        for (const key of keys) {
            if (changes[key]) {
                settings[key] = changes[key].newValue;
                updated = true;
            }
        }

        if (updated) {
            listeners.forEach(fn => fn(settings));
        }
    });

    return {
        load,
        get: () => settings,
        onChange: (fn) => {
            listeners.push(fn);
            return () => {
                listeners = listeners.filter(l => l !== fn);
            };
        },
    };
};