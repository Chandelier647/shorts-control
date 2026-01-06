import SwiftUI

struct SettingsView: View {
    // MARK: - YouTube Settings
    @AppStorage("youtube", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeEnabled = true
    
    @AppStorage("youtube-hide-channel", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeHideChannel = false
    
    @AppStorage("youtube-hide-title", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeHideTitle = false
    
    @AppStorage("youtube-hide-description", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeHideDescription = true
    
    @AppStorage("youtube-hide-track", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeHideTrack = true
    
    @AppStorage("youtube-hide-search-button", store: UserDefaults(suiteName: Settings.suiteName))
    private var youtubeHideSearchButton = true
    
    // MARK: - Instagram Settings
    @AppStorage("instagram", store: UserDefaults(suiteName: Settings.suiteName))
    private var instagramEnabled = true
    
    @AppStorage("instagram-autounmute", store: UserDefaults(suiteName: Settings.suiteName))
    private var instagramAutounmute = false
    
    @AppStorage("instagram-autoplay", store: UserDefaults(suiteName: Settings.suiteName))
    private var instagramAutoplay = false
    
    // MARK: - Facebook Settings
    @AppStorage("facebook", store: UserDefaults(suiteName: Settings.suiteName))
    private var facebookEnabled = true
    
    @AppStorage("facebook-autounmute", store: UserDefaults(suiteName: Settings.suiteName))
    private var facebookAutounmute = false
    
    var body: some View {
        Form {
            Section {
                Toggle("Enable controls", isOn: $youtubeEnabled)
                
                if youtubeEnabled {
                    Toggle("Hide channel", isOn: $youtubeHideChannel)
                    Toggle("Hide title", isOn: $youtubeHideTitle)
                    Toggle("Hide description", isOn: $youtubeHideDescription)
                    Toggle("Hide music track", isOn: $youtubeHideTrack)
                    Toggle("Hide search button", isOn: $youtubeHideSearchButton)
                }
            } header: {
                Text("YouTube Shorts")
            }
            
            Section {
                Toggle("Enable controls", isOn: $instagramEnabled)
                
                if instagramEnabled {
                    Toggle("Autoplay on load", isOn: $instagramAutoplay)
                }
            } header: {
                Text("Instagram Reels")
            }
            
            Section {
                Toggle("Enable controls", isOn: $facebookEnabled)
                
                if facebookEnabled {
                    Toggle("Unmute by default", isOn: $facebookAutounmute)
                }
            } header: {
                Text("Facebook Reels")
            }
        }
#if os(macOS)
.frame(minWidth: 400, minHeight: 300)
#endif
    }
}

#Preview {
    SettingsView()
}
