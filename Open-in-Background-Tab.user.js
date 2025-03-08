// ==UserScript==
// @name         Open in Background Tab
// @namespace    http://example.com/
// @version      2.0
// @description  Opens links in a new background tab with shortcut keys to enable or disbale it.
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Persistent toggle states
    let toggleEnabled = GM_getValue("toggleEnabled", false);
    let imageToggleEnabled = GM_getValue("imageToggleEnabled", false);

    // Update the menu when toggled
    function updateMenu() {
        GM_registerMenuCommand("Open in Background Tab - " + (toggleEnabled ? "ENABLED" : "DISABLED"), () => {
            toggleEnabled = !toggleEnabled;
            GM_setValue("toggleEnabled", toggleEnabled);
            showStatusMessage();
        });

        GM_registerMenuCommand("Image in Background Tab - " + (imageToggleEnabled ? "ENABLED" : "DISABLED"), () => {
            imageToggleEnabled = !imageToggleEnabled;
            GM_setValue("imageToggleEnabled", imageToggleEnabled);
            showStatusMessage();
        });
    }

    // Show status message in the corner
    function showStatusMessage() {
        // Remove any existing message
        const existingMessage = document.getElementById('backgroundTabStatusMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        let message = toggleEnabled ? "Open in Background Tab ENABLED" : "Open in Background Tab DISABLED";
        if (toggleEnabled && imageToggleEnabled) {
            message += " | Image in Background Tab ENABLED";
        } else if (toggleEnabled && !imageToggleEnabled) {
            message += " | Image in Background Tab DISABLED";
        }

        const div = document.createElement('div');
        div.textContent = message;
        div.id = 'backgroundTabStatusMessage';
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.backgroundColor = '#333';
        div.style.color = '#fff';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.zIndex = '9999';
        div.style.fontSize = '14px';
        div.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        document.body.appendChild(div);

        // Remove the message after 3 seconds
        setTimeout(() => {
            div.remove();
        }, 3000);
    }

    // Function to check if the link contains a fragment (#)
    function isFragmentLink(url) {
        return url.includes('#');
    }



    // Function to check if the link is an image URL
    function isImageURL(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const imageKeywords = ['img', 'image'];

        // Check if URL contains image keywords or extensions
        return imageKeywords.some(keyword => url.includes(keyword)) || imageExtensions.some(ext => url.endsWith(ext));
    }

    // Function to handle keypress events for Shift toggle
    document.addEventListener('keydown', function (e) {
        if (e.shiftKey && e.key === 'Z') {  // If Shift + Z, toggle the background tab opener
            toggleEnabled = !toggleEnabled;
            GM_setValue("toggleEnabled", toggleEnabled);
            showStatusMessage(); // Show the message after toggling the status
        } else if (e.shiftKey && e.key === 'X') {  // If Shift + X, toggle the image link opener
            imageToggleEnabled = !imageToggleEnabled;
            GM_setValue("imageToggleEnabled", imageToggleEnabled);
            showStatusMessage(); // Show the message after toggling the status
        }
    });

    // Function to handle link clicks
    function handleClick(e) {
        if (!toggleEnabled) return;

        let anchor = e.target.closest('a');
        if (!anchor || !anchor.href) return; // Ignore non-links

        let url = anchor.href.trim();

        // Ignore fragment-only links (e.g., links with #)
        if (isFragmentLink(url)) {
            console.log("Ignored fragment link:", anchor);
            return;
        }

        // Ignore links with javascript: as href (non-navigational)
        if (url.startsWith("javascript:")) {
            console.log("Ignored JavaScript link:", anchor);
            return;
        }

        // If image links are disabled (opening images in the same tab)
        if (imageToggleEnabled && isImageURL(url)) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Opening image in background:", url);
            setTimeout(() => {
                GM_openInTab(url, { active: false });
            }, 0);
            return;
        }

        // Otherwise, open in background tab for non-image links
        e.preventDefault();
        e.stopPropagation();
        console.log("Opening link in background:", url);
        setTimeout(() => {
            GM_openInTab(url, { active: false });
        }, 0);
    }

    // Attach event listener for all clicks
    document.addEventListener('click', handleClick, true);

    // Mutation Observer to catch dynamically loaded links
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    node.querySelectorAll("a").forEach(link => {
                        link.addEventListener("click", handleClick, true);
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial menu setup
    updateMenu();

})();
