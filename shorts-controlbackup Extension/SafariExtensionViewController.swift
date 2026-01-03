//
//  SafariExtensionViewController.swift
//  shorts-controlbackup Extension
//
//  Created by Phillip Bosek on 2026-01-03.
//

import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width:320, height:240)
        return shared
    }()

}
