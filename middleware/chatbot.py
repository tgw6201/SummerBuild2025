import json
import os
from dotenv import load_dotenv
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import BaseModel
from typing import List

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("middleware/chatbot.log")
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
logger.debug("Loading .env file")
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if not os.path.exists(env_path):
    logger.error(f".env file not found at {env_path}")
    raise FileNotFoundError(f".env file not found at {env_path}")
load_dotenv(dotenv_path=env_path)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Validate API key
if not GOOGLE_API_KEY:
    logger.error("Missing GOOGLE_API_KEY in .env file")
    raise ValueError("Missing GOOGLE_API_KEY in .env file")

# Define Pydantic models
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
    inputmessage: str

# Initialize Gemini model
try:
    logger.debug("Initializing Gemini model")
    model = ChatGoogleGenerativeAI(
        google_api_key=GOOGLE_API_KEY,
        model="gemini-2.5-flash",
        temperature=0.7
    )
except Exception as e:
    logger.error(f"Failed to initialize Gemini model: {str(e)}", exc_info=True)
    raise

# Retry decorator for Gemini API calls
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((Exception,)),
    before_sleep=lambda retry_state: logger.debug(f"Retrying Gemini call: attempt {retry_state.attempt_number}")
)
async def invoke_gemini_model(model, prompt_text):
    return await model.ainvoke(prompt_text)

async def generate_response(input_data: dict) -> dict:
    """
    Process input JSON and generate a response using Gemini 2.5 Flash.
    Returns a JSON-compatible dictionary (e.g., recipe).
    """
    try:
        logger.info("Processing input data: %s", input_data)
        
        # Validate input using Pydantic
        food_input = FoodInput(**input_data)
        
        # Construct prompt
        ingredient_list = ", ".join([f"{i.quantity} {i.unit} {i.food}" for i in food_input.ingredients])
        allergies = ", ".join(food_input.user.food_preferences.allergies)
        prompt_text = (
            f"{food_input.inputmessage}\n"
            f"User details: {food_input.user.age}-year-old, {food_input.user.food_preferences.special_diet} diet, "
            f"allergies to {allergies}, daily calorie target of {food_input.user.calorie_target} kcal.\n"
            f"Available ingredients: {ingredient_list}.\n"
            f"Return the response in JSON format with 'name', 'ingredients', and 'instructions' if a recipe is requested."
        )
        logger.debug("Generated prompt: %s", prompt_text)

        # Call Gemini
        try:
            response = await invoke_gemini_model(model, prompt_text)
            response_json = json.loads(response.content)
            logger.info("Gemini response: %s", response_json)
            return response_json
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Gemini response: {str(e)}", exc_info=True)
            # Fallback recipe
            fallback_response = {
                "name": "Basic Ingredient Mix",
                "ingredients": ingredient_list.split(", "),
                "instructions": [
                    "Combine all ingredients in a bowl.",
                    f"Prepare according to your preferred {food_input.user.food_preferences.special_diet} recipe, "
                    f"ensuring no {allergies} allergens are included."
                ]
            }
            logger.info("Using fallback response due to JSON error")
            return fallback_response
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}", exc_info=True)
            raise

    except Exception as e:
        logger.error(f"Error processing input: {str(e)}", exc_info=True)
        raise Exception(f"Failed to generate response: {str(e)}")