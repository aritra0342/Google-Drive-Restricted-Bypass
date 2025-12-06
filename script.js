/*
 * GDrive Restricted PDF Bypass
 * A utility to intercept ephemeral blob resources from Google Drive's 
 * virtual scrolling view and reconstruct them into a PDF.
 * Usage:
 * 1. Run PDFBypass.start() in console.
 * 2. Scroll through the document.
 * 3. Run PDFBypass.save() to download.
 * * @author [aritra_0342]
 */

const PDFBypass = (function () {
    // Configuration
    const CONFIG = {
        minImageSize: 20000, // Bytes (ignore thumbnails)
        libUrl: "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js",
        policyName: "gdrive-bypass-policy"
    };

    // Internal State
    let _capturedBlobs = [];
    let _originalCreateObjectURL = window.URL.createObjectURL;
    let _isIntercepting = false;

    /*
     * Patch the browser's URL.createObjectURL to intercept blobs 
     * before they are rendered and potentially revoked
     */
    function _enableInterceptor() {
        if (_isIntercepting) return;

        window.URL.createObjectURL = function (blobObj) {
            // Capture image blobs only
            if (blobObj && blobObj.type && blobObj.type.includes('image')) {
                _capturedBlobs.push({
                    blob: blobObj,
                    type: blobObj.type,
                    timestamp: Date.now()
                });
                console.debug(`[Bypass] Intercepted resource: ${blobObj.size} bytes`);
            }
            return _originalCreateObjectURL.apply(this, arguments);
        };

        _isIntercepting = true;
        console.log("%c[Bypass] Interceptor Active. Please scroll through the document.", "color: #0f0; font-weight: bold;");
    }

    /*
     * Bypasses CSP Trusted Types to load external libraries
     */
    function _loadLibrary() {
        return new Promise((resolve, reject) => {
            if (window.jspdf) return resolve(window.jspdf);

            const script = document.createElement("script");
            let src = CONFIG.libUrl;

            // Handle Trusted Types CSP
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                try {
                    const policy = window.trustedTypes.createPolicy(CONFIG.policyName, {
                        createScriptURL: (s) => s
                    });
                    src = policy.createScriptURL(src);
                } catch (e) {
                    console.warn("[Bypass] Policy creation failed, attempting raw load.");
                }
            }

            script.src = src;
            script.onload = () => resolve(window.jspdf);
            script.onerror = () => reject(new Error("Failed to load jsPDF library"));
            document.body.appendChild(script);
        });
    }

    /*
     * Converts a Blob object to Base64 string.
     */
    function _blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    /*
     * Loads an image from Base64 to get dimensions.
     */
    function _getImageDimensions(base64Data) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Data;
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        });
    }

    // Public API
    return {
        start: function () {
            _capturedBlobs = [];
            _enableInterceptor();
        },

        /*
         * Process captured blobs and generate the PDF.
         * @parameter {string} filename - Optional filename
         */
        save: async function (filename = "downloaded_document.pdf") {
            if (_capturedBlobs.length === 0) {
                console.error("[Bypass] No images captured. Did you scroll through the document?");
                return;
            }

            console.log(`[Bypass] Processing ${_capturedBlobs.length} captured resources...`);

            try {
                const { jsPDF } = await _loadLibrary();
                let pdf = null;
                let processedCount = 0;

                for (const item of _capturedBlobs) {
                    if (item.blob.size < CONFIG.minImageSize) continue;

                    const imgData = await _blobToBase64(item.blob);
                    const dim = await _getImageDimensions(imgData);
                    const orientation = dim.width > dim.height ? "l" : "p";

                    if (!pdf) {
                        pdf = new jsPDF({
                            orientation: orientation,
                            unit: "px",
                            format: [dim.width, dim.height]
                        });
                    } else {
                        pdf.addPage([dim.width, dim.height], orientation);
                    }

                    pdf.addImage(imgData, "JPEG", 0, 0, dim.width, dim.height);
                    processedCount++;
                }

                console.log(`[Bypass] Generating PDF with ${processedCount} pages...`);
                pdf.save(filename);
                console.log("%c[Bypass] Download complete.", "color: #0f0; font-weight: bold;");

            } catch (err) {
                console.error("[Bypass] Export failed:", err);
            }
        }
    };
})();