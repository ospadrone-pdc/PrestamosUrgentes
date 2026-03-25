const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool: poolPromise } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/debug/db', async (req, res) => {
    try {
        console.log('Diagnostic: Awaiting poolPromise...');
        const pool = await poolPromise;
        if (!pool) {
            console.error('Diagnostic: Pool is undefined!');
            throw new Error('No se pudo establecer conexión con la base de datos (Pool undefined)');
        }
        
        console.log('Diagnostic: Pool acquired, querying schema...');
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
        const columns = await pool.request().query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Partners'");
        res.json({ tables: tables.recordset, partnersColumns: columns.recordset });
    } catch (err) {
        console.error('Diagnostic Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- API ROUTES ---

// 1. Clients
app.get('/api/clients', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT *, (SELECT COUNT(*) FROM Loans WHERE ClientId = Clients.Id AND Status = \'Active\') as ActiveLoansCount FROM Clients ORDER BY CreatedAt DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/clients/:id/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT * FROM Loans WHERE ClientId = $1 ORDER BY CreatedAt DESC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const { name, email, phone, address, notes } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO Clients (Name, Email, Phone, Address, Notes) VALUES ($1, $2, $3, $4, $5)',
            [name, email, phone, address, notes]
        );
        res.json({ message: 'Cliente creado con éxito' });
    } catch (err) {
        console.error('API Error (POST Clients):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, notes } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'UPDATE Clients SET Name = $1, Email = $2, Phone = $3, Address = $4, Notes = $5 WHERE Id = $6',
            [name, email, phone, address, notes, id]
        );
        res.json({ message: 'Cliente actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.query('DELETE FROM Clients WHERE Id = $1', [req.params.id]);
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Loans
app.get('/api/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT l.*, c.Name as ClientName 
            FROM Loans l 
            JOIN Clients c ON l.ClientId = c.Id 
            ORDER BY l.CreatedAt DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('API Error (GET Loans):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Stats (Dashboard)
app.get('/api/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const totalPortfolio = await pool.query('SELECT SUM(Amount) as Total FROM Loans');
        const activeClients = await pool.query('SELECT COUNT(*) as Total FROM Clients');
        const riskyLoans = await pool.query("SELECT COUNT(*) as Total FROM Loans WHERE Light = 'Red'");
        
        res.json({
            totalPortfolio: totalPortfolio.rows[0].total || 0,
            activeClients: activeClients.rows[0].total || 0,
            riskyLoans: riskyLoans.rows[0].total || 0
        });
    } catch (err) {
        console.error('API Error (GET Partners):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Partners (Investors & Referrers)
app.get('/api/partners', async (req, res) => {
    const { type } = req.query; // Optional filter
    try {
        const pool = await poolPromise;
        let query = `
            SELECT P.*, 
                   (SELECT COUNT(*) FROM LoanInvestors LI 
                    JOIN Loans L ON LI.LoanId = L.Id 
                    WHERE LI.PartnerId = P.Id AND L.Status = 'Active') as ActiveLoansCount,
                   (SELECT COUNT(DISTINCT PR.ClientId) FROM Valuations V
                    JOIN Properties PR ON V.PropertyId = PR.Id
                    WHERE V.ReferrerId = P.Id) as ReferredClientsCount
            FROM Partners P
        `;
        const params = [];
        if (type) {
            query += ` WHERE P.Type = $1`;
            params.push(type);
        }
        query += ' ORDER BY P.CreatedAt DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('API Error (GET Partners):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/partners', async (req, res) => {
    const { name, type, phone, email, commissionRate, balance } = req.body;
    try {
        const pool = await poolPromise;
        const rate = parseFloat(commissionRate);
        const bal = parseFloat(balance);
        await pool.query(
            'INSERT INTO Partners (Name, Type, Phone, Email, CommissionRate, Balance) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, type, phone, email, isNaN(rate) ? 0 : rate, isNaN(bal) ? 0 : bal]
        );
        res.json({ message: 'Socio creado con éxito' });
    } catch (err) {
        console.error('API Error (POST Partners):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/partners/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, phone, email, commissionRate, balance } = req.body;
    try {
        const pool = await poolPromise;
        const rate = parseFloat(commissionRate);
        const bal = parseFloat(balance);
        await pool.query(
            'UPDATE Partners SET Name = $1, Type = $2, Phone = $3, Email = $4, CommissionRate = $5, Balance = $6 WHERE Id = $7',
            [name, type, phone, email, isNaN(rate) ? 0 : rate, isNaN(bal) ? 0 : bal, id]
        );
        res.json({ message: 'Socio actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/partners/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.query('DELETE FROM Partners WHERE Id = $1', [req.params.id]);
        res.json({ message: 'Socio eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Properties
app.get('/api/properties', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT p.*, c.Name as OwnerName,
            (SELECT ApprovedAmount FROM Valuations WHERE PropertyId = p.Id AND Status = 'Evaluated' ORDER BY CreatedAt DESC LIMIT 1) as ValuatedAmount
            FROM Properties p 
            JOIN Clients c ON p.ClientId = c.Id 
            ORDER BY p.CreatedAt DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('API Error (GET Properties):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/properties', async (req, res) => {
    const { clientId, description, location, estimatedValue, status } = req.body;
    try {
        const pool = await poolPromise;
        const value = parseFloat(estimatedValue);
        await pool.query(
            'INSERT INTO Properties (ClientId, Description, Location, EstimatedValue, Status) VALUES ($1, $2, $3, $4, $5)',
            [clientId, description, location, isNaN(value) ? 0 : value, status || 'Available']
        );
        res.json({ message: 'Propiedad creada con éxito' });
    } catch (err) {
        console.error('API Error (POST Properties):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loans', async (req, res) => {
    const { clientId, propertyId, amount, interestRate, lateFeeRate, term, investors } = req.body;
    const client = await poolPromise.connect();
    try {
        await client.query('BEGIN');

        const loanRes = await client.query(`
            INSERT INTO Loans (ClientId, PropertyId, Amount, InterestRate, MoratorioRate, TermMonths, Status, StartDate)
            VALUES ($1, $2, $3, $4, $5, $6, 'Active', CURRENT_DATE)
            RETURNING Id;
        `, [clientId, propertyId, amount, interestRate, lateFeeRate, term]);
        
        const loanId = loanRes.rows[0].id;

        if (Array.isArray(investors)) {
            for (const inv of investors) {
                if (inv.partnerId && inv.percentage > 0) {
                    await client.query(
                        'INSERT INTO LoanInvestors (LoanId, PartnerId, Percentage) VALUES ($1, $2, $3)',
                        [loanId, inv.partnerId, inv.percentage]
                    );
                }
            }
        }

        await client.query("UPDATE Properties SET Status = 'Active Guarantee' WHERE Id = $1", [propertyId]);

        await client.query('COMMIT');
        res.json({ message: 'Préstamo originado con éxito', loanId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('API Error (POST Loans):', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/properties/:id', async (req, res) => {
    const { id } = req.params;
    const { description, location, estimatedValue, status } = req.body;
    try {
        const pool = await poolPromise;
        const value = parseFloat(estimatedValue);
        await pool.query(
            'UPDATE Properties SET Description = $1, Location = $2, EstimatedValue = $3, Status = $4 WHERE Id = $5',
            [description, location, isNaN(value) ? 0 : value, status, id]
        );
        res.json({ message: 'Propiedad actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/properties/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM Properties WHERE Id = @id');
        res.json({ message: 'Propiedad eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Valuations
app.get('/api/valuations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT v.*, p.Description as PropertyDesc, p.Location as PropertyLoc, r.Name as ReferrerName, c.Name as ClientName
            FROM Valuations v
            JOIN Properties p ON v.PropertyId = p.Id
            JOIN Partners r ON v.ReferrerId = r.Id
            JOIN Clients c ON p.ClientId = c.Id
            ORDER BY v.CreatedAt DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/valuations', upload.array('photos', 5), async (req, res) => {
    const { propertyId, referrerId, requestedAmount } = req.body;
    const photoPaths = req.files.map(f => `/uploads/${f.filename}`);
    const client = await poolPromise.connect();
    try {
        await client.query('BEGIN');
        const amount = parseFloat(requestedAmount);
        
        await client.query(
            'INSERT INTO Valuations (PropertyId, ReferrerId, RequestedAmount, Status, Photos) VALUES ($1, $2, $3, $4, $5)',
            [propertyId, referrerId, isNaN(amount) ? 0 : amount, 'Pending', JSON.stringify(photoPaths)]
        );
        
        await client.query('UPDATE Properties SET Status = \'Valuation\' WHERE Id = $1', [propertyId]);
        
        await client.query('COMMIT');
        res.json({ message: 'Solicitud de valuación enviada con éxito' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/valuations/:id', async (req, res) => {
    const { id } = req.params;
    const { status, approvedAmount, centralNotes } = req.body;
    console.log(`PUT Valuation ${id}: status=${status}, amount=${approvedAmount}`);
    try {
        const client = await poolPromise.connect();
        try {
            await client.query('BEGIN');
            const amount = parseFloat(approvedAmount);
            
            await client.query(
                'UPDATE Valuations SET Status = $1, ApprovedAmount = $2, CentralNotes = $3 WHERE Id = $4',
                [status, isNaN(amount) ? 0 : amount, centralNotes, id]
            );

            if (status === 'Evaluated') {
                await client.query('UPDATE Properties SET Status = \'Available\' WHERE Id = (SELECT PropertyId FROM Valuations WHERE Id = $1)', [id]);
            } else if (status === 'Rejected') {
                await client.query('UPDATE Properties SET Status = \'Rejected\' WHERE Id = (SELECT PropertyId FROM Valuations WHERE Id = $1)', [id]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Valuación actualizada' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('PUT Valuation Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 9. Payments
app.get('/api/loans/:id/payments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT * FROM Payments WHERE LoanId = $1 ORDER BY PaymentDate DESC', [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const { loanId, amount, type, date, notes, appliedCapital, appliedInterest } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO Payments (LoanId, Amount, Type, PaymentDate, Notes, AppliedCapital, AppliedInterest) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [loanId, amount, type, date || new Date(), notes || '', appliedCapital || 0, appliedInterest || 0]
        );
        res.json({ message: 'Pago registrado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Partner Specific Data
app.get('/api/partners/:id/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
                SELECT L.*, C.Name as ClientName 
                FROM Loans L
                JOIN Clients C ON L.ClientId = C.Id
                JOIN LoanInvestors LI ON L.Id = LI.LoanId
                WHERE LI.PartnerId = $1
                ORDER BY L.CreatedAt DESC
            `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/partners/:id/evaluations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
                SELECT V.*, P.Description as PropertyDesc, C.Name as ClientName
                FROM Valuations V
                JOIN Properties P ON V.PropertyId = P.Id
                JOIN Clients C ON P.ClientId = C.Id
                WHERE V.ReferrerId = $1
                ORDER BY V.CreatedAt DESC
            `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LEGAL SECTION ---
app.get('/api/legal', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT LC.*, L.Amount as LitigantAmount, C.Name as ClientName 
            FROM LegalCases LC
            JOIN Loans L ON LC.LoanId = L.Id
            JOIN Clients C ON L.ClientId = C.Id
            ORDER BY LC.CreatedAt DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/legal', async (req, res) => {
    const { loanId, expediente, lawyer, notes, status } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'INSERT INTO LegalCases (LoanId, Expediente, Lawyer, Notes, Status) VALUES ($1, $2, $3, $4, $5)',
            [loanId, expediente, lawyer, notes, status || 'Demanda Presentada']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/legal/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notes, lawyer } = req.body;
    try {
        const pool = await poolPromise;
        await pool.query(
            'UPDATE LegalCases SET Status = COALESCE($1, Status), Notes = COALESCE($2, Notes), Lawyer = COALESCE($3, Lawyer) WHERE Id = $4',
            [status, notes, lawyer, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor API ejecutándose en puerto ${PORT}`);
});
