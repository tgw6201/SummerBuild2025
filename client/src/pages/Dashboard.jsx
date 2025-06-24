import React, { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "../css/Dashboard.css";

const Dashboard = () => {
  const barRef = useRef(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const calorieGoal = 2000;

  const topDishes = [
    {
      name: "Corn baked chicken chop",
      img: "https://www.wokandskillet.com/wp-content/uploads/2016/08/black-pepper-chicken-chop.jpg",
      title: "Corn Baked Chicken Chop",
      description:
        "Juicy grilled chicken served with sweet corn and black pepper sauce.",
      calories: 350,
    },
    {
      name: "Eggs and tomatoes",
      img: "https://images.squarespace-cdn.com/content/v1/58939a42d2b857c51ea91c0d/1566319942248-0GYBX3V9DUH8CU66ZE6V/bloody+mary+obsessed+one+pan+healthy+and+simple+breakfast+recipe+4.jpg",
      title: "Eggs & Tomatoes",
      description: "A healthy and simple breakfast dish cooked in one pan.",
      calories: 480,
    },
    {
      name: "Fruit bowl",
      img: "https://tastesbetterfromscratch.com/wp-content/uploads/2017/06/Fresh-Fruit-Bowl-1.jpg",
      title: "Fresh Fruit Bowl",
      description: "A refreshing bowl of assorted fruits to boost your day.",
      calories: 220,
    },
  ];

  const suggestedMeals = [
    {
      name: "Eggs and tomatoes",
      img: "https://images.squarespace-cdn.com/content/v1/58939a42d2b857c51ea91c0d/1566319942248-0GYBX3V9DUH8CU66ZE6V/bloody+mary+obsessed+one+pan+healthy+and+simple+breakfast+recipe+4.jpg",
      title: "Eggs & Tomatoes",
      description: "A healthy and simple breakfast dish cooked in one pan.",
      calories: 350,
    },
    {
      name: "Corn baked chicken chop",
      img: "https://www.wokandskillet.com/wp-content/uploads/2016/08/black-pepper-chicken-chop.jpg",
      title: "Corn Baked Chicken Chop",
      description:
        "Juicy grilled chicken served with sweet corn and black pepper sauce.",
      calories: 550,
    },
    {
      name: "Curry explosion",
      img: "https://images.immediate.co.uk/production/volatile/sites/30/2021/12/Dhal-poached-eggs-e700674.jpg",
      title: "Curry Explosion",
      description: "Spiced dhal with poached eggs — full of flavor and energy.",
      calories: 480,
    },
    {
      name: "Fruit bowl",
      img: "https://tastesbetterfromscratch.com/wp-content/uploads/2017/06/Fresh-Fruit-Bowl-1.jpg",
      title: "Fresh Fruit Bowl",
      description: "A refreshing bowl of assorted fruits to boost your day.",
      calories: 220,
    },
  ];

  useEffect(() => {
    if (!barRef.current) return;

    const chart = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Calories Consumed",
            data: [1600, 1800, 2000, 1700, 1900, 2100, 1500],
            backgroundColor: "#f58636",
          },
          {
            label: "Remaining Calorie Goal",
            data: [400, 200, 0, 300, 100, 0, 500].map((v) => Math.max(0, v)),
            backgroundColor: "#ffd15b",
          },
        ],
      },
      options: {
        maintainAspectRatio: true,
        aspectRatio: 2,
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            beginAtZero: true,
            stacked: true,
            max: 2500,
          },
        },
      },
    });

    return () => chart.destroy();
  }, []);

  const handleAdd = (cal) => setTotalCalories((c) => c + cal);
  const handleRemove = (cal) => setTotalCalories((c) => Math.max(0, c - cal));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Healthier food, healthier you!</h1>
        <h3>Only the best recipes made for a better future!</h3>
      </div>
      <div className="calorie-counter">
        <h4>
          Calories Consumed: <span>{totalCalories}/{calorieGoal}</span> kcal
        </h4>
      </div>

      {/* Top Dishes */}
      <div className=" section favourite-dishes">
        <h2>Top 3 Favourite Dishes</h2>
        <div className="horizontal-cards">
          {topDishes.map((item) => (
            <div className="card" key={item.name}>
              <img src={item.img} className="card-img-top" alt={item.name} />
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text">{item.description}</p>
              </div>
              <div className="card-footer">
                <div className="btn-group">
                  <button className="btn">View</button>
                  <button className="btn btn-outline">Edit</button>
                </div>
                <div className="btn-group right-group">
                  <button
                    className="btn"
                    onClick={() => handleAdd(item.calories)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Second Row */}
      <div className="second-row">
        <div className="left-column">
          {/* Consumed Today */}
          <div className="section">
            <h2>Food Consumed Today</h2>
            <div className="horizontal-cards">
              {suggestedMeals.map((item) => (
                <div className="card" key={item.name}>
                  <img
                    src={item.img}
                    className="card-img-top"
                    alt={item.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text">{item.description}</p>
                    <p className="card-calories">{item.calories} kcal</p>
                  </div>
                  <div className="card-footer">
                    <div className="btn-group" style={{ marginLeft: "auto" }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleRemove(item.calories)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookmarked */}
          <div className="section">
            <h2>Bookmarked Recipes</h2>
            <div className="horizontal-cards">
              {suggestedMeals.map((item) => (
                <div className="card" key={item.name}>
                  <img
                    src={item.img}
                    className="card-img-top"
                    alt={item.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text">{item.description}</p>
                  </div>
                  <div className="card-footer">
                    <div className="btn-group">
                      <button className="btn">View</button>
                      <button className="btn btn-outline">Edit</button>
                    </div>
                    <div className="btn-group right-group">
                      <button
                        className="btn"
                        onClick={() => handleAdd(item.calories)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="right-column">
          <div className="chart-container">
            <h2>Calorie vs Goal (This Week)</h2>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
