import logging
import os
import json
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
import requests
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Cookie
import re

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    handlers=[logging.FileHandler("langchain.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env")

# Initialize FastAPI app
app = FastAPI()

# Initialize LangChain with Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=api_key,
    temperature=0.7
)

# Define Pydantic models for request bodies
class ChatRequest(BaseModel):
    message: str

class SaveRecipeRequest(BaseModel):
    sessionid: str

class CalculateCaloriesRequest(BaseModel):
    mname: str
    recipe_ingredients: str
    recipe_instruction: str
    calories: int = 0

# HTTP request functions
#def save_chat_history_to_db(chatbot_history, sessionid):
#    url = "http://localhost:3000/chatbot-history"
#    headers = {"Cookie": f"sessionid={sessionid}"}
#    try:
#        user_query = None
#        for msg in chatbot_history:
#            if msg["role"] == "user":
#                user_query = msg["content"]
#            elif msg["role"] == "assistant" and user_query:
#                data = {"query": user_query, "response": msg["content"]}
#                response = requests.post(url, json=data, headers=headers)
#                if response.status_code != 201:
#                    logger.error(f"Failed to save chat history to DB: {response.text}")
#                user_query = None
#    except Exception as e:
#        logger.error(f"Error saving chat history to DB: {e}")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def save_recent_prompt_to_db(user_input, assistant_response, sessionid):
    url = "http://localhost:3000/chatbot-history"
    cookies = {"sessionid": sessionid}
    data = {"query": user_input, "response": assistant_response}
    try:
        response = requests.post(url, json=data, cookies=cookies)
        if response.status_code != 201:
            logger.error(f"Failed to save recent prompt to DB: {response.text}")
    except Exception as e:
        logger.error(f"Error saving recent prompt to DB: {e}")

def save_recipe_to_db(json_string, sessionid):
    url = "http://localhost:3000/user-recipes"
    headers = {"Cookie": f"sessionid={sessionid}"}
    try:
        recipe_data = json.loads(json_string)

        if not isinstance(recipe_data.get("recipe_ingredients"), str):
            recipe_data["recipe_ingredients"] = ", ".join(recipe_data["recipe_ingredients"])
        if not isinstance(recipe_data.get("calories"), int):
            try:
                recipe_data["calories"] = int(recipe_data["calories"])
            except ValueError:
                recipe_data["calories"] = 0

        if "error" in recipe_data:
            logger.warning("Invalid recipe, not saving to DB")
            return

        # Ensure all required fields are present
        if not all(k in recipe_data for k in ("mname", "recipe_ingredients", "recipe_instruction", "calories")):
            logger.error("Recipe data missing required fields.")
            return

        data = {
            "mname": recipe_data["mname"],
            "recipe_ingredients": recipe_data["recipe_ingredients"],
            "recipe_instruction": recipe_data["recipe_instruction"],
            "calories": recipe_data["calories"]
        }

        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 201:
            logger.error(f"Failed to save recipe to DB: {response.text}")
        else:
            logger.info(f"Recipe saved successfully: {response.json()}")
    except Exception as e:
        logger.error(f"Error saving recipe to DB: {e}")


def load_user_preferences_from_db(sessionid):
    url = "http://localhost:3000/user-details"
    cookie = {"sessionid": sessionid}
    try:
        response = requests.get(url, cookies=cookie)
        if response.status_code != 200:
            logger.error(f"Failed to fetch user preferences: {response.text}")
            return None

        raw_data = response.json()
        logger.debug(f"user_data from /user-details: {raw_data}")

        user_info = raw_data.get("user", {})
        food_prefs = user_info.get("food_preferences", {})

        return {
            "user": {
                "age": user_info.get("age", "unknown"),
                "calorie_target": user_info.get("calorie_target", 2000),
                "food_preferences": {
                    "allergies": food_prefs.get("allergies", []),
                    "dietary_preference": food_prefs.get("dietary_preference", "none")
                }
            },
            "ingredients": ""  # You may later populate this
        }

    except Exception as e:
        logger.error(f"Error fetching user preferences from DB: {e}")
        return None

# Load messagesample.json for fallback (as in chatbot.py)
def load_messagesample():
    try:
        if os.path.exists("messagesample.json"):
            with open("messagesample.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                if (
                    isinstance(data, dict) and
                    "user" in data and
                    "ingredients" in data and
                    isinstance(data["user"], dict) and
                    isinstance(data["ingredients"], str)
                ):
                    logger.debug("Loaded user context from messagesample.json")
                    return data
        logger.debug("No valid messagesample.json found, using default context")
        return None
    except Exception as e:
        logger.error(f"Error loading messagesample.json: {e}")
        return None

# Format system prompt (adapted from format_context)
def format_context(messagesample_data):
    if not messagesample_data:
        return (
            "You are a culinary and nutritional assistant tasked with helping users create recipes, track calories, or improve communication based on their preferences and needs. Provide helpful responses based on user input.\n"
            "If there is any ingredients that do not adhere to the user's Dietary preference or Allergies, suggest a recipe without them\n"
            "For recipe requests, format your response as:\n"
            "Recipe: [Recipe Name]\n"
            "Ingredients: [List each ingredient on a new line]\n"
            "Instructions: [Detailed steps]"
        )
    
    user = messagesample_data.get("user", {})
    ingredients = messagesample_data.get("ingredients", "")
    
    return (
        f"You are a culinary and nutritional assistant tasked with helping users create recipes and track calories.\n"
        f"For recipe requests, format your response as:\n"
        f"Recipe: [Recipe Name]\n"
        f"Ingredients: [List each ingredient on a new line]\n"
        f"Instructions: [Detailed steps]\n"
        f"User details:\n"
        f"User Age: {user.get('age', 'unknown')}-year-old\n"
        f"You must respect user's Dietary preference: {user.get('food_preferences', {}).get('dietary_preference', 'no diet')} diet\n"
        f"You must respect user's Allergies: {', '.join(user.get('food_preferences', {}).get('allergies', []))}\n"
        f"The user's caloric Target: {user.get('calorie_target', 'unknown')} kcal/day\n"
        f"You can only use the following ingredients unless explicitly stated by the user: {ingredients}\n"
        f"Ignore ingredients that do not adhere to the user's Dietary preference or Allergies. You need not follow the caloric target strictly but you MUST return the calories of the recipe per serving and the serving size.\n"
        f"Calorie value per serving of the recipe MUST be an exact, single value and in kcal unit.\n"
    )

# Load user preferences at startup
messagesample_data = load_messagesample()
system_prompt = format_context(messagesample_data)

# LangChain prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# Initialize LangChain chain
chain = prompt | llm

# In-memory chat history (per sessionid)
chat_histories = {}

# Save latest response as JSON (adapted from save_latest_response)
def save_latest_response(sessionid):
    try:
        history = chat_histories.get(sessionid, [])
        if not history:
            logger.warning("No chat history found")
            return json.dumps({"error": "No chat history available"}, indent=2)

        # Find the most recent recipe in chat history
        latest_recipe = None
        for msg in reversed(history):
            if isinstance(msg, AIMessage) and "Recipe:" in msg.content:
                latest_recipe = msg.content
                break

        if not latest_recipe:
            logger.warning("No recipe found in chat history")
            return json.dumps({"error": "No recipe found in chat history"}, indent=2)

        # Parse the recipe text into structured data
        recipe_data = {
            "mname": "",
            "recipe_ingredients": "",
            "recipe_instruction": "",
            "calories": 0
        }

        # Extract recipe name
        recipe_name_match = re.search(r"Recipe:\s*(.*?)\n", latest_recipe)
        if recipe_name_match:
            recipe_data["mname"] = recipe_name_match.group(1).strip()

        # Extract ingredients
        ingredients_match = re.search(r"Ingredients:\s*([\s\S]*?)\nInstructions:", latest_recipe)
        if ingredients_match:
            ingredients_text = ingredients_match.group(1).strip()
            # Convert bullet points or dashes to comma-separated list
            ingredients_list = [ing.strip().replace("- ", "").replace("* ", "") 
                              for ing in ingredients_text.split("\n") if ing.strip()]
            recipe_data["recipe_ingredients"] = ", ".join(ingredients_list)

        # Extract instructions
        instructions_match = re.search(r"Instructions:\s*([\s\S]*?)(?:\nCalories|\nServing|\n\d+\.|$)", latest_recipe)
        if instructions_match:
            instructions_text = instructions_match.group(1).strip()
            # Clean up numbered steps if present
            instructions_text = re.sub(r"^\d+\.\s*", "", instructions_text, flags=re.MULTILINE)
            recipe_data["recipe_instruction"] = instructions_text

        # Extract calories
        calories_match = re.search(r"Calories per serving:\s*(\d+)", latest_recipe)
        if calories_match:
            try:
                recipe_data["calories"] = int(calories_match.group(1))
            except ValueError:
                recipe_data["calories"] = 0

        # Validate we have all required fields
        if not all(recipe_data.values()):
            logger.error("Failed to extract complete recipe data")
            return json.dumps({"error": "Incomplete recipe data"}, indent=2)

        # Save to file
        with open("recipe.json", "w", encoding="utf-8") as f:
            json.dump(recipe_data, f, indent=2, ensure_ascii=False)

        # Save to DB
        save_recipe_to_db(json.dumps(recipe_data), sessionid)
        logger.debug("Recipe saved successfully")

        return json.dumps(recipe_data, indent=2)

    except Exception as e:
        logger.error(f"Error in save_latest_response: {e}")
        return json.dumps({"error": str(e)}, indent=2)


# FastAPI endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(request: ChatRequest, sessionid: str = Cookie(None)):
    try:
        # First check if this is a "Log meal" command
        if request.message.strip().lower() == "log meal":
            # Try to save the most recent recipe
            recipe_json = save_latest_response(sessionid)
            recipe_data = json.loads(recipe_json)
            
            if "error" not in recipe_data:
                # If save was successful, return confirmation message
                return {
                    "query": request.message,
                    "response": f"Recipe '{recipe_data.get('mname', '')}' successfully saved to your log!"
                }
            else:
                return {
                    "query": request.message,
                    "response": "I couldn't find a recent recipe to log. Please ask for a recipe first, then say 'Log meal'."
                }

        # Normal chat processing for all other messages
        # Load user preferences
        if not sessionid:
            raise HTTPException(status_code=401, detail="No sessionid cookie found")
        messagesample_data = load_user_preferences_from_db(sessionid)

        if not messagesample_data:
            messagesample_data = load_messagesample()
        system_prompt_local = format_context(messagesample_data)
        
        # Update prompt with user-specific system prompt
        prompt_local = ChatPromptTemplate.from_messages([
            ("system", system_prompt_local),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        chain_local = prompt_local | llm
        
        # Get or initialize chat history
        if sessionid not in chat_histories:
            chat_histories[sessionid] = []
        chatbot_history = chat_histories[sessionid]
        
        # Append user message
        chatbot_history.append(HumanMessage(content=request.message))
        
        # Convert history to LangChain format
        langchain_history = [
            HumanMessage(content=msg.content) if isinstance(msg, dict) and msg.get("role") == "user" else 
            AIMessage(content=msg.content) if isinstance(msg, dict) and msg.get("role") == "assistant" else 
            msg
            for msg in chatbot_history
            if isinstance(msg, (dict, HumanMessage, AIMessage))
        ]
        
        # Invoke LangChain chain
        response = await chain_local.ainvoke({
            "chat_history": langchain_history,
            "input": request.message
        })
        
        # Append assistant response
        assistant_response = response.content
        chatbot_history.append(AIMessage(content=assistant_response))

        # Save recent prompt to file and DB
        recent_data = {
            "query": request.message,
            "response": assistant_response
        }
        save_chat_history(recent_data, "recent_prompt")
        save_recent_prompt_to_db(request.message, assistant_response, sessionid)
        
        return {
            "query": request.message,
            "response": assistant_response
        }
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-recipe")
async def save_recipe(request: SaveRecipeRequest):
    try:
        sessionid= request.sessionid
        json_string = save_latest_response(sessionid)
        return {"recipe_json": json_string}
    except Exception as e:
        logger.error(f"Error saving recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Save chat history to file (from chatbot.py)
def save_chat_history(chatbot_history, filename: str):
    try:
        with open(f"{filename}.json", "w", encoding="utf-8") as f:
            json.dump(chatbot_history, f, indent=4, ensure_ascii=False)
        logger.debug(f"Chat history saved to {filename}.json")
    except Exception as e:
        logger.error(f"Error saving chat history to JSON: {e}")

@app.post("/calculate-calories")
async def calculate_calories(request: CalculateCaloriesRequest, sessionid: str = Cookie(None)):
    try:
        if not sessionid:
            raise HTTPException(status_code=401, detail="No sessionid cookie found")
        
        # Create prompt for calorie calculation
        calorie_prompt = f"""
        Calculate the total calories for this recipe based on its ingredients and preparation method.
        Return ONLY the total calorie count as a single integer number.
        
        Recipe Name: {request.mname}
        Ingredients: {request.recipe_ingredients}
        Instructions: {request.recipe_instruction}
        
        Current calorie value: {request.calories} (update this if inaccurate)
        """
        
        # Get calorie calculation from LLM
        response = await llm.ainvoke(calorie_prompt)
        
        # Extract the calorie number from the response
        try:
            # Look for a number in the response
            calorie_match = re.search(r'\d+', response.content)
            if calorie_match:
                calculated_calories = int(calorie_match.group())
            else:
                calculated_calories = request.calories  # fallback to original if no number found
        except Exception as e:
            logger.error(f"Error parsing calorie calculation: {e}")
            calculated_calories = request.calories
        
        # Update the recipe with calculated calories
        recipe_data = {
            "mname": request.mname,
            "recipe_ingredients": request.recipe_ingredients,
            "recipe_instruction": request.recipe_instruction,
            "calories": calculated_calories
        }
        
        # Save to database
        save_recipe_to_db(json.dumps(recipe_data), sessionid)
        
        return recipe_data
        
    except Exception as e:
        logger.error(f"Error calculating calories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)