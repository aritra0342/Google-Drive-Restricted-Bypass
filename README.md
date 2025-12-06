# Google-Drive-Restricted-Bypass
A client side utility to intercept and extract ephemeral blob resources from "View Only" Google Drive documents, bypassing DOM-based restriction and lazy-loading mechanisms
# GDrive Restricted Bypass

A lightweight JavaScript utility designed to bypass "View Only" restrictions on Google Drive documents. This tool intercepts ephemeral `blob` resources from the browser's memory buffer before they are garbage collected by Google's virtual scrolling mechanism.

## ⚠️ Disclaimer
**For Educational and CTF Use Only.**
This script is intended for Capture The Flag (CTF) challenges and security research. Do not use this tool to violate copyright laws or Terms of Service.

## The Problem
Google Drive uses aggressive "Virtual Scrolling" and "Canvas Tainting" to prevent downloading restricted documents:
1.  **Lazy Loading:** Images are only fetched when visible.
2.  **Resource Revocation:** `blob:` URLs are revoked (deleted) immediately after rendering to free up RAM, causing `404` errors if you try to fetch them later.
3.  **Canvas Tainting:** Direct canvas extraction is often blocked by CORS policies.

## The Solution
This tool employs **Monkey Patching** on `window.URL.createObjectURL`. Instead of scraping the DOM, it sits at the browser's resource pipeline. When Drive requests to render an image, this script intercepts the `Blob` object and stores a reference in a persistent array, effectively preventing garbage collection.

## Usage

### Step 1: Inject the Interceptor
1. Open the restricted Google Drive document.
2. Open Developer Tools (`F12` or `Ctrl+Shift+I`) -> **Console**.
3. Paste the contents of `script.js`.

Download:
Once you have reached the bottom of the document, run:
PDFBypass.save("my_document.pdf");
4. Run the start command:
   ```javascript
   PDFBypass.start();
