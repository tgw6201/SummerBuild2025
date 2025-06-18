import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import '../css/Dashboard.css';  // Import the separate CSS file

const Dashboard = () => {
  const barRef = useRef(null);

  const suggestedMeals = [
    { name: 'Breakfast', img: 'https://images.squarespace-cdn.com/content/v1/58939a42d2b857c51ea91c0d/1566319942248-0GYBX3V9DUH8CU66ZE6V/bloody+mary+obsessed+one+pan+healthy+and+simple+breakfast+recipe+4.jpg' },
    { name: 'Lunch', img: 'https://www.wokandskillet.com/wp-content/uploads/2016/08/black-pepper-chicken-chop.jpg' },
    { name: 'Dinner', img: 'https://images.immediate.co.uk/production/volatile/sites/30/2021/12/Dhal-poached-eggs-e700674.jpg' },
    { name: 'Snacks', img: 'https://tastesbetterfromscratch.com/wp-content/uploads/2017/06/Fresh-Fruit-Bowl-1.jpg' },
  ];

useEffect(() => {
    if (!barRef.current) return;

    const barChart = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Calories Consumed',
          data: [1600, 1800, 2000, 1700, 1900, 2100, 1500],
          backgroundColor: '#36A2EB',
        }],
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 2500},
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
      {/* Header */}
      <div className="dashboard-header">
        <h1>Calorie Goal: 2000 kcal · 85% met today</h1>
      </div>

      <div className="dashboard-main">
        {/* Left Side: Suggested Meals Gallery */}
        <div className="left-column">
          <div className="suggested-section">
            <h2>What shall we eat today?</h2>
            <div className="meal-gallery">
              {suggestedMeals.map(meal => (
                <div
                  key={meal.name}
                  className="meal-card"
                  onClick={() => alert(`Clicked on ${meal.name}`)}
                >
                  <img src={meal.img} alt={meal.name} className="meal-image" />
                  <div className="meal-name">{meal.name}</div>
                </div>
              ))}
            </div>
          </div>
                    {/* Favourite Dishes */}
          <div className="favourite-dishes">
            <h2>Top 3 favourite dishes</h2>
            <div className="favourite-dishes-list">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="favourite-dish-card"
                  onClick={() => alert(`Clicked Dish ${i}`)}
                >
                  <img
                    src={`https://via.placeholder.com/150?text=Dish+${i}`}
                    alt={`Dish ${i}`}
                    className="favourite-dish-image"
                  />
                  <p className="favourite-dish-name">Dish {i}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Bar Chart and Favourite Dishes */}
        <div className="right-column">
          {/* Bar Chart */}
          <div className="chart-container">
            <h2>Calorie vs Goal (This Week)</h2>
            <canvas ref={barRef}></canvas>
          </div>
        </div>
      </div>

      {/* Chatbot Button */}
      <div className="chatbot-button-container">
        <button className="chatbot-button">Generate Based on Diet</button>
      </div>
    </div>
  );
};

export default Dashboard;
