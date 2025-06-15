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

#Get API key
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

input_file = "messagesample.json"
logger.debug(f"Reading input file: {input_file}")
try:
    with open(input_file, 'r') as f:
        input_data = json.load(f)
    logger.info("Generating response using chatbot")
    #Getting User parameters and constructing prompt
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
      #f"Return the response in JSON format with 'name', 'ingredients', and 'instructions' if a recipe is requested."
    )
    #Invoking LLM
    ai_msg = model.invoke(prompt)
except Exception as e:
        logger.error(f"Error in chatbotTest: {str(e)}")
        raise
print(ai_msg.content)
