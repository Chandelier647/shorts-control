//
//  Settings.swift
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//

import Foundation

struct Settings {
    static let suiteName = "group.com.chandelier647.shorts-control"
    
    private static var defaults: UserDefaults? {
        UserDefaults(suiteName: suiteName)
    }
    
    // MARK: - Keys
    enum Key: String {
        case youtube
        case youtubeHideChannel = "youtube-hide-channel"
        case youtubeHideTitle = "youtube-hide-title"
        case youtubeHideDescription = "youtube-hide-description"
        case youtubeHideTrack = "youtube-hide-track"
        case youtubeHideSearchButton = "youtube-hide-search-button"
        case instagram
        case instagramAutoplay = "instagram-autoplay"
        case facebook
        case facebookAutounmute = "facebook-autounmute"
    }
    
    // MARK: - Getters/Setters
    static func bool(for key: Key, default defaultValue: Bool = true) -> Bool {
        guard let defaults = defaults else { return defaultValue }
        if defaults.object(forKey: key.rawValue) == nil {
            return defaultValue
        }
        return defaults.bool(forKey: key.rawValue)
    }
    
    static func set(_ value: Bool, for key: Key) {
        defaults?.set(value, forKey: key.rawValue)
    }
    
    // MARK: - Bulk Operations
    static func allSettings() -> [String: Bool] {
        var result: [String: Bool] = [:]
        for key in [Key.youtube, .youtubeHideChannel, .youtubeHideTitle,
                    .youtubeHideDescription, .youtubeHideTrack, .youtubeHideSearchButton,
                    .instagram, .instagramAutoplay, .facebook, .facebookAutounmute] {
            result[key.rawValue] = bool(for: key)
        }
        return result
    }
}
