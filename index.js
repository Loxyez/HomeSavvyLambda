// Import required dependencies
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const defectRoutes = require('./src/routes/defectRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

// Initialize express app
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());  // JSON parser middleware (used instead of body-parser)

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/defects', defectRoutes);

// Error handling middleware
app.use(errorHandler);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
