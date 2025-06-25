
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import '../css/RecipeInput.css';

const initialIngredient = { text: "" };

function calculateCalories(ingredients) {
  return ingredients.reduce((sum, ing) => sum + Number(ing.calories || 0), 0);
}

function getVerdict(totalCalories) {
  if (totalCalories < 300) return "Balanced";
  if (totalCalories < 600) return "Slightly High";
  if (totalCalories < 900) return "High Calories";
  return "Very High Calories";
}

export default function RecipeInput({ onSave, onBack }) {
  const { mid } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([{ ...initialIngredient }]);
  const [instructions, setInstructions] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [manualCalories, setManualCalories] = useState("");
  const [autoCalculateCalories, setAutoCalculateCalories] = useState(true);


  //Load existing recipe if editing
  useEffect(() => {
    if (mid) {
      fetch(`http://localhost:3000/user-recipes/${mid}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch recipe");
          return res.json();
        })
        .then(data => {
          setName(data.mname || "");
          setInstructions(data.recipe_instruction || "");

          console.log("Raw ingredients:", data.recipe_ingredients);
          const parsedIngredients = data.recipe_ingredients
            ?.split(',')
            .map(item => ({ text: item.trim() })) || [];

          setIngredients(parsedIngredients.length ? parsedIngredients : [{ ...initialIngredient }]);
        })
        .catch(err => {
          alert("Error loading recipe: " + err.message);
        });
    }
  }, [mid]);


  const totalCalories = autoCalculateCalories
  ? calculateCalories(ingredients)
  : Number(manualCalories || 0);

  const verdict = getVerdict(totalCalories);
  

  const handleIngredientChange = (idx, field, value) => {
    setIngredients(ings =>
      ings.map((ing, i) =>
        i === idx ? { ...ing, [field]: value } : ing
      )
    );
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ...initialIngredient }]);
  };

  const removeIngredient = idx => {
    setIngredients(ings => ings.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim() || ingredients.length === 0 || !instructions.trim()) {
      alert("Please fill in all the fields.");
      return;
    }

    const formattedIngredients = ingredients
      .map(ing => ing.text.trim())
      .filter(str => str.length > 0)
      .join(', ');

    if (autoCalculateCalories) {
      console.log("formattedIngredients:", formattedIngredients);
      try {
        const response = await fetch('http://localhost:8000/calculate-calories', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mname: name.trim(),
            recipe_ingredients: formattedIngredients,
            recipe_instruction: instructions.trim(),
            calories: totalCalories
          }),
          credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch calories");

        const data = await response.json();
        setManualCalories(data.calories);
      } catch (error) {
        console.error("Error fetching calories:", error);
      }
    }


    const recipeToSend = {
      mname: name.trim(),
      recipe_ingredients: formattedIngredients,
      recipe_instruction: instructions.trim(),
      calories: totalCalories,
    };

    console.log("Sending recipe:", recipeToSend);

    try {
      const url = mid
        ? `http://localhost:3000/user-recipes/${mid}`
        : 'http://localhost:3000/user-recipes';

      const method = mid ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeToSend),
      });

      if (response.ok) {
        alert('Recipe saved successfully!');
        if (onSave) onSave(recipeToSend);
        navigate('/Chatbot'); // Redirect to chatbot after saving
      } else {
        const err = await response.json();
        alert(`Failed to save: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Network error. Please try again.");
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div className="recipe-input-container">
      <div className="card shadow recipe-input-card">
        <div className="card-body">
          {/* Header */}
          <div className="d-flex flex-column align-items-center mb-4">
            <h2 className="mb-0 mt-2 text-warning">{mid ? "Edit Recipe" : "Create New Recipe"}</h2>
            <div className="text-muted" style={{ fontSize: '1.1em' }}>
              Fill in your recipe details below
            </div>
          </div>
          <hr />

          {/* Recipe Name */}
          <div className="mb-3">
            <label className="form-label fw-bold">Recipe Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Ingredients */}
          <h5 className="mb-3 text-warning">Ingredients</h5>
          <div className="mb-2 text-muted" style={{ fontSize: "0.9rem" }}>
            Please enter each ingredient's name, amount, and measurement.
            <p>(e.g. "Chicken Breast, 200, grams" or "Rice, 1, cup")</p>
          </div>
          {ingredients.map((ing, idx) => (
            <div className="ingredient-row" key={idx}>
              <input
                className="form-control"
                placeholder='e.g. Chicken Breast 200 grams'
                value={ing.text || ""}
                onChange={e => handleIngredientChange(idx,"text" ,e.target.value)}
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeIngredient(idx)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary add-ingredient-btn"
            onClick={addIngredient}
          >
            + Add Ingredient
          </button>
          <hr />

          {/* Calories */}
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoCalcCalories"
              checked={autoCalculateCalories}
              onChange={() => setAutoCalculateCalories(prev => !prev)}
            />
            <label className="form-check-label" htmlFor="autoCalcCalories">
              Automatically calculate calories
            </label>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Total Calories</label>
            <input
              type="number"
              className="form-control"
              value={totalCalories}
              disabled={autoCalculateCalories}
              onChange={(e) => setManualCalories(e.target.value)}
              placeholder="Enter total calories"
            />
          </div>
          <hr />

          {/* Instructions */}
          <h5 className="mb-3 text-warning">Instructions</h5>
          <textarea
            className="form-control instructions-area"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={4}
          />
          <hr />

          {/* Modal */}
          {showModal && (
            <div className="modal show" tabIndex="-1" style={{ display: "block", background: "rgba(0,0,0,0.3)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Estimated Calories & Verdict</h5>
                    <button type="button" className="btn-close" onClick={closeModal}></button>
                  </div>
                  <div className="modal-body">
                    <p><strong>Estimated Calories:</strong> {totalCalories} kcal</p>
                    <p><strong>Verdict:</strong> {verdict}</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-3 mt-4">
           <button
              type="button"
              className="btn btn-info rounded-pill"
              onClick={openModal}
              disabled={autoCalculateCalories}
            >
              Show Calories & Verdict
            </button>
            <button type="button" className="btn btn-warning rounded-pill" onClick={handleSave}>
              Save recipe and Eat
            </button>
            <button type="button" className="btn btn-secondary rounded-pill" onClick={onBack || (() => navigate('/chatbot'))}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
