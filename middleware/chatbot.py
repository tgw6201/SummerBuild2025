import logging
import os
import gradio as gr
import google.generativeai as genai
from dotenv import load_dotenv
import json

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    handlers=[logging.FileHandler("chatbot.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env")

# Configure Gemini API
genai.configure(api_key=api_key)
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={"temperature": 0.7}
)

def load_messagesample():
    #Load user context from messagesample.json if it exists.
    try:
        if os.path.exists("messagesample.json"):
            with open("messagesample.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                # Validate structure
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

def load_chat_history():
    #Load chat history from chat_history.json if it exists.
    try:
        if os.path.exists("recent_prompt.json"):
            with open("chat_history.json", "r", encoding="utf-8") as f:
                history = json.load(f)
                if isinstance(history, list) and all(isinstance(msg, dict) and "role" in msg and "content" in msg for msg in history):
                    logger.debug("Loaded chat history from recent_prompt.json")
                    return history
        logger.debug("No valid recent_prompt.json found, starting with empty history")
        return []
    except Exception as e:
        logger.error(f"Error loading chat history from JSON: {e}")
        return []

def save_chat_history(chatbot_history, filename:str):
    #Save the chatbot history to [filename].json.
    try:
        with open(f"{filename}.json", "w", encoding="utf-8") as f:
            json.dump(chatbot_history, f, indent=4, ensure_ascii=False)
        logger.debug("Chat history saved to chat_history.json")
    except Exception as e:
        logger.error(f"Error saving chat history to JSON: {e}")

def format_context(messagesample_data):
    #Format user context from messagesample.json as a system prompt.
    if not messagesample_data:
        return (
            "You are a culinary and nutritional assistant tasked with helping users create recipes, track calories, or improve communication based on their preferences and needs. Provide helpful responses based on user input.\n"
            f"If there is any ingredients that do not adhere to the user's Dietary preference or Allergies, suggest a recipe without them\n"
            f"For recipe requests, format your response as:\n"
            f"Recipe: [Recipe Name]\n"
            f"Ingredients: [List each ingredient on a new line]\n"
            f"Instructions: [Detailed steps]"
            )
    
    user = messagesample_data.get("user", {})
    ingredients = messagesample_data.get("ingredients", str)
    
    age = user.get("age", "unknown")
    food_prefs = user.get("food_preferences", {})
    allergies = food_prefs.get("allergies", [])
    dietary_preference = food_prefs.get("dietary_preference", "none")
    calorie_target = user.get("calorie_target", "unspecified")
    
    #ingredients_str = ", ".join([f"{ing['quantity']} {ing['unit']} {ing['food']}" for ing in ingredients ])
    
    return (
        f"You are a culinary and nutritional assistant tasked with helping users create recipes and track calories.\n"
        f"For recipe requests, format your response as:\n"
        f"Recipe: [Recipe Name] .\n"
        f"Ingredients: [List each ingredient on a new line].\n"
        f"Instructions: [Detailed steps]\n"
        f"User details:\n" 
        f"User Age: {user.get('age', 'unknown')}-year-old, \n"
        f"You must respect user's Dietary preference: {user.get('food_preferences', {}).get('dietary_preference', 'no diet')} diet, \n"
        f"You must respect user's Allergies: {', '.join(user.get('food_preferences', {}).get('allergies', []))}, \n"
        f"The user's caloric Target: {user.get('calorie_target', 'unknown')} kcal/day.\n"
        f"You can only use the following ingredients unless explicitly stated by the user: {', '.join(i for i in ingredients)}.\n"
        f"Ignore ingredients that do not adhere to the user's Dietary preference or Allergies. You need not follow the caloric target strictly but you need to return the calories of the recipe per serving."
    )

# Load messagesample.json at startup
messagesample_data = load_messagesample()
system_prompt = format_context(messagesample_data)

def save_latest_response():
    try:
        history = load_chat_history()
        if not history:
            logger.warning("No chat history found")
            return json.dumps({"error": "No chat history available"}, indent=2)
        
        # Find the latest assistant response
        latest_response = None
        for msg in reversed(history):
            if msg["role"] == "assistant":
                latest_response = msg["content"]
                break
        if not latest_response:
            logger.warning("No assistant response found in chat history")
            return json.dumps({"error": "No assistant response found"}, indent=2)
        
        # Prompt Gemini to convert the response to JSON
        json_prompt = (
            f"Convert the following recipe into a JSON-formatted string with keys: Endname (recipe name), Ingredients (string), and Instruction (string).\n"
            f"Return ONLY the JSON string, enclosed in triple backticks:\n"
            f"```\n"
            f"{{\"Endname\": \"[Recipe Name]\", \"Ingredients\": \"[Ingredient 1,Ingredient 2\", ...], \"Instruction\": \"[Detailed steps]\"}}\n"
            f"```\n"
            f"Ensure the recipe respects the user preferences:\n"
            f"If the input is not a valid recipe, return:\n"
            f"```\n"
            f"{{\"error\": \"Invalid recipe description\"}}\n"
            f"```\n"
            f"Recipe description: {latest_response}\n"
            f"DO NOT include any text outside the triple backticks."
        )
        
        response = model.generate_content(json_prompt)
        json_string = response.text.strip()
        #for debugging to see AI's response
        #print(json_string)
        # Extract JSON from triple backticks
        if json_string.startswith("```json") and json_string.endswith("```"):
            json_string = json_string[7:-3].strip()
        elif json_string.startswith("```") and json_string.endswith("```"):
            json_string = json_string[3:-3].strip()
        
        # Validate JSON
        recipe_data = json.loads(json_string)
        
        # Save to recipe.json
        with open("recipe.json", "w", encoding="utf-8") as f:
            json.dump(recipe_data, f, indent=2, ensure_ascii=False)
        logger.debug("Recipe saved to recipe.json")
        
        return json_string
    except Exception as e:
        logger.error(f"Error in save_latest_response: {e}")
        return json.dumps({"error": str(e)}, indent=2)

    

def handle_user_query(user_input, chatbot_history):
    #Handle user input, query the Gemini model, update chat history, and save to JSON.
    try:
        # Initialize chatbot history if None
        chatbot_history = chatbot_history or load_chat_history()
        
        # Append user's message to chat history
        chatbot_history.append({"role": "user", "content": user_input})
        
        # Prepare the conversation history for the model
        conversation = (
            f"{system_prompt}\n\n" +
            "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in chatbot_history])
        )
        
        # Query the Gemini model
        response = model.generate_content(conversation)
        assistant_response = response.text
        
        # Append assistant's response to chat history
        chatbot_history.append({"role": "assistant", "content": assistant_response})
        
        
        #Save the whole chat history to JSON
        save_chat_history(chatbot_history, "chat_history")
        
        #Save the most recent chat history to JSON
        data = {
        "query": user_input,
        "response": assistant_response
        }
        save_chat_history(data,"recent_prompt")
        
        return "", chatbot_history
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        chatbot_history.append({"role": "assistant", "content": f"Error: {str(e)}"})
        save_chat_history(chatbot_history)
        return "", chatbot_history

# Create Gradio interface
with gr.Blocks() as demo:
    chatbot = gr.Chatbot(
        label="Chat with Gemini",
        type="messages",
        value=load_chat_history()
    )
    msg = gr.Textbox(placeholder="Type your message here...")
    clear = gr.ClearButton([msg, chatbot])
    save_button = gr.Button("Save Latest Response as Recipe")
    save_output = gr.Textbox(label="Latest Response (JSON)", interactive=False)

    # Connect the Textbox submit action to the handler
    msg.submit(
        fn=handle_user_query,
        inputs=[msg, chatbot],
        outputs=[msg, chatbot]
    )
    save_button.click(
        fn=save_latest_response,
        inputs=[],
        outputs=save_output
    )


if __name__ == "__main__":
    demo.queue()
    demo.launch()