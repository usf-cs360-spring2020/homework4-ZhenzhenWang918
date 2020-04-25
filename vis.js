var width = 960,
    height = 540;

var stratify = d3.stratify()
    .id(function (d) { return d.path; })
    .parentId(function (d) { return d.path.substring(0, d.path.lastIndexOf("_")); });

function tree(data) {
    root = d3.hierarchy(stratify(data));
    root.dx = 10;
    root.dy = 0.9 * width / (root.height + 1);
    root = d3.tree().nodeSize([root.dx, root.dy])(root);

    let x0 = Infinity;
    let x1 = -x0;

    root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
    });

    const svg = d3.select("#vis1").append("svg")
        .attr("viewBox", [0, 0, width, x1 - x0 + root.dx * 2]);

    const g = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

    const link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("fill", d => d.children ? "#555" : "#999")
        .attr("r", 2.5);

    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.id.substring(d.data.id.lastIndexOf("_") + 1) + (d.data.data.count ? (" (" + (d.data.data.count) + ")") : ""))
        .clone(true).lower()
        .attr("stroke", "white");

    return svg.node();
}
color = d3.scaleOrdinal(d3.schemeCategory10)

function sumBySize(d) {
    return d.data.count;
}

function treemap(data) {
    var tm = d3.treemap()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .padding(1)
        .round(true);

    var root = d3.hierarchy(stratify(data))
        // .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data; })
        .sum(sumBySize)
    // .sort(function(a, b) { return b.height - a.height || b.value - a.value; });
    root = tm(root);

    svg = d3.select("#vis2").append("svg")

    var cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", function (d) { return d.data.id; })
        .attr("width", function (d) { return d.x1 - d.x0; })
        .attr("height", function (d) { return d.y1 - d.y0; })
        .attr("fill", function (d) { return color(d.parent.data.id); })

    cell.append("clipPath")
        .attr("id", function (d) { return "clip-" + d.data.id; })
        .append("use")
        .attr("xlink:href", function (d) { return "#" + d.data.id; });

    cell.append("text")
        .attr("clip-path", function (d) { return "url(#clip-" + d.data.id + ")"; })
        .selectAll("tspan")
        .data(function (d) { return d.data.id.split(/_/g); })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function (d, i) { return 13 + i * 10; })
        .text(function (d) { return d; });

    cell.append("title")
        .text(function (d) { return d.data.id + "\n" + d.data.count; });
}

d3.csv("data_wrangled.csv").then(function (data) {
    tree(data);
    treemap(data);
});
