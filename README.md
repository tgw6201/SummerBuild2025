# Calorie Chat

**Calorie Chat** is a smart, AI-powered nutrition assistant designed to help users track their calories, log meals, and generate healthy recipes based on dietary preferences and personal goals. It combines the power of generative AI with an intuitive user experience to make calorie counting and meal planning effortless.

---

## Features

### AI-Enhanced Capabilities
- GenAI Chatbot Calorie Counter – Log and calculate meal calories with conversational ease.
- AI Recipe Suggestions – Get recipes based on groceries, diet goals, and preferences.
- AI Verdicts – Get nutritional feedback on custom recipes (e.g., Balanced, High Sugar).

### Core Functionality
- Calorie Logging – Seamless input of daily food intake with database-backed tracking.
- Calorie Goal & Diet Tracking – Visual indicators and stats for streaks and progress.
- Manual Recipe Input – Create and edit your own recipes with calorie estimation.

### Analytics & History
- Weekly Progress Charts – Visual breakdown of calorie intake vs. goals.
- Food History – Track what you ate and when.
- Export to CSV – Easily download your data via the web app.

---

## App Pages Overview

### Landing Page
- Navigation bar: Login | Sign Up
- Email verification
- “About Us” section
- Background image with smiling people

### Authentication
- Login Page
- Signup Page
- Forget Password *(coming soon)*

### Onboarding Page
- Goal setting: Gender, Age, Weight, Height, Calorie Goal
- Dietary Preferences & Allergies

### Dashboard
- Calorie Goal + % Met
- Healthy plate balance
- Meal suggestions (Breakfast, Lunch, Dinner, Snacks)
- Weekly bar chart: Calorie vs Goal
- Favorite dishes (clickable)
- "Create Recipe" / "Generate Recipe" buttons

### Recipe Pages
- Manual Recipe Input / Edit Recipe
- Name, Ingredients, Instructions
- Estimated calories & AI Verdict
- "Save Recipe and Eat" button

### AI Chatbot
- Natural language interface for:
  - Suggesting recipes
  - Logging meals
  - Tracking calories
- Chat history and suggested commands

### User Profile
- Avatar and Name
- Editable profile details
- Export data as CSV
- Bookmarked recipes

### Settings Page
- Change password, username, goal, and dietary settings

---

## Tech Stack

- **Frontend:** React / Vite (or optionally Next.js)
- **Backend:** Node.js / Express
- **Database:** PostgreSQL
- **AI Integration:** OpenAI / Langchain / Custom NLP models

---

## Project Structure

calorie-chat/\
│\
├── client/                  # Frontend code (React + Vite)\
│   ├── public/              # Static assets\
│   ├── src/                 # Source code (components, pages, etc.)\
│   └── package.json         # Frontend dependencies and scripts\
│\
├── server/                  # Backend code (Express API)\
│   ├── controllers/         # Request handlers\
│   ├── routes/              # API routes\
│   ├── models/              # Database models\
│   ├── db.js                # DB connection logic\
│   └── index.js             # Entry point for server\
│\
├── .env                     # Environment variables\
├── README.md                # Project documentation\
└── package.json             # (Optional) root-level metadata (if needed)\

## Necessary installs
1. npm install -g vite -> Client Side
2. npm install react react-dom -> Client Side
3. npm install express pg cors (Express, Postgresql, Cors) -> Sever side
4. npm install -g nodemon
5. npm install
6. npm install uuid (for generating session id for users)
7. npm install cookie parser
## Starting the client side
Step 1: CD into the client directory\
Step 2: Run the command, "npm run dev"

## Starting the server side
Step 1: CD into the server directory\
Step 2: Run the command, "nodemon index"
