/* Chart 4: line chart - spot electricity prices 1998 to 2024 (average plus one line per region) */

const LINE_COLOURS = {
  "Average": "#17212b",
  "Queensland": "#D55E00",
  "New South Wales": "#0072B2",
  "Victoria": "#CC79A7",
  "South Australia": "#E69F00",
  "Tasmania": "#009E73",
  "Snowy": "#56B4E9"
};

let lineSeries = [];      // [{ label, colour, values: [{ year, value }] }]
const lineVisible = {};   // which lines are switched on: { label: true/false }
let redrawLine = () => {};

// "Queensland ($ per megawatt hour)" -> "Queensland";  "Average Price (notTas-Snowy)" -> "Average"
function tidySeriesName(column) {
  if (column.startsWith("Average")) return "Average";
  return column.replace(/\s*\(\$.*\)$/, "");
}

d3.csv("data/Ex5_ARE_Spot_Prices.csv")
  .then(rows => {
    lineSeries = rows.columns.slice(1).map(column => {
      const label = tidySeriesName(column);
      lineVisible[label] = true;
      return {
        label,
        colour: LINE_COLOURS[label],
        // Empty cells (e.g. Tasmania before it joined the market) become null = a gap in the data.
        values: rows.map(r => ({ year: +r.Year, value: r[column] === "" ? null : +r[column] }))
      };
    });
    redrawLine = renderResponsive("#line", drawLine);
  })
  .catch(showLoadError("#line"));

function drawLine(width) {
  const container = d3.select("#line");
  container.selectAll("*").remove();

  // Key doubles as on/off buttons. Keep at least one line visible.
  makeLegend(container.node(), lineSeries.map(s => ({
    key: s.label,
    label: s.label,
    colour: s.colour,
    active: lineVisible[s.label],
    onToggle: item => {
      const visibleCount = Object.values(lineVisible).filter(Boolean).length;
      if (lineVisible[item.key] && visibleCount === 1) return;
      lineVisible[item.key] = !lineVisible[item.key];
      redrawLine();
      const button = container.select(`button[data-key="${item.key}"]`).node();
      if (button) button.focus();
    }
  })));

  const height = Math.max(300, Math.min(440, width * 0.5));
  const margin = { top: 30, right: 16, bottom: 40, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "Line chart of electricity spot prices in dollars per megawatt hour from 1998 to 2024. " +
      "The average price stays between about 30 and 65 dollars until 2015, then rises to a peak of 144.50 dollars in 2022.");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const years = lineSeries[0].values.map(d => d.year);
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
  // The y-axis range uses all lines, so it does not jump when a line is hidden.
  const y = d3.scaleLinear()
    .domain([0, d3.max(lineSeries, s => d3.max(s.values, v => v.value))]).nice()
    .range([innerH, 0]);

  // Fewer year labels on narrow screens.
  const step = width < 520 ? 6 : width < 760 ? 4 : 2;

  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues(d3.range(years[0], years[years.length - 1] + 1, step)).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => "$" + d));

  g.append("text").attr("class", "axis-title")
    .attr("x", -margin.left + 4).attr("y", -14)
    .text("Price ($ per megawatt hour)");

  // defined() leaves a gap wherever the value is missing.
  const line = d3.line()
    .defined(d => d.value !== null)
    .x(d => x(d.year))
    .y(d => y(d.value));

  // Draw the regions first and the average last, so the average is on top.
  const ordered = [...lineSeries].sort((a, b) => (a.label === "Average") - (b.label === "Average"));
  ordered.filter(s => lineVisible[s.label]).forEach(s => {
    g.append("path")
      .datum(s.values)
      .attr("fill", "none")
      .attr("stroke", s.colour)
      .attr("stroke-width", s.label === "Average" ? 3.5 : 1.75)
      .attr("stroke-opacity", s.label === "Average" ? 1 : 0.85)
      .attr("stroke-linejoin", "round")
      .attr("d", line);
  });

  // ----- Hover: a guide line, a dot on each visible line, and a tooltip for that year -----
  const focus = g.append("g").style("display", "none");
  focus.append("line")
    .attr("y1", 0).attr("y2", innerH)
    .attr("stroke", "#17212b").attr("stroke-opacity", 0.35);

  g.append("rect")
    .attr("width", innerW).attr("height", innerH)
    .attr("fill", "transparent")
    .style("touch-action", "pan-y")   // lets a finger still scroll the page vertically
    .on("pointermove", event => {
      const [mx] = d3.pointer(event, g.node());
      const [minYear, maxYear] = x.domain();
      const year = Math.max(minYear, Math.min(maxYear, Math.round(x.invert(mx))));

      const rows = ordered
        .filter(s => lineVisible[s.label])
        .map(s => ({ s, value: s.values.find(v => v.year === year).value }))
        .filter(r => r.value !== null)
        .sort((a, b) => b.value - a.value);

      focus.style("display", null);
      focus.select("line").attr("x1", x(year)).attr("x2", x(year));
      focus.selectAll("circle")
        .data(rows, r => r.s.label)
        .join("circle")
        .attr("cx", x(year))
        .attr("cy", r => y(r.value))
        .attr("r", 4.5)
        .attr("fill", r => r.s.colour)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      showTooltip(event,
        `<strong>${year}</strong>` +
        rows.map(r =>
          `<div class="tip__row"><span class="tip__swatch" style="background:${r.s.colour}"></span>` +
          `${escapeHtml(r.s.label)}: $${d3.format(",.2f")(r.value)}</div>`
        ).join(""));
    })
    .on("pointerleave", () => {
      focus.style("display", "none");
      hideTooltip();
    });
}
