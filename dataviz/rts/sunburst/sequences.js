// Dimensions of sunburst & sidepanel.
var height = 600;

var p = { w: 210, h: height};
var width = 840 ;
//var radius = Math.min(width, height) / 2;
var radius = 280;
var aperture = -.75;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 210, h: 25, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
    "Tessin": "#5687d1",
    "Suisse romande": "#6ab975",
    "Suisse allemande": "#a173d1",

    "Drame/Migration": "#808080",
    "Drame/Homosexualité": "#808080",
    "Drame/Famille": "#808080",
    "Drame/Adolescence": "#808080",
    "Drame/Histoire": "#808080",
    "Drame/Amour": "#808080",
    "Drame/Société": "#808080",


    "Docu/Nature": "#800000",
    "Docu/Migration": "#800000",
    "Docu/Economie politique": "#800000",
    "Docu/Famille": "#800000",
    "Docu/Musique": "#800000",
    "Docu/guerre": "#800000",
    "Docu/Société": "#800000",

    "Docu/Société/Paysan": "#800000",
    "NA": "#e000e0",
    "Comédie/Amour": "#008000",
    "Comédie/Heimat": "#008000",
    "Comédie/Famille": "#008000",
    "Comédie/Société": "#008000",

    "Thriller": "#'000080",
    "Science Fiction": "#000080",
    "Policier": "#000080",
    "Road Movie/Migration": "#000080",

    "Meilleur film d'animation": "#67d9f4",
    "Meilleur Documentaire": "#a589a1",
    "Meilleure interprétation féminine": "#9a67f7",
    "Meilleure interprétation masculine": "#1cea8c",
    "Meilleur scénario": "#25ccc7",
    "Meilleure Musique de film": "#b234a6",
    "Meilleure photographie": "#b72929",
    "Meilleur court métrage": "#ed2e5b",
    "Meilleur second rôle": "#e89a3d",

    "Meilleur film de fiction": "#0825f7",
    "Meilleur rôle principal": "#f09010",
    "Meilleur espoir": "#f09010",


    "1998": "#c0c0c0",
    "1999": "#c0c0c0",
    "2000": "#c0c0c0",
    "2001": "#c0c0c0",
    "2002": "#c0c0c0",
    "2003": "#c0c0c0",
    "2004": "#c0c0c0",
    "2005": "#c0c0c0",
    "2006": "#c0c0c0",
    "2007": "#c0c0c0",
    "2008": "#c0c0c0",
    "2009": "#c0c0c0",
    "2010": "#c0c0c0",
    "2011": "#c0c0c0",
    "2012": "#c0c0c0",
    "2013": "#c0c0c0"

};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return aperture * d.x; })
    .endAngle(function(d)   { return aperture  * (d.x + d.dx); }) // Try 0.75 :)
    .innerRadius(function(d) { return 1.0 * Math.sqrt(d.y); })
    .outerRadius(function(d) { return 1.0 * Math.sqrt(d.y + d.dy); });

// Tooltip init
var tooltip = d3.select('#chart')
    .append('div')
    .attr('class', 'tooltip');

tooltip.append('div')
    .attr('class', 'label');

//tooltip.append('div').attr('class', 'percent');

var path;

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("result.csv", function(text) {
    var csv = d3.dsv(";", "text/plain").parseRows(text);
    //var csv = d3.csv.parseRows(text);
    var json = buildHierarchy(csv);
    createVisualization(json);
});

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

    // Basic setup of page elements.
    initializeBreadcrumbTrail();

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition.nodes(json)
        .filter(function(d) {
            return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
        });


    path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) { return colors[d.name]; })
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove);

    arc.append("text").attr("x", 6)
        .attr("dy", 15).text("X");


    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.value;
};

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

    d3.select("#entete")
        .text(d.prix + " " + d.annee);

    d3.select("#titre")
        .text('"' + d.titre + '"');

    d3.select("#realisation")
        .text(d.realisation);

    d3.select("#laureat")
        .text(d.laureat != "NA" ? d.laureat : "");

    d3.select("#explanation")
        .style("visibility", d.depth == 4 ? "" : "hidden");

    d3.select("#labellaureat")
        .style("visibility", d.laureat == "NA" ? "hidden" : "");


    console.log("Depth:" + d.depth);

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray);

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.1);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);

    tooltip.style("visibility", "");

    /*
     arc.startAngle(function(d) { return 1 * d.x; })
     .endAngle(function(d)   { return 1 * (d.x + d.dx); })
     .transition(1000).attrTween("d", arcTween);
     // Try 0.75 :)
     */
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .each("end", function() {
            d3.select(this).on("mouseover", mouseover);
        });

    d3.select("#explanation")
        .style("visibility", "hidden");

    tooltip.style("visibility", "hidden");
}

function mousemove(d) {

    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var percentageString = percentage + "%";
    if (percentage < 0.1) {
        percentageString = "< 0.1%";
    }

    // Tooltip update

    tooltip.select('.label').html(d.name);
    tooltip.select('.percent').html(percentageString);
    tooltip.style('display', 'block');

    var offset = 0;

    tooltip.style('top',  (d3.event.pageY - offset) + 'px')
           .style('left', (d3.event.pageX - offset) + 'px');

}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}

function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequence").append("svg:svg")
        .attr("width", width).attr("height", 50).attr("id", "trail")
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence.
function updateBreadcrumbs(nodeArray) {

    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
        .selectAll("g")
        .data(nodeArray, function(d) { return d.name + d.depth; });

    // Add breadcrumb and label for entering nodes.
    var entering = g.enter().append("svg:g");

    entering.append("svg:polygon")
        .attr("points", breadcrumbPoints)
        .style("fill", function(d) { return colors[d.name]; });

    entering.append("svg:text")
        .attr("x", (b.w + b.t) / 2)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; });

    // Set position for entering and updating nodes.
    g.attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    // Remove exiting nodes.
    g.exit().remove();

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail").style("visibility", "");
}


// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.
function buildHierarchy(csv) {
    var root = {"name": "root", "children": []};
    for (var i = 0; i < csv.length; i++) {
        var sequence = csv[i][0];
        var size = +csv[i][1];
        var titre = csv[i][2];
        var realisation = csv[i][3];
        var laureat =  csv[i][4];
        var prix =  csv[i][6];
        var annee =  csv[i][5];

        if (isNaN(size)) { // e.g. if this is a header row
            continue;
        }
        var parts = sequence.split("-");
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
            var children = currentNode["children"];
            var nodeName = parts[j];
            var childNode;
            if (j + 1 < parts.length) {
                // Not yet at the end of the sequence; move down the tree.
                var foundChild = false;
                for (var k = 0; k < children.length; k++) {
                    if (children[k]["name"] == nodeName) {
                        childNode = children[k];
                        foundChild = true;
                        break;
                    }
                }
                // If we don't already have a child node for this branch, create it.
                if (!foundChild) {
                    childNode = {"name": nodeName, "children": []};
                    children.push(childNode);
                }
                currentNode = childNode;
            } else {
                // Reached the end of the sequence; create a leaf node.
                childNode = {
                    "name": nodeName,
                    "size": size,
                    "laureat": laureat,
                    "titre": titre,
                    "realisation": realisation,
                    "prix": prix,
                    "annee": annee
                };
                children.push(childNode);
            }
        }
    }
    return root;
};