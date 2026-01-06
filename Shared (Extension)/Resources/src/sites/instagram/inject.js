(function () {
    const DEBUG = document.currentScript?.dataset?.debug === 'true';
    const log = (...args) => DEBUG && console.log('[ReelsFix:inject]', ...args);

    if (window.__reelsFixPagePatched) {
        log('Page context already patched, skipping');
        return;
    }
    window.__reelsFixPagePatched = true;

    log('Injected script running in page context');

    const patchedVideos = new WeakSet();

    // Track recent user interaction
    let lastUserInteraction = 0;
    const USER_INTERACTION_WINDOW = 500; // ms

    const markUserInteraction = () => {
        lastUserInteraction = Date.now();
    };

    // Listen for user interactions that indicate intentional mute/unmute
    document.addEventListener('click', markUserInteraction, true);
    document.addEventListener('touchstart', markUserInteraction, true);
    document.addEventListener('keydown', (e) => {
        // m = toggle mute
        if (e.key === 'm' || e.key === 'M') {
            markUserInteraction();
        }
    }, true);

    const isUserInitiated = () => {
        return (Date.now() - lastUserInteraction) < USER_INTERACTION_WINDOW;
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'VIDEO') patchVideo(node);
                if (node.querySelectorAll) node.querySelectorAll('video').forEach(patchVideo);
            }
        }
    });

    function patchVideo(video) {
        if (patchedVideos.has(video)) return;
        patchedVideos.add(video);
        log('Patching video:', video);

        // Store the real muted state
        let realMuted = video.muted;

        // Unmute initially to override Instagram's default
        video.muted = false;
        realMuted = false;

        Object.defineProperty(video, 'muted', {
            set(value) {
                if (isUserInitiated()) {
                    // User clicked mute button - allow it
                    log('User-initiated mute:', value);
                    realMuted = value;
                    // Actually set it on the underlying element
                    HTMLMediaElement.prototype.__lookupSetter__('muted').call(video, value);
                } else {
                    // Instagram trying to mute - block it
                    log('Blocked Instagram mute attempt:', value);
                }
            },
            get() {
                return realMuted;
            },
            configurable: true
        });
    }

    document.querySelectorAll('video').forEach(patchVideo);

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
