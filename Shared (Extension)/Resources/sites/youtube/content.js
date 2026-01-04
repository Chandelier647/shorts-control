//
//  content.js
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//


let youtubeSettings = null;
const keys = ["youtube",
              "youtube-hide-title",
              "youtube-hide-channel",
              "youtube-hide-description",
              "youtube-hide-track",
              "youtube-hide-search-button"]
chrome.storage.sync.get([...keys]).then((settings) => {
    youtubeSettings = settings;
});

// Listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        Object.assign(youtubeSettings,
            Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.newValue]))
        );
    }
});

const modifyYoutubeUI = () => {
    
    if (!youtubeSettings) return;
    
    
                                if (!window.location.hostname.includes("youtube.com")) return;
                                
                                const enabled = true;
                                const hideChannel = youtubeSettings["youtube-hide-channel"] !== false;
                                const hideTitle = youtubeSettings["youtube-hide-title"] !== false;
                                const hideDescription = youtubeSettings["youtube-hide-description"] !== false;
                                const hideTrack = youtubeSettings["youtube-hide-track"] !== false;
                                const hideSearchButton = youtubeSettings["youtube-hide-search-button"] !== false;
                                
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
                            
                            
};
