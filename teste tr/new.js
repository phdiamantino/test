const MARGIN3 = {LEFT:30, RIGHT:40, TOP:20, BOTTOM:30}
const WIDTH3 = 700 - MARGIN3.LEFT - MARGIN3.RIGHT
const HEIGHT3 = 300 - MARGIN3.TOP - MARGIN3.BOTTOM

// Add SVG
var svgTR = d3.select("#themeRiver").append("svg")
    .attr("width", WIDTH3 + MARGIN3.LEFT + MARGIN3.RIGHT)
    .attr("height", HEIGHT3 + MARGIN3.TOP + MARGIN3.BOTTOM)
    .append("g")
    .attr("transform", "translate(" + MARGIN3.LEFT + "," + MARGIN3.TOP + ")");

    var tooltip = d3.select("body")
        .append("div").attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "20")
        .style("visibility", "hidden")
        .style("top", "20px")
        .style("font-size", )
        .style("opacity", 0)
        .style("left", "55px")
        .style("font-family", "Verdana" );

var format = d3.timeParse("%Y-%m-%d")   
var datearray = [];



  var graph = d3.csv("excomment_sentiments.csv").then(function(data) {
        data.forEach(function(d) {
            d.date = format(d.date);
            d.score = +d.score;
        });

    var nest = d3.nest()
        .key(d=> d.sentiment)
        //.key(d=> d.date)
        .entries(data) 
    const keys  =[]
        for (i in nest){ keys.push(nest[i].key)}
    console.log(keys)
    console.log(nest)

    // Paleta de cores
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeDark2)  //Insere d=>color(d)

    // Stack 
    var stack = d3.stack()
        .keys(keys)
        .value(d=>d.values.score !== undefined? d.values.score: 0)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);
    var stackedData = stack(nest)
    console.log(stackedData)

    var dashboardData = d3.stack().keys(keys).value(d=> d.score)(data)//.offset(d3.stackOffsetSilhouette)
    console.log(dashboardData)

    /*const stackedValues = [];
        // Copy the stack offsets back into the data.
        dashboardData.forEach((layer, index) => {
        const currentStack = [];
        layer.forEach((d, i) => {
            if (typeof data[layer] === 'undefined') data[layer] = [];
            data[layer].push([ d[0], d[1], data[i].date]);
        });
        stackedValues.push(data[layer]);
    });
    console.log(stackedValues)*/

    // Add X & Y axis      
    // X axis  
    var x = d3.scaleTime()
            .domain(d3.extent(data, d=> d.date))
            .range([0, WIDTH3]);
        svgTR.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + HEIGHT3 + ")")
            .call(d3.axisBottom(x));
    // Y axis 
    var y = d3.scaleLinear()
            .domain([d3.min(dashboardData, l => d3.min(l, d => d[0])),
                     d3.max(dashboardData, l => d3.max(l, d => d[1]))]).nice()
            .range([ HEIGHT3, 0 ]);
        svgTR.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));
        svgTR.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + WIDTH3 + ", 0)")
            .call(d3.axisRight(y));


    curve = d3.curveMonotoneX
    //curve = d3.curveCardinal
    var area = d3.area()
        //.defined(d => !isNaN(d.score))
        .curve(curve)
        //.x((d,i)=> d.data.date == undefined? x(d.data.date): i)
        //.x((d,i)=>  x(d[i].data.date))
        .x((d,i)=>  x(d.data.date))
        .y0(d=> y(d[0]))
        .y1(d=> y(d[1]));
    console.log(dashboardData)
    //console.log(area(dashboardData))

    // Elementos de interação
    svgTR.selectAll(".layer")
        .attr("opacity", 1)
        .on("mouseover", function(d, i) {
            svgTR.selectAll(".layer")
            .transition()
            .duration(250)
            .attr("opacity", function(d, j) {return j != i ? 0.6 : 1;})
        })
        // Mouseover
        var mouseover = function(d) {
            tooltip.style("opacity", 1)
            d3.selectAll(".myArea").style("opacity", .2)
            d3.select(this)
            .style("stroke", "#121212")
            .style("opacity", 1)
        }
        //Exibe informações ao passar o mouse
        var mousemove = function(d,i) {
            tooltip.text(keys[i])
            mousex = d3.mouse(this);
            mousex = mousex[0];
            var invertedx = x.invert(mousex);
            invertedx =  invertedx.getDate();
            var selected = (d);
            console.log(d)
            console.log(new Date(selected[638].data.date));
            for (var k = 0; k < selected.length; k++) {
                datearray[k] = new Date(selected[k].data.date)
                mid = datearray[k]
                datearray[k] =  mid.getDate();
            }
            console.log(datearray);
            mousedate = datearray.indexOf(invertedx);
            console.log(mousedate)
            console.log(d[mousedate]);
            pro = d[mousedate].data.comment;
            console.log(pro)
            d3.select(this)
                .classed("hover", true)
                .attr("stroke-width", "0.5px"), 
                    tooltip.html("<p>" + d.key + "<br>" + pro +  "<br>" + d[mousedate].data.reference + "</p>").style("visibility", "visible")
        }
        //Retornar o gráfico de volta ao normal
        var mouseleave = function(d) {
            tooltip.style("opacity", 0)
            d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
            .transition()
            .duration(250)
            .attr("opacity", "1");
            d3.select(this)
                .classed("hover", false)
                .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key  + "</p>" ).style("visibility", "hidden")
        }


        // Exbibe as áreas
        svgTR.selectAll(".layer")
            .data(dashboardData).enter()
            .append("path").attr("class", "myArea")
            .style("stroke-width",0.3)
            .attr("d", area)
                .style("fill", ( d => color(d.key)))
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)

    // Criar linha vertical - mouse
    var vertical = d3.select("#themeRiver")
        .append("div").attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1.25px")
        .style("height", "320px")
        .style("top", "10px")
        .style("bottom", "30px")
        .style("left", "0px")
        .style("background", "#fff");
    d3.select("#themeRiver")
        .on("mousemove", function(){  
            mousex = d3.mouse(this);
            mousex = mousex[0] + 5;
            vertical.style("left", mousex + "px" )})
        .on("mouseover", function(){  
            mousex = d3.mouse(this);
            mousex = mousex[0] + 5;
            vertical.style("left", mousex + "px")});


})