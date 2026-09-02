const fs = require("fs");
const path = require("path");
const db = require("../handlers/dbHandler");
const bcrypt = require("bcrypt");

async function runInit() {
	try {
		console.log("Connecting to database and executing init.sql...");
		const sqlPath = path.join(__dirname, "init.sql");
		const sql = fs.readFileSync(sqlPath, "utf8");

		await db.query(sql);
		console.log("Database schema initialized successfully!");

		// Seed default Admin user
		const adminEmail = "admin@makelyft.com";
		const salt = await bcrypt.genSalt(10);
		const adminHash = await bcrypt.hash("admin123", salt);
		await db.query(
			`INSERT INTO users (emp_id, name, email, org_name, phone, role, password_hash) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[
				"EMP-ADMIN",
				"System Admin",
				adminEmail,
				"Odoo",
				"0000000000",
				"admin",
				adminHash,
			],
		);
		console.log("Default Admin user created (admin@makelyft.com / admin123)");

		// Let's verify the tables exist
		const result = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

		console.log("\\nExisting Tables in public schema:");
		result.rows.forEach((row) => console.log(`- ${row.table_name}`));

		process.exit(0);
	} catch (error) {
		console.error("Error executing init.sql:");
		console.error(error.message);
		process.exit(1);
	}
}

runInit();
