require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function initDB() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL database.');

        const schemaPath = path.resolve(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split commands by semicolon or just run the whole file if pg supports it?
        // pg client.query() usually runs one query. schema.sql has multiple.
        // We can split, but schema.sql might have semicolons in strings/triggers (unlikely here).
        // A simple split is fine for this schema.

        // Remove comments and split
        const queries = schema
            .replace(/--.*$/gm, '') // Remove comments
            .split(';')
            .filter(q => q.trim().length > 0);

        for (const query of queries) {
            await client.query(query);
            console.log('Executed query successfully.');
        }

        console.log('Database initialization complete.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
    }
}

initDB();
