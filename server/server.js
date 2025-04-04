const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;
const PORT = process.env.PORT || 3000;

// Database connection configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Default XAMPP password
    database: 'todo_webapp'
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to database successfully');
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Debugging Middleware
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.path}`);
    next();
});

// API Routes for Todo Tasks
app.get('/api/tasks', (req, res) => {
    connection.query('SELECT * FROM tasks', (error, results) => {
        if (error) {
            console.error('Error fetching tasks:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/tasks', (req, res) => {
    const { text, completed } = req.body;
    console.log('Creating task:', { text, completed });
    
    connection.query('INSERT INTO tasks (text, completed) VALUES (?, ?)', 
        [text, completed], 
        (error, results) => {
            if (error) {
                console.error('Error creating task:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Task created with ID:', results.insertId);
            res.status(201).json({ id: results.insertId });
        }
    );
});

app.put('/api/tasks/:id', (req, res) => {
    const { completed } = req.body;
    const taskId = req.params.id;
    
    console.log(`Updating task ${taskId}:`, { completed });
    
    connection.query('UPDATE tasks SET completed = ? WHERE id = ?', 
        [completed, taskId], 
        (error, results) => {
            if (error) {
                console.error('Error updating task:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Task updated. Affected rows:', results.affectedRows);
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.status(200).json({ message: 'Task updated' });
        }
    );
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    console.log(`Deleting task ${taskId}`);
    
    connection.query('DELETE FROM tasks WHERE id = ?', 
        [taskId], 
        (error, results) => {
            if (error) {
                console.error('Error deleting task:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Task deleted. Affected rows:', results.affectedRows);
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.status(200).json({ message: 'Task deleted' });
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start server
app.listen(port, () => {
    console.log(`To-do-list app listening at http://localhost:${port}`);
});