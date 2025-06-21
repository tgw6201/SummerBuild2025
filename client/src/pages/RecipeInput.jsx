import React, { useState } from "react";
import '../css/RecipeInput.css';

const initialIngredient = { name: "", amount: "", unit: ""};

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
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([{ ...initialIngredient }]);
  const [instructions, setInstructions] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const totalCalories = calculateCalories(ingredients);
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

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        name,
        ingredients,
        instructions,
        totalCalories,
        verdict,
        image, // File object
      });
    }
  };

  return (
    <div className="recipe-input-container">
      <h2>Create New Recipe</h2>

      {/* Profile-style square image upload */}
      <div className="recipe-image-upload-wrapper">
        <div className="recipe-image-square">
          {imagePreview ? (
            <img src={imagePreview} alt="Recipe" />
          ) : (
            <span style={{ color: "#bbb" }}>No Image</span>
          )}
          <label className="recipe-image-upload-label">
            Upload
            <input
              type="file"
              accept="image/*"
              className="recipe-image-upload-input"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      <label className="form-label fw-bold">Recipe Name</label>
      <input
        type="text"
        className="form-control mb-3"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className="section-title">Ingredients</div>
      <div className="mb-2 text-muted" style={{ fontSize: "0.9rem" }}>
      Please enter each ingredient's name, amount, and measurement. 
      <p> (e.g. "Chicken Breast, 200, grams" or "Rice, 1, cup") </p>
      </div>
      {ingredients.map((ing, idx) => (
        <div className="ingredient-row" key={idx}>
          <input
            className="form-control"
            placeholder="Name"
            value={ing.name}
            onChange={e => handleIngredientChange(idx, "name", e.target.value)}
          />
          <input
            className="form-control"
            placeholder="Amount"
            value={ing.amount}
            onChange={e => handleIngredientChange(idx, "amount", e.target.value)}
          />
          <input
            className="form-control"
            placeholder="Unit"
            value={ing.unit}
            onChange={e => handleIngredientChange(idx, "unit", e.target.value)}
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

      <label className="form-label fw-bold">Instructions</label>
      <textarea
        className="form-control instructions-area"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
        rows={4}
      />

      <div className="calorie-verdict-box">
        <strong>Estimated Calories:</strong> {totalCalories} kcal<br />
        <strong>Verdict:</strong> {verdict}
      </div>

      <div className="recipe-btn-group">
        <button
          type="button"
          className="btn btn-warning"
          onClick={handleSave}
        >
          Save recipe and Eat
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}