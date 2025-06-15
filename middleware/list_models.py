import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env")

genai.configure(api_key=api_key)

models = genai.list_models()
for model in models:
    print(f"Model: {model.name}, Supported Methods: {model.supported_generation_methods}")