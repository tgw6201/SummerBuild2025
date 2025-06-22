import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const response = await fetch('http://localhost:3000/user-recipes', {
                credentials: 'include'
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
    };

    const handleDelete = async (mid) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) return;

        try {
            const response = await fetch(`http://localhost:3000/user-recipes/${mid}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error("Failed to delete recipe");
            }

            // Update local state
            setRecipes(prev => prev.filter(recipe => recipe.mid !== mid));
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const navigate = useNavigate();

    const handleEdit = (recipe) => {
        // Troubleshooting: Check if recipe.mid is defined
        // alert(`Edit clicked for: ${recipe.mname}\n(MID: ${recipe.mid})`);
        navigate(`/recipe-input/${recipe.mid}`);
    };

    if (loading) return <div>Loading recipes...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="recipe-list-container">
            <h2>All Recipes</h2>
            {recipes.length === 0 ? (
                <p>No recipes found.</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Ingredients</th>
                            <th>Instructions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map((recipe) => (
                            <tr key={recipe.mid}>
                                <td>{recipe.mname}</td>
                                <td>{recipe.recipe_ingredients}</td>
                                <td>{recipe.recipe_instruction}</td>
                                <td>
                                    <button
                                        className="btn btn-secondary me-2"
                                        onClick={() => handleEdit(recipe)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(recipe.mid)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
