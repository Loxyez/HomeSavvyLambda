// Import required dependencies
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import the file system module
const defectRoutes = require('./src/routes/defectRoutes');

// Initialize express app
const app = express();

// Path to the uploads directory
const uploadsPath = path.join(__dirname, 'uploads');

// Check if the folder exists, and if not, create it
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true }); // recursive ensures nested directories are created
    console.log('Uploads folder created at:', uploadsPath);
} else {
    console.log('Uploads folder already exists at:', uploadsPath);
}

// Middleware setup
app.use(cors());
app.use(bodyParser.json());  // JSON parser middleware (used instead of body-parser)

// Static file serving for uploads
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/defects', defectRoutes);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
