const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 5000;

// MongoDB connection string
const uri = "mongodb+srv://kangaroogamingapo0731:ygcUu3ZLPpMy79jQ@fgapp.xk8n3.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=FGapp";

let client;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const connectToDatabase = async () => {
    try {
        client = await MongoClient.connect(uri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

// Endpoint to update user profile
app.post('/updateProfile', async (req, res) => {
    console.log('Request body:', req.body); // Log the entire request body
    const { username, displayName, bio } = req.body;

    // Check if the request body is received correctly
    if (!username || (!displayName && !bio)) {
        return res.status(400).send({ message: 'Invalid data provided.' });
    }

    try {
        const db = client.db();
        const updateData = {};
        if (displayName) updateData.Name = displayName; 
        if (bio) updateData.Bio = bio; 

        console.log('Updating profile for username:', username);
        console.log('Update data:', updateData);

        const result = await db.collection('users').updateOne(
            { username }, 
            { $set: updateData }
        );

        console.log('Update result:', result);

        if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'User not found.' });
        }

        res.status(200).send({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
});

// Endpoint to get user profile by username
app.get('/getUserProfile', async (req, res) => {
    const { username } = req.query; // Get the username from the query parameters
    console.log('Received username:', username); // Log the received username

    const trimmedUsername = username.trim(); // Trim for the query
    console.log('Trimmed username for DB query:', trimmedUsername);

    try {
        const db = client.db();
        const user = await db.collection('users').findOne({ username: trimmedUsername }); // Use trimmed username

        if (user) {
            console.log('User found:', user); // Log the user data
            res.status(200).send({ Name: user.Name, Bio: user.Bio });
        } else {
            console.log(`User not found for username: ${trimmedUsername}`); // Log if no user is found
            res.status(404).send({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error); // Log the error
        res.status(500).send({ message: 'Internal server error.' });
    }
});
// Start the server
app.listen(port, () => {
    connectToDatabase().then(() => {
        console.log(`Server is running on http://localhost:${port}`);
    }).catch(error => {
        console.error('Failed to connect to the database:', error);
        process.exit(1); // Exit the process with failure
    });
});
