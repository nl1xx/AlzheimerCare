const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const dataRoutes = require('./routes/data');
const communityRoutes = require('./routes/community');
const medicationRoutes = require('./routes/medication');
const activityRoutes = require('./routes/activity');
const emergencyRoutes = require('./routes/emergency');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/export', exportRoutes);

// Root
app.get('/', (req, res) => {
  res.send('Alzheimer Care Assistant API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
