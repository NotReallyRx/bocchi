(() => {
  const params = new URLSearchParams(window.location.search);

  const gameId = params.get("g");
  const siteUrl = params.get("s");

  const proxyFrame = document.getElementById("proxyFrame");
  const loading = document.getElementById("loading");

  const ZONES_URL =
    "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json";

  const HTML_URL =
    "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

  const WISP_URL =
    localStorage.getItem("wispUrl") ||
    "wss://g.novalee.xyz/wisp/";

  function setLoading(text) {
    loading.textContent = text;
    loading.style.display = "flex";
  }

  function hideLoading() {
    loading.style.display = "none";
  }

  async function loadGame() {
    setLoading("Loading activity...");

    const response = await fetch(ZONES_URL);

    if (!response.ok) {
      throw new Error("Couldn't load zones.json.");
    }

    const zones = await response.json();

    const activity = zones.find(
      item => String(item.id) === String(gameId)
    );

    if (!activity) {
      throw new Error("Activity not found.");
    }

    if (!activity.url) {
      throw new Error("Activity URL is missing.");
    }

    const gameUrl = activity.url
      .replace("{HTML_URL}", HTML_URL);

    const gameResponse = await fetch(gameUrl);

    if (!gameResponse.ok) {
      throw new Error(
        `Couldn't load activity (${gameResponse.status}).`
      );
    }

    const html = await gameResponse.text();

    document.open();
    document.write(html);
    document.close();
  }

  async function waitForServiceWorker() {
    const registration =
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none"
      });

    await navigator.serviceWorker.ready;

    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }

    if (!registration.active) {
      throw new Error(
        "Scramjet service worker is not active."
      );
    }

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            "Scramjet service worker did not take control."
          )
        );
      }, 10000);

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });

    return navigator.serviceWorker.controller;
  }

  async function loadSite() {
    setLoading("Loading site...");

    if (!siteUrl) {
      throw new Error("No site URL was specified.");
    }

    const destination = new URL(siteUrl);

    const serviceworker =
      await waitForServiceWorker();

    const transport =
      new LibcurlTransport.LibcurlClient({
        websocket: WISP_URL
      });

    const controller =
      new $scramjetController.Controller({
        serviceworker,
        transport
      });

    await controller.wait();

    const frame =
      controller.createFrame(proxyFrame);

    proxyFrame.addEventListener("load", hideLoading);

    frame.go(destination.href);
  }

  async function start() {
    try {
      if (gameId !== null) {
        await loadGame();
        return;
      }

      if (siteUrl !== null) {
        await loadSite();
        return;
      }

      throw new Error("No activity or site was specified.");
    } catch (error) {
      console.error("Embed initialization failed:", error);

      loading.textContent =
        "Failed to load: " + error.message;
    }
  }

  start();
})();
