const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'g3transport.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Customer Table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE,
        name TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Booking Table
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE,
        customer_id TEXT,
        pickup TEXT,
        delivery TEXT,
        distance TEXT,
        load_type TEXT,
        average_weight TEXT,
        helpers INTEGER,
        estimated_price INTEGER,
        expected_date TEXT,
        assigned_driver TEXT,
        booking_status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
      )
    `);

    // Vehicle Table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_no TEXT,
        vehicle_type TEXT,
        status TEXT DEFAULT 'Available',
        driver TEXT
      )
    `);

    // Seed Vehicles if empty
    db.get("SELECT COUNT(*) AS count FROM vehicles", (err, row) => {
      if (!err && row.count === 0) {
        const stmt = db.prepare("INSERT INTO vehicles (vehicle_no, vehicle_type, driver) VALUES (?, ?, ?)");
        stmt.run("TN77 AB 1234", "17 Feet", "Murugan");
        stmt.run("TN28 XY 9876", "Mini Truck", "Ramesh");
        stmt.run("TN30 BZ 5432", "14 Feet", "Suresh");
        stmt.run("TN33 PQ 1122", "Pickup", "Karthik");
        stmt.finalize();
        console.log('Seeded vehicles table.');
      }
    });
  });
}

module.exports = db;
