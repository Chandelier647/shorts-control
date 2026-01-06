//
//  content.js
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//

import { Native, log, DEBUG } from '../../shared/index.js';
import { isInViewport, createUIObserver } from '../../shared/index.js';
import { storage, createSettings } from '../../shared/index.js';

const settings = createSettings([
    'instagram',
    'instagram-autoplay',
    'instagram-keep-playing'
], {
    'instagram': true,
    'instagram-autoplay': false,
    'instagram-keep-playing': false
});

// Initialize
Native.init();

const setupVideoHandling = () => {
    const setupVideos = new WeakSet();
    let currentVolume = 1.0;
    let isMuted = false;
    let saveTimeout;
    
    // Track which video the user explicitly started playing
    let userPlayedVideo = null;

    // Load saved state on startup
    storage.local.get(['reelVolume', 'reelMuted']).then((result) => {
        if (result.reelVolume !== undefined) {
            currentVolume = result.reelVolume;
        }
        if (result.reelMuted !== undefined) {
            isMuted = result.reelMuted;
        }
    });

    const saveState = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            storage.local.set({
                reelVolume: currentVolume,
                reelMuted: isMuted,
            });
            log('State saved:', { volume: currentVolume, muted: isMuted });
        }, 300);
    };

    const applyVolumeState = (video) => {
        if (isMuted) {
            video.volume = 0;
        } else {
            video.volume = currentVolume;
        }
    };

    function updateNearbyVideos(sourceVideo) {
        const allVideos = Array.from(document.querySelectorAll('video'));
        const sourceIndex = allVideos.indexOf(sourceVideo);

        if (sourceIndex === -1) return;

        // Update 3 videos before and 3 after
        const start = Math.max(0, sourceIndex - 3);
        const end = Math.min(allVideos.length, sourceIndex + 4);

        for (let i = start; i < end; i++) {
            if (i !== sourceIndex) {
                applyVolumeState(allVideos[i]);
                log('Updated nearby video volume:', i);
            }
        }
    }

    const setupVideo = (video) => {
        if (setupVideos.has(video)) return;
        setupVideos.add(video);

        const s = settings.get();

        video.controls = true;

        // Apply volume state
        applyVolumeState(video);
        setTimeout(() => applyVolumeState(video), 0);
        setTimeout(() => applyVolumeState(video), 100);

        // Handle volume changes
        video.addEventListener('volumechange', () => {
            if (!document.contains(video)) return;
            const newVolume = video.volume;

            // Ignore suspicious resets from non-visible videos
            if (newVolume === 1 && !isInViewport(video)) {
                applyVolumeState(video);
                return;
            }

            // User muted (dragged to 0)
            if (newVolume === 0 && !isMuted) {
                isMuted = true;
                updateNearbyVideos(video);
                saveState();
                return;
            }

            // User unmuted (dragged above 0)
            if (newVolume > 0 && isMuted) {
                isMuted = false;
                currentVolume = newVolume;
                updateNearbyVideos(video);
                saveState();
                return;
            }

            // Normal volume change
            if (newVolume > 0 && newVolume !== currentVolume) {
                currentVolume = newVolume;
                updateNearbyVideos(video);
                saveState();
            }
        });

        // Handle user-initiated play
        video.addEventListener('play', () => {
            const s = settings.get();
            
            // If user clicked play on a different video
            if (userPlayedVideo && userPlayedVideo !== video && document.contains(userPlayedVideo)) {
                log('User played new video, pausing previous');
                userPlayedVideo.pause();
            }
            
            // Track this as the user's active video
            userPlayedVideo = video;
            log('User played video:', video);
        });

        // Handle autoplay setting
        if (s['instagram-autoplay'] && isInViewport(video)) {
            video.play().catch(() => {});
        }
    };

    // Handle "keep playing" behavior when scrolling
    const handleScrollBehavior = () => {
        const s = settings.get();
        
        // If autoplay is enabled, normal Instagram behavior is fine
        if (s['instagram-autoplay']) return;
        
        // If keep-playing is disabled, pause videos that scroll out of view
        // (unless they're the user's explicitly played video)
        if (!s['instagram-keep-playing']) {
            document.querySelectorAll('video').forEach(video => {
                if (!isInViewport(video) && !video.paused) {
                    if (video !== userPlayedVideo) {
                        video.pause();
                    }
                }
            });
        }
        
        // If keep-playing IS enabled, only the userPlayedVideo should keep playing
        // Other videos that come into view should NOT autoplay
    };

    // Debounced scroll handler
    let scrollTimeout;
    const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScrollBehavior, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    document.querySelectorAll('video').forEach(setupVideo);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'VIDEO') setupVideo(node);
                if (node.querySelectorAll) node.querySelectorAll('video').forEach(setupVideo);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};

const modifyInstagramUI = () => {
    const s = settings.get();
    const enabled = s['instagram'];

    log('enabled:', enabled);

    if (!enabled) return;
    if (!window.location.hostname.includes('instagram.com')) return;

    // Hide play buttons
    document.querySelectorAll('[aria-label="Play"]').forEach((element) => {
        if (element.parentElement?.parentElement) {
            element.parentElement.parentElement.style.display = 'none';
        }
    });

    // Hide presentation overlays
    document.querySelectorAll('div [role="presentation"]').forEach((element) => {
        if (element.nextElementSibling?.tagName === 'DIV') {
            element.parentElement.style.display = 'none';
        }
    });

    // Inject mute-prevention script (only once)
    if (!window.__reelsFixInjected) {
        window.__reelsFixInjected = true;
        log('Content script running, attempting injection');

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('dist/instagram-inject.js');
        script.dataset.debug = DEBUG;
        script.addEventListener('load', () => {
            log('inject.js loaded successfully');
            script.remove();
        }, { once: true });
        document.documentElement.appendChild(script);

        setupVideoHandling();
    }
};

const init = async () => {
    const { startObserving } = createUIObserver(modifyInstagramUI);

    await settings.load();

    settings.onChange(() => modifyInstagramUI());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            modifyInstagramUI();
        });
    } else {
        modifyInstagramUI();
    }
    
    startObserving();
};

init();
