import React, { useEffect } from 'react';
import Chart from 'chart.js/auto';
import '../css/Dashboard.css';

export default function Dashboard() {
  useEffect(() => {
    const ctx = document.getElementById('calorieChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Calories Consumed',
          data: [1800, 1900, 2000, 2100, 1900, 1700, 2000],
          backgroundColor: '#4e73df'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }, []);

  const createRecipe = () => {
    alert("Create your own recipe clicked!");
  };

  const generateAIRecipe = () => {
    alert("Generate recipe from AI clicked!");
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Homepage – Dashboard</h1>
      </header>

      <section className="stats">
        <div className="card">Calorie Goal: 2000 kcal</div>
        <div className="card">% Met Today: 68%</div>
      </section>

      <section className="meals">
        <h2>Suggested Meal for Today</h2>
        <div className="meal-cards">
          <div className="card">Breakfast</div>
          <div className="card">Lunch</div>
          <div className="card">Dinner</div>
          <div className="card">Snacks</div>
        </div>
      </section>

      <section className="progress">
        <h2>Weekly Progress Chart</h2>
        <canvas id="calorieChart" width="600" height="300"></canvas>
      </section>

      <section className="tools">
        <button onClick={createRecipe}>Create Your Own Recipe</button>
        <button onClick={generateAIRecipe}>Generate Recipe from AI</button>
        <button className="chatbot-btn">Generate Based on Diet</button>
      </section>
    </div>
  );

}