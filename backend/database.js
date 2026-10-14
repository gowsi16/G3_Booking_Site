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
    // 1. Customer Table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT UNIQUE,
        name TEXT,
        phone TEXT UNIQUE,
        password TEXT,
        email TEXT,
        customer_address TEXT,
        gst_number TEXT,
        company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.all("PRAGMA table_info(customers)", (err, columns) => {
      if (!err && columns) {
        const names = columns.map(c => c.name);
        if (!names.includes('password')) {
          db.run("ALTER TABLE customers ADD COLUMN password TEXT");
        }
        if (!names.includes('customer_address')) {
          db.run("ALTER TABLE customers ADD COLUMN customer_address TEXT");
        }
      }
    });

    // 2. Drivers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Seed the 3 company drivers
      const drivers = ["Senthil", "Chithiraj", "Prabhu"];
      drivers.forEach(d => {
        db.run("INSERT OR IGNORE INTO drivers (name, status) VALUES (?, 'Active')", [d]);
      });
    });

    // 3. Vehicles Table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_no TEXT UNIQUE,
        vehicle_type TEXT,
        capacity_kg INTEGER DEFAULT 3500,
        status TEXT DEFAULT 'Available',
        driver TEXT
      )
    `, () => {
      // Remove legacy archived/demo vehicles that do not belong to the company
      db.run("DELETE FROM vehicles WHERE vehicle_no NOT IN ('TN 77AY 3006', 'TN28 BF 1256')", () => {
        // Ensure no duplicate rows per vehicle_no
        db.run("DELETE FROM vehicles WHERE id NOT IN (SELECT MIN(id) FROM vehicles GROUP BY vehicle_no)", () => {
          db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_vehicleno ON vehicles(vehicle_no)", () => {
            const companyVehicles = [
              { no: "TN 77AY 3006", type: "Heavy Commercial Lorry (8 Ton)", capacity: 8000, driver: "Senthil" },
              { no: "TN28 BF 1256", type: "Medium Commercial Lorry (3.5 Ton)", capacity: 3500, driver: "Chithiraj" }
            ];

            companyVehicles.forEach(v => {
              db.run(`
                INSERT OR IGNORE INTO vehicles (vehicle_no, vehicle_type, capacity_kg, status, driver) 
                VALUES (?, ?, ?, 'Available', ?)
              `, [v.no, v.type, v.capacity, v.driver]);
              db.run(`
                UPDATE vehicles SET vehicle_type = ?, capacity_kg = ?, driver = ? WHERE vehicle_no = ?
              `, [v.type, v.capacity, v.driver, v.no]);
            });
          });
        });
      });
    });

    // 4. Bookings Table
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE,
        customer_id TEXT,
        pickup TEXT,
        delivery TEXT,
        distance TEXT,
        vehicle_type TEXT,
        assigned_vehicle TEXT,
        load_type TEXT,
        average_weight TEXT,
        weight_kg INTEGER,
        helpers INTEGER DEFAULT 0,
        helper_charge INTEGER DEFAULT 0,
        estimated_price INTEGER,
        approved_fare INTEGER,
        expected_date TEXT,
        trip_duration_days INTEGER DEFAULT 1,
        assigned_driver TEXT,
        booking_status TEXT DEFAULT 'Pending Review & Assignment',
        cancellation_reason TEXT,
        customer_address TEXT,
        pickup_address TEXT,
        delivery_address TEXT,
        instructions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
      )
    `, () => {
      db.all("PRAGMA table_info(bookings)", (err, columns) => {
        if (!err && columns) {
          const names = columns.map(c => c.name);
          const toAdd = [
            { name: "vehicle_type", type: "TEXT" },
            { name: "assigned_vehicle", type: "TEXT" },
            { name: "weight_kg", type: "INTEGER" },
            { name: "helper_charge", type: "INTEGER DEFAULT 0" },
            { name: "approved_fare", type: "INTEGER" },
            { name: "trip_duration_days", type: "INTEGER DEFAULT 1" },
            { name: "cancellation_reason", type: "TEXT" },
            { name: "customer_address", type: "TEXT" },
            { name: "pickup_address", type: "TEXT" },
            { name: "delivery_address", type: "TEXT" },
            { name: "instructions", type: "TEXT" }
          ];

          toAdd.forEach(col => {
            if (!names.includes(col.name)) {
              db.run(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`, () => {});
            }
          });
        }
      });
    });

    // 5. Pricing Settings Table (Admin configurable)
    db.run(`
      CREATE TABLE IF NOT EXISTS pricing_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Audit Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        details TEXT,
        performed_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

module.exports = db;
