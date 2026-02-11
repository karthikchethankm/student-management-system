const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));
// 1. Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP user
    password: '',      // Default XAMPP password is empty
    database: 'sms_db'
});

db.connect(err => {
    if (err) { console.error('DB Connection Failed:', err); } 
    else { console.log('Connected to MySQL Database'); }
});

// 2. Routes (API Endpoints)

// Sign Up
app.post('/register', (req, res) => {
    const { name, email, course, password } = req.body;
    const sql = "INSERT INTO students (name, email, course, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, course, password], (err, result) => {
        if (err) return res.json({ success: false, message: 'Email already exists or error' });
        res.json({ success: true, id: result.insertId });
    });
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Check for Admin
    if(email === 'Admin' && password === 'admin123') {
        return res.json({ success: true, isAdmin: true });
    }

    // Check for Student
    const sql = "SELECT * FROM students WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, data) => {
        if (err || data.length === 0) return res.json({ success: false, message: 'Wrong details' });
        res.json({ success: true, isAdmin: false, student: data[0] });
    });
});

// Update Marks (After Signup)
app.post('/update-marks', (req, res) => {
    const { id, s1, s2, s3, s4, s5 } = req.body;
    const sql = "UPDATE students SET sem1=?, sem2=?, sem3=?, sem4=?, sem5=? WHERE id=?";
    db.query(sql, [s1, s2, s3, s4, s5, id], (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// Get Student Dashboard Data
app.get('/student/:id', async (req, res) => {
    const id = req.params.id;
    // Use promise-based queries for cleaner async/await
    const dbPromise = db.promise();

    try {
        // Get student's info and class average in parallel for efficiency
        const [studentResult, classAvgResult] = await Promise.all([
            dbPromise.query("SELECT * FROM students WHERE id = ?", [id]),
            dbPromise.query("SELECT AVG((sem1 + sem2 + sem3 + sem4 + sem5) / 5) as classAvg FROM students")
        ]);

        const [studentData] = studentResult;
        if (studentData.length === 0) {
            return res.status(404).json({ error: true, message: 'Student not found' });
        }
        const student = studentData[0];

        // Calculate student's average, handling potential null marks
        const studentMarks = [student.sem1, student.sem2, student.sem3, student.sem4, student.sem5].map(m => Number(m) || 0);
        const studentTotal = studentMarks.reduce((sum, mark) => sum + mark, 0);
        const studentAvg = studentMarks.length > 0 ? studentTotal / studentMarks.length : 0;

        const classAvg = classAvgResult[0][0].classAvg || 0;

        res.json({
            name: student.name,
            course: student.course, // Added course details
            marks: studentMarks,
            yourAvg: studentAvg.toFixed(2),
            classAvg: parseFloat(classAvg).toFixed(2)
        });
    } catch (err) {
        console.error('Error fetching student dashboard data:', err);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
});

// Admin: Get All Students
app.get('/all-students', (req, res) => {
    db.query("SELECT * FROM students", (err, data) => {
        res.json(data);
    });
});

// Admin: Delete Student
app.delete('/delete/:id', (req, res) => {
    db.query("DELETE FROM students WHERE id = ?", [req.params.id], (err, result) => {
        res.json({ success: true });
    });
});

// Start Server
app.listen(3000, () => {
    console.log('Backend running on port 3000');
});