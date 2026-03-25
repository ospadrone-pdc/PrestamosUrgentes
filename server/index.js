const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sql, poolPromise } = require('./db');
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
        const result = await pool.request().query('SELECT *, (SELECT COUNT(*) FROM Loans WHERE ClientId = Clients.Id AND Status = \'Active\') as ActiveLoansCount FROM Clients ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/clients/:id/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('clientId', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM Loans WHERE ClientId = @clientId ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    const { name, email, phone, address, notes } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('notes', sql.NVarChar, notes)
            .query('INSERT INTO Clients (Name, Email, Phone, Address, Notes) VALUES (@name, @email, @phone, @address, @notes)');
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
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('notes', sql.NVarChar, notes)
            .query('UPDATE Clients SET Name = @name, Email = @email, Phone = @phone, Address = @address, Notes = @notes WHERE Id = @id');
        res.json({ message: 'Cliente actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM Clients WHERE Id = @id');
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Loans
app.get('/api/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT l.*, c.Name as ClientName 
            FROM Loans l 
            JOIN Clients c ON l.ClientId = c.Id 
            ORDER BY l.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('API Error (GET Partners):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Stats (Dashboard)
app.get('/api/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const totalPortfolio = await pool.request().query('SELECT SUM(Amount) as Total FROM Loans');
        const activeClients = await pool.request().query('SELECT COUNT(*) as Total FROM Clients');
        const riskyLoans = await pool.request().query("SELECT COUNT(*) as Total FROM Loans WHERE Light = 'Red'");
        
        res.json({
            totalPortfolio: totalPortfolio.recordset[0].Total || 0,
            activeClients: activeClients.recordset[0].Total || 0,
            riskyLoans: riskyLoans.recordset[0].Total || 0
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
        if (type) query += ` WHERE P.Type = '${type}'`;
        query += ' ORDER BY P.CreatedAt DESC';
        const result = await pool.request().query(query);
        res.json(result.recordset);
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
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('rate', sql.Decimal(5, 2), isNaN(rate) ? 0 : rate)
            .input('bal', sql.Decimal(15, 2), isNaN(bal) ? 0 : bal)
            .query('INSERT INTO Partners (Name, Type, Phone, Email, CommissionRate, Balance) VALUES (@name, @type, @phone, @email, @rate, @bal)');
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
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('rate', sql.Decimal(5, 2), isNaN(rate) ? 0 : rate)
            .input('bal', sql.Decimal(15, 2), isNaN(bal) ? 0 : bal)
            .query('UPDATE Partners SET Name = @name, Type = @type, Phone = @phone, Email = @email, CommissionRate = @rate, Balance = @bal WHERE Id = @id');
        res.json({ message: 'Socio actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/partners/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM Partners WHERE Id = @id');
        res.json({ message: 'Socio eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Properties
app.get('/api/properties', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, c.Name as OwnerName,
            (SELECT TOP 1 ApprovedAmount FROM Valuations WHERE PropertyId = p.Id AND Status = 'Evaluated' ORDER BY CreatedAt DESC) as ValuatedAmount
            FROM Properties p 
            JOIN Clients c ON p.ClientId = c.Id 
            ORDER BY p.CreatedAt DESC
        `);
        res.json(result.recordset);
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
        await pool.request()
            .input('clientId', sql.UniqueIdentifier, clientId)
            .input('desc', sql.NVarChar, description)
            .input('loc', sql.NVarChar, location)
            .input('val', sql.Decimal(15, 2), isNaN(value) ? 0 : value)
            .input('status', sql.NVarChar, status || 'Available')
            .query('INSERT INTO Properties (ClientId, Description, Location, EstimatedValue, Status) VALUES (@clientId, @desc, @loc, @val, @status)');
        res.json({ message: 'Propiedad creada con éxito' });
    } catch (err) {
        console.error('API Error (POST Properties):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loans', async (req, res) => {
    const { clientId, propertyId, amount, interestRate, lateFeeRate, term, investors } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const loanRes = await transaction.request()
                .input('clientId', sql.UniqueIdentifier, clientId)
                .input('propertyId', sql.UniqueIdentifier, propertyId)
                .input('amount', sql.Decimal(15, 2), amount)
                .input('interestRate', sql.Decimal(5, 2), interestRate)
                .input('lateFeeRate', sql.Decimal(5, 2), lateFeeRate)
                .input('term', sql.Int, term)
                .query(`
                    INSERT INTO Loans (ClientId, PropertyId, Amount, InterestRate, MoratorioRate, TermMonths, Status, StartDate)
                    OUTPUT INSERTED.Id
                    VALUES (@clientId, @propertyId, @amount, @interestRate, @lateFeeRate, @term, 'Active', GETDATE());
                `);
            
            const loanId = loanRes.recordset[0].Id;

            if (Array.isArray(investors)) {
                for (const inv of investors) {
                    if (inv.partnerId && inv.percentage > 0) {
                        await transaction.request()
                            .input('loanId', sql.UniqueIdentifier, loanId)
                            .input('partnerId', sql.UniqueIdentifier, inv.partnerId)
                            .input('percent', sql.Decimal(5, 2), inv.percentage)
                            .query('INSERT INTO LoanInvestors (LoanId, PartnerId, Percentage) VALUES (@loanId, @partnerId, @percent)');
                    }
                }
            }

            await transaction.request()
                .input('propertyId', sql.UniqueIdentifier, propertyId)
                .query("UPDATE Properties SET Status = 'Active Guarantee' WHERE Id = @propertyId");

            await transaction.commit();
            res.json({ message: 'Préstamo originado con éxito', loanId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('API Error (POST Loans):', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/properties/:id', async (req, res) => {
    const { id } = req.params;
    const { description, location, estimatedValue, status } = req.body;
    try {
        const pool = await poolPromise;
        const value = parseFloat(estimatedValue);
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('desc', sql.NVarChar, description)
            .input('loc', sql.NVarChar, location)
            .input('val', sql.Decimal(15, 2), isNaN(value) ? 0 : value)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Properties SET Description = @desc, Location = @loc, EstimatedValue = @val, Status = @status WHERE Id = @id');
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
        const result = await pool.request().query(`
            SELECT v.*, p.Description as PropertyDesc, p.Location as PropertyLoc, r.Name as ReferrerName, c.Name as ClientName
            FROM Valuations v
            JOIN Properties p ON v.PropertyId = p.Id
            JOIN Partners r ON v.ReferrerId = r.Id
            JOIN Clients c ON p.ClientId = c.Id
            ORDER BY v.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/valuations', upload.array('photos', 5), async (req, res) => {
    const { propertyId, referrerId, requestedAmount } = req.body;
    const photoPaths = req.files.map(f => `/uploads/${f.filename}`);
    
    try {
        const pool = await poolPromise;
        const amount = parseFloat(requestedAmount);
        await pool.request()
            .input('propertyId', sql.UniqueIdentifier, propertyId)
            .input('referrerId', sql.UniqueIdentifier, referrerId)
            .input('amount', sql.Decimal(15, 2), isNaN(amount) ? 0 : amount)
            .input('photos', sql.NVarChar, JSON.stringify(photoPaths))
            .query(`
                BEGIN TRANSACTION;
                INSERT INTO Valuations (PropertyId, ReferrerId, RequestedAmount, Status, Photos)
                VALUES (@propertyId, @referrerId, @amount, 'Pending', @photos);
                
                UPDATE Properties SET Status = 'Valuation' WHERE Id = @propertyId;
                COMMIT TRANSACTION;
            `);
        res.json({ message: 'Solicitud de valuación enviada con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/valuations/:id', async (req, res) => {
    const { id } = req.params;
    const { status, approvedAmount, centralNotes } = req.body;
    console.log(`PUT Valuation ${id}: status=${status}, amount=${approvedAmount}`);
    try {
        const pool = await poolPromise;
        const amount = parseFloat(approvedAmount);
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('status', sql.NVarChar, status)
            .input('approvedAmount', sql.Decimal(15, 2), isNaN(amount) ? 0 : amount)
            .input('notes', sql.NVarChar, centralNotes)
            .query(`
                SET NOCOUNT ON;
                BEGIN TRANSACTION;
                UPDATE Valuations 
                SET Status = @status, ApprovedAmount = @approvedAmount, CentralNotes = @notes 
                WHERE Id = @id;

                IF @status = 'Evaluated'
                    UPDATE Properties SET Status = 'Available' WHERE Id = (SELECT PropertyId FROM Valuations WHERE Id = @id);
                ELSE IF @status = 'Rejected'
                    UPDATE Properties SET Status = 'Rejected' WHERE Id = (SELECT PropertyId FROM Valuations WHERE Id = @id);

                COMMIT TRANSACTION;
                SELECT @@ROWCOUNT as Affected;
            `);
        
        console.log('Update result:', result.recordset[0]);
        res.json({ message: 'Valuación actualizada', affected: result.recordset[0].Affected });
    } catch (err) {
        console.error('PUT Valuation Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 9. Payments
app.get('/api/loans/:id/payments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('loanId', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM Payments WHERE LoanId = @loanId ORDER BY PaymentDate DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const { loanId, amount, type, date, notes, appliedCapital, appliedInterest } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('loanId', sql.UniqueIdentifier, loanId)
            .input('amount', sql.Decimal(15, 2), amount)
            .input('type', sql.NVarChar, type)
            .input('date', sql.DateTimeOffset, date || new Date())
            .input('notes', sql.NVarChar, notes || '')
            .input('capital', sql.Decimal(15, 2), appliedCapital || 0)
            .input('interest', sql.Decimal(15, 2), appliedInterest || 0)
            .query('INSERT INTO Payments (LoanId, Amount, Type, PaymentDate, Notes, AppliedCapital, AppliedInterest) VALUES (@loanId, @amount, @type, @date, @notes, @capital, @interest)');
        res.json({ message: 'Pago registrado con éxito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Partner Specific Data
app.get('/api/partners/:id/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('partnerId', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT L.*, C.Name as ClientName 
                FROM Loans L
                JOIN Clients C ON L.ClientId = C.Id
                JOIN LoanInvestors LI ON L.Id = LI.LoanId
                WHERE LI.PartnerId = @partnerId
                ORDER BY L.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/partners/:id/evaluations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('partnerId', sql.UniqueIdentifier, req.params.id)
            .query(`
                SELECT V.*, P.Description as PropertyDesc, C.Name as ClientName
                FROM Valuations V
                JOIN Properties P ON V.PropertyId = P.Id
                JOIN Clients C ON P.ClientId = C.Id
                WHERE V.ReferrerId = @partnerId
                ORDER BY V.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LEGAL SECTION ---
app.get('/api/legal', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT LC.*, L.Amount as LitigantAmount, C.Name as ClientName 
            FROM LegalCases LC
            JOIN Loans L ON LC.LoanId = L.Id
            JOIN Clients C ON L.ClientId = C.Id
            ORDER BY LC.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/legal', async (req, res) => {
    const { loanId, expediente, lawyer, notes, status } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('loanId', sql.UniqueIdentifier, loanId)
            .input('expediente', sql.NVarChar, expediente)
            .input('lawyer', sql.NVarChar, lawyer)
            .input('notes', sql.NVarChar, notes)
            .input('status', sql.NVarChar, status || 'Demanda Presentada')
            .query(`
                INSERT INTO LegalCases (LoanId, Expediente, Lawyer, Notes, Status)
                VALUES (@loanId, @expediente, @lawyer, @notes, @status)
            `);
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
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('status', sql.NVarChar, status)
            .input('notes', sql.NVarChar, notes)
            .input('lawyer', sql.NVarChar, lawyer)
            .query(`
                UPDATE LegalCases 
                SET Status = ISNULL(@status, Status), 
                    Notes = ISNULL(@notes, Notes),
                    Lawyer = ISNULL(@lawyer, Lawyer)
                WHERE Id = @id
            `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor API ejecutándose en http://localhost:${PORT}`);
});
