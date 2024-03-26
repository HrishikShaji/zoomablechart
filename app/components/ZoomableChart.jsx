import { useEffect, useRef } from "react";
import json from "../../lib/data.json";
import * as d3 from "d3";

const data = json;

export const ZoomableChart = () => {
  const svgRef = useRef < SVGSVGElement > null;

  useEffect(() => {
    // Specify the chart╬ô├ç├ûs dimensions.
    const width = 928;
    const height = 1200;

    // Create the color scale.
    const color = d3.scaleOrdinal(
      d3.quantize(d3.interpolateRainbow, data.children.length + 1),
    );

    // Compute the layout.
    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => {
        const aValue = a.value || 0;
        const bValue = b.value || 0;
        return b.height - a.height || bValue - aValue;
      });
    const root = d3
      .partition()
      .size([height, ((hierarchy.height + 1) * width) / 3])(hierarchy);

    // Append cells.
    const svg = d3.select(svgRef.current);

    const cell = svg
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`)
      .on("click", clicked);
    const rect = cell
      .append("rect")
      .attr("width", (d) => d.y1 - d.y0 - 1)
      .attr("height", (d) => rectHeight(d))
      .attr("fill-opacity", 0.6)
      .attr("fill", (d) => {
        if (!d.depth) return "#ccc";
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .style("cursor", "pointer");

    const text = cell
      .append("text")
      .style("user-select", "none")
      .attr("pointer-events", "none")
      .attr("x", 4)
      .attr("y", 13)
      .attr("fill-opacity", (d) => +labelVisible(d));

    text.append("tspan").text((d) => d.data.name);

    const format = d3.format(",d");
    const tspan = text
      .append("tspan")
      .attr("fill-opacity", (d) => labelVisible(d) * 0.7)
      .text((d) => ` ${format(d.value)}`);

    cell.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .map((d) => d.data.name)
          .reverse()
          .join("/")}\n${format(d.value)}`,
    );

    let focus = root;
    function clicked(event, p) {
      if (!p.parent) return;
      focus = focus === p ? (p = p.parent || root) : p;

      root.each(
        (d) =>
          (d.target = {
            x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
            x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
            y0: d.y0 - p.y0,
            y1: d.y1 - p.y0,
          }),
      );

      const t = cell
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);

      rect.transition(t).attr("height", (d) => rectHeight(d.target));
      text.transition(t).attr("fill-opacity", (d) => +labelVisible(d.target));
      tspan
        .transition(t)
        .attr("fill-opacity", (d) => labelVisible(d.target) * 0.7);
    }

    function rectHeight(d) {
      return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
    }

    function labelVisible(d) {
      return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
    }
  }, []);

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
};
