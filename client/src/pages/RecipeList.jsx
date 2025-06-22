
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
//import '../css/RecipeList.css';

export default function RecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    useEffect(() => {
        async function fetchRecipes() {
        try {
            const response = await fetch('http://localhost:3000/recipes', {
            credentials: 'include' // Important to send cookies!
            });
            if (!response.ok) {
            throw new Error("Failed to fetch recipes");
            }
            const data = await response.json();
            setRecipes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        }
        fetchRecipes();
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="recipe-list">
        <h1>Recipe List</h1>
        {recipes.length === 0 ? (
            <p>No recipes found.</p>
        ) : (
            <ul>
            {recipes.map(recipe => (
                <li key={recipe.id}>
                <h2>{recipe.name}</h2>
                <p>{recipe.description}</p>
                </li>
            ))}
            </ul>
        )}
        </div>
    );
}
