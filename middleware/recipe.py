from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import requests
from pydantic import BaseModel
from typing import List
import json
from dotenv import load_dotenv
import os

# Load environment variables from .env file
# Purpose: Securely load API keys from a .env file to avoid hardcoding sensitive data
# change to .json when implementing with front end.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "variables.env"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")

# Validate that API keys are set
# Purpose: Ensure API keys are available before starting the application
if not OPENAI_API_KEY or not SPOONACULAR_API_KEY:
    raise ValueError("Missing API keys in .env file")

# Initialize FastAPI app to handle HTTP requests
# Purpose: Set up the FastAPI server to process incoming API requests
app = FastAPI()

# Initialize LangChain Chat model for recipe generation
# Purpose: Configure the LLM (GPT-3.5-turbo) to generate recipe suggestions based on input
model = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,
    model_name="gpt-3.5-turbo",
    temperature=0.7  # Controls randomness in LLM responses
)

# Define Pydantic models for input validation
# Purpose: Ensure incoming JSON data (e.g., from sample.json) conforms to expected structure
class Ingredient(BaseModel):
    food: str
    quantity: float
    unit: str

class FoodPreferences(BaseModel):
    allergies: List[str]
    special_diet: str

class User(BaseModel):
    age: int
    food_preferences: FoodPreferences
    calorie_target: int

class FoodInput(BaseModel):
    user: User
    ingredients: List[Ingredient]

# Define API endpoint to process food input
# Purpose: Handle POST requests to /calorie-counter, process ingredients, and return calorie and recipe data
@app.post("/calorie-counter")
async def analyze_food(input: FoodInput):
    try:
        # Initialize variables to store results
        # Purpose: Track total calories and details for each ingredient
        total_calories = 0
        ingredient_details = []

        # Validate ingredients against allergies
        # Purpose: Ensure no ingredients contain user-specified allergens
        for ingredient in input.ingredients:
            for allergen in input.user.food_preferences.allergies:
                if allergen.lower() in ingredient.food.lower():
                    raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient.food}' contains allergen '{allergen}'")

        # Process each ingredient for calorie data
        # Purpose: Query Spoonacular API to get nutritional info for each ingredient
        for ingredient in input.ingredients:
            nutrition_response = requests.get(
                f"https://api.spoonacular.com/food/ingredients/search?apiKey={SPOONACULAR_API_KEY}&query={ingredient.food}"
            )
            nutrition_response.raise_for_status()  # Raise exception for HTTP errors
            ingredient_id = nutrition_response.json().get("results", [{}])[0].get("id")
            if not ingredient_id:
                raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient.food}' not found")

            # Get detailed nutrition data
            nutrition_details = requests.post(
                f"https://api.spoonacular.com/food/ingredients/{ingredient_id}/information?apiKey={SPOONACULAR_API_KEY}&amount={ingredient.quantity}&unit={ingredient.unit}"
            )
            nutrition_details.raise_for_status()
            calories = nutrition_details.json().get("nutrition", {}).get("nutrients", [{}])[0].get("amount", 0)

            total_calories += calories
            ingredient_details.append({
                "food": ingredient.food,
                "quantity": ingredient.quantity,
                "unit": ingredient.unit,
                "calories": calories
            })

        # Check if total calories meet user's target
        # Purpose: Provide feedback on whether the input aligns with the user's calorie goal
        calorie_status = "within target" if total_calories <= input.user.calorie_target else "exceeds target"

        # Generate recipe suggestion using LangChain
        # Purpose: Use LLM to create a recipe tailored to ingredients, age, preferences, and calorie target
        ingredient_list = ", ".join([f"{i.quantity} {i.unit} {i.food}" for i in input.ingredients])
        allergies = ", ".join(input.user.food_preferences.allergies)
        recipe_prompt = ChatPromptTemplate.from_messages([
            ("user", f"""Suggest a recipe for a {input.user.age}-year-old user with these ingredients: {ingredient_list}. 
            The user has allergies to {allergies}, follows a {input.user.food_preferences.special_diet} diet, and has a daily calorie target of {input.user.calorie_target} kcal. 
            Return the recipe in JSON format with 'name', 'ingredients', and 'instructions', ensuring it aligns with the diet and avoids allergens.""")
        ])
        recipe_response = await model.ainvoke(recipe_prompt)
        recipe = json.loads(recipe_response.content)

        # Return formatted response
        # Purpose: Send back user details, ingredient calories, total calories, and recipe suggestion
        return {
            "user": {
                "age": input.user.age,
                "food_preferences": input.user.food_preferences.dict(),
                "calorie_target": input.user.calorie_target,
                "calorie_status": calorie_status
            },
            "ingredients": ingredient_details,
            "total_calories": total_calories,
            "recipe": recipe
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))