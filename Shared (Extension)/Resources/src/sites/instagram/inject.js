(function() {
    const DEBUG = document.currentScript?.dataset?.debug === 'true'; // We'll solve this another way later
    const log = (...args) => DEBUG && console.log('[ReelsFix:inject]', ...args);
    if (window.__reelsFixPagePatched) {
        console.log('[ReelsFix] Page context already patched, skipping');
        return;
    }
    window.__reelsFixPagePatched = true;
    
    console.log('[ReelsFix] Injected script running in page context');
    
    const patchedVideos = new WeakSet();
    
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
        console.log('[ReelsFix] Patching video:', video);
        
        // Actually unmute it first, before we override the property
        video.muted = false;
        
        Object.defineProperty(video, 'muted', {
            set(v) {
                console.log('[ReelsFix] Mute blocked:', v);
                // Don't set it
            },
            get() { return false; },
            configurable: true
        });
    }
    
    document.querySelectorAll('video').forEach(patchVideo);
    observer.observe(document.body, { childList: true, subtree: true });
})();
