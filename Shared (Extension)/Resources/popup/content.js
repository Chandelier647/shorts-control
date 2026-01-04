Native.init();

console.log("Content script loaded!");
log('chrome defined:', typeof chrome);
console.log('browser defined:', typeof browser);

var overallVolume = 1;






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

const hostname = window.location.hostname;
const isInstagram = hostname.includes("instagram.com");
const isFacebook = hostname.includes("facebook.com");
const isYoutube = hostname.includes("youtube.com");

window.onload = () => {
    // initial exec
    if (isInstagram) {
        
        
        modifyInstagramUI();
    }
    
    if (isFacebook) {
        modifyFacebookUI();
    }
    
    if (isYoutube) {
        modifyYoutubeUI();
    }
    
    
    let debounceTimeout;
    const uiObserver = new MutationObserver(() => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            if (isInstagram) modifyInstagramUI();
            if (isFacebook) modifyFacebookUI();
            if (isYoutube) modifyYoutubeUI();
        }, 100);
    });
    
    uiObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style','class']
    });
};
