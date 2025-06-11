import requests
import json
import os

# Purpose: Load input JSON from project root, send it to the FastAPI endpoint, and save the response
# Read sample.json from project root
input_path = os.path.join(os.path.dirname(__file__), "sample.json")
with open(input_path, "r") as file:
    input_data = json.load(file)

# Send POST request to FastAPI endpoint
response = requests.post("http://localhost:8000/calorie-counter", json=input_data)
response.raise_for_status()  # Raise exception for HTTP errors

# Save response to output.json in project root
output_path = os.path.dirname(os.path.dirname(__file__), "output.json")
with open(output_path, "w") as file:
    json.dump(response.json(), file, indent=2)

print("Response saved to output.json")