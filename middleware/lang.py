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
    sessionid: str
    message: str

class SaveRecipeRequest(BaseModel):
    sessionid: str

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

def save_recent_prompt_to_db(user_input, assistant_response, sessionid):
    url = "http://localhost:3000/chatbot-history"
    headers = {"Cookie": f"sessionid={sessionid}"}
    data = {"query": user_input, "response": assistant_response}
    try:
        response = requests.post(url, json=data, headers=headers)# deleted headers
        if response.status_code != 201:
            logger.error(f"Failed to save recent prompt to DB: {response.text}")
    except Exception as e:
        logger.error(f"Error saving recent prompt to DB: {e}")

def save_recipe_to_db(json_string, sessionid):
    url = "http://localhost:3000/user-recipes"
    headers = {"Cookie": f"sessionid={sessionid}"}
    try:
        recipe_data = json.loads(json_string)
        if "error" in recipe_data:
            logger.warning("Invalid recipe, not saving to DB")
            return
        data = {
            "mname": recipe_data["mname"],
            "recipe_ingredients": recipe_data["Ingredients"],
            "recipe_instruction": recipe_data["Instruction"]
        }
        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 201:
            logger.error(f"Failed to save recipe to DB: {response.text}")
    except Exception as e:
        logger.error(f"Error saving recipe to DB: {e}")

def load_user_preferences_from_db(sessionid):
    url = "http://localhost:3000/user-details"
    headers = {"Cookie": f"sessionid={sessionid}"}
    try:
        response = requests.get(url, headers)
        if response.status_code != 200:
            logger.error(f"Failed to fetch user preferences: {response.text}")
            return None
        user_data = response.json()
        dob = datetime.strptime(user_data["date_of_birth"], "%Y-%m-%dT%H:%M:%S.%fZ")
        age = (datetime.now() - dob).days // 365
        return {
            "user": {
                "age": age,
                "calorie_target": user_data["daily_calorie_goal"],
                "food_preferences": {
                    "allergies": user_data["allergies"] or [],
                    "dietary_preference": user_data["dietary_preference"] or "none"
                }
            },
            "ingredients": []  # Fetch ingredients separately if needed
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
# Get the chat history
def get_latest_response(sessionid):
    url = "http://localhost:3000/chatbot-history"
    headers = {"Cookie": f"sessionid={sessionid}"}
    try:
        response = requests.get(url, headers)
        if response.status_code != 200:
            logger.error(f"Failed to fetch user preferences: {response.text}")
            return None
        history = response.json()
        return history
    except Exception as e:
        logger.error(f"Error fetching user preferences from DB: {e}")
        return None

# Save latest response as JSON (adapted from save_latest_response)
def save_latest_response(sessionid):
    try:
        history = get_latest_response(sessionid)
        print(history)
        if not history:
            logger.warning("No chat history found")
            return json.dumps({"error": "No chat history available"}, indent=2)
        
        latest_response = history[0]["ai_response"]
        print(latest_response)
        if not latest_response:
            logger.warning("No assistant response found in chat history")
            return json.dumps({"error": "No assistant response found"}, indent=2)
        
        json_prompt = (
            f"Convert the following recipe into a JSON-formatted string with keys: mname (recipe name), recipe_ingredients(Ingredients), recipe_instructions(Instruction), calories (int).\n"
            f"Return ONLY the JSON string, enclosed in triple backticks:\n"
            f"```\n"
            f"{{\"mname\": \"[Recipe Name]\", \"recipe_ingredients\": \"[Ingredient 1,Ingredient 2\", ...], \"recipe_instruction\": \"[Detailed steps]\", \"calories\":\"[calories]\"}}\n"
            f"```\n"
            f"Ensure the recipe respects the user preferences:\n"
            f"If the input is not a valid recipe, return:\n"
            f"```\n"
            f"{{\"error\": \"Invalid recipe description\"}}\n"
            f"```\n"
            f"Recipe description: {latest_response}\n"
            f"DO NOT include any text outside the triple backticks."
        )
        
        response = chain.invoke({"chat_history": [], "input": json_prompt})
        json_string = response.content.strip()
        if json_string.startswith("```json") and json_string.endswith("```"):
            json_string = json_string[7:-3].strip()
        elif json_string.startswith("```") and json_string.endswith("```"):
            json_string = json_string[3:-3].strip()
        
        recipe_data = json.loads(json_string)
        
        with open("recipe.json", "w", encoding="utf-8") as f:
            json.dump(recipe_data, f, indent=2, ensure_ascii=False)
        logger.debug("Recipe saved to recipe.json")
        
        save_recipe_to_db(json_string, sessionid)
        
        return json_string
    except Exception as e:
        logger.error(f"Error in save_latest_response: {e}")
        return json.dumps({"error": str(e)}, indent=2)

# FastAPI endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Load user preferences
        sessionid= request.sessionid
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
        if request.sessionid not in chat_histories:
            chat_histories[request.sessionid] = []
        chatbot_history = chat_histories[request.sessionid]
        
        # Append user message
        chatbot_history.append(HumanMessage(content=request.message))
        
        # Convert history to LangChain format
        langchain_history = [
            HumanMessage(content=msg.content) if msg["role"] == "user" else AIMessage(content=msg.content)
            for msg in chatbot_history if isinstance(msg, dict)
        ] + [
            msg for msg in chatbot_history if isinstance(msg, (HumanMessage, AIMessage))
        ]
        
        # Invoke LangChain chain
        response = await chain_local.ainvoke({
            "chat_history": langchain_history,
            "input": request.message
        })
        
        # Append assistant response
        assistant_response = response.content
        chatbot_history.append(AIMessage(content=assistant_response))
        
        # Save chat history to file and DB, saving for chat_history not working
        #save_chat_history(chatbot_history, "chat_history")
        #save_chat_history_to_db(chatbot_history, request.sessionid)
        
        # Save recent prompt to file and DB
        recent_data = {
            "query": request.message,
            "response": assistant_response
        }
        save_chat_history(recent_data, "recent_prompt")
        save_recent_prompt_to_db(request.message, assistant_response, request.sessionid)
        
        # Convert chatbot_history to response format
        #history_response = [
        #    {"role": "user" if isinstance(msg, HumanMessage) else "assistant", "content": msg.content}
        #    for msg in chatbot_history
        #    ]
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

# Run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)