const APPS_URL = "./a.json";

const status = document.getElementById("status");
const grid = document.getElementById("appsGrid");

function favicon(url) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`;
}

function hostname(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function renderApps(data) {
  const apps = Array.isArray(data.apps) ? data.apps : [];

  status.style.display = "none";

  const fragment = document.createDocumentFragment();

  for (const app of apps) {
    const link = document.createElement("a");
    link.className = "app";
    link.href = "/l/?s=" + app.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = app.name;

    const icon = document.createElement("div");
    icon.className = "icon";

    const img = document.createElement("img");
    img.src = favicon(app.url);
    img.alt = "";
    img.loading = "lazy";

    icon.appendChild(img);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = app.name;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = hostname(app.url);

    link.appendChild(icon);
    link.appendChild(name);
    link.appendChild(meta);

    fragment.appendChild(link);
  }

  grid.appendChild(fragment);
}

fetch(APPS_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load a.json (${response.status})`);
    }

    return response.json();
  })
  .then(renderApps)
  .catch((error) => {
    console.error("Failed to load apps:", error);
    status.textContent = "Couldn't load the apps list.";
  });
