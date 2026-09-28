const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");

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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const url = normalizeInput(input.value);

  if (!url) {
    input.focus();
    return;
  }

  location.href = `../search/?url=${encodeURIComponent(url)}`;
});
