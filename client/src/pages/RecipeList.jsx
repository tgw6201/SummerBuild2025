import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/RecipeList.css';

export default function RecipeList() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedRows, setExpandedRows] = useState({});

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
            console.log("Fetched recipes:", data);
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

            setRecipes(prev => prev.filter(recipe => recipe.mid !== mid));
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleFavorite = async (recipe) => {
        try {
            const response = await fetch(`http://localhost:3000/saved-meals/${recipe.mid}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mname: recipe.mname }), // important!
            });

            if (response.status === 409) {
                alert("Already marked as favorite!");
            } else if (!response.ok) {
                throw new Error("Failed to mark as favorite");
            } else {
                alert("Marked as favorite!");
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };


    const handleConsumed = async (recipe) => {
        try {
            const response = await fetch(`http://localhost:3000/consumed-meals`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mid: recipe.mid }),
            });
            console.log("sending consumed recipe:", recipe.mid);
            console.log("Response from marking as consumed:", response);
            if (!response.ok) {
                throw new Error("Failed to mark as consumed");
            }
            alert("Marked as consumed!");
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // Helper to toggle expanded state
    const toggleExpand = (mid, field) => {
        setExpandedRows(prev => ({
            ...prev,
            [mid]: {
                ...prev[mid],
                [field]: !prev[mid]?.[field]
            }
        }));
    };

    const navigate = useNavigate();

    const handleEdit = (recipe) => {
        navigate(`/recipe-input/${recipe.mid}`);
    };

    if (loading) return <div>Loading recipes...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="recipe-list-container">
            <div className="card shadow recipe-list-card">
                <div className="card-body">
                    {/* Header */}
                    <div className="d-flex flex-column align-items-center mb-4">
                        <h2 className="mb-0 text-warning">All Recipes</h2>
                        <div className="text-muted" style={{ fontSize: '1.1em' }}>
                            Browse and manage your saved recipes
                        </div>
                    </div>
                    <hr />
                    {recipes.length === 0 ? (
                        <p className="text-muted">No recipes found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Ingredients</th>
                                        <th>Instructions</th>
                                        <th>Calories</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.map((recipe) => (
                                        <tr key={recipe.mid}>
                                            <td className="fw-bold">{recipe.mname}</td>
                                            <td style={{ maxWidth: 180, whiteSpace: 'pre-line' }}>
                                                {recipe.recipe_ingredients.length > 80 && !expandedRows[recipe.mid]?.ingredients
                                                    ? (
                                                        <>
                                                            {recipe.recipe_ingredients.slice(0, 80)}...
                                                            <button
                                                                className="btn btn-link btn-sm p-0 ms-1"
                                                                style={{ color: "#e66a17" }}
                                                                onClick={() => toggleExpand(recipe.mid, 'ingredients')}
                                                            >
                                                                View More
                                                            </button>
                                                        </>
                                                    )
                                                    : (
                                                        <>
                                                            {recipe.recipe_ingredients}
                                                            {recipe.recipe_ingredients.length > 80 && (
                                                                <button
                                                                    className="btn btn-link btn-sm p-0 ms-1"
                                                                    style={{ color: "#e66a17" }}
                                                                    onClick={() => toggleExpand(recipe.mid, 'ingredients')}
                                                                >
                                                                    View Less
                                                                </button>
                                                            )}
                                                        </>
                                                    )
                                                }
                                            </td>
                                            <td style={{ maxWidth: 350, whiteSpace: 'pre-line' }}>
                                                {recipe.recipe_instruction.length > 80 && !expandedRows[recipe.mid]?.instructions
                                                    ? (
                                                        <>
                                                            {recipe.recipe_instruction.slice(0, 80)}...
                                                            <button
                                                                className="btn btn-link btn-sm p-0 ms-1"
                                                                style={{ color: "#e66a17" }}
                                                                onClick={() => toggleExpand(recipe.mid, 'instructions')}
                                                            >
                                                                View More
                                                            </button>
                                                        </>
                                                    )
                                                    : (
                                                        <>
                                                            {recipe.recipe_instruction}
                                                            {recipe.recipe_instruction.length > 80 && (
                                                                <button
                                                                    className="btn btn-link btn-sm p-0 ms-1"
                                                                    style={{ color: "#e66a17" }}
                                                                    onClick={() => toggleExpand(recipe.mid, 'instructions')}
                                                                >
                                                                    View Less
                                                                </button>
                                                            )}
                                                        </>
                                                    )
                                                }
                                            </td>
                                            <td>{recipe.calories}</td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="btn btn-secondary btn-sm me-2 rounded-pill"
                                                        onClick={() => handleEdit(recipe)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm me-2 rounded-pill"
                                                        onClick={() => handleDelete(recipe.mid)}
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        className="btn btn-warning btn-sm me-2 rounded-pill"
                                                        onClick={() => handleFavorite(recipe)}
                                                    >
                                                        Favorite
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm rounded-pill"
                                                        onClick={() => handleConsumed(recipe)}
                                                    >
                                                        Consumed
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}