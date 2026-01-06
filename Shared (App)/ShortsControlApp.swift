//
//  ShortsControlApp.swift
//  shorts-control
//
//  Created by Phillip Bosek on 2026-01-03.
//

import SwiftUI



@main
struct ShortsControlApp: App {
    #if os(macOS)
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    #else
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    #endif
    
    
    
    var body: some Scene {
        
        
        
        WindowGroup {
            SettingsView()
            #if os(macOS)
                .frame(minWidth: 450, idealWidth: 500, minHeight: 350, idealHeight: 400)
            #endif
        }
        #if os(macOS)
        .windowStyle(.hiddenTitleBar)
        #endif
    }
}

