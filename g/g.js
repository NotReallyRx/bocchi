const ZONES_URL = "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json";

const coverURL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

const status = document.getElementById("status");
const grid = document.getElementById("activitiesGrid");

function resolve(template, id) {
  return template
    .replace("{COVER_URL}", coverURL)
    .replace("{HTML_URL}", htmlURL);
}

function renderActivities(zones) {
  const activities = zones.filter((zone) => zone.id >= 0);

  status.style.display = "none";

  const fragment = document.createDocumentFragment();

  for (const activity of activities) {
    const link = document.createElement("a");
    link.className = "activity";
    link.href = `/l/?g=${activity.id}`;
    link.title = activity.name;

    const cover = document.createElement("div");
    cover.className = "cover";

    const img = document.createElement("img");
    img.src = resolve(activity.cover, activity.id);
    img.alt = "";
    img.loading = "lazy";

    cover.appendChild(img);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = activity.name;

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
  .then(renderActivities)
  .catch((error) => {
    console.error("Failed to load activities:", error);
    status.textContent = "Couldn't load the activities list.";
  });
