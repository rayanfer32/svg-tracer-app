// ==UserScript==
// @name         Draggable Overlay Inside Container
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Inject draggable image inside target container with controls
// @match        https://svgartista.net/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONTAINER_SELECTOR = '.sc-htoDjs.hiJbVY';
    const SVG_SELECTOR = '.sc-htoDjs.hiJbVY > svg';

    function waitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) return callback(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                callback(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForElement(CONTAINER_SELECTOR, (container) => {

        if (!container.style.position) {
            // container.style.position = "relative";
        }

        // Create image
        const img = document.createElement("img");
        img.src = localStorage.getItem("overlay_url") || "";
        img.id = "tm-overlay-image";
        img.style.position = "absolute";
        img.style.top = localStorage.getItem("overlay_top") || "50px";
        img.style.left = localStorage.getItem("overlay_left") || "50px";
        img.style.width = localStorage.getItem("overlay_width") || "300px";
        img.style.opacity = localStorage.getItem("overlay_opacity") || "1";
        img.style.cursor = "move";
        // img.style.zIndex = "9999";
        img.style.display = img.src ? "block" : "none"; // Hide if no source

        container.appendChild(img);

        // Auto-reattach logic: monitor the DOM and re-append image if it's removed
        const reattachObserver = new MutationObserver(() => {
            const currentContainer = document.querySelector(CONTAINER_SELECTOR);
            if (currentContainer && !currentContainer.contains(img)) {
                console.log("[Overlay] Image missing or moved, reattaching...");
                currentContainer.appendChild(img);
            }
        });
        reattachObserver.observe(document.body, { childList: true, subtree: true });

        // Drag functionality (relative to container)
        let isDragging = false;
        let offsetX, offsetY;

        img.addEventListener("mousedown", (e) => {
            isDragging = true;
            const rect = container.getBoundingClientRect();
            offsetX = e.clientX - rect.left - img.offsetLeft;
            offsetY = e.clientY - rect.top - img.offsetTop;
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            const rect = container.getBoundingClientRect();

            let newLeft = e.clientX - rect.left - offsetX;
            let newTop = e.clientY - rect.top - offsetY;

            img.style.left = newLeft + "px";
            img.style.top = newTop + "px";
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                localStorage.setItem("overlay_top", img.style.top);
                localStorage.setItem("overlay_left", img.style.left);
            }
            isDragging = false;
        });

        // Control panel
        const panel = document.createElement("div");
        panel.style.position = "fixed";
        panel.style.bottom = "20px";
        panel.style.right = "20px";
        panel.style.background = "rgba(0,0,0,0.85)";
        panel.style.padding = "12px";
        panel.style.borderRadius = "8px";
        panel.style.color = "#fff";
        panel.style.fontSize = "12px";
        panel.style.zIndex = "999999";

        panel.innerHTML = `
            <div>
                <label>Opacity</label><br>
                <input type="range" min="0" max="1" step="0.05" value="${img.style.opacity}" id="opacityControl">
            </div>

            <div style="margin-top:8px;">
                <label>Size</label><br>
                <input type="range" min="100" max="800" step="10" value="${parseInt(img.style.width)}" id="sizeControl">
            </div>

            <div style="margin-top:10px;">
                <label>
                    <input type="checkbox" id="zIndexToggle">
                    Force SVG z-index: 1
                </label>
            </div>

            <div style="margin-top:10px; display: flex; gap: 5px; flex-direction: column;">
                <button id="loadImageBtn" style="padding: 4px;">Set Image URL</button>
                <button id="remountImageBtn" style="padding: 4px;">Remount Image</button>
            </div>
        `;

        document.body.appendChild(panel);

        const opacityControl = panel.querySelector("#opacityControl");
        const sizeControl = panel.querySelector("#sizeControl");
        const zIndexToggle = panel.querySelector("#zIndexToggle");
        const remountImageBtn = panel.querySelector("#remountImageBtn");
        const loadImageBtn = panel.querySelector("#loadImageBtn");

        // Load Image
        loadImageBtn.addEventListener("click", () => {
            const url = prompt("Enter Image URL:", img.src);
            if (url !== null) {
                img.src = url;
                img.style.display = url ? "block" : "none";
                localStorage.setItem("overlay_url", url);
            }
        });

        // Opacity
        opacityControl.addEventListener("input", (e) => {
            img.style.opacity = e.target.value;
            localStorage.setItem("overlay_opacity", e.target.value);
        });

        // Size
        sizeControl.addEventListener("input", (e) => {
            img.style.width = e.target.value + "px";
            localStorage.setItem("overlay_width", img.style.width);
        });

        // SVG Z-Index Toggle
        let originalZIndex = null;

        zIndexToggle.addEventListener("change", () => {
            const targetSvg = document.querySelector(SVG_SELECTOR);
            if (!targetSvg) {
                alert("SVG not found");
                zIndexToggle.checked = false;
                return;
            }

            if (zIndexToggle.checked) {
                originalZIndex = targetSvg.style.zIndex;
                targetSvg.style.position = "relative";
                targetSvg.style.zIndex = "1";
            } else {
                targetSvg.style.zIndex = originalZIndex || "";
            }
        });

        // Remount Button
        remountImageBtn.addEventListener("click", () => {
            const currentContainer = document.querySelector(CONTAINER_SELECTOR);
            if (!currentContainer) {
                alert("Container not found");
                return;
            }

            // Directly append the img reference we already have
            currentContainer.appendChild(img);
        });

    });

})();
