const env = require('dotenv');
env.config();
const express = require('express');
const database = require('./config/db.config');
database.database();
const cookieParser = require('cookie-parser');
const app = express();
const cors = require('cors');

// Routes
const adminRoutes = require('./routes/adminRouter');
const userRoutes = require('./routes/userRouter');
const taskRoutes = require('./routes/taskRouter')

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // your frontend URL(s)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // allows cookies, JWT, etc.
  })
);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 