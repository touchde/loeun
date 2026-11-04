// Loeun extension background script (MV3 service worker in Chrome,
// event page in Firefox). Download capture and native messaging arrive with
// M3; see docs/BROWSER_INTEGRATION.md.

export function onInstalled(details: chrome.runtime.InstalledDetails): void {
  console.info(`Loeun extension ${details.reason}: v${chrome.runtime.getManifest().version}`);
}

chrome.runtime.onInstalled.addListener(onInstalled);
