import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import "../css/Dashboard.css";

const Dashboard = () => {
  const barRef = useRef(null);

  const suggestedMeals = [
    {
      name: "Breakfast",
      img: "https://images.squarespace-cdn.com/content/v1/58939a42d2b857c51ea91c0d/1566319942248-0GYBX3V9DUH8CU66ZE6V/bloody+mary+obsessed+one+pan+healthy+and+simple+breakfast+recipe+4.jpg",
    },
    {
      name: "Lunch",
      img: "https://www.wokandskillet.com/wp-content/uploads/2016/08/black-pepper-chicken-chop.jpg",
    },
    {
      name: "Dinner",
      img: "https://images.immediate.co.uk/production/volatile/sites/30/2021/12/Dhal-poached-eggs-e700674.jpg",
    },
    {
      name: "Snacks",
      img: "https://tastesbetterfromscratch.com/wp-content/uploads/2017/06/Fresh-Fruit-Bowl-1.jpg",
    },
  ];

  useEffect(() => {
    if (!barRef.current) return;

    const barChart = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Calories Consumed",
            data: [1600, 1800, 2000, 1700, 1900, 2100, 1500],
            backgroundColor: "#36A2EB",
          },
        ],
      },
      options: {
        maintainAspectRatio: true,
        aspectRatio: 2,
        scales: {
          y: { beginAtZero: true, max: 2500 },
        },
        plugins: { legend: { display: false } },
      },
    });

    return () => {
      barChart.destroy();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Healthy food, healthy lifestyle!</h1>
        <h3>Only the best recipes for made for you! </h3>
      </div>

      <div className="dashboard-main">
        <div className="left-column">
          <div className="favourite-dishes">
            <h2>Top 3 favourite dishes</h2>
            <div className="row">
              {[1, 2, 3].map((i) => (
                <div className="col-md-4" key={i}>
                  <div
                    className="card"
                    onClick={() => alert(`Clicked Dish ${i}`)}
                  >
                    <img
                      src="https://www.wokandskillet.com/wp-content/uploads/2016/08/black-pepper-chicken-chop.jpg"
                      className="card-img-top"
                      alt={`Dish ${i}`}
                    />
                    <div className="card-body">
                      <p className="card-text">Dish {i}</p>
                      <div className="card-footer">
                        <div className="btn-group">
                          <button type="button" className="btn btn-outline-secondary">
                            View
                          </button>
                          <button type="button" className="btn btn-outline-secondary">
                            Edit
                          </button>
                        </div>
                        <small className="text-muted">Now</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="suggested-section">
            <h2>What shall we eat today?</h2>
            <div className="row">
              {suggestedMeals.map((meal) => (
                <div className="col-md-4" key={meal.name}>
                  <div
                    className="card"
                    onClick={() => alert(`Clicked on ${meal.name}`)}
                  >
                    <img
                      src={meal.img}
                      className="card-img-top"
                      alt={meal.name}
                    />
                    <div className="card-body">
                      <p className="card-text">{meal.name}</p>
                      <div className="card-footer">
                        <div className="btn-group">
                          <button type="button" className="btn btn-outline-secondary">
                            View
                          </button>
                          <button type="button" className="btn btn-outline-secondary">
                            Edit
                          </button>
                        </div>
                        <small className="text-muted">Suggested</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="chart-container">
            <h2>Calorie vs Goal (This Week)</h2>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      </div>

      <div className="chatbot-button-container">
        <button className="chatbot-button">Generate Based on Diet</button>
      </div>
    </div>
  );
};

export default Dashboard;
