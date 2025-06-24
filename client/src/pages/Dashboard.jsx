import React, { useRef, useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "../css/Dashboard.css";

const Dashboard = () => {
  const barRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [totalCalories, setTotalCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [favoriteDishes, setFavoriteDishes] = useState([]);
  const [consumedMeals, setConsumedMeals] = useState([]);

  const createChart = (weeklyCalories, calorieGoal) => {
    const weekDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const shortLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const caloriesConsumed = weekDays.map((day) => weeklyCalories[day] || 0);

    const withinGoal = caloriesConsumed.map((cal) =>
      Math.min(cal, calorieGoal)
    );
    const aboveGoal = caloriesConsumed.map((cal) =>
      cal > calorieGoal ? cal - calorieGoal : 0
    );
    const remainingCalories = caloriesConsumed.map((cal) =>
      cal < calorieGoal ? calorieGoal - cal : 0
    );

    // Destroy old chart if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (barRef.current) {
      chartInstanceRef.current = new Chart(barRef.current, {
        type: "bar",
        data: {
          labels: shortLabels,
          datasets: [
            {
              label: "Within Goal",
              data: withinGoal,
              backgroundColor: "#f58636",
            },
            {
              label: "Above Goal",
              data: aboveGoal,
              backgroundColor: "#ff4d4d",
            },
            {
              label: "Remaining",
              data: remainingCalories,
              backgroundColor: "#ffd15b",
            },
          ],
        },
        options: {
          maintainAspectRatio: true,
          aspectRatio: 2,
          responsive: true,
          plugins: {
            legend: { display: true },
          },
          scales: {
            x: { stacked: true },
            y: {
              beginAtZero: true,
              stacked: true,
              suggestedMax: calorieGoal + 1000,
              title: {
                display: true,
                text: "Calories (kcal)",
              },
            },
          },
        },
      });
    }
  };

  // Fetch and update all dashboard data and chart
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:3000/dashboard", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data = await response.json();

      if (data.calorie_goal?.daily_calorie_goal) {
        setCalorieGoal(data.calorie_goal.daily_calorie_goal);
      }

      if (Array.isArray(data.favorite_meals)) {
        setFavoriteDishes(data.favorite_meals);
      }

      if (Array.isArray(data.consumed_meals)) {
        setConsumedMeals(data.consumed_meals);
        const total = data.consumed_meals.reduce(
          (sum, meal) => sum + (meal.calories || 0),
          0
        );
        setTotalCalories(total);
      }

      createChart(
        data.past_week_calories || {},
        data.calorie_goal?.daily_calorie_goal || calorieGoal
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Cleanup chart on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Handle Removing of favorite dish
  const handleRemoveFavorite = async (mealToRemove) => {
    console.log("Removing favorite dish:", mealToRemove);
    try {
      const response = await fetch(
        `http://localhost:3000/saved-meals/${mealToRemove.mid}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to remove favorite dish");

      // Update local state
      setFavoriteDishes((dishes) =>
        dishes.filter((dish) => dish.mid !== mealToRemove.mid)
      );
    } catch (error) {
      console.error("Error removing favorite dish:", error);
    }
  };

  // Handle adding calories from favorite dishes (assuming 500 kcal default)
  const handleTrack = async (mealToConsume) => {
    try {
      const response = await fetch("http://localhost:3000/consumed-meals", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mid: mealToConsume.mid }),
      });

      if (!response.ok) throw new Error("Failed to track consumed meal");

      await fetchDashboardData(); // Refresh everything after adding
    } catch (error) {
      console.error("Error tracking consumed meal:", error);
    }
  };

  // Delete consumed meal then refresh dashboard data
  const handleRemoveConsume = async (mealToRemove) => {
    try {
      const response = await fetch(
        `http://localhost:3000/consumed-meals/${mealToRemove.cmid}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete consumed meal");

      await fetchDashboardData(); // Refresh everything after deletion
    } catch (error) {
      console.error("Error deleting consumed meal:", error);
    }
  };

  // Handle Editing favorite dish
  const handleEditFavorite = async (mealToEdit) => {
    console.log("Editing favorite dish:", mealToEdit);
    try {
      const response = await fetch(
        `http://localhost:3000/user-recipes/${mealToEdit.mid}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch recipe for editing");

      const recipeData = await response.json();
      // Redirect to RecipeInput with the recipe data
      window.location.href = `/recipe-input/${mealToEdit.mid}`;
    } catch (error) {
      console.error("Error fetching recipe for editing:", error);
    }
  };

  return (
    <>
      {loading ? (
        <div className="profile-loading-overlay">
          <div className="loader"></div>
          <div className="loader-text">
            {"Loading...".split("").map((char, i) => (
              <span
                className="loader-letter"
                key={i}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Healthier food, healthier you!</h1>
            <h3>Only the best recipes made for a better future!</h3>
          </div>

          <div className="calorie-counter">
            <h4>
              Calories Consumed:{" "}
              <span>
                {totalCalories}/{calorieGoal}
              </span>{" "}
              kcal
            </h4>
          </div>

          {/* Favorite Dishes */}
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
                      <button
                        className="btn"
                        onClick={() => handleRemoveFavorite(item)}
                      >
                        Remove
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEditFavorite(item)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="btn-group right-group">
                      <button className="btn" onClick={() => handleTrack(item)}>
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
                    <div className="card" key={`${item.cmid}-${index}`}>
                      <div className="card-body">
                        <h5 className="card-title">{item.mname}</h5>
                        <p className="card-calories">{item.calories} kcal</p>
                      </div>
                      <div className="card-footer">
                        <div
                          className="btn-group"
                          style={{ marginLeft: "auto" }}
                        >
                          <button
                            className="btn btn-outline"
                            onClick={() => handleRemoveConsume(item)}
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
      )}
    </>
  );
};

export default Dashboard;
