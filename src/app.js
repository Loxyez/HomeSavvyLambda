const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const defectRoutes = require('./routes/defectRoutes');
const errorHandler = require('./middlewares/errorHandler');

const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/defects', defectRoutes);

app.use(errorHandler);

module.exports = app;