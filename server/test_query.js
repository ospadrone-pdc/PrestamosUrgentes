const { poolPromise, sql } = require('./db');

async function testQuery() {
    try {
        const pool = await poolPromise;
        const partnerId = '3D75DC0E-3910-4D9A-8DB5-6934FED5000D';
        
        console.log('Testing query for partner:', partnerId);
        
        const result = await pool.request()
            .query(`
                SELECT P.*, 
                       (SELECT COUNT(*) FROM LoanInvestors LI 
                        JOIN Loans L ON LI.LoanId = L.Id 
                        WHERE LI.PartnerId = P.Id AND L.Status = 'Active') as ActiveLoansCount
                FROM Partners P
                WHERE P.Name LIKE '%Oscar%'
            `);
        
        console.log('PARTNER DETAILS:', result.recordset);
        
        const countResult = await pool.request()
            .input('partnerId', sql.UniqueIdentifier, partnerId)
            .query(`
                SELECT COUNT(*) as Count
                FROM LoanInvestors LI 
                JOIN Loans L ON LI.LoanId = L.Id 
                WHERE LI.PartnerId = @partnerId AND L.Status = 'Active'
            `);
        console.log('COUNT:', countResult.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testQuery();
