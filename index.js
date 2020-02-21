"use-strict";

let data = "";
let svgContainer = ""; // keep SVG reference in global scope
let totalData = "";
let toolChart = "";

const msm = {
    width: 900,
    height: 500,
    marginAll: 50,
    marginLeft: 80
}
const small_msm = {
    width: 400,
    height: 400,
    marginAll: 40,
    marginLeft: 120
}

window.onload = function () {
    svgContainer = d3.select("#chart")
    .append('svg')
    .attr('width', msm.width)
    .attr('height', msm.height);

    d3.csv("gapminder.csv")
    .then((data) => makeScatterPlot(data))
}

function makeScatterPlot(csvData) {
    totalData = csvData;
    totalData = totalData.filter((data) => {return data.fertility != "NA" && data.life_expectancy != "NA"})
    data = csvData.filter((data) => {return data.fertility != "NA" && data.life_expectancy != "NA"})
    data = data.filter(function(d) {return d["year"] == "1980";});

    // get arrays of fertility rate data and life Expectancy data
    let fertility_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, msm);


    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  
}
  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .style('font-size', '18pt')
      .text("Fertility vs Life Expectancy (1980)");

    svgContainer.append('text')
      .attr('x', 425)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility');

    svgContainer.append('text')
      .attr('transform', 'translate(30, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy');

    toolChart.append('text')
    .attr('x', 200)
    .attr('y', 25)
    .style('font-size', '10pt')
    .text("Year");

    toolChart.append('text')
    .attr('transform', 'translate(25, 220)rotate(-90)')
    .style('font-size', '10pt')
    .text("Population");
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 50]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    let xScale = map.xScale;

    // make tooltip
    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // let toolTipChart = div.append("div").attr("id", "tipChart")
    toolChart = div.append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height)

    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('stroke', "steelblue")
        .attr('stroke-width', "2")
        .attr('fill', "white")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          toolChart.selectAll("*").remove()
          div.transition()
            .duration(200)
            .style("opacity", .9);
            plotPopulation(d.country, toolChart)
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
      
      let popData = data.filter(function(d) {return +d['population'] > 100000000});

      svgContainer.selectAll('.text')
        .attr('class', 'label')
        .data(popData)
        .enter()
        .append('text')
        .attr('x', function(d) { return xScale(+d["fertility"]) + 20})
        .attr('y', yMap)
        .style('font-size', '7pt')
        .text(function(d) {return d["country"];});
  }

  function plotPopulation(country, toolChart) {
    let countryData = totalData.filter((row) => {return row.country == country})
    let population = countryData.map((row) => parseInt(row["population"]));
    let year = countryData.map((row) => parseInt(row["year"]));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", toolChart, small_msm);
    toolChart.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                    .x(function(d) { return mapFunctions.xScale(d.year) })
                    .y(function(d) { return mapFunctions.yScale(d.population) }))
    makeLabels();
}

  // draw the axes and ticks
  function drawAxes(limits, x, y, svgContainer, msm) {

    // function to scale x value
    let xScale = d3.scaleLinear()
    .domain([limits.xMin - 0.4, limits.xMax + 0.5]) // give domain buffer room
    .range([0 + msm.marginLeft, msm.width - msm.marginAll])

    let xValue = function (d) {
      return +d[x];
    }

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) {
      return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);

    if (x == "fertility") {
      svgContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis
          .ticks(16));
    } else {
      svgContainer.append("g")
      .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
      .call(xAxis
        .ticks(7));
    }
    // function to scale y
    let yScale = d3.scaleLinear()
    .domain([limits.yMax + 5, limits.yMin - 2]) // give domain buffer
    .range([0 + msm.marginAll, msm.height - msm.marginAll])

    // return y value from a row of data
    let yValue = function (d) {
      return +d[y]
    }

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) {
      return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(' + msm.marginLeft + ', 0)')
      .call(yAxis);

          // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };

  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }
