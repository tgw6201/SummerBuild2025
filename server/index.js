const express = require("express")
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pool = require("./db");
const uuidv4 = require("uuid").v4;
const app = express()

const port = process.env.PORT || 3000;

//Middleware
app.use(cors({
    origin: "http://localhost:5173", // Update this to your frontend URL
    credentials: true, // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(cookieParser());

//ROUTES//

//Login page

//Login user
app.post("/login", async (req, res) => {
    try {
        const { userid, password } = req.body;
        const user = await pool.query("SELECT * FROM user_login_table WHERE userid = $1 AND password = $2", [userid, password]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a new session ID
        const sessionid = uuidv4();
        res.cookie("sessionid", sessionid, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
        });
        // Update the user's session ID in the database
        await pool.query("UPDATE user_login_table SET sessionid = $1 WHERE userid = $2", [sessionid, userid]);
        // Return the user data along with the new session ID
        user.rows[0].sessionid = sessionid;
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Sign up page

//Create a user
app.post("/signup", async (req, res) => {
    try {
        const { userid, password } = req.body;

        // Check if the user already exists
        const existingUser = await pool.query("SELECT * FROM user_login_table WHERE userid = $1", [userid]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Generate a new session ID
        const sessionid = uuidv4();
        res.cookie("sessionid", sessionid, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
        });
        if (!userid || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const newUser = await pool.query(
            "INSERT INTO user_login_table (userid, password, sessionid) VALUES ($1, $2, $3) RETURNING *",
            [userid, password, sessionid]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Check if user exists
app.get("/users/:userid", async (req, res) => {
    try {
        const { userid } = req.params;
        const user = await pool.query("SELECT * FROM user_login_table WHERE userid = $1", [userid]);
        if (user.rows.length === 0) {
            return res.status(200).json({ message: "Valid Email" });
        }
        // Returning of data, prepare to modify to exclude sensitive information (only return sessionid)
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Onboarding page

//Create user dietary preferences
app.post('/profile', async(req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const {phoneNumber, name, gender, weight, height, date_of_birth} = req.body;
    try{
        const result = await pool.query(
            "INSERT INTO user_details (phone_number, name, gender, weight, height, date_of_birth, userid_fk) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",[phoneNumber,name,gender,weight,height,date_of_birth,user.rows[0].userid])
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send("Server Error");
    }
    res.status(201).json({ message: "User dietary preferences created successfully" });
});

// Update user dietary preferences
app.put('/profile', async (req, res) => {
  const sessionid = req.cookies.sessionid;
  if (!sessionid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await pool.query(
    "SELECT userid FROM user_login_table WHERE sessionid = $1",
    [sessionid]
  );
  if (user.rows.length === 0) {
    return res.status(404).json({ message: "Invalid session id" });
  }

  const {
    name,
    phone_number,
    gender,
    weight,
    height,
    date_of_birth,
    daily_calorie_goal,
    dietary_preference,
    profile_image,
    allergies
  } = req.body;

  // Convert image data to Buffer if it exists
  let imageBuffer = null;
  if (profile_image && profile_image.data) {
    imageBuffer = Buffer.from(profile_image.data);
  }

  try {
    const updateUserDetailResult = await pool.query(
      `UPDATE user_details 
       SET phone_number = $1, name = $2, gender = $3, weight = $4, 
           height = $5, date_of_birth = $6, profile_image = $7 
       WHERE userid_fk = $8 
       RETURNING *`,
      [
        phone_number,
        name,
        gender,
        weight,
        height,
        date_of_birth,
        imageBuffer,
        user.rows[0].userid
      ]
    );

    const updateDietaryPreference = await pool.query(
      `UPDATE user_dietary_preference 
       SET dietary_preference = $1, daily_calorie_goal = $2, allergies = $3 
       WHERE userid = $4 
       RETURNING *`,
      [
        dietary_preference,
        daily_calorie_goal,
        allergies,
        user.rows[0].userid
      ]
    );

    if (updateUserDetailResult.rows.length === 0 || updateDietaryPreference.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(201).json({ message: "User dietary preferences updated successfully" });

  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send("Server Error");
  }
});


//Get user dietary preferences
app.get('/profile', async (req, res) => {
  const sessionid = req.cookies.sessionid;
  if (!sessionid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
  if (user.rows.length === 0) {
    return res.status(404).json({ message: "Invalid session ID" });
  }

  pool.query(
    `SELECT * 
     FROM user_details ud
     JOIN user_dietary_preference udp ON ud.userid_fk = udp.userid
     WHERE ud.userid_fk = $1`,
    [user.rows[0].userid]
  )
    .then(result => {
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = result.rows[0];

      if (userData.profile_image) {
        const contentType = userData.profile_image_type || 'image/png';
        const byteArray = [...userData.profile_image]; // Convert Buffer to array
        userData.profile_image = {
            data: byteArray,
            contentType: contentType
        };
        } else {
        userData.profile_image = {
            data: [],
            contentType: ''
        };
    }

      res.json(userData);
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).send("Server Error");
    });
});


// Create dietary preferences
app.post('/dietary-preferences', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { allergies, dietary_preference, daily_calorie_goal } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO user_dietary_preference (userid, allergies, dietary_preference, daily_calorie_goal) VALUES ($1, $2, $3, $4) RETURNING *",
            [user.rows[0].userid, allergies, dietary_preference, daily_calorie_goal]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get dietary preferences
app.get('/dietary-preferences', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    try {
        const result = await pool.query("SELECT * FROM user_dietary_preference WHERE userid = $1", [user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Dietary preferences not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
// Update dietary preferences
app.put('/dietary-preferences', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { allergies, dietary_preference, daily_calorie_goal } = req.body;
    try {
        const result = await pool.query(
            "UPDATE user_dietary_preference SET allergies = $1, dietary_preference = $2, daily_calorie_goal = $3 WHERE userid = $4 RETURNING *",
            [allergies, dietary_preference, daily_calorie_goal, user.rows[0].userid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Dietary preferences not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Connsumed meals

// Create consumed meal
app.post('/consumed-meals', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { mid } = req.body;

    // Get current day and date
    const now = new Date();
    const day = now.toLocaleString('en-US', { weekday: 'long' }); // e.g. "Monday"
    const date = now.toISOString().split('T')[0]; // e.g. "2025-06-23"

    try {
        const result = await pool.query(
            "INSERT INTO consumed_meals (mid, userid, day, date) VALUES ($1, $2, $3, $4) RETURNING *",
            [mid, user.rows[0].userid, day, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// read consumed meals
app.get('/consumed-meals', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    try {
        const result = await pool.query("SELECT * FROM consumed_meals WHERE userid = $1", [user.rows[0].userid]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
// Delete consumed meal
app.delete('/consumed-meals/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM consumed_meals WHERE cmid = $1 AND userid = $2 RETURNING *", [id, user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Consumed meal not found" });
        }
        res.json({ message: "Consumed meal deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Update consumed meal
app.put('/consumed-meals/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    const { mid, day, date } = req.body;
    try {
        const result = await pool.query(
            "UPDATE consumed_meals SET mid = $1, day = $2, date = $3 WHERE id = $4 AND userid = $5 RETURNING *",
            [mid, day, date, id, user.rows[0].userid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Consumed meal not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Create saved user meals
app.post('/saved-meals/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const mid = req.params.id; // Get mid from URL parameter
    const { mname } = req.body;
    const alreadySaved = await pool.query(
        'SELECT 1 FROM saved_user_meals WHERE mid = $1 AND userid = $2',
        [mid, user.rows[0].userid]
    );
    if (alreadySaved.rowCount > 0) {
        return res.status(409).json({ message: 'Recipe already favorited' });
        }
    try {
        const result = await pool.query(
            "INSERT INTO saved_user_meals (mid, userid, mname) VALUES ($1, $2, $3) RETURNING *",
            [mid,user.rows[0].userid, mname]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Read saved user meals
app.get('/saved-meals', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    try {
        const result = await pool.query("SELECT * FROM saved_user_meals WHERE userid = $1 ORDER BY mid ", [user.rows[0].userid]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Delete saved user meal
app.delete('/saved-meals/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM saved_user_meals WHERE mid = $1 AND userid = $2 RETURNING *", [id, user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Saved meal not found" });
        }
        res.json({ message: "Saved meal deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
// Update saved user meal
app.put('/saved-meals/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    const { mname } = req.body;
    try {
        const result = await pool.query(
            "UPDATE saved_user_meals SET mname = $1 WHERE mid = $2 AND userid = $3 RETURNING *",
            [mname, id, user.rows[0].userid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Saved meal not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Create Chatbot History
app.post('/chatbot-history', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { query, response } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO chatbot_history_table (userid, date, user_question, ai_response) VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *",
            [user.rows[0].userid, query, response]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Get Chatbot History
app.get('/chatbot-history', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    try {
        const result = await pool.query("SELECT * FROM chatbot_history_table WHERE userid = $1 ORDER BY cid DESC", [user.rows[0].userid]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
//Delete Chatbot History
app.delete('/chatbot-history/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM chatbot_history_table WHERE id = $1 AND userid = $2 RETURNING *", [id, user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Chatbot history not found" });
        }
        res.json({ message: "Chatbot history deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Get user recipie table
app.get('/user-recipes', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    try {
        const result = await pool.query("SELECT * FROM user_recipe_table WHERE userid = $1", [user.rows[0].userid]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get('/user-recipes/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);

    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM user_recipe_table WHERE mid = $1 AND userid = $2", [id, user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User recipe not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

    //Create user recipe
app.post('/user-recipes', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    let { mname, recipe_ingredients, recipe_instruction, calories } = req.body;



    try {
        const result = await pool.query(
            "INSERT INTO user_recipe_table (userid, mname, recipe_instruction, recipe_ingredients, calories) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [user.rows[0].userid, mname, recipe_instruction, recipe_ingredients, calories]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Update user recipie
app.put('/user-recipes/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    const { mname, recipe_ingredients, recipe_instruction, calories } = req.body;
    try {
        const result = await pool.query(
            "UPDATE user_recipe_table SET mname = $1, recipe_ingredients = $2, recipe_instruction = $3, calories = $4 WHERE mid = $5 AND userid = $6 RETURNING *",
            [mname, recipe_ingredients, recipe_instruction, calories, id, user.rows[0].userid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User recipe not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Delete user recipe
app.delete('/user-recipes/:id', async (req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM user_recipe_table WHERE mid = $1 AND userid = $2 RETURNING *", [id, user.rows[0].userid]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User recipe not found" });
        }
        res.json({ message: "User recipe deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});  

app.post('/onboarding', async (req, res) => {
    const sessionid = req.cookies.sessionid;

    console.log("Session ID:", sessionid);
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const { phone, name, gender, weight, height, date_of_birth, allergies, dietary_preference, calorie_goal } = req.body;

    try {
        // Insert user details
        await pool.query(
            "INSERT INTO user_details (phone_number, name, gender, weight, height, date_of_birth, userid_fk) VALUES ($1, $2, $3, $4, $5, $6, $7)",[phone, name, gender, weight, height, date_of_birth, user.rows[0].userid]
        );
        // Insert dietary preferences
        await pool.query(
            "INSERT INTO user_dietary_preference (userid, allergies, dietary_preference, daily_calorie_goal) VALUES ($1, $2, $3, $4)",[user.rows[0].userid, allergies, dietary_preference, calorie_goal]
        );
        res.status(201).json({ message: "Onboarding completed successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})


app.post('/logout', (req, res) => {
    res.clearCookie("sessionid", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
    }); 
    res.status(200).json({ message: "Logged out successfully" });
});


app.listen(3000,()=>{
    console.log("Server is running on port: ", port);
});