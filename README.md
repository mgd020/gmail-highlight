# Gmail Highlight

Firefox extension that highlights Gmail email addresses by domain.

## Load in Firefox

1. Open `about:debugging`.
2. Select **This Firefox** and choose **Load Temporary Add-on**.
3. Select `manifest.json` from this directory.

The extension uses Firefox's `browser.storage.sync` API and also supports
Chrome's callback-based equivalent when `browser` is unavailable.
