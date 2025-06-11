import requests
import json

# Purpose: Load input JSON, send it to the FastAPI endpoint, and save the response
# Read sample.json
with open("sample.json", "r") as file:
    input_data = json.load(file)

# Send POST request to FastAPI endpoint
response = requests.post("http://localhost:8000/calorie-counter", json=input_data)
response.raise_for_status()  # Raise exception for HTTP errors

# Save response to output.json
with open("output.json", "w") as file:
    json.dump(response.json(), file, indent=2)

print("Response saved to output.json")