/* Gallery interactions: search, kind filter, enlarge dialog, copy prompt,
   and the mobile sidebar drawer.

   Progressive enhancement only — every category is a real URL and every card
   links to a real detail page, so the gallery works without JavaScript. */

const grid = document.querySelector("[data-gallery-grid]");
const search = document.querySelector("[data-gallery-search]");
const filters = [...document.querySelectorAll("[data-filter]")];
const cards = grid ? [...grid.querySelectorAll(".gallery-card")] : [];
const noMatch = document.querySelector("[data-gallery-no-match]");

let activeKind = "all";

function applyFilters() {
  const query = (search?.value ?? "").trim().toLowerCase();
  let visible = 0;

  for (const card of cards) {
    const matchesKind = activeKind === "all" || card.dataset.kind === activeKind;
    const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
    const show = matchesKind && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  }

  if (noMatch) noMatch.hidden = visible !== 0;
}

search?.addEventListener("input", applyFilters);

for (const button of filters) {
  button.addEventListener("click", () => {
    activeKind = button.dataset.filter ?? "all";
    for (const other of filters) other.classList.toggle("is-active", other === button);
    applyFilters();
  });
}

/* ---- Enlarge dialog ---- */

const dialog = document.getElementById("gallery-dialog");
const viewerTitle = document.getElementById("viewer-title");
const viewerImage = document.getElementById("viewer-img");
const viewerNote = document.getElementById("viewer-note");

function figureData(id) {
  const card = document.getElementById(id);
  if (!card) return null;
  const image = card.querySelector(".gallery-art img");
  const title = card.querySelector(".gallery-body h3");
  const journal = card.querySelector(".gallery-journal");
  const date = card.querySelector(".gallery-date");
  const paper = card.querySelector(".gallery-paper");
  const figure = card.querySelector(".gallery-figure");
  const badge = card.querySelector(".gallery-badge");
  return {
    src: image?.getAttribute("src") ?? "",
    alt: image?.getAttribute("alt") ?? "",
    title: title?.textContent.trim() ?? "",
    journal: journal?.firstChild?.textContent?.trim() ?? "",
    date: date?.textContent.trim() ?? "",
    paper: paper?.textContent.trim() ?? "",
    figure: figure?.textContent.trim() ?? "",
    badge: badge?.textContent.trim() ?? "",
  };
}

for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click", () => {
    const data = figureData(button.dataset.view);
    if (!data || !dialog) return;
    viewerTitle.textContent = data.title;
    viewerImage.src = data.src;
    viewerImage.alt = data.alt;
    const parts = [data.badge, data.figure, data.journal, data.date, data.paper]
      .filter(Boolean);
    viewerNote.textContent = parts.join(" · ");
    dialog.showModal();
  });
}

document.querySelector(".gallery-dialog-close")?.addEventListener("click", () => {
  dialog?.close();
});

/* Click on the backdrop area closes the dialog. */
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

/* ---- Copy the agent prompt ---- */

const status = document.getElementById("copy-status");

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const id = button.dataset.copy;
    const panel = document.getElementById(`agent-prompt-${id}`);
    const text = document.getElementById(`agent-text-${id}`);
    if (!panel || !text) return;

    panel.hidden = false;
    const value = text.value;
    try {
      await navigator.clipboard.writeText(value);
      if (status) status.textContent = "Agent 调用提示词已复制";
      button.textContent = "已复制 ✓";
    } catch {
      text.focus();
      text.select();
      if (status) status.textContent = "请按 Ctrl/Cmd+C 手动复制";
      button.textContent = "请手动复制";
    }
    setTimeout(() => {
      button.textContent = "复制 Agent 提示词";
      if (status) status.textContent = "";
    }, 3000);
  });
}

/* ---- Mobile sidebar drawer ---- */

const menu = document.querySelector(".gallery-menu");
const backdrop = document.querySelector(".gallery-backdrop");
const closeButton = document.querySelector(".gallery-sidebar-close");

function setNavigation(open) {
  document.body.classList.toggle("nav-open", open);
  menu?.setAttribute("aria-expanded", String(open));
  if (backdrop) backdrop.hidden = !open;
}

menu?.addEventListener("click", () => setNavigation(!document.body.classList.contains("nav-open")));
backdrop?.addEventListener("click", () => setNavigation(false));
closeButton?.addEventListener("click", () => setNavigation(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setNavigation(false);
    if (dialog?.open) dialog.close();
  }
});
