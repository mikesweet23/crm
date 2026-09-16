/*!
 * Absolute Mind CRM — embeddable form loader
 *
 * Usage (paste into a WordPress "Custom HTML" block):
 *
 *   <div data-absolute-mind-form
 *        data-form="enquiry"
 *        data-source="Website"
 *        data-accent="#e5772a"
 *        data-max-width="640px"></div>
 *   <script src="https://crm.absolutemind.co.uk/embed.js" async></script>
 *
 * The iframe resizes itself to fit its content on both mobile and desktop.
 */
(function () {
  "use strict";

  var current = document.currentScript;
  var origin = current ? new URL(current.src).origin : window.location.origin;

  // Maps data-* attributes on the placeholder to embed query parameters.
  var ATTR_TO_PARAM = {
    "data-source": "source",
    "data-heading": "heading",
    "data-intro": "intro",
    "data-accent": "accent",
    "data-submit": "submit",
    "data-redirect": "redirect",
    "data-fields": "fields",
    "data-bg": "bg",
    "data-compact": "compact",
  };

  function buildIframe(el) {
    if (el.getAttribute("data-am-initialised") === "1") return;
    el.setAttribute("data-am-initialised", "1");

    var form = el.getAttribute("data-form") || "enquiry";
    var params = new URLSearchParams();
    Object.keys(ATTR_TO_PARAM).forEach(function (attr) {
      var value = el.getAttribute(attr);
      if (value !== null && value !== "") params.set(ATTR_TO_PARAM[attr], value);
    });

    var query = params.toString();
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + form + (query ? "?" + query : "");
    iframe.title = "Absolute Mind enquiry form";
    iframe.loading = "lazy";
    iframe.setAttribute("scrolling", "no");
    iframe.style.width = "100%";
    iframe.style.maxWidth = el.getAttribute("data-max-width") || "640px";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.margin = "0 auto";
    iframe.style.overflow = "hidden";
    // Sensible starting height before the first resize message arrives.
    iframe.style.height = (el.getAttribute("data-height") || "720") + "px";

    el.appendChild(iframe);
  }

  function initAll() {
    var nodes = document.querySelectorAll("[data-absolute-mind-form]");
    for (var i = 0; i < nodes.length; i++) buildIframe(nodes[i]);
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data || {};
    if (data.type !== "am-embed-height" || typeof data.height !== "number") return;

    var iframes = document.getElementsByTagName("iframe");
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframes[i].style.height = Math.ceil(data.height) + "px";
        break;
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Expose a manual initialiser for forms injected after page load.
  window.AbsoluteMindForm = { init: initAll };
})();
