/** Fills the popup with the extension version. */
export function renderPopup(doc: Document, version: string): void {
  const el = doc.getElementById("version");
  if (el) {
    el.textContent = `Extension v${version}`;
  }
}

renderPopup(document, chrome.runtime.getManifest().version);
