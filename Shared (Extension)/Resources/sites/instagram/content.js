const modifyInstagramUI = () => {
    //chrome.storage.sync.get("instagram", ({ instagram }) => {
    //console.log("overallVolume", overallVolume);
    //const enabled = instagram !== false;
    
    const enabled = true;
    
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
        if(element.nextElementSibling?.tagName === "DIV") {
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
        script.src = chrome.runtime.getURL('inject.js');
        script.addEventListener('load', () => {
            console.log('[ReelsFix] inject.js loaded successfully');
            script.remove();
        }, { once: true });
        script.dataset.debug = DEBUG; // Pass debug state
        document.documentElement.appendChild(script);
        
        const setupVideos = new WeakSet();
        let currentVolume = 1.0;
        let saveTimeout;
        
        // Load saved volume on startup
        chrome.storage.local.get('reelVolume').then((result) => {
            if (result.reelVolume !== undefined) {
                currentVolume = result.reelVolume;
            }
        });
        
        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Check if element center is roughly in viewport
            const elementCenter = rect.top + rect.height / 2;
            return elementCenter > 0 && elementCenter < windowHeight;
        }
        
        function updateNearbyVideos(sourceVideo) {
            const allVideos = Array.from(document.querySelectorAll('video'));
            const sourceIndex = allVideos.indexOf(sourceVideo);
            
            if (sourceIndex === -1) return;
            
            // Update 3 videos before and 3 after
            const start = Math.max(0, sourceIndex - 3);
            const end = Math.min(allVideos.length, sourceIndex + 4);
            
            for (let i = start; i < end; i++) {
                if (i !== sourceIndex) {
                    allVideos[i].volume = currentVolume;
                    console.log('[ReelsFix] Updated nearby video volume:', i);
                }
            }
        }
        
        function setupVideo(video) {
            if (setupVideos.has(video)) return;
            setupVideos.add(video);
            
            video.controls = true;
            
            // Set immediately
            video.volume = currentVolume;
            
            // Set again after Instagram's initialization likely completes
            setTimeout(() => { video.volume = currentVolume; }, 0);
            setTimeout(() => { video.volume = currentVolume; }, 100);
            
            
            
            video.addEventListener('volumechange', () => {
                if (!document.contains(video)) return;
                if (video.volume === currentVolume) return;
                
                // Ignore suspicious resets to 1 from non-visible videos
                if (video.volume === 1 && !isInViewport(video)) {
                    video.volume = currentVolume;  // Fight back!
                    return;
                }
                
                currentVolume = video.volume;
                updateNearbyVideos(video);
                
                // debounce writes - oh yea optimization time baby
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    chrome.storage.local.set({ reelVolume: currentVolume });
                    console.log('[ReelsFix] Volume saved:', currentVolume);
                }, 300);
            });
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