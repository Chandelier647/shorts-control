console.log("Content script loaded!");

var overallVolume = 1;

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
        script.src = browser.runtime.getURL('inject.js');
        script.onload = () => {
            console.log('[ReelsFix] inject.js loaded successfully');
            script.remove();
        };
        document.documentElement.appendChild(script);
        
        let currentVolume = 1.0;
        
        // Load saved volume on startup
        browser.storage.local.get('reelVolume').then((result) => {
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
            if (video._reelsFixSetup) return;
            video._reelsFixSetup = true;
            
            video.controls = true;
            
            // Set immediately
            video.volume = currentVolume;
            
            // Set again after Instagram's initialization likely completes
            setTimeout(() => { video.volume = currentVolume; }, 0);
            setTimeout(() => { video.volume = currentVolume; }, 100);
            
            let saveTimeout;
            
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
                    browser.storage.local.set({ reelVolume: currentVolume });
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

const modifyFacebookUI = () => {
    chrome.storage.sync.get(["facebook", "facebook-autounmute"], (settings) => {
        const {facebook, 'facebook-autounmute': autoUnmute} = settings;
        
        const enabled = facebook !== false;
        
        if (!window.location.hostname.includes("facebook.com")) return;
        
        const base = document.querySelector('[data-video-id]');
        const target = base?.parentElement?.nextElementSibling?.matches('.__fb-dark-mode')
        ? base.parentElement.nextElementSibling
        : null;
        
        if (!target) return;
        
        if (!document.getElementById('fb-ext-overlay-style')) {
            const style = document.createElement('style');
            style.id = 'fb-ext-overlay-style';
            style.textContent = `
        .fb-ext-overlay { opacity: 0; transition:opacity .2s ease; }
        .fb-ext-overlay:hover { opacity: 1; }
      `;
            document.head.appendChild(style);
        }
        target.classList.add('fb-ext-overlay');
        
        if (target && enabled)
            Object.assign(target.style, {
                display: 'block',
                position: 'absolute',
                bottom: '65px',
                width: '100%',
                height: '100%'
            });
        
        document.querySelectorAll("video").forEach((video) => {
            video.controls = enabled ? true : false;
            video.loop = true;
            video.controlsList = "nofullscreen";
            if (autoUnmute) {
                video.muted = false;
            }
            
            video.onmouseup = () => (video.muted = false);
            // onseeked seems to include looping back around to the beginning
            video.onseeked = () => {if (autoUnmute) {video.muted = false;}};
            video.onended = () => {if (autoUnmute) {video.muted = false;}};
            
            const parent = video.parentElement;
            if (parent) {
                Array.from(parent.children).forEach((sibling) => {
                    if (sibling !== video && sibling.hasAttribute("data-instancekey")) {
                        sibling.style.display = enabled ? "none" : "block";
                    }
                });
            }
        });
    });
};

const modifyYoutubeUI = () => {
    chrome.storage.sync.get(
                            [
                                "youtube",
                                "youtube-hide-title",
                                "youtube-hide-channel",
                                "youtube-hide-description",
                                "youtube-hide-track",
                                "youtube-hide-search-button",
                            ],
                            (settings) => {
                                if (!window.location.hostname.includes("youtube.com")) return;
                                
                                const enabled = settings.youtube !== false;
                                const hideChannel = settings["youtube-hide-channel"] !== false;
                                const hideTitle = settings["youtube-hide-title"] !== false;
                                const hideDescription = settings["youtube-hide-description"] !== false;
                                const hideTrack = settings["youtube-hide-track"] !== false;
                                const hideSearchButton = settings["youtube-hide-search-button"] !== false;
                                
                                const isShorts = window.location.pathname.includes("shorts");
                                
                                if (!isShorts) {
                                    document.querySelectorAll("video").forEach((video) => {
                                        video.controls = false;
                                    });
                                    return;
                                }
                                
                                // Top controls
                                document.querySelectorAll("ytd-shorts-player-controls").forEach((el) => {
                                    el.style.display = enabled ? "none" : "flex";
                                });
                                
                                // Red progress bar
                                document
                                .querySelectorAll("yt-progress-bar")
                                .forEach((el) => (el.style.display = enabled ? "none" : "flex"));
                                
                                // Audio track info
                                document
                                .querySelectorAll("reel-sound-metadata-view-model")
                                .forEach((el) => {
                                    el.style.display = hideTrack ? "none" : "block";
                                });
                                
                                // Weird suggested search button
                                document
                                .querySelectorAll("yt-shorts-suggested-action-view-model")
                                .forEach((el) => {
                                    el.style.display = hideSearchButton ? "none" : "block";
                                });
                                
                                // Metapanel: includes title, description, channel
                                // document
                                //   .querySelectorAll("yt-reel-metapanel-view-model")
                                //   .forEach((el) => {
                                //     if (hideChannel) {
                                //     el.parentElement.parentElement.style.pointerEvents = "none";
                                //     el.style.pointerEvents = "none";
                                //   });
                                
                                // Channel (handle + subscribe)
                                document
                                .querySelectorAll("yt-reel-channel-bar-view-model")
                                .forEach((el) => {
                                    el.style.display = hideChannel ? "none" : "flex";
                                });
                                
                                // title
                                document
                                .querySelectorAll("yt-shorts-video-title-view-model")
                                .forEach((el) => {
                                    el.style.display = hideTitle ? "none" : "initial";
                                });
                                
                                // description
                                document
                                .querySelectorAll("yt-reel-multi-format-link-view-model")
                                .forEach((el) => {
                                    el.style.display = hideDescription ? "none" : "block";
                                });
                                
                                // Metadata container at bottom (handle position/border/etc)
                                document
                                .querySelectorAll(
                                                  ".metadata-container.ytd-reel-player-overlay-renderer"
                                                  )
                                .forEach((el) => {
                                    el.style.position = "relative";
                                    el.style.bottom = "40px";
                                    el.style.backgroundImage = "none";
                                });
                                
                                document.querySelectorAll("video").forEach((video) => {
                                    video.controls = enabled;
                                    if (video.attributes["data-no-fullscreen"]) {
                                        video.attributes["data-no-fullscreen"].value = "false";
                                    }
                                    video.style.objectFit = "contain";
                                    
                                    video.onvolumechange = () => {
                                        if (!isOnScreen(video)) {
                                            return;
                                        }
                                        
                                        overallVolume = video.volume;
                                        // this breaks the mute shortcut control but this is good
                                        // because platforms hijack this.
                                        // The user can still drag the volume slider to 0
                                        video.muted = false;
                                    };
                                    
                                    video.muted = overallVolume === 0;
                                    video.volume = overallVolume;
                                });
                            }
                            );
};

const isOnScreen = (el) => {
    const rect = el.getBoundingClientRect();
    return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
};

window.onload = () => {
    setInterval(modifyInstagramUI, 500);
    setInterval(modifyFacebookUI, 500);
    setInterval(modifyYoutubeUI, 500);
};
