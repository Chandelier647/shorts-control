document.addEventListener("DOMContentLoaded", () => {
  const platforms = ["youtube", "instagram", "facebook"];
  const additionalOptions = [
    "youtube-hide-channel",
    "youtube-hide-title",
    "youtube-hide-description",
    "youtube-hide-track",
    "youtube-hide-search-button",
    "instagram-autoplay",
    "instagram-keep-playing",
    "facebook-autounmute",
  ];

  const allKeys = [...platforms, ...additionalOptions];

  const optionDefaults = {
    "youtube-hide-channel": false,
    "youtube-hide-title": false,
    "youtube-hide-description": true,
    "youtube-hide-track": true,
    "youtube-hide-search-button": true,
    "instagram-autoplay": false,
    "instagram-keep-playing": false,
    "facebook-autounmute": false,
  };

  // Update visibility of conditional options
  const updateConditionalVisibility = () => {
    const autoplayCheckbox = document.getElementById("instagram-autoplay");
    const keepPlayingRow = document.getElementById("instagram-keep-playing-row");
    
    if (autoplayCheckbox && keepPlayingRow) {
      // Show "keep playing" only when autoplay is OFF
      keepPlayingRow.classList.toggle("hidden", autoplayCheckbox.checked);
    }
  };

  chrome.storage.sync.get(allKeys, (settings) => {
    // Main platform toggles
    platforms.forEach((platform) => {
      const toggle = document.getElementById(`${platform}-toggle`);
      if (!toggle) return;
      
      const isEnabled = settings[platform] !== false; // default: true
      toggle.checked = isEnabled;

      toggle.addEventListener("change", () => {
        chrome.storage.sync.set({ [platform]: toggle.checked });
      });
    });

    // Additional options
    additionalOptions.forEach((key) => {
      const checkbox = document.getElementById(key);
      if (!checkbox) return;
      
      const isChecked =
        settings[key] !== undefined ? settings[key] : optionDefaults[key];
      checkbox.checked = isChecked;

      checkbox.addEventListener("change", () => {
        chrome.storage.sync.set({ [key]: checkbox.checked });
        updateConditionalVisibility();
      });
    });

    // Initial visibility update
    updateConditionalVisibility();
  });

  // Listen for storage changes (in case settings change elsewhere)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    
    if (changes["instagram-autoplay"]) {
      const checkbox = document.getElementById("instagram-autoplay");
      if (checkbox) {
        checkbox.checked = changes["instagram-autoplay"].newValue;
        updateConditionalVisibility();
      }
    }
  });
});

const notes = {
  instagram: `
    <strong>Instagram</strong><br/><br/>
    - Adds native video controls with progress bar and volume slider.<br/><br/>
    - <strong>Autoplay:</strong> When off, videos won't auto-play as you scroll.<br/><br/>
    - <strong>Keep playing after scroll:</strong> When enabled, a video you've started will keep playing even when you scroll away. It only stops when you play a different video.
  `,
  youtube: `
    <strong>YouTube Shorts</strong><br/><br/>
    - YouTube does have its own progress bar, but it's proprietary and kept out of view and so it doesn't allow the user to tell the length of the video at a glance.<br/><br/>
    - YouTube Shorts interface is crazy cluttered, so we have some options to remove most elements from view.
  `,
  facebook: `
    <strong>Facebook Reels</strong><br/><br/>
    - Facebook Reels have a crazy amount of clutter, and also no progress bar or video controls.<br/><br/>
    - Facebook's HTML structure is extremely obfuscated, so we just removed all the clutter and added a progress bar. If anyone wants to add more fine-grained control, PRs are most welcome here!
  `,
  tiktok: `
    <strong>TikTok</strong><br/><br/>
    - TikTok actually has pretty good video control behavior! So we leave it alone. (with the comments open).
  `,
  soliloquy: `
    <strong>Soliloquy Apps</strong><br/><br/>
    Enjoying this extension?<br/><br/>We also built <span class="audio">Audio</span><span class="diary">Diary</span>--a super smart voice-powered journal that's gotten lots of love from its users.<br/><br/><center><a href="https://audiodiary.ai" class="audio-diary-link" target="_blank">Try it out here!</a></center>
  `,
};

document.addEventListener("DOMContentLoaded", () => {
  // Modal setup
  const modal = document.getElementById("notes-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  document.querySelectorAll(".modal-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const platform = link.getAttribute("data-platform");
      modalBody.innerHTML = notes[platform] || "No notes available.";
      modal.style.display = "flex";
    });
  });

  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
