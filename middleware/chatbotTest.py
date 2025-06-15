import json
import asyncio
import logging
from chatbot import generate_response

logging.basicConfig(level=logging.DEBUG, handlers=[logging.FileHandler("chatbotTest.log"), logging.StreamHandler()])
logger = logging.getLogger(__name__)

async def main():
    input_file = "messagesample.json"
    logger.debug(f"Reading input file: {input_file}")
    try:
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        logger.info("Generating response using chatbot")
        response = await generate_response(input_data)
        output_file = "../messageoutput.json"
        with open(output_file, 'w') as f:
            json.dump(response, f, indent=2)
        logger.info(f"Response saved to {output_file}")
    except Exception as e:
        logger.error(f"Error in chatbotTest: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())