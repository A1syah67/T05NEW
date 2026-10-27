/* Helpers shared by every chart file.
   Loaded before scatter.js, donut.js, bar.js and line.js. */

// Colour-blind-safe colours (Okabe-Ito). The same technology keeps the same colour in every chart.
const TECH_COLOURS = { "LCD": "#0072B2", "LED": "#E69F00", "OLED": "#009E73" };
const TECH_ORDER = ["LCD", "LED", "OLED"];

// The big TV file calls LED sets "LCD (LED)"; the summary files call them "LED".
// Using one name everywhere keeps the legends consistent.
function normaliseTech(name) {
  return name === "LCD (LED)" ? "LED" : name;
}

// Make text safe before putting it into tooltip HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

/* ---------- Responsive drawing ----------
   Calls draw(width) now, and again whenever the container's width changes.
   Returns a function that forces a redraw (used by the line chart's legend). */
function renderResponsive(selector, draw) {
  const el = document.querySelector(selector);
  let lastWidth = 0;

  function run(force) {
    const width = Math.floor(el.clientWidth);
    if (!width) return;
    if (width === lastWidth && !force) return;
    lastWidth = width;
    draw(width);
  }

  new ResizeObserver(() => run(false)).observe(el);
  run(true);
  return () => run(true);
}

/* ---------- Tooltip ---------- */
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .attr("role", "tooltip");

function showTooltip(event, html) {
  tooltip.html(html).classed("visible", true);
  moveTooltip(event);
}

function moveTooltip(event) {
  const gap = 14;
  const box = tooltip.node().getBoundingClientRect();
  let left = event.clientX + gap;
  let top = event.clientY + gap;
  // Keep the tooltip inside the window.
  if (left + box.width > window.innerWidth - 8) left = event.clientX - box.width - gap;
  if (top + box.height > window.innerHeight - 8) top = event.clientY - box.height - gap;
  tooltip.style("left", Math.max(8, left) + "px").style("top", Math.max(8, top) + "px");
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

/* ---------- Legend ----------
   items: [{ label, colour, detail?, key?, active?, onToggle? }]
   If an item has onToggle it becomes a button (used by the line chart). */
function makeLegend(container, items, extraClass) {
  const list = d3.select(container).append("ul")
    .attr("class", "legend" + (extraClass ? " " + extraClass : ""));

  items.forEach(item => {
    const row = list.append("li");
    const holder = item.onToggle
      ? row.append("button")
          .attr("type", "button")
          .attr("data-key", item.key)
          .attr("aria-pressed", item.active)
          .on("click", () => item.onToggle(item))
      : row.append("span");

    holder.classed("legend__item", true);
    holder.append("span").attr("class", "legend__swatch").style("background", item.colour);
    holder.append("span").text(item.label);
    if (item.detail) holder.append("span").attr("class", "legend__detail").text(item.detail);
  });

  return list;
}

/* ---------- Errors ----------
   d3.csv() uses fetch(), which does not work when index.html is opened straight from disk. */
function showLoadError(selector) {
  return error => {
    console.error(error);
    d3.select(selector).html(
      '<p class="error">Could not load the data. Open this page through a web server ' +
      '(for example VS Code Live Server or GitHub Pages) rather than double-clicking the file.</p>'
    );
  };
}
