import React, { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "../css/Dashboard.css";

const Dashboard = () => {
  const barRef = useRef(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [favoriteDishes, setFavoriteDishes] = useState([]);
  const [consumedMeals, setConsumedMeals] = useState([]);

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
    const fetchDashboardData = async () => {
      try{
        const response = await fetch('http://localhost:3000/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        console.log("Dashboard data:", data);

        // gets daily calorie goal from the response
        if (data.calorie_goal?.daily_calorie_goal) {
        setCalorieGoal(data.calorie_goal.daily_calorie_goal);
        }

        // gets favorite dishes from the response
        if (data.favorite_meals && Array.isArray(data.favorite_meals)) {
          setFavoriteDishes(data.favorite_meals);
        } else {
          console.warn("No favorite meals found in the response");
        }

        // gets consumed meals from the response
        if (data.consumed_meals && Array.isArray(data.consumed_meals)) {
          setConsumedMeals(data.consumed_meals);
        } else {
          console.warn("No consumed meals found in the response");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }

    fetchDashboardData();
    if (!barRef.current) return;

    const chart = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Calories Consumed",
            data: [0, 0, 0, 0, 0, 2100, 1500],
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
      <div className="section favourite-dishes">
        <h2>Favourite Dishes</h2>
        <div className="horizontal-cards">
          {favoriteDishes.map((item) => (
            <div className="card" key={item.mid}>
              <div className="card-body">
                <h5 className="card-title">{item.mname}</h5>
              </div>
              <div className="card-footer">
                <div className="btn-group">
                  <button className="btn">Remove</button>
                  <button className="btn btn-outline">Edit</button>
                </div>
                <div className="btn-group right-group">
                  <button
                    className="btn"
                    onClick={() => handleAdd(500)} // assume a default of 500 kcal per favorite meal
                  >
                    Track
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
              {consumedMeals.map((item, index) => (
                <div className="card" key={item.mid + "-" + index}>
                  <div className="card-body">
                    <h5 className="card-title">{item.mname}</h5>
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
