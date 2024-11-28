// Get the button element
const button = document.getElementById("myButton");

// Add an event listener to the button
button.addEventListener("click", () => {
  console.log("Button clicked!");
  // Update the chart data here
});

// Create a chart using Chart.js
const chartCanvas = document.getElementById("chartContainer");
const chart = new Chart(chartCanvas, {
  type: "bar",
  data: {
    labels: ["January", "February", "March", "April", "May"],
    datasets: [{
        label: "Sales",
        data: [10, 20, 30, 40, 50],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
    }]
  },
  options: {
    title: {
      display: true,
      text: "Sales Chart",
    },
  }
});