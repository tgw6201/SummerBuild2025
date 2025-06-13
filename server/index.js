const express = require("express")
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express()
const pool = require("./db");
const uuidv4 = require("uuid").v4;

//Middleware
app.use(cors());
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
        res.set("Set-Cookie", `sessionid=${sessionid}`);
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
        const { userid, password, sessionid } = req.body;
        const newUser = await pool.query(
            "INSERT INTO users (name, email) VALUES ($1, $2, $3) RETURNING *",
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
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    const {phoneNumber, name, gender, weight, height, date_of_birth} = req.body;
    try{
        const result = await pool.query(
            "UPDATE user_details SET phone_number = $1, name = $2, gender = $3, weight = $4, height = $5, date_of_birth = $6 WHERE userid_fk = $7 RETURNING *",[phoneNumber,name,gender,weight,height,date_of_birth,user.rows[0].userid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User dietary preferences not found" });
        }
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).send("Server Error");
    }
    res.status(201).json({ message: "User dietary preferences updated successfully" });
});

//Get user dietary preferences
app.get('/profile', async(req, res) => {
    const sessionid = req.cookies.sessionid;
    if (!sessionid) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Get useremail from sessionid
    const user = await pool.query("SELECT userid FROM user_login_table WHERE sessionid = $1", [sessionid]);
    if (user.rows.length === 0) {
        return res.status(404).json({ message: "invalid session id" });
    }

    pool.query("SELECT * FROM user_details WHERE userid_fk = $1", [user.rows[0].userid])
        .then(result => {
            if (result.rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            // Return the user details
            // Take note that date of birth might display differently based on timezone differences (inform me if need to adjust)
            res.json(result.rows[0]);
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

app.listen(5000,()=>{
    console.log("Server is running on port 5000")
});