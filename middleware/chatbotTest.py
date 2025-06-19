import logging
import os
import gradio as gr
import google.generativeai as genai
import json
from dotenv import load_dotenv

import asyncio

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
    model_name="gemini-1.5-flash",  # Use a valid model name
    generation_config={"temperature": 0.7}
)

def load_context():
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
                    isinstance(data["ingredients"], list)
                ):
                    logger.debug("Loaded user context from messagesample.json")
                    return data
        logger.debug("No valid messagesample.json found, using default context")
        return None
    except Exception as e:
        logger.error(f"Error loading messagesample.json: {e}")
        return None
  
def save_to_json(data):
  #Save the chatbot history to a JSON file.
  try:
    with open("query_response.json", "w") as file:
        json.dump(data, file, indent=2)
    print("JSON file 'query_response.json' created successfully.")
  except Exception as e:
    print(f"Error creating JSON file: {str(e)}")

def format_context(messagesample_data):
    #Format user context from messagesample.json as a system prompt.
    if not messagesample_data:
        return "You are a culinary assistant. Provide helpful responses based on user input."
    
    user = messagesample_data.get("user", {})
    ingredients = messagesample_data.get("ingredients", [])
    
    age = user.get("age", "unknown")
    food_prefs = user.get("food_preferences", {})
    allergies = food_prefs.get("allergies", [])
    special_diet = food_prefs.get("special_diet", "none")
    calorie_target = user.get("calorie_target", "unspecified")
    
    ingredients_str = ", ".join(
        [f"{ing['quantity']} {ing['unit']} {ing['food']}" for ing in ingredients if ing.get("food") != "pork"]  # Exclude pork for halal
    )
    
    return (
        f"You are a culinary and nutritional assistant tasked with helping users create recipes, track calories, or improve communication based on their preferences and needs.\n"
        f"User details:\n" 
        f"User Age: {user.get('age', 'unknown')}-year-old, \n"
        f"You must respect user's Dietary preference: {user.get('food_preferences', {}).get('special_diet', 'no diet')} diet, \n"
        f"You must respect user's Allergies: {', '.join(user.get('food_preferences', {}).get('allergies', []))}, \n"
        f"The user's caloric Target: {user.get('calorie_target', 'unknown')} kcal/day.\n"
        f"You must only use the Available ingredients: {', '.join([f'{i['quantity']} {i['unit']} {i['food']}' for i in ingredients])}.\n"
    )

# Load messagesample.json at startup
messagesample_data = load_context()
initial_prompt = format_context(messagesample_data)

def handle_user_query(user_input, chatbot_history):
    #Handle user input, query the Gemini model, and update chat history.
    try:
        # Append user's message to chat history
        chatbot_history = chatbot_history or []  # Initialize if None
        chatbot_history.append({"role": "user", "content": user_input}) # was [user_input, None]
        
        # Prepare the conversation history for the model
        conversation = (
            f"{initial_prompt}\n\n" +
            "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in chatbot_history])
        )
        
        # Query the Gemini model
        response = model.generate_content(conversation)
        assistant_response = response.text
        
        # Update the last message with the assistant's response
        chatbot_history[-1][1] = assistant_response
        
        # Prepare data format for json
        data = {
        "query": user_input,
        "response": assistant_response
        }
        # Save to Json invocation
        save_to_json(data)

        return "", chatbot_history  # Clear input box, update chat history
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        chatbot_history[-1][1] = f"Error: {str(e)}"
        return "", chatbot_history

# Create Gradio interface
with gr.Blocks() as demo:
    chatbot = gr.Chatbot(
        label="Chat with Gemini",
        bubble_full_width=False,
    )
    msg = gr.Textbox(placeholder="Type your message here...")
    clear = gr.ClearButton([msg, chatbot])
    
    # Connect the Textbox submit action to the handler
    msg.submit(
        fn=handle_user_query,
        inputs=[msg, chatbot],
        outputs=[msg, chatbot]
    )

if __name__ == "__main__":
    demo.queue()
    demo.launch()