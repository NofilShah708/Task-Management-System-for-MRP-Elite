const env = require('dotenv');
env.config();
const express = require('express');
const database = require('./config/db.config');
database.database();
const cookieParser = require('cookie-parser');
const app = express();

// Skip ngrok browser warning
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

const cors = require('cors');

// Routes
const adminRoutes = require('./routes/adminRouter');
const userRoutes = require('./routes/userRouter');
const taskRoutes = require('./routes/taskRouter')

const allowedOrigins = [
  "https://mrpelite-tms.netlify.app",
  "https://mrp-tms.netlify.app",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/admin', adminRoutes, taskRoutes);
app.use('/user', userRoutes, taskRoutes);
app.use('/auth', userRoutes);
app.use('/auth/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
}
);

const PORT = process.env.PORT || 4041;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
