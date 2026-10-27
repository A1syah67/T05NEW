/* Chart 1: scatter plot - energy consumption vs star rating (one dot per TV model) */

d3.csv("data/Ex5_TV_energy.csv", d => ({
  brand: d.brand,
  tech: normaliseTech(d.screen_tech),
  size: +d.screensize,
  kwh: +d.energy_consumpt,
  stars: +d.star2
}))
  .then(data => {
    // Draw OLED last so its few dots are not hidden underneath the others.
    data.sort((a, b) => TECH_ORDER.indexOf(a.tech) - TECH_ORDER.indexOf(b.tech));
    renderResponsive("#scatter", width => drawScatter(data, width));
  })
  .catch(showLoadError("#scatter"));

function drawScatter(data, width) {
  const container = d3.select("#scatter");
  container.selectAll("*").remove();

  makeLegend(container.node(),
    TECH_ORDER.map(t => ({ label: t, colour: TECH_COLOURS[t] })));

  // Height follows width, within sensible limits.
  const height = Math.max(300, Math.min(460, width * 0.62));
  const margin = { top: 12, right: 14, bottom: 54, left: 68 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "Scatter plot of energy consumption against star rating for " +
      data.length + " televisions, coloured by screen technology. Higher star ratings tend to use less energy.");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([1.5, 8.5]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.kwh)]).nice().range([innerH, 0]);

  // Light gridlines, then axes.
  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues(d3.range(2, 9)));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));

  // Axis titles.
  g.append("text").attr("class", "axis-title")
    .attr("x", innerW / 2).attr("y", innerH + 44).attr("text-anchor", "middle")
    .text("Star rating (energy efficiency)");
  g.append("text").attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2).attr("y", -margin.left + 16).attr("text-anchor", "middle")
    .text("Energy consumption (kWh/year)");

  // One circle per TV. Semi-transparent so overlapping dots still show.
  g.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.stars))
    .attr("cy", d => y(d.kwh))
    .attr("r", 4)
    .attr("fill", d => TECH_COLOURS[d.tech])
    .attr("fill-opacity", 0.55)
    .attr("stroke", d => TECH_COLOURS[d.tech])
    .attr("stroke-opacity", 0.9)
    .on("pointerenter", (event, d) => showTooltip(event,
      `<strong>${escapeHtml(d.brand)}</strong><br>` +
      `${d.tech}, ${d.size}-inch<br>` +
      `${d3.format(".2~f")(d.stars)} stars, ${d3.format(",.0f")(d.kwh)} kWh/year`))
    .on("pointermove", moveTooltip)
    .on("pointerleave", hideTooltip);
}
