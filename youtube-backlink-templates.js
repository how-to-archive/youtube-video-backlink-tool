let youtubeTemplates = [];

/* ===============================
   LOAD + SHUFFLE
================================= */
async function loadTemplates() {
    try {
        const res = await fetch('https://backlink-generator-tool.github.io/youtube-backlink-generator/youtube-backlink-templates.json');
        if (res.ok) {
            youtubeTemplates = await res.json();
            youtubeTemplates.sort(() => Math.random() - 0.5);
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
            return u.pathname.replace("/", "");
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
   SHAREABLE URL
================================= */
function updateShareUrl(originalUrl) {
    //const encoded = encodeURIComponent(originalUrl);
    //const share = window.location.origin + window.location.pathname + "?" + encoded;
   const share = window.location.origin + window.location.pathname + "?" + originalUrl;

    document.getElementById("newUrl").value = share;
    //window.history.replaceState(null, "", "?" + encoded);
    window.history.replaceState(null, "", "?" + originalUrl);
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
    updateShareUrl(input);
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
        capture_all: "1"
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
    //const param = decodeURIComponent(window.location.search.slice(1));
    const param = window.location.search.slice(1);
    if (!param) return;

    document.getElementById("urlInput").value = param;

    const videoID = extractYouTubeID(param);
    if (!videoID) return;

    renderResults(generateBacklinks(videoID));
    updateShareUrl(param);
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
