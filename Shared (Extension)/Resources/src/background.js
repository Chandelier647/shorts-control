/*
See the LICENSE.txt file for this sample’s licensing information.

Abstract:
Script that makes up the extension's background page.
*/
// Send a message to the native app extension from the background page.
browser.runtime.sendNativeMessage("application.id", { message: "Hello from background page" }, function (response) {
    console.log("Received sendNativeMessage response:");
    console.log(response);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'native') {
        chrome.runtime.sendNativeMessage(
            'com.chandelier647.shorts-control',
            request.message
        ).then(response => {
            sendResponse(response);
        }).catch(error => {
            console.error('Native messaging error:', error);
            sendResponse({ error: error.message });
        });
        return true; // Keep channel open for async response
    }
});

// Set up a connection to receive messages from the native app.
let port = browser.runtime.connectNative("application.id");
port.postMessage("Hello from JavaScript Port");
port.onMessage.addListener(function (message) {
    console.log("Received native port message:");
    console.log(message);
});
port.onDisconnect.addListener(function (disconnectedPort) {
    console.log("Received native port disconnect:");
    console.log(disconnectedPort);
});

