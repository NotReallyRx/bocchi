(() => {
  const params = new URLSearchParams(window.location.search);

  const gameUrl = params.get("url");
  const embedMode = params.get("embed") === "1";

  /*
   * EMBED MODE
   *
   * /l/?url=https://cdn.../game.html&embed=1
   *
   * Fetch the actual game HTML and write it directly
   * into this page.
   */
  if (embedMode) {
    if (!gameUrl) {
      document.open();

      document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
        </head>

        <body>
          <h1>No game was specified.</h1>
        </body>
        </html>
      `);

      document.close();
      return;
    }

    fetch(gameUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(
            `Game returned HTTP ${response.status}`
          );
        }

        return response.text();
      })
      .then(html => {
        /*
         * Only inject a <base> if the game doesn't
         * already contain one.
         */
        if (!/<base[\s>]/i.test(html)) {
          const gameBase = new URL(gameUrl);
          const baseTag = `<base href="${gameBase.href}">`;

          if (/<head[\s>]/i.test(html)) {
            html = html.replace(
              /<head([^>]*)>/i,
              `<head$1>${baseTag}`
            );
          } else {
            html = `
              <!DOCTYPE html>
              <html>
              <head>
                ${baseTag}
                <meta charset="UTF-8">
              </head>

              <body>
                ${html}
              </body>
              </html>
            `;
          }
        }

        /*
         * Write the actual game into this page.
         *
         * There is NO iframe here.
         */
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => {
        console.error("Failed to load game:", error);

        document.open();

        document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >

            <title>Game Error</title>

            <style>
              html,
              body {
                width: 100%;
                height: 100%;
                margin: 0;
                background: #000;
                color: #fff;
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .error {
                text-align: center;
                padding: 30px;
              }

              h1 {
                font-size: 22px;
                margin-bottom: 10px;
              }

              p {
                color: #aaa;
              }
            </style>
          </head>

          <body>
            <div class="error">
              <h1>Couldn't load the game</h1>
              <p>${escapeHtml(error.message)}</p>
            </div>
          </body>
          </html>
        `);

        document.close();
      });

    return;
  }

  /*
   * NORMAL MODE
   *
   * Example:
   *
   * /l/?url=https://cdn.jsdelivr.net/.../11-f.html
   *
   * The iframe points to OUR /l/ page with embed=1.
   *
   * It does NOT point directly to the CDN.
   */

  const gameFrame = document.getElementById("gameFrame");
  const loading = document.getElementById("loading");
  const errorBox = document.getElementById("errorBox");
  const errorMessage = document.getElementById("errorMessage");

  const homeButton = document.getElementById("homeButton");
  const openTabButton = document.getElementById("openTabButton");
  const fullscreenButton = document.getElementById("fullscreenButton");

  const browser = document.getElementById("browser");

  function showError(message) {
    if (loading) {
      loading.style.display = "none";
    }

    if (errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorBox) {
      errorBox.style.display = "flex";
    }
  }

  function hideLoading() {
    if (loading) {
      loading.style.display = "none";
    }
  }

  /*
   * LOAD GAME
   */
  if (!gameUrl) {
    showError("No game was specified.");
  } else {
    /*
     * Build:
     *
     * /l/?url=GAME_URL&embed=1
     */
    const embedUrl = new URL(window.location.href);

    embedUrl.searchParams.set("url", gameUrl);
    embedUrl.searchParams.set("embed", "1");

    /*
     * IMPORTANT:
     *
     * The iframe points to our wrapper.
     * The wrapper then fetches the CDN HTML.
     */
    gameFrame.addEventListener("load", hideLoading);

    gameFrame.addEventListener("error", () => {
      showError("Couldn't load that game.");
    });

    gameFrame.src = embedUrl.href;
  }

  /*
   * HOME
   */
  homeButton.addEventListener("click", () => {
    window.location.href = "/g/";
  });

  /*
   * OPEN IN NEW TAB
   *
   * Open OUR wrapper in embed mode.
   */
  openTabButton.addEventListener("click", () => {
    if (!gameUrl) {
      return;
    }

    const embedUrl = new URL(window.location.href);

    embedUrl.searchParams.set("url", gameUrl);
    embedUrl.searchParams.set("embed", "1");

    window.open(
      embedUrl.href,
      "_blank",
      "noopener"
    );
  });

  /*
   * FULLSCREEN
   */
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

  fullscreenButton.addEventListener("click", () => {
    if (isFullscreen()) {
      exitFullscreen();
      return;
    }

    browser.classList.add("expanded");

    requestFullscreen(browser);
  });

  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "msfullscreenchange"
  ].forEach(eventName => {
    document.addEventListener(eventName, () => {
      if (!isFullscreen()) {
        browser.classList.remove("expanded");
      }
    });
  });

  /*
   * Escape HTML for error messages.
   */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
