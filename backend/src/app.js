const express = require('express');
const cors = require('cors');
const path = require('path');

const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/complaints', complaintRoutes);

// Welcome Route
app.get('/', (req, res) => {
  res.send('CivicSeva API is running...');
});

module.exports = app;
