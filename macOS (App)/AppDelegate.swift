//
//  AppDelegate.swift
//  macOS (App)
//
//  Created by Phillip Bosek on 2026-01-03.
//

import Cocoa


class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Override point for customization after application launch.
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

}
