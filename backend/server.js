
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 30001;

app.use(cors());
app.use(bodyParser.json());




// Connect to the database ----------------------------------------------------------------------

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Vipro1604',
    database: 'database'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});




// get data function --------------------------------------------------------------------

app.get('/accounts', (req, res) => {
    const accountsQuery = 'SELECT AccID, AccUsername, AccPassword FROM account';

    db.query(accountsQuery, (err, accountsResults) => {
        if (err) {
            console.error('Accounts query error:', err.stack);
            return res.status(500).json({ error: 'Accounts query error' });
        }
    res.json({
        accounts: accountsResults,
    });
    });
});


app.get('/notes', (req, res) => {
    const notesQuery = 'SELECT NoteID, NoteTitle, NoteDetails FROM note';
    db.query(notesQuery, (err, notesResults) => {
        if (err) {
            console.error('Notes query error:', err.stack);
            return res.status(500).json({ error: 'Notes query error' });
        }

    res.json({
        notes: notesResults
    });
    });
});




// Login function -------------------------------------------------------------------------------

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT AccID, AccUsername FROM account WHERE AccUsername = ? AND AccPassword = ?';

    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error('Login query error:', err.stack);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length > 0) {
            res.json({
                message: 'Login successful',
                userId: results[0].AccID,
                username: results[0].AccUsername
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    });
});




// Register function --------------------------------------------------------------------------
app.post('/accounts', (req, res) => {
    const { AccUsername, AccPassword } = req.body;

    const sql = 'INSERT INTO account (AccUsername, AccPassword) VALUES (?, ?)';
    
    db.query(sql, [AccUsername, AccPassword], (err, results) => {
        if (err) {
            console.error('Insert account error:', err.stack);
            return res.status(500).json({ error: 'Failed to register' });
        }

        const newAccID = results.insertId;

        
        const infoSql = 'INSERT INTO info (AccID, Spending) VALUES (?, ?)';
        
        db.query(infoSql, [newAccID, 0], (err) => {
            if (err) {
                console.error('Insert info error:', err.stack);
                return res.status(500).json({ error: 'Failed to initialize spending information' });
            }
            res.status(201).json({ message: 'Registered successfully', AccID: newAccID, AccUsername: AccUsername });

        });
    });
});







// Ranking function ---------------------------------------------------------------
app.get('/ranking', (req, res) => {
    const rankingQuery = `
        SELECT a.AccUsername, SUM(i.Spending) AS TotalSpending
        FROM account a
        LEFT JOIN info i ON a.AccID = i.AccID
        GROUP BY a.AccID
        ORDER BY TotalSpending DESC
    `;

    db.query(rankingQuery, (err, rankingResults) => {
        if (err) {
            console.error('Ranking query error:', err.stack);
            return res.status(500).json({ error: 'Ranking query error' });
        }

        res.json({
            ranking: rankingResults,
        });
    });
});




 // Delete account function -------------------------------------------------------------------

 app.delete('/accounts/:id', (req, res) => {
    const accountId = req.params.id;

    // Delete spending records related to the account
    const deleteSpendingSql = 'DELETE FROM info WHERE AccID = ?';
    db.query(deleteSpendingSql, [accountId], (err, spendingResults) => {
        if (err) {
            console.error('Delete info error:', err.stack);
            return res.status(500).json({ error: 'Failed to delete info records' });
        }

        // After spending records are deleted, delete the account
        const deleteAccountSql = 'DELETE FROM account WHERE AccID = ?';
        db.query(deleteAccountSql, [accountId], (err, accountResults) => {
            if (err) {
                console.error('Delete account error:', err.stack);
                return res.status(500).json({ error: 'Failed to delete account' });
            }

            res.json({ message: 'Account and related spending records deleted successfully' });
        });
    });
});






// Update total spending function -------------------------------------------------------------------
app.put('/spending/:userId', (req, res) => {
    const userId = req.params.userId;
    const { totalSpending } = req.body;

    const sql = 'UPDATE info SET Spending = ? WHERE AccID = ?';

    db.query(sql, [totalSpending, userId], (err, results) => {
        if (err) {
            console.error('Update spending error:', err.stack);
            return res.status(500).json({ error: 'Failed to update spending' });
        }
        res.json({ message: 'Spending updated successfully' });
    });
});





app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});



