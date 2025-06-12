from fastapi import FastAPI, HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import requests
from pydantic import BaseModel
from typing import List
import json
from dotenv import load_dotenv
import os
import logging

# Configure logging to output to console and file
# Purpose: Capture detailed errors for debugging, including tracebacks
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler("middleware/api.log")  # File output
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file in project root
# Purpose: Securely load API keys, accounting for recipe.py being in middleware/
logger.debug("Loading .env file")
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "variables.env")
if not os.path.exists(env_path):
    logger.error(f".env file not found at {env_path}")
    raise FileNotFoundError(f".env file not found at {env_path}")
load_dotenv(dotenv_path=env_path)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")

# Validate that API keys are set
# Purpose: Ensure API keys are available before starting the application
if not OPENAI_API_KEY or not SPOONACULAR_API_KEY:
    logger.error("Missing API keys in .env file: OPENAI_API_KEY=%s, SPOONACULAR_API_KEY=%s",
                 "set" if OPENAI_API_KEY else "missing", "set" if SPOONACULAR_API_KEY else "missing")
    raise ValueError("Missing API keys in .env file")

# Initialize FastAPI app to handle HTTP requests
# Purpose: Set up the FastAPI server to process incoming API requests
app = FastAPI()

# Initialize LangChain Chat model for recipe generation
# Purpose: Configure the LLM (GPT-3.5-turbo) to generate recipe suggestions
try:
    logger.debug("Initializing OpenAI model")
    model = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY,
        model_name="gpt-3.5-turbo",
        temperature=0.7
    )
except Exception as e:
    logger.error(f"Failed to initialize OpenAI model: {str(e)}", exc_info=True)
    raise

# Define Pydantic models for input validation
# Purpose: Ensure incoming JSON data conforms to expected structure
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
# Purpose: Handle POST requests to /calorie-counter, process ingredients, and return calorie/recipe data
@app.post("/calorie-counter")
async def analyze_food(input: FoodInput):
    try:
        logger.info("Received request with input: %s", input.dict())
        
        # Initialize variables to store results
        # Purpose: Track total calories and details for each ingredient
        total_calories = 0
        ingredient_details = []

        # Validate ingredients against allergies
        # Purpose: Ensure no ingredients contain allergens
        for ingredient in input.ingredients:
            for allergen in input.user.food_preferences.allergies:
                if allergen.lower() in ingredient.food.lower():
                    logger.warning(f"Allergen '{allergen}' detected in '{ingredient.food}'")
                    raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient.food}' contains allergen '{allergen}'")

        # Process each ingredient for calorie data
        # Purpose: Query Spoonacular API for nutritional info
        for ingredient in input.ingredients:
            try:
                logger.debug("Searching Spoonacular for ingredient: %s", ingredient.food)
                nutrition_response = requests.get(
                    f"https://api.spoonacular.com/food/ingredients/search?apiKey={SPOONACULAR_API_KEY}&query={ingredient.food}"
                )
                nutrition_response.raise_for_status()
                results = nutrition_response.json().get("results", [])
                if not results:
                    logger.warning(f"No results found for ingredient: {ingredient.food}")
                    raise HTTPException(status_code=400, detail=f"Ingredient '{ingredient.food}' not found")
                ingredient_id = results[0].get("id")
            except requests.RequestException as e:
                logger.error(f"Spoonacular search error for {ingredient.food}: {str(e)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Failed to fetch ingredient data: {str(e)}")

            try:
                logger.debug("Fetching nutrition details for ingredient ID: %s", ingredient_id)
                nutrition_details = requests.get(
                    f"https://api.spoonacular.com/food/ingredients/{ingredient_id}/information?apiKey={SPOONACULAR_API_KEY}&amount={ingredient.quantity}&unit={ingredient.unit}"
                )
                nutrition_details.raise_for_status()
                nutrition_data = nutrition_details.json()
                calories = next((nutrient["amount"] for nutrient in nutrition_data.get("nutrition", {}).get("nutrients", []) if nutrient["name"] == "Calories"), 0)
            except requests.RequestException as e:
                logger.error(f"Spoonacular details error for {ingredient.food}: {str(e)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Failed to fetch nutrition details: {str(e)}")
            except (KeyError, StopIteration) as e:
                logger.error(f"Invalid nutrition data for {ingredient.food}: {str(e)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Invalid nutrition data: {str(e)}")

            total_calories += calories
            ingredient_details.append({
                "food": ingredient.food,
                "quantity": ingredient.quantity,
                "unit": ingredient.unit,
                "calories": calories
            })

        # Check if total calories meet user's target
        # Purpose: Provide feedback on calorie goal alignment
        calorie_status = "within target" if total_calories <= input.user.calorie_target else "exceeds target"
        logger.info("Total calories: %s, Status: %s", total_calories, calorie_status)

        # Generate recipe suggestion using LangChain
        # Purpose: Create a tailored recipe using LLM
        try:
            logger.debug("Generating recipe with LangChain")
            ingredient_list = ", ".join([f"{i.quantity} {i.unit} {i.food}" for i in input.ingredients])
            allergies = ", ".join(input.user.food_preferences.allergies)
            prompt_text = f"""Suggest a recipe for a {input.user.age}-year-old user with these ingredients: {ingredient_list}. 
                The user has allergies to {allergies}, follows a {input.user.food_preferences.special_diet} diet, and has a daily calorie target of {input.user.calorie_target} kcal. 
                Return the recipe in JSON format with 'name', 'ingredients', and 'instructions', ensuring it aligns with the diet and avoids allergens."""
            recipe_response = await model.ainvoke(prompt_text)
            recipe = json.loads(recipe_response.content)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in recipe response: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Invalid recipe JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Recipe generation error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to generate recipe: {str(e)}")

        # Return formatted response
        # Purpose: Send back user details, ingredient calories, total calories, and recipe
        response = {
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
        logger.info("Returning response: %s", response)
        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")