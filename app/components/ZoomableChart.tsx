import { useEffect, useRef } from "react";
import json from "../../lib/data.json";
import * as d3 from "d3";

const data = json;

export const ZoomableChart = () => {
	const svgRef = useRef(null);

	useEffect(() => {
		if (!svgRef.current) return;

		d3.select(svgRef.current).selectAll("svg").remove();
		// Specify the chart╬ô├ç├ûs dimensions.
		const width = 1400;
		const height = 700;

		// Create the color scale.
		const color = d3.scaleOrdinal(
			d3.quantize(d3.interpolateRainbow, data.children.length + 1),
		);

		// Compute the layout.
		const hierarchy = d3
			.hierarchy(data)
			.sum((d: any) => d.value)
			.sort((a, b) => {
				const aValue = a.value || 0;
				const bValue = b.value || 0;
				return b.height - a.height || bValue - aValue;
			});
		const root = d3
			.partition()
			.size([height, ((hierarchy.height + 1) * width) / 3])(hierarchy as any);

		// Append cells.
		const svg = d3
			.select(svgRef.current)
			.append("svg")
			.attr("viewBox", [0, 0, width, height])
			.attr("width", width)
			.attr("height", height)
			.attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

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
				while (d.depth > 1) d = d.parent as any;
				return color((d.data as any).name);
			})
			.style("cursor", "pointer");

		const text = cell
			.append("text")
			.style("user-select", "none")
			.attr("pointer-events", "none")
			.attr("x", 4)
			.attr("y", 13)
			.attr("fill-opacity", (d) => +labelVisible(d));

		text.append("tspan").text((d) => (d.data as any).name);

		const format = d3.format(",d");
		const tspan = text
			.append("tspan")
			.attr("fill-opacity", (d) => +labelVisible(d) * 0.7)
			.text((d) => ` ${format(d.value as number)}`);

		cell.append("title").text(
			(d) =>
				`${d
					.ancestors()
					.map((d) => (d.data as any).name)
					.reverse()
					.join("/")}\n${format(d.value as number)}`,
		);

		let focus: any = root;
		function clicked(event: MouseEvent, p: any) {
			focus = focus === p ? (p = p.parent) : p;

			root.each(
				(d: any) =>
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
				.attr(
					"transform",
					(d: any) => `translate(${d.target.y0},${d.target.x0})`,
				);

			rect.transition(t).attr("height", (d: any) => rectHeight(d.target));
			text
				.transition(t)
				.attr("fill-opacity", (d: any) => +labelVisible(d.target));
			tspan
				.transition(t)
				.attr("fill-opacity", (d: any) => +labelVisible(d.target) * 0.7);
		}

		function rectHeight(d: any) {
			return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
		}

		function labelVisible(d: any) {
			return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
		}
	}, []);

	return <div className="w-full h-full" ref={svgRef}></div>;
};
