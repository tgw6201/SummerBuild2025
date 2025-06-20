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
                    isinstance(data["ingredients"], list)
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
        if os.path.exists("chat_history.json"):
            with open("chat_history.json", "r", encoding="utf-8") as f:
                history = json.load(f)
                if isinstance(history, list) and all(isinstance(msg, dict) and "role" in msg and "content" in msg for msg in history):
                    logger.debug("Loaded chat history from chat_history.json")
                    return history
        logger.debug("No valid chat_history.json found, starting with empty history")
        return []
    except Exception as e:
        logger.error(f"Error loading chat history from JSON: {e}")
        return []

def save_chat_history(chatbot_history):
    #Save the chatbot history to chat_history.json.
    try:
        with open("chat_history.json", "w", encoding="utf-8") as f:
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
        f"You are a culinary and nutritional assistant tasked with helping users create recipes and track calories.\n"
        f"For recipe requests, format your response as:\n"
        f"Recipe: [Recipe Name] .\n"
        f"Ingredients: [List each ingredient on a new line].\n"
        f"Instructions: [Detailed steps]\n"
        f"User details:\n" 
        f"User Age: {user.get('age', 'unknown')}-year-old, \n"
        f"You must respect user's Dietary preference: {user.get('food_preferences', {}).get('special_diet', 'no diet')} diet, \n"
        f"You must respect user's Allergies: {', '.join(user.get('food_preferences', {}).get('allergies', []))}, \n"
        f"The user's caloric Target: {user.get('calorie_target', 'unknown')} kcal/day.\n"
        f"You can only use the following ingredients: {', '.join([f'{i['quantity']} {i['unit']} {i['food']}' for i in ingredients])}.\n"
        f"Ignore ingredients that do not adhere to the user's Dietary preference or Allergies. You need not follow the caloric target strictly"
    )

# Load messagesample.json at startup
messagesample_data = load_messagesample()
system_prompt = format_context(messagesample_data)

def save_latest_response():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env")
    
    #Reading chat_history.json
    input_file = "chat_history.json"
    logger.debug(f"Reading input file: {input_file}")
    try:
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        logger.info("Generating response using chatbot")
        #Constructing prompt
        recipe = input_data.get("response","")
        prompt = [(
        f"Convert the following recipe into a json formatted string.\n"
        f"The json have the following keys: the endname(which is another word for recipe name), ingredients, and instruction. "
        f"Return only the json formatted string. You must not say anything else"
        f"The recipe is {recipe}"
        )]
        ai_msg = model.invoke(prompt)
    except Exception as e:
        logger.error(f"Error in chatbotTest: {str(e)}")
        raise
    #saving Gemini response as .json
    data = json.load(ai_msg.content)
    try:
        with open("recipe.json", "w") as file:
            json.dump(data, file, indent=2)
        print("JSON file 'recipe.json' created successfully.")
        return "Successfully saved"
    except Exception as e:
        print(f"Error creating JSON file: {str(e)}")
        return "Error saving"

    

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
        
        data = {
        "query": user_input,
        "response": assistant_response
        }

        # Save the updated chat history to JSON
        save_chat_history(data)
        
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