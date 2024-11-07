const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 5000; // Port to run the server on localhost
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// MongoDB connection string
const uri = "mongodb+srv://kangaroogamingapo0731:ygcUu3ZLPpMy79jQ@fgapp.xk8n3.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=FGapp";

let client;

// Function to connect to MongoDB
const connectToDatabase = async () => {
    try {
        client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

// Define the updateTheme endpoint
app.post('/updateTheme', async (req, res) => {
    const { username, themeMode } = req.body;

    // Basic validation
    if (!username || (themeMode !== 0 && themeMode !== 1)) {
        return res.status(400).json({ message: 'Invalid data provided. Ensure themeMode is either 0 or 1.' });
    }

    try {
        const db = client.db('sample_mflix'); // Use your actual database name
        const result = await db.collection('settings').updateOne(
            { username: username }, // Match by username
            { $set: { themeMode: themeMode } }, // Set the themeMode (0 for light, 1 for dark)
            { upsert: true } // Insert if no document found for username
        );

        if (result.matchedCount === 0 && result.upsertedCount === 0) {
            return res.status(404).json({ message: 'User settings not found, and failed to create new entry.' });
        }

        res.status(200).json({ message: 'Theme updated successfully!' });
    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/getTheme', async (req, res) => {
    const { username } = req.query; // Get the username from the query parameters

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const database = client.db('sample_mflix'); // Replace with your actual database name
        const collection = database.collection('settings'); // Assuming you're using a `settings` collection
        const user = await collection.findOne({ username: username }); // Fetch user by username

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Fetched user:', user); // Check if user data is fetched correctly

        // Return the themeMode in response
        res.json({ themeMode: user.themeMode });
    } catch (error) {
        console.error("Error fetching theme:", error);
        res.status(500).json({ message: 'Error fetching theme' });
    }
});

// Define the updateProfile endpoint
app.post('/updateProfile', async (req, res) => {
    const { username, displayName, bio } = req.body;

    // Basic validation
    if (!username || (!displayName && !bio)) {
        return res.status(400).json({ message: 'Invalid data provided.' });
    }

    try {
        const db = client.db('sample_mflix'); // Use your actual database name
        const updateData = {};
        
        // Update only if new data is provided
        if (displayName) updateData.Name = displayName; // Use Name for display name
        if (bio) updateData.Bio = bio; // Use Bio for bio

        const result = await db.collection('users').updateOne(
            { username: username },
            { $set: updateData } // Overwrite existing Name and Bio
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Define the /userProfile endpoint
app.get('/userProfile', async (req, res) => {
    const { username } = req.query; // Get the username from the query parameters

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const database = client.db('sample_mflix'); // Use your actual database name
        const collection = database.collection('users'); // Use your actual collection name
        const user = await collection.findOne({ username: username }); // Find user by username

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user profile data (assuming you want to return displayName and bio)
        res.json({
            displayName: user.Name, // Adjust according to your data structure
            bio: user.Bio // Adjust according to your data structure
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Start the server and connect to the database
app.listen(port, async () => {
    try {
        await connectToDatabase();
        console.log(`Server is running on http://localhost:${port}`);
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1); // Exit the process with a failure code
    }
});

// Define the /AddProfile endpoint
app.post('/AddProfile', async (req, res) => {
    const { username, displayName, bio, createdAt, Gmail, password } = req.body; // Include Gmail and password

    // Basic validation
    if (!username || !displayName || !Gmail || !password) { // Ensure Gmail and password are provided
        return res.status(400).json({ message: 'Username, display name, Gmail, and password are required.' });
    }

    try {
        const db = client.db('sample_mflix'); // Use your actual database name
        const newUser = {
            username,
            Name: displayName,
            Gmail, // Save Gmail
            password, // Save the hashed password
            Bio: bio || '',
            createdAt // Add timestamp
        };

        const result = await db.collection('users').insertOne(newUser);

        if (!result.insertedId) {
            return res.status(500).json({ message: 'Failed to create user profile.' });
        }

        res.status(201).json({ message: 'User profile created successfully!' });
    } catch (error) {
        console.error('Error adding profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Export the connection function and client for use in other files
module.exports = {
    connectToDatabase,
    getClient: () => client
};
