import json
import os
import asyncio
import logging
from chatbot import generate_response

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("middleware/chatbotTest.log")
    ]
)
logger = logging.getLogger(__name__)

async def main():
    try:
        # Define file paths
        project_root = os.path.dirname(os.path.dirname(__file__))
        input_file = os.path.join(project_root, "messagesample.json")
        output_file = os.path.join(project_root, "messageoutput.json")

        # Read input JSON
        logger.debug("Reading input file: %s", input_file)
        if not os.path.exists(input_file):
            logger.error(f"Input file not found: {input_file}")
            raise FileNotFoundError(f"Input file not found: {input_file}")
        with open(input_file, "r") as f:
            input_data = json.load(f)

        # Generate response
        logger.info("Generating response using chatbot")
        response = await generate_response(input_data)

        # Write output JSON
        logger.debug("Writing output to: %s", output_file)
        with open(output_file, "w") as f:
            json.dump(response, f, indent=2)
        logger.info("Output written successfully: %s", response)

    except Exception as e:
        logger.error(f"Error in chatbotTest: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    asyncio.run(main())