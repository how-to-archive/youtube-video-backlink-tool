let youtubeTemplates = [];

/* ===============================
   LOAD
================================= */
async function loadTemplates() {
    try {
        const res = await fetch('https://how-to-archive.github.io/youtube-video-backlink-tool/youtube-backlink-templates.json');
        if (res.ok) {
            youtubeTemplates = await res.json();
        }
    } catch (e) {
        console.error("Template load error:", e);
    }
}

/* ===============================
   EXTRACT YOUTUBE ID
================================= */
function extractYouTubeID(url) {
    try {
        const u = new URL(url);

        if (u.hostname.includes("youtube.com")) {
            return u.searchParams.get("v");
        }

        if (u.hostname.includes("youtu.be")) {
            return u.pathname.replace("/", "").split("?")[0];
        }

        return null;
    } catch {
        return null;
    }
}

/* ===============================
   GENERATE LINKS
================================= */
function generateBacklinks(videoID) {
    youtubeTemplates.sort(() => Math.random() - 0.5);
    return youtubeTemplates
        .map(tpl => tpl.replace(/\{\{ID\}\}/g, videoID))
        .filter(Boolean);
}

/* ===============================
   RENDER LINKS
================================= */
function renderResults(urls) {
    const ul = document.getElementById("results");
    ul.innerHTML = "";

    urls.forEach(url => {
        const li = document.createElement("li");

        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url;

        li.appendChild(link);
        ul.appendChild(li);
    });
}

/* ===============================
   archive Current Page in Background
================================= */
// small URL validator (safe, uses URL constructor)
function isValidURL(u) {
  try {
    if (!u || typeof u !== 'string') return false;
    // allow encoded forms too: decode safely
    let cand = u.trim();
    try {
      const dec = decodeURIComponent(cand);
      if (dec && dec !== cand) cand = dec;
    } catch (e) { /* ignore */ }
    // ensure we have a scheme for URL parsing
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(cand)) cand = 'https://' + cand;
    new URL(cand);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Submits a hidden form (POST) to web.archive.org/save/ using the supplied iframe as target.
 * If iframe is not attached yet, it will still work since we ensure attachment before submit.
 *
 * @param {HTMLIFrameElement} iframe - existing iframe element (will be given a name if missing)
 * @param {string} [targetUrl] - url to archive (defaults to window.location.href)
 */
function submitToWaybackInFrame(iframe, targetUrl) {
  try {
    targetUrl = (typeof targetUrl === 'string' && targetUrl.trim()) ? targetUrl.trim() : window.location.href;

    if (!isValidURL(targetUrl)) {
      console.warn('submitToWaybackInFrame: invalid target URL:', targetUrl);
      return;
    }

    // Ensure iframe has a name (used as form.target)
    if (!iframe.name) {
      iframe.name = 'bg-wayback-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    }

    // Ensure iframe is attached to the DOM before submit (some browsers require this)
    if (!document.body.contains(iframe)) {
      document.body.appendChild(iframe);
    }

    // Build hidden form and submit to Wayback Save endpoint
    const form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'POST';
    form.action = 'https://web.archive.org/save/';
    form.referrerPolicy = "no-referrer";
    form.target = iframe.name;
    form.className = 'web-save-form';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'url';
    input.value = targetUrl;

    // Helper function to create checkbox
    function addCheckbox(name, checked = false) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = name;
        checkbox.value = "1";
        if (checked) checkbox.checked = true;
        form.appendChild(checkbox);
    }

    // Add options
    addCheckbox("capture_outlinks", true);
    addCheckbox("capture_all", true); // default checked
    addCheckbox("capture_screenshot", true);
    addCheckbox("disable_adblocker");
    addCheckbox("wm-save-mywebarchive", true);
    addCheckbox("email_result");
    addCheckbox("wacz");
     
    form.appendChild(input);

    // Attach, submit, then clean-up the form quickly (we keep iframe for TTL)
    document.body.appendChild(form);

    console.log('Wayback: submitting POST to /save/ for', targetUrl, 'target iframe:', iframe.name);
    try {
      form.submit();
    } catch (eSubmit) {
      // Some browsers restrict programmatic submit in rare contexts; try dispatching a submit event as fallback
      try {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } catch (eEvent) {}
    }

    // Remove the form after a short delay
    setTimeout(() => {
      try { form.remove(); } catch (e) {}
    }, 1000);
  } catch (err) {
    console.error('submitToWaybackInFrame error:', err);
  }
}

/**
 * Create a tiny, invisible iframe, submit a Wayback save request into it,
 * and auto-remove iframe after TTL. If background method appears to fail (no network request),
 * optionally fallback to opening a small tab (may be blocked by popup blocker).
 */
function archiveCurrentPageBackground(opts = {}) {
  try {
    const ttl = (typeof opts.ttl === 'number') ? opts.ttl : 180000; // default 3 minutes
    const targetUrl = (typeof opts.url === 'string' && opts.url.trim()) ? opts.url.trim() : window.location.href;

    if (!isValidURL(targetUrl)) {
         console.warn('archiveCurrentPageBackground: invalid URL, skipping:', targetUrl);
         return false;
    }

    // Create the iframe and make it minimally visible but effectively hidden.
    const iframe = document.createElement('iframe');
    iframe.title = 'Archive current page';
    //iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.referrerPolicy = "no-referrer";
    iframe.className = 'hidden-iframe';

    // Use inline styles so CSS won't accidentally hide it (we keep it tiny and non-interactive)
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      width: '1px',
      height: '1px',
      border: '0',
      padding: '0',
      margin: '0',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-999999'
    });

    // Ensure iframe has a stable name before we build the form target
    iframe.name = 'bg-wayback-' + Date.now() + '-' + Math.floor(Math.random() * 100000);

    // Append iframe then submit
    document.body.appendChild(iframe);

    // small delay before submit to ensure DOM attach
    setTimeout(() => submitToWaybackInFrame(iframe, targetUrl), 200);

    // cleanup after TTL
    const ttlTimer = setTimeout(() => {
      try { iframe.remove(); } catch (e) {}
      clearTimeout(ttlTimer);
    }, ttl);

    console.info('archiveCurrentPageBackground: attempted background save for', targetUrl, 'iframe name:', iframe.name);
    return true;
  } catch (err) {
    console.error('archiveCurrentPageBackground fatal error:', err);
    return false;
  }
}

/* ===============================
   SHAREABLE URL
================================= */
function updateShareUrl(originalUrl) {
    //const encoded = encodeURIComponent(originalUrl);
    //const share = window.location.origin + window.location.pathname + "?" + encoded;
    const share = window.location.origin + window.location.pathname + "?" + originalUrl;
    //const share = window.location.origin + "?" + originalUrl;

    document.getElementById("newUrl").value = share;
    //window.history.replaceState(null, "", "?" + encoded);
    window.history.replaceState(null, "", "?" + originalUrl);

   // Archive current page (only when a run actually starts)
 	//archiveCurrentPageBackground();
      archiveCurrentPageBackground({
       url: share
   });
}

/* ===============================
   MAIN GENERATOR
================================= */
function startGenerator() {
    const input = document.getElementById("urlInput").value.trim();
    const videoID = extractYouTubeID(input);

    if (!videoID) {
        alert("Invalid YouTube URL.");
        return;
    }

    const backlinks = generateBacklinks(videoID);
    renderResults(backlinks);
    updateShareUrl(videoID);
}

/* ===============================
   DOWNLOAD
================================= */
function downloadLinks() {
    const input = document.getElementById("urlInput").value.trim();
    const videoID = extractYouTubeID(input);
    if (!videoID) return;

    const backlinks = generateBacklinks(videoID);
    const blob = new Blob([backlinks.join("\n")], { type: "text/plain" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "youtube-backlinks.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* ===============================
   COPY SHARE URL
================================= */
function copyShareUrl() {
    const input = document.getElementById("newUrl");
    input.select();
    document.execCommand("copy");
}

/* ===============================
   GENERIC FORM SUBMIT
================================= */
function submitForm(action, method, fields) {
    const form = document.createElement("form");
    form.action = action;
    form.method = method;
    form.target = "_blank";

    for (const key in fields) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function getCurrentUrl() {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) {
        alert("Enter a YouTube URL first.");
        return null;
    }
    return url;
}

/* ===============================
   ARCHIVE SERVICES
================================= */

function submitToWayback() {
    const url = getCurrentUrl();
    if (!url) return;

    submitForm("https://web.archive.org/save/", "POST", {
        url: url,
        capture_all: "1",
        capture_screenshot: "1"
    });
}

function submitToGhostarchive() {
    const url = getCurrentUrl();
    if (!url) return;

    submitForm("https://ghostarchive.org/archive2", "POST", {
        archive: url
    });
}

function submitToArchiveToday() {
    const url = getCurrentUrl();
    if (!url) return;

    submitForm("https://archive.today/submit/", "GET", {
        url: url
    });
}

function submitToMegalodon() {
    const url = getCurrentUrl();
    if (!url) return;

    submitForm("https://megalodon.jp/pc/main", "GET", {
        url: url
    });
}

function submitToArchiveST() {
    const url = getCurrentUrl();
    if (!url) return;

    const encoded = encodeURIComponent(url);
    window.open("https://archive.st/?error=Archived&URL=" + encoded, "_blank");
}

/* ===============================
   AUTO START
================================= */
function autoStart() {
    if (!window.location.search) return;

    let query = window.location.search.substring(1).trim();
    if (!query) return;

    try {
        query = decodeURIComponent(query);
    } catch (e) {}

    let videoID = null;

    // 1️⃣ Full URL case
    if (/^https?:\/\//i.test(query)) {
        videoID = extractYouTubeID(query);
    }

    // 2️⃣ ?v=ID format
    else if (query.startsWith("v=")) {
        videoID = query.split("=")[1]?.split("&")[0];
    }

    // 3️⃣ Raw ID (11 chars typical YouTube ID)
    else if (/^[a-zA-Z0-9_-]{11}$/.test(query)) {
        videoID = query;
    }

    if (!videoID) return;

    const normalizedUrl = "https://www.youtube.com/watch?v=" + videoID;

    // Set input field
    document.getElementById("urlInput").value = normalizedUrl;

    // Generate backlinks
    const backlinks = generateBacklinks(videoID);
    renderResults(backlinks);

    // Update share URL (you use videoID intentionally)
    updateShareUrl(videoID);
}
/* ===============================
   INIT
================================= */
window.addEventListener("DOMContentLoaded", async () => {

    await loadTemplates();
    autoStart();

    document.getElementById("startBtn").addEventListener("click", startGenerator);
    document.getElementById("downloadBtn").addEventListener("click", downloadLinks);
    document.getElementById("copyBtn").addEventListener("click", copyShareUrl);

    const container = document.getElementById("archiveButtons");

    const services = [
        { text: "Wayback", fn: submitToWayback },
        { text: "Ghostarchive", fn: submitToGhostarchive },
        { text: "Archive.today", fn: submitToArchiveToday },
        { text: "Megalodon.jp", fn: submitToMegalodon },
        { text: "Archive.st", fn: submitToArchiveST }
    ];

    services.forEach(service => {
        const btn = document.createElement("button");
        btn.textContent = service.text;
        btn.addEventListener("click", service.fn);
        container.appendChild(btn);
    });
});
