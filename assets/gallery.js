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

/* ---- Topic figure group: thumbnails swap the main figure ---- */

const figureGroup = document.querySelector("[data-figure-group]");

if (figureGroup) {
  const mainImage = figureGroup.querySelector("[data-figure-main]");
  const captionTitle = figureGroup.querySelector("[data-figure-caption-title]");
  const captionSource = figureGroup.querySelector("[data-figure-caption-source]");
  const download = figureGroup.querySelector(".gallery-figure-actions a");
  const thumbs = [...figureGroup.querySelectorAll(".gallery-thumb")];

  for (const thumb of thumbs) {
    thumb.addEventListener("click", () => {
      if (!mainImage) return;
      /* 读 <img src> 而不是 data-* 副本：多语言构建只会重写 src，
         复制一份到 data-* 会让 zh-CN 页面指到错误层级。 */
      const source = thumb.querySelector("img")?.getAttribute("src") ?? "";
      mainImage.src = source;
      mainImage.alt = thumb.dataset.figureTitle ?? "";
      if (captionTitle) captionTitle.textContent = thumb.dataset.figureTitle ?? "";
      if (captionSource) captionSource.textContent = thumb.dataset.figureSource ?? "";
      if (download) download.href = source || "#";
      for (const other of thumbs) other.classList.toggle("is-active", other === thumb);
    });
  }
}

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

/* ---- Collapsible category groups (spatial sub-platforms) ----

   Progressive enhancement: the markup ships expanded, so without JS every
   sub-link stays visible and clickable. This only ADDS the ability to collapse.
   The chosen state is remembered in localStorage so it survives navigation
   between category pages (otherwise the tree would jump open on every click). */

const CATEGORY_STATE_KEY = "gallery:collapsed-groups";

function readCollapsedGroups() {
  try {
    const raw = localStorage.getItem(CATEGORY_STATE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    // localStorage 可能被隐私模式禁用，或内容损坏；折叠功能照常工作，只是不记忆
    return new Set();
  }
}

function writeCollapsedGroups(set) {
  try {
    localStorage.setItem(CATEGORY_STATE_KEY, JSON.stringify([...set]));
  } catch {
    /* 忽略：不可写时只是不记忆 */
  }
}

function setGroupCollapsed(group, collapsed) {
  const toggle = group.querySelector("[data-toggle]");
  group.classList.toggle("is-collapsed", collapsed);
  toggle?.setAttribute("aria-expanded", String(!collapsed));
  const label = toggle?.getAttribute("aria-label") ?? "";
  if (label) {
    // 按钮文案随状态切换：收起 -> 「展开…」，展开 -> 「收起…」
    const next = collapsed
      ? label.replace(/^收起/, "展开")
      : label.replace(/^展开/, "收起");
    toggle.setAttribute("aria-label", next);
  }
}

const collapsedGroups = readCollapsedGroups();

for (const group of document.querySelectorAll(".gallery-category-group[data-group]")) {
  const key = group.dataset.group;
  if (!key) continue;
  setGroupCollapsed(group, collapsedGroups.has(key));

  group.querySelector("[data-toggle]")?.addEventListener("click", (event) => {
    // 按钮在 <a> 之外，但仍阻止冒泡，避免未来结构变化时误触导航
    event.preventDefault();
    event.stopPropagation();
    const nowCollapsed = !group.classList.contains("is-collapsed");
    setGroupCollapsed(group, nowCollapsed);
    if (nowCollapsed) collapsedGroups.add(key);
    else collapsedGroups.delete(key);
    writeCollapsedGroups(collapsedGroups);
  });
}
