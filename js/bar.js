/* Chart 3: bar chart - mean energy consumption by screen technology, 55-inch TVs only */

d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv", row => {
  const [techColumn, valueColumn] = Object.keys(row);
  return { tech: normaliseTech(row[techColumn]), value: +row[valueColumn] };
})
  .then(data => renderResponsive("#bar", width => drawBar(data, width)))
  .catch(showLoadError("#bar"));

function drawBar(data, width) {
  const container = d3.select("#bar");
  container.selectAll("*").remove();

  const height = Math.max(280, Math.min(380, width * 0.7));
  const margin = { top: 26, right: 12, bottom: 56, left: 66 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const fmt = d3.format(",.0f");

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "Bar chart of mean energy consumption for 55-inch TVs: " +
      data.map(d => `${d.tech} ${fmt(d.value)} kWh per year`).join(", ") + ".");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d.tech)).range([0, innerW]).padding(0.3);
  // Bars must start at zero, otherwise their lengths exaggerate the differences.
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([innerH, 0]);

  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(8));
  g.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")));

  g.append("text").attr("class", "axis-title")
    .attr("x", innerW / 2).attr("y", innerH + 46).attr("text-anchor", "middle")
    .text("Screen technology");
  g.append("text").attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2).attr("y", -margin.left + 16).attr("text-anchor", "middle")
    .text("Mean energy (kWh/year)");

  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.tech))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => innerH - y(d.value))
    .attr("fill", d => TECH_COLOURS[d.tech]);

  // Value labels above the bars, so no hovering is needed.
  g.selectAll(".bar-value")
    .data(data)
    .join("text")
    .attr("class", "bar-value")
    .attr("x", d => x(d.tech) + x.bandwidth() / 2)
    .attr("y", d => y(d.value) - 7)
    .text(d => fmt(d.value));
}
