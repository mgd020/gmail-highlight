# Gmail Highlight

Cross-browser extension that highlights Gmail email addresses by domain. For
domains not configured manually, it reads the website's `theme-color` metadata,
chooses the higher-contrast black or white text color, and caches the result.

## Load in Firefox

1. Open `about:debugging`.
2. Select **This Firefox** and choose **Load Temporary Add-on**.
3. Select `manifest.json` from this directory.

The extension uses Firefox's `browser.storage.sync` API and also supports
Chrome's callback-based equivalent when `browser` is unavailable. It requests
website host access so the background context can fetch domain metadata.
