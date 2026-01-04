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