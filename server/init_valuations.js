const { poolPromise, sql } = require('./db');

async function initValuations() {
    try {
        console.log('Connecting to database...');
        const pool = await poolPromise;
        if (!pool) throw new Error('Could not connect to database');
        
        console.log('Creating Valuations table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Valuations')
            BEGIN
                CREATE TABLE Valuations (
                    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    PropertyId UNIQUEIDENTIFIER NOT NULL,
                    ReferrerId UNIQUEIDENTIFIER NOT NULL,
                    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Evaluated, Rejected
                    RequestedAmount DECIMAL(15, 2),
                    ApprovedAmount DECIMAL(15, 2),
                    CentralNotes NVARCHAR(MAX),
                    Photos NVARCHAR(MAX), -- JSON string of file paths
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_Valuation_Property FOREIGN KEY (PropertyId) REFERENCES Properties(Id),
                    CONSTRAINT FK_Valuation_Referrer FOREIGN KEY (ReferrerId) REFERENCES Partners(Id)
                )
            END
        `);
        
        console.log('Table Valuations ready.');
        process.exit(0);
    } catch (err) {
        console.error('Initialization Error:', err.message);
        process.exit(1);
    }
}

initValuations();
