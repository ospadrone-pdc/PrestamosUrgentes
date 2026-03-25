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

app.get('/api/diag', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        dir: __dirname,
        distExists: fs.existsSync(path.join(__dirname, '..', 'dist')),
        indexExists: fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'))
    });
});


// Serve Vite build files from the root dist directory
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));


app.get('/api/debug/db', async (req, res) => {
    try {
        console.log('Diagnostic: Awaiting poolPromise...');
        const pool = await poolPromise;
        if (!pool) {
            console.error('Diagnostic: Pool is undefined!');
            throw new Error('No se pudo establecer conexión con la base de datos (Pool undefined)');
        }
        
        console.log('Diagnostic: Pool acquired, querying schema...');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const columns = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name = 'partners'");
        res.json({ tables: tables.rows, partnersColumns: columns.rows });
    } catch (err) {
        console.error('Diagnostic Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query('SELECT 1 as connected');
        res.json({ status: 'ok', db: result.rows[0].connected === 1 });
    } catch (err) {
        res.status(500).json({ status: 'error', db: false, message: err.message });
    }
});

// --- API ROUTES ---

// 1. Clients
app.get('/api/clients', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT c.id as "Id", c.name as "Name", c.email as "Email", c.phone as "Phone", 
                   c.address as "Address", c.notes as "Notes",
                   (SELECT COUNT(*) FROM loans l WHERE l.clientid = c.id AND l.status = 'Active') as "ActiveLoansCount"
            FROM clients c
            ORDER BY c.createdat DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/clients/:id/loans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.query(`
            SELECT id as "Id", amount as "Amount", interestrate as "InterestRate", 
                   status as "Status", createdat as "CreatedAt"
            FROM Loans 
            WHERE ClientId = $1 
            ORDER BY CreatedAt DESC
        `, [req.params.id]);
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
            SELECT l.id as "Id", l.clientid as "ClientId", l.propertyid as "PropertyId", 
                   l.amount as "Amount", l.interestrate as "InterestRate", l.moratoriorate as "MoratorioRate", 
                   l.termmonths as "TermMonths", l.status as "Status", l.light as "Light", 
                   l.startdate as "StartDate", l.nextpaymentdate as "NextPaymentDate",
                   c.name as "ClientName"
            FROM loans l
            JOIN clients c ON l.clientid = c.id
            ORDER BY l.createdat DESC
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
        
        // Basic Stats
        const totalPortfolioRes = await pool.query('SELECT SUM(Amount) as total FROM Loans');
        const activeClientsRes = await pool.query('SELECT COUNT(*) as total FROM Clients');
        const riskyLoansRes = await pool.query("SELECT COUNT(*) as total FROM Loans WHERE Light = 'Red'");
        
        // Monthly Collection (Current Month)
        const monthlyCollectionRes = await pool.query(`
            SELECT SUM(Amount) as total 
            FROM Payments 
            WHERE DATE_TRUNC('month', PaymentDate) = DATE_TRUNC('month', CURRENT_DATE)
        `);

        // Collection History (Monthly for current year)
        const collectionHistoryRes = await pool.query(`
            SELECT 
                EXTRACT(MONTH FROM PaymentDate) as month_num,
                SUM(Amount) as monto
            FROM Payments 
            WHERE PaymentDate >= DATE_TRUNC('year', CURRENT_DATE)
            GROUP BY month_num
            ORDER BY month_num
        `);

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const collectionHistory = collectionHistoryRes.rows.map(row => ({
            name: monthNames[parseInt(row.month_num) - 1],
            monto: parseFloat(row.monto)
        }));

        // Portfolio Distribution
        const distributionRes = await pool.query(`
            SELECT 
                Light,
                COUNT(*) as count
            FROM Loans 
            GROUP BY Light
        `);

        const totalLoans = distributionRes.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
        const portfolioDistribution = distributionRes.rows.map(row => {
            let name = 'Sana';
            let color = '#10b981';
            if (row.light === 'Yellow') { name = 'Riesgo'; color = '#f59e0b'; }
            if (row.light === 'Red') { name = 'Vencida'; color = '#ef4444'; }
            
            return {
                name,
                value: totalLoans > 0 ? Math.round((parseInt(row.count) / totalLoans) * 100) : 0,
                color
            };
        });

        res.json({
            totalPortfolio: parseFloat(totalPortfolioRes.rows[0].total) || 0,
            activeClients: parseInt(activeClientsRes.rows[0].total) || 0,
            riskyLoans: parseInt(riskyLoansRes.rows[0].total) || 0,
            monthlyCollection: parseFloat(monthlyCollectionRes.rows[0].total) || 0,
            collectionHistory: collectionHistory.length > 0 ? collectionHistory : [
                { name: 'Ene', monto: 0 }, { name: 'Feb', monto: 0 }, { name: 'Mar', monto: 0 }
            ],
            portfolioDistribution: portfolioDistribution.length > 0 ? portfolioDistribution : [
                { name: 'Sana', value: 100, color: '#10b981' }
            ]
        });
    } catch (err) {
        console.error('API Error (GET Stats):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Partners (Investors & Referrers)
app.get('/api/partners', async (req, res) => {
    const { type } = req.query; // Optional filter
    try {
        const pool = await poolPromise;
        let query = `
            SELECT P.id as "Id", P.name as "Name", P.type as "Type", P.phone as "Phone", 
                   P.email as "Email", P.commissionrate as "CommissionRate", P.balance as "Balance",
                   (SELECT COUNT(*) FROM loaninvestors LI 
                    JOIN loans L ON LI.loanid = L.id 
                    WHERE LI.partnerid = P.id AND L.status = 'Active') as "ActiveLoansCount",
                   (SELECT COUNT(DISTINCT PR.clientid) FROM valuations V
                    JOIN properties PR ON V.propertyid = PR.id
                    WHERE V.referrerid = P.id) as "ReferredClientsCount"
            FROM partners P
        `;
        const params = [];
        if (type) {
            query += ` WHERE P.type = $1`;
            params.push(type);
        }
        query += ' ORDER BY P.createdat DESC';
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
            SELECT p.id as "Id", p.clientid as "ClientId", p.description as "Description", 
                   p.location as "Location", p.estimatedvalue as "EstimatedValue", p.status as "Status",
                   c.name as "OwnerName",
                   (SELECT approvedamount FROM valuations WHERE propertyid = p.id AND status = 'Evaluated' ORDER BY createdat DESC LIMIT 1) as "ValuatedAmount"
            FROM properties p 
            JOIN clients c ON p.clientid = c.id 
            ORDER BY p.createdat DESC
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

        // 1. Validaciones de Balance y Porcentaje
        if (Array.isArray(investors)) {
            let totalPercent = 0;
            for (const inv of investors) {
                totalPercent += parseFloat(inv.percentage);
                const partnerRes = await client.query('SELECT name, balance FROM Partners WHERE id = $1', [inv.partnerId]);
                const partner = partnerRes.rows[0];
                const required = (parseFloat(amount) * parseFloat(inv.percentage)) / 100;

                if (!partner) throw new Error('Uno de los inversionistas no existe.');
                if (parseFloat(partner.balance) < required) {
                    throw new Error(`Inversionista ${partner.name} no tiene fondos suficientes (Saldo: $${parseFloat(partner.balance).toLocaleString()}, Requerido: $${required.toLocaleString()})`);
                }
            }
            if (Math.abs(totalPercent - 100) > 0.01) {
                throw new Error('La suma de porcentajes de inversionistas debe ser 100%');
            }
        } else {
            throw new Error('Debe asignar al menos un inversionista.');
        }

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
        await pool.query('DELETE FROM Properties WHERE Id = $1', [req.params.id]);
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
            SELECT v.id as "Id", v.propertyid as "PropertyId", v.referrerid as "ReferrerId", 
                   v.status as "Status", v.requestedamount as "RequestedAmount", 
                   v.approvedamount as "ApprovedAmount", v.centralnotes as "CentralNotes", 
                   v.photos as "Photos", v.latitude as "latitude", v.longitude as "longitude",
                   p.description as "PropertyDesc", p.location as "PropertyLoc", 
                   r.name as "ReferrerName", c.name as "ClientName"
            FROM valuations v
            JOIN properties p ON v.propertyid = p.id
            JOIN partners r ON v.referrerid = r.id
            JOIN clients c ON p.clientid = c.id
            ORDER BY v.createdat DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/valuations', upload.array('photos', 5), async (req, res) => {
    const { propertyId, referrerId, requestedAmount, latitude, longitude } = req.body;
    const photoPaths = req.files.map(f => `/uploads/${f.filename}`);
    const client = await poolPromise.connect();
    try {
        await client.query('BEGIN');
        const amount = parseFloat(requestedAmount);
        
        await client.query(
            'INSERT INTO valuations (propertyId, referrerId, requestedAmount, Status, Photos, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [propertyId, referrerId, isNaN(amount) ? 0 : amount, 'Pending', JSON.stringify(photoPaths), latitude || null, longitude || null]
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
        const result = await pool.query('SELECT id as "Id", loanid as "LoanId", amount as "Amount", type as "Type", paymentdate as "PaymentDate", notes as "Notes" FROM payments WHERE loanid = $1 ORDER BY paymentdate DESC', [req.params.id]);
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
                SELECT L.id as "Id", L.clientid as "ClientId", L.amount as "Amount", 
                       L.interestrate as "InterestRate", L.status as "Status", 
                       L.startdate as "StartDate", L.createdat as "CreatedAt",
                       C.name as "ClientName" 
                FROM loans L
                JOIN clients C ON L.clientid = C.id
                JOIN loaninvestors LI ON L.id = LI.loanid
                WHERE LI.partnerid = $1
                ORDER BY L.createdat DESC
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
                SELECT V.id as "Id", V.status as "Status", V.createdat as "CreatedAt",
                       P.description as "PropertyDesc", C.name as "ClientName"
                FROM valuations V
                JOIN properties P ON V.propertyid = P.id
                JOIN clients C ON P.clientid = C.id
                WHERE V.referrerid = $1
                ORDER BY V.createdat DESC
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
            SELECT LC.id as "Id", LC.loanid as "LoanId", LC.expediente as "Expediente", 
                   LC.lawyer as "Lawyer", LC.notes as "Notes", LC.status as "Status",
                   L.amount as "LitigantAmount", C.name as "ClientName" 
            FROM legalcases LC
            JOIN loans L ON LC.loanid = L.id
            JOIN clients C ON L.clientid = C.id
            ORDER BY LC.createdat DESC
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

// Catch-all route to serve index.html for any alternative routes (React Router support)
app.get('*', (req, res) => {
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        res.status(404).send('Frontend build not found. Please run "npm run build" at the root.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor API ejecutándose en puerto ${PORT}`);
});

