(() => {
  const params = new URLSearchParams(window.location.search);

  const activityId = params.get("g");
  const siteUrl = params.get("s");


  /* =========================================================
     DOM
     ========================================================= */

  const activityFrame =
    document.getElementById("activityFrame");

  const loading =
    document.getElementById("loading");

  const loadingText =
    document.getElementById("loadingText");

  const errorBox =
    document.getElementById("errorBox");

  const errorMessage =
    document.getElementById("errorMessage");

  const homeButton =
    document.getElementById("homeButton");

  const openTabButton =
    document.getElementById("openTabButton");

  const refreshButton =
    document.getElementById("refreshButton");

  const fullscreenButton =
    document.getElementById("fullscreenButton");

  const browser =
    document.getElementById("browser");


  /* =========================================================
     LOADING
     ========================================================= */

  function showLoading(text) {

    if (loadingText) {
      loadingText.textContent = text;
    }

    if (loading) {
      loading.style.display = "flex";
    }

    if (errorBox) {
      errorBox.style.display = "none";
    }

  }


  function hideLoading() {

    if (loading) {
      loading.style.display = "none";
    }

  }


  function showError(message) {

    hideLoading();

    if (errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorBox) {
      errorBox.style.display = "flex";
    }

  }


  /* =========================================================
     BUILD EMBED URL
     
     Activities:
       /l/?g=1
       -> /l/embed/?g=1

     Sites:
       /l/?s=https://spotify.com/
       -> /l/embed/?s=https://spotify.com/
     ========================================================= */

  function getEmbedUrl() {

    const embedUrl =
      new URL(
        "e/",
        window.location.href
      );


    if (activityId) {

      embedUrl.searchParams.set(
        "g",
        activityId
      );

      return embedUrl.href;
    }


    if (siteUrl) {

      embedUrl.searchParams.set(
        "s",
        siteUrl
      );

      return embedUrl.href;
    }


    return null;

  }


  /* =========================================================
     LOAD
     ========================================================= */

  const embedUrl = getEmbedUrl();


  if (!embedUrl) {

    showError(
      "No activity or site was specified."
    );

  } else {

    /*
     * Show the correct loading message.
     */

    if (activityId) {
      showLoading("Loading activity...");
    } else {
      showLoading("Loading site...");
    }


    /*
     * The iframe points ONLY to /l/embed/.
     *
     * l.js does not load activities.
     *
     * l.js does not run Scramjet.
     *
     * l.js does not fetch zones.json.
     *
     * All of that is handled by e.js.
     */

    activityFrame.addEventListener(
      "load",
      hideLoading,
      {
        once: true
      }
    );


    activityFrame.addEventListener(
      "error",
      () => {

        if (activityId) {
          showError("Couldn't load that activity.");
        } else {
          showError("Couldn't load that site.");
        }

      }
    );


    activityFrame.src = embedUrl;

  }


  /* =========================================================
     HOME
     ========================================================= */

  homeButton.addEventListener(
    "click",
    () => {

      window.location.href = "../g/";

    }
  );


  /* =========================================================
     OPEN IN NEW TAB
     ========================================================= */

  openTabButton.addEventListener(
    "click",
    () => {

      if (!embedUrl) {
        return;
      }


      window.open(
        embedUrl,
        "_blank",
        "noopener"
      );

    }
  );


  /* =========================================================
     REFRESH
     ========================================================= */

  refreshButton.addEventListener(
    "click",
    () => {

      if (!embedUrl) {
        return;
      }


      if (activityId) {
        showLoading("Loading activity...");
      } else {
        showLoading("Loading site...");
      }


      /*
       * Setting src to the exact same value won't
       * reload the iframe in most browsers, so append
       * a cache-busting param to force a fresh load.
       */

      const reloadUrl =
        new URL(embedUrl);

      reloadUrl.searchParams.set(
        "_r",
        Date.now().toString()
      );


      /*
       * The original "load" listener was attached with
       * { once: true }, so it already fired and removed
       * itself on first load. Without re-attaching it here,
       * hideLoading() never runs again and the spinner
       * gets stuck forever.
       */

      activityFrame.addEventListener(
        "load",
        hideLoading,
        {
          once: true
        }
      );


      activityFrame.src = reloadUrl.href;

    }
  );


  /* =========================================================
     FULLSCREEN
     ========================================================= */

  function requestFullscreen(element) {

    const request =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen;


    if (request) {
      request.call(element);
    }

  }


  function exitFullscreen() {

    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;


    if (exit) {
      exit.call(document);
    }

  }


  function isFullscreen() {

    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

  }


  fullscreenButton.addEventListener(
    "click",
    () => {

      if (isFullscreen()) {

        exitFullscreen();

        return;

      }


      browser.classList.add(
        "expanded"
      );


      requestFullscreen(
        browser
      );

    }
  );


  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "msfullscreenchange"
  ].forEach(
    eventName => {

      document.addEventListener(
        eventName,
        () => {

          if (!isFullscreen()) {

            browser.classList.remove(
              "expanded"
            );

          }

        }
      );

    }
  );

})();
