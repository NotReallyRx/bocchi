let controller = null;
let frame = null;

const addressBar = document.getElementById("addressBar");
const proxyFrame = document.getElementById("proxyFrame");

const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");

const homeButton = document.getElementById("homeButton");
const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const reloadButton = document.getElementById("reloadButton");

const settingsButton = document.getElementById("settingsButton");
const settingsMenu = document.getElementById("settingsMenu");
const wispInput = document.getElementById("wispInput");
const saveWispButton = document.getElementById("saveWispButton");

const DEFAULT_WISP_URL = "wss://g.novalee.xyz/wisp/";
const WISP_URL = localStorage.getItem("wispUrl") || DEFAULT_WISP_URL;

function showLoading(text) {
  loadingText.textContent = text;
  loading.style.display = "flex";
}

function hideLoading() {
  loading.style.display = "none";
}

function normalizeInput(value) {
  value = value.trim();

  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.includes(".") && !/\s/.test(value)) {
    return `https://${value}`;
  }

  return `https://search.brave.com/search?q=${encodeURIComponent(value)}`;
}

async function waitForServiceWorker() {
  const registration = await navigator.serviceWorker.register("../sw.js", {
    scope: "../",
    updateViaCache: "none",
  });

  await navigator.serviceWorker.ready;

  if (navigator.serviceWorker.controller) {
    return navigator.serviceWorker.controller;
  }

  if (!registration.active) {
    throw new Error("Scramjet service worker is not active.");
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Scramjet service worker did not take control."));
    }, 10000);

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

  return navigator.serviceWorker.controller;
}

async function initializeController() {
  if (controller) {
    return controller;
  }

  showLoading("Starting Scramjet...");

  const serviceworker = await waitForServiceWorker();

  const transport = new LibcurlTransport.LibcurlClient({
    websocket: WISP_URL,
  });

  controller = new $scramjetController.Controller({
    serviceworker,
    transport,
    config: { prefix: new URL("../edu/", location.href).pathname },
  });

  await controller.wait();

  return controller;
}

function navigate(url) {
  if (!frame || !url) {
    return;
  }

  showLoading("Loading...");

  addressBar.value = url;

  frame.go(url);
}

function watchFrameUrl() {
  let lastUrl = "";

  const update = () => {
    if (!frame || !proxyFrame.contentWindow) {
      return;
    }

    try {
      const current = proxyFrame.contentWindow.location.href;

      if (!current || current === lastUrl) {
        return;
      }

      lastUrl = current;

      const context = frame.context;
      const prefix = context.prefix.href;

      if (!current.startsWith(prefix)) {
        return;
      }

      const rewritten = new URL(current);
      const encoded = rewritten.href.slice(prefix.length);

      let destination = context.interface.codecDecode(encoded);

      try {
        const cleanUrl = new URL(destination);
        cleanUrl.searchParams.delete("$io");
        destination = cleanUrl.href;
      } catch {}

      if (rewritten.hash) {
        destination += context.interface.codecDecode(
          rewritten.hash.slice(1),
        );
      }

      if (destination) {
        addressBar.value = destination;
        localStorage.setItem("lastVisited", destination);
      }
    } catch (error) {
      console.debug("Unable to update address bar:", error);
    }
  };

  setInterval(update, 100);
}

async function start(url) {
  try {
    const api = await initializeController();

    frame = api.createFrame(proxyFrame);

    watchFrameUrl();

    proxyFrame.addEventListener("load", () => {
      hideLoading();
    });

    navigate(url);
  } catch (error) {
    console.error("Scramjet initialization failed:", error);

    loadingText.textContent = `Scramjet failed to start: ${error.message}`;

    loading.style.display = "flex";
  }
}

addressBar.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  const url = normalizeInput(addressBar.value);

  if (url) {
    navigate(url);
  }

  addressBar.blur();
});

homeButton.addEventListener("click", () => {
  location.href = "../index/";
});

backButton.addEventListener("click", () => {
  frame?.back();
});

forwardButton.addEventListener("click", () => {
  frame?.forward();
});

reloadButton.addEventListener("click", () => {
  if (!frame) {
    return;
  }

  showLoading("Reloading...");
  frame.reload();
});

/* settings menu: change wisp server */
wispInput.value = WISP_URL;

settingsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  settingsMenu.classList.toggle("open");
});

settingsMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  settingsMenu.classList.remove("open");
});

saveWispButton.addEventListener("click", () => {
  const value = wispInput.value.trim();

  if (!value) {
    return;
  }

  localStorage.setItem("wispUrl", value);
  location.reload();
});

const initialUrl = new URLSearchParams(location.search).get("url");

if (initialUrl) {
  history.replaceState(null, "", location.pathname);

  start(initialUrl);
} else {
  const lastVisited = localStorage.getItem("lastVisited");

  if (lastVisited) {
    start(lastVisited);
  } else {
    location.href = "../index/";
  }
}
