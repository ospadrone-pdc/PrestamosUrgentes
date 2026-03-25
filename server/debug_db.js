const { poolPromise, sql } = require('./db');

async function debug() {
    try {
        const pool = await poolPromise;
        const partners = await pool.request().query("SELECT Id, Name, Type FROM Partners WHERE Name LIKE '%Oscar%'");
        console.log('PARTNERS:', partners.recordset);
        
        const loans = await pool.request().query("SELECT Id, ClientId, Amount, Status FROM Loans");
        console.log('LOANS:', loans.recordset);
        
        const investors = await pool.request().query("SELECT * FROM LoanInvestors");
        console.log('LOAN_INVESTORS:', investors.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
