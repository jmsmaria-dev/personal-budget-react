import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import * as d3 from 'd3';

function HomePage() {
  const chartRef = useRef(null);
  const d3ChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const originalDataRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    getBudgetData();
  }, []);

  const getBudgetData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/budget');
      const budgetData = response.data.myBudget;
      
      if (budgetData && budgetData.length > 0) {
        originalDataRef.current = budgetData;
        createChart(budgetData);
        createD3Chart(budgetData);
      } else {
        console.error('No budget data received from server');
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

  const createChart = (data) => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(item => item.title),
        datasets: [{
          data: data.map(item => item.budget),
          backgroundColor: [
            '#ffcd56', '#ff6384', '#36a2eb', '#fd6b19',
            '#4bc0c0', '#9966ff', '#00bcd4', '#e91e63', '#ffc107'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  };

  const createD3Chart = (data) => {
    const container = d3.select(d3ChartRef.current);
    container.selectAll("*").remove();

    const width = 960;
    const height = 500;
    const radius = Math.min(width, height) / 2;

    const svg = container
      .append("svg")
      .attr("width", "960px")
      .attr("height", "500px")
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    svgRef.current = svg;

    svg.append("g").attr("class", "slices");
    svg.append("g").attr("class", "labels");
    svg.append("g").attr("class", "lines");

    const pie = d3.pie()
      .sort(null)
      .value(d => d.budget);

    const arc = d3.arc()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.4);

    const outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.title))
      .range([
        '#ffcd56', '#ff6384', '#36a2eb', '#fd6b19',
        '#4bc0c0', '#9966ff', '#00bcd4', '#e91e63', '#ffc107'
      ]);

    drawChart(data, svg, pie, arc, outerArc, color, radius);
  };

  const drawChart = (data, svg, pie, arc, outerArc, color, radius) => {
    const key = d => d.title;

    function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    /* ------- PIE SLICES ------- */
    const slice = svg.select(".slices").selectAll("path.slice")
      .data(pie(data), key);

    slice.enter()
      .insert("path")
      .style("fill", d => color(d.data.title))
      .attr("class", "slice")
      .attr("d", arc)
      .style("stroke", "#fff")
      .style("stroke-width", "2px");

    slice
      .transition().duration(1000)
      .attrTween("d", function(d) {
        this._current = this._current || d;
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    slice.exit().remove();

    /* ------- TEXT LABELS ------- */
    const text = svg.select(".labels").selectAll("text")
      .data(pie(data), key);

    text.enter()
      .append("text")
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .style("font-family", "Arial, sans-serif")
      .text(d => d.data.title)
      .attr("transform", function(d) {
        const pos = outerArc.centroid(d);
        pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .style("text-anchor", function(d) {
        return midAngle(d) < Math.PI ? "start" : "end";
      });

    text.transition().duration(1000)
      .attrTween("transform", function(d) {
        this._current = this._current || d;
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return `translate(${pos})`;
        };
      })
      .styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          const d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });

    text.exit().remove();

    /* ------- SLICE TO TEXT POLYLINES ------- */
    const polyline = svg.select(".lines").selectAll("polyline")
      .data(pie(data), key);

    polyline.enter()
      .append("polyline")
      .style("opacity", 0.3)
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("fill", "none")
      .attr("points", function(d) {
        const pos = outerArc.centroid(d);
        pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos];
      });

    polyline.transition().duration(1000)
      .attrTween("points", function(d) {
        this._current = this._current || d;
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });

    polyline.exit().remove();
  };

  const randomizeData = () => {
    if (originalDataRef.current && svgRef.current) {
      const randomData = originalDataRef.current.map(d => ({
        ...d,
        budget: Math.random() * d.budget
      }));

      // Randomize Chart.js with original colors
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      createChart(randomData);

      // Randomize D3.js with original colors
      const width = 960;
      const height = 500;
      const radius = Math.min(width, height) / 2;

      const pie = d3.pie()
        .sort(null)
        .value(d => d.budget);

      const arc = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(radius * 0.4);

      const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      // Use original colors, not random ones
      const color = d3.scaleOrdinal()
        .domain(randomData.map(d => d.title))
        .range([
          '#ffcd56', '#ff6384', '#36a2eb', '#fd6b19',
          '#4bc0c0', '#9966ff', '#00bcd4', '#e91e63', '#ffc107'
        ]);

      drawChart(randomData, svgRef.current, pie, arc, outerArc, color, radius);
    }
  };

  return (
    <main className="center" id="main">
      <div className="page-area">
        <article>
          <h1>Stay on track</h1>
          <p>
              Do you know where you are spending your money? If you really stop to track it down,
              you would get surprised! Proper budget management depends on real data... and this
              app will help you with that!
          </p>
        </article>
  
        <article>
          <h1>Alerts</h1>
          <p>
              What if your clothing budget ended? You will get an alert. The goal is to never go over the budget.
          </p>
        </article>
  
        <article>
          <h1>Results</h1>
          <p>
              People who stick to a financial plan, budgeting every expense, get out of debt faster!
              Also, they to live happier lives... since they expend without guilt or fear... 
              because they know it is all good and accounted for.
          </p>
        </article>
  
        <article>
          <h1>Free</h1>
          <p>
              This app is free!!! And you are the only one holding your data!
          </p>
        </article>
  
        <article>
          <h1>Stay on track</h1>
          <p>
              Do you know where you are spending your money? If you really stop to track it down,
              you would get surprised! Proper budget management depends on real data... and this
              app will help you with that!
          </p>
        </article>
  
        <article>
          <h1>Alerts</h1>
          <p>
              What if your clothing budget ended? You will get an alert. The goal is to never go over the budget.
          </p>
        </article>
  
        <article>
          <h1>Results</h1>
          <p>
              People who stick to a financial plan, budgeting every expense, get out of debt faster!
              Also, they to live happier lives... since they expend without guilt or fear... 
              because they know it is all good and accounted for.
          </p>
        </article>
  
        <div style={{display: "flex", gap: "2em", justifyContent: "center", alignItems: "flex-start", marginTop: "2em"}}>
          <div>
            <h1>Chart</h1>
            <canvas ref={chartRef} id="myChart" width="400" height="400" aria-label="Budget chart" role="img"></canvas>
          </div>
          <div>
            <h1>D3.js Budget Chart</h1>
            <div ref={d3ChartRef} id="d3Chart"></div>
            <button className="randomize" onClick={randomizeData}>Randomize</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default HomePage;

