import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import os
import json
from dotenv import load_dotenv
import asyncio

# Setup logging
logging.basicConfig(level=logging.DEBUG, handlers=[logging.FileHandler("chatbot.log"), logging.StreamHandler()])
logger = logging.getLogger(__name__)

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
  raise ValueError("GOOGLE_API_KEY not found in .env")

# Initialize model
model = ChatGoogleGenerativeAI(
  model="gemini-2.0-flash",
  google_api_key=api_key,
  client_options={"api_endpoint": "https://generativelanguage.googleapis.com/v1"},
  temperature=0.7,
)

async def invoke_gemini_model(model, prompt_text):
  logger.debug(f"Generated prompt: {prompt_text}")
  try:
    async with asyncio.timeout(30):
      message = HumanMessage(content=prompt_text)
      response = await model.ainvoke([message])
      logger.debug(f"API response: {response.content}")
      return response.content
  except asyncio.TimeoutError:
    logger.error("Gemini API call timed out after 30 seconds")
    raise
  except Exception as e:
    logger.error(f"Gemini API error: {str(e)}")
    raise

async def generate_response(input_data):
  logger.info(f"Processing input data: {input_data}")
  try:
    user = input_data.get("user", {})
    ingredients = input_data.get("ingredients", [])
    input_message = input_data.get("inputmessage", "")
    prompt = (
      f"{input_message}\n"
      f"User details: {user.get('age', 'unknown')}-year-old, "
      f"{user.get('food_preferences', {}).get('special_diet', 'no diet')} diet, "
      f"allergies to {', '.join(user.get('food_preferences', {}).get('allergies', []))}, "
      f"daily calorie target of {user.get('calorie_target', 'unknown')} kcal.\n"
      f"Available ingredients: {', '.join([f'{i['quantity']} {i['unit']} {i['food']}' for i in ingredients])}.\n"
      f"Return the response in JSON format with 'name', 'ingredients', and 'instructions' if a recipe is requested."
    )
    response_text = await invoke_gemini_model(model, prompt)
    logger.info(f"Generated response: {response_text}")
    try:
      return json.loads(response_text)
    except json.JSONDecodeError:
      return {"error": "Invalid JSON response", "raw_response": response_text}
  except Exception as e:
    logger.error(f"Error processing input: {str(e)}")
    raise Exception(f"Failed to generate response: {str(e)}")

if __name__ == "__main__":
  async def main():
    sample_input = {
      "user": {
        "age": 30,
        "food_preferences": {"allergies": ["peanuts", "shellfish"], "special_diet": "vegetarian"},
        "calorie_target": 2000
      },
      "ingredients": [
        {"food": "whole wheat flour", "quantity": 1.5, "unit": "cups"},
        {"food": "blueberries", "quantity": 1.0, "unit": "cup"}
      ],
      "inputmessage": "Suggest a vegetarian recipe using these ingredients, avoiding peanuts and shellfish, within 2000 calories."
    }
    response = await generate_response(sample_input)
    print(response)
  asyncio.run(main())