// Check if element is visible in viewport
export const isOnScreen = (el) => {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Check if element center is in viewport (more lenient)
export const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    return elementCenter > 0 && elementCenter < windowHeight;
};

// ============================================
// Observer Helper
// ============================================

/**
 * Creates a debounced MutationObserver that calls the provided function
 * @param {Function} modifyFn - The UI modification function to call
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 100)
 */
export const createUIObserver = (modifyFn, debounceMs = 100) => {
    let debounceTimeout;

    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(modifyFn, debounceMs);
    });

    // Wait for body to exist before observing
    const startObserving = () => {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        } else {
            // Body doesn't exist yet, wait for it
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            });
        }
    };

    return { observer, startObserving };
};