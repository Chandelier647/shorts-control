import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        let profile: UUID?
        let message: [String: Any]?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }
        
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey] as? [String: Any]
        } else {
            
            message = request?.userInfo?["message"] as? [String: Any]
            os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")
        }
        
        guard let message = message, let action = message["action"] as? String else {
            context.completeRequest(returningItems: nil, completionHandler: nil)
            return
        }
        
        var responseData: [String: Any] = [:]
        
        switch action {
        case "getConfig":
#if DEBUG
            responseData["isDebug"] = true
#else
            responseData["isDebug"] = false
#endif
            responseData["version"] = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        case "getSettings":
            responseData["settings"] = Settings.allSettings()
            
        case "getSetting":
            if let key = message["key"] as? String,
               let settingKey = Settings.Key(rawValue: key) {
                responseData["value"] = Settings.bool(for: settingKey)
            } else {
                responseData["error"] = "Invalid key"
            }
            
        case "setSetting":
            if let key = message["key"] as? String,
               let value = message["value"] as? Bool,
               let settingKey = Settings.Key(rawValue: key) {
                Settings.set(value, for: settingKey)
                responseData["success"] = true
            } else {
                responseData["error"] = "Invalid key or value"
            }
            
        default:
            responseData["error"] = "Unknown action"
        }
        
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: responseData]
        } else {
            response.userInfo = ["message": responseData]
        }
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
