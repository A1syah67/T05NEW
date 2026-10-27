/* Chart 2: donut chart - mean energy consumption by screen technology (all sizes) */

d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv", row => {
  // The second column has a long name, so read the columns by position.
  const [techColumn, valueColumn] = Object.keys(row);
  return { tech: normaliseTech(row[techColumn]), value: +row[valueColumn] };
})
  .then(data => renderResponsive("#donut", width => drawDonut(data, width)))
  .catch(showLoadError("#donut"));

function drawDonut(data, width) {
  const container = d3.select("#donut");
  container.selectAll("*").remove();

  const size = Math.min(width, 340);
  const outerRadius = size / 2 - 6;      // leaves room for the hover grow effect
  const innerRadius = outerRadius * 0.62;
  const fmt = d3.format(",.0f");

  const svg = container.append("svg")
    .attr("class", "donut-svg")
    .attr("width", size)
    .attr("height", size)
    .attr("role", "img")
    .attr("aria-label", "Donut chart of mean energy consumption by screen technology: " +
      data.map(d => `${d.tech} ${fmt(d.value)} kWh per year`).join(", ") + ".");

  const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

  const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.02);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const arcGrown = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius + 4);

  // Text in the hole of the donut.
  const centreValue = g.append("text").attr("class", "donut-value").attr("y", 2);
  const centreLabel = g.append("text").attr("class", "donut-label").attr("y", 24);

  function resetCentre() {
    centreValue.text("");
    centreLabel.attr("y", 5).text("Select a slice");
  }
  function setCentre(d) {
    centreValue.text(fmt(d.data.value));
    centreLabel.attr("y", 24).text(`${d.data.tech}, kWh/year`);
  }
  resetCentre();

  g.selectAll("path")
    .data(pie(data))
    .join("path")
    .attr("class", "donut-slice")
    .attr("d", arc)
    .attr("fill", d => TECH_COLOURS[d.data.tech])
    .attr("tabindex", 0)
    .attr("aria-label", d => `${d.data.tech}: ${fmt(d.data.value)} kWh per year`)
    .on("pointerenter focus", function (event, d) {
      d3.select(this).attr("d", arcGrown);
      setCentre(d);
    })
    .on("pointerleave blur", function () {
      d3.select(this).attr("d", arc);
      resetCentre();
    });

  // The legend carries the exact numbers, so they are readable without hovering.
  makeLegend(container.node(),
    data.map(d => ({
      label: d.tech,
      colour: TECH_COLOURS[d.tech],
      detail: `${fmt(d.value)} kWh/year`
    })),
    "legend--centre");
}
