//
//  content.js
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//

import { Native, log, DEBUG } from '../../shared/index.js';
import { isInViewport, createUIObserver } from '../../shared/index.js';
import { storage, createSettings } from '../../shared/index.js';

const settings = createSettings(['instagram', 'instagram-autoplay'], {
    'instagram': true,
    'instagram-autoplay': false
});

// Initialize
Native.init();

const setupVideoHandling = () => {
    const setupVideos = new WeakSet();
    let currentVolume = 1.0;
    let isMuted = false;
    let saveTimeout;

    // Load saved volume on startup
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
                applyVolumeState(allVideos[i])
                log('[ReelsFix] Updated nearby video volume:', i);
            }
        }
    }

    const setupVideo = (video) => {
        if (setupVideos.has(video)) return;
        setupVideos.add(video);

        const s = settings.get();

        video.controls = true;

        // Set immediately
        applyVolumeState(video);






        // Set again after Instagram's initialization likely completes
        setTimeout(() => applyVolumeState(video), 0);
        setTimeout(() => applyVolumeState(video), 100);



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

        if (s['instagram-autoplay'] && isInViewport(video)) {
            video.play().catch(() => { }); // Catch autoplay rejection
        }


    }
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
}
const modifyInstagramUI = () => {
    //chrome.storage.sync.get("instagram", ({ instagram }) => {
    //console.log("overallVolume", overallVolume);
    //const enabled = instagram !== false;

    const s = settings.get();

    const enabled = s['instagram'];

    log("enabled: " + enabled);

    if (!enabled) return;

    if (!window.location.hostname.includes("instagram.com")) return;



    document.querySelectorAll('[aria-label="Play"]').forEach((element) => {
        if (element.parentElement?.parentElement) {
            element.parentElement.parentElement.style.display = enabled
                ? "none"
                : "";
        }
    });



    document
        .querySelectorAll('div [role="presentation"]')
        .forEach((element) => {
            // if it's a vid the next tag tends to be a div, otherwise button
            if (element.nextElementSibling?.tagName === "DIV") {
                element.parentElement.style.display = enabled ? "none" : "";
            }
        });


    if (window.__reelsFixInjected) {
        console.log('[ReelsFix] Already injected, skipping');
    } else {
        window.__reelsFixInjected = true;
        console.log('[ReelsFix] Content script running, attempting injection');

        // Inject the mute-blocking script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('dist/instagram-inject.js');
        script.addEventListener('load', () => {
            console.log('[ReelsFix] inject.js loaded successfully');
            script.remove();
        }, { once: true });
        script.dataset.debug = DEBUG; // Pass debug state
        document.documentElement.appendChild(script);

        setupVideoHandling();


        /*document.querySelectorAll("video").forEach((video) => {
         if (enabled) {
         video.onvolumechange = () => {
         overallVolume = video.volume;
         // this breaks the mute shortcut control but this is good
         // because platforms hijack this.
         // The user can still drag the volume slider to 0
         video.muted = false;
         };
         video.muted = overallVolume === 0;
         video.volume = overallVolume;
         video.loop = true;
         video.controls = tr ue;
         video.controlsList = "nofullscreen";
         video.onclick = () => (video.paused ? video.play() : video.pause());
         } else {
         video.controls = false;
         video.onmouseup = null;
         video.onseeked = null;
         video.onended = null;
         video.onclick = null;
         }
         });
         });*/
    };



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
        modifyInstagramUI(); a

    }
    startObserving();
}
init();