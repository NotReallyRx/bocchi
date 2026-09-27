const ZONES_URL = "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json";

const coverURL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

const status = document.getElementById("status");
const grid = document.getElementById("gamesGrid");

function resolve(template, id) {
  return template
    .replace("{COVER_URL}", coverURL)
    .replace("{HTML_URL}", htmlURL);
}

function renderGames(zones) {
  const games = zones.filter((zone) => zone.id >= 0);

  status.style.display = "none";

  const fragment = document.createDocumentFragment();

  for (const game of games) {
    const link = document.createElement("a");
    link.className = "game";
    link.href = `/l/?url=${encodeURIComponent(resolve(game.url, game.id))}`;
    link.title = game.name;

    const cover = document.createElement("div");
    cover.className = "cover";

    const img = document.createElement("img");
    img.src = resolve(game.cover, game.id);
    img.alt = "";
    img.loading = "lazy";

    cover.appendChild(img);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = game.name;

    link.appendChild(cover);
    link.appendChild(name);

    fragment.appendChild(link);
  }

  grid.appendChild(fragment);
}

fetch(ZONES_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load zones.json (${response.status})`);
    }

    return response.json();
  })
  .then(renderGames)
  .catch((error) => {
    console.error("Failed to load games:", error);
    status.textContent = "Couldn't load the games list.";
  });
