const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../g3transport.db');
const db = new sqlite3.Database(dbPath);

console.log('Reading existing SQLite database for PostgreSQL migration dump...');

db.serialize(() => {
  db.all('SELECT * FROM customers', (err, customers) => {
    if (err) throw err;
    db.all('SELECT * FROM drivers', (err, drivers) => {
      if (err) throw err;
      db.all("SELECT * FROM vehicles WHERE vehicle_no IN ('TN 77AY 3006', 'TN28 BF 1256')", (err, vehicles) => {
        if (err) throw err;
        db.all('SELECT * FROM bookings', (err, bookings) => {
          if (err) throw err;

          let sql = `-- =====================================================================\n`;
          sql += `-- G3 Transport - Data Migration Dump (SQLite -> PostgreSQL)\n`;
          sql += `-- Generated on: ${new Date().toISOString()}\n`;
          sql += `-- Target Database: g3_transport\n`;
          sql += `-- =====================================================================\n\n`;
          sql += `BEGIN;\n\n`;

          // 1. Customers
          sql += `-- 1. Existing Customers (${customers.length} records)\n`;
          customers.forEach(c => {
            const esc = (v) => v ? `'${String(v).replace(/'/g, "''")}'` : 'NULL';
            sql += `INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)\n`;
            sql += `VALUES (${esc(c.customer_id)}, ${esc(c.name)}, ${esc(c.phone)}, ${esc(c.password)}, ${esc(c.email)}, ${esc(c.customer_address)}, ${esc(c.gst_number)}, ${esc(c.company)}, ${esc(c.created_at)})\n`;
            sql += `ON CONFLICT (customer_id) DO UPDATE SET\n`;
            sql += `  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,\n`;
            sql += `  customer_address = EXCLUDED.customer_address;\n\n`;
          });

          // 2. Drivers
          sql += `-- 2. Company Drivers (${drivers.length} records)\n`;
          drivers.forEach(d => {
            sql += `INSERT INTO drivers (name, status, created_at)\n`;
            sql += `VALUES ('${d.name.replace(/'/g, "''")}', '${d.status || 'Active'}', '${d.created_at || 'NOW()'}' )\n`;
            sql += `ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;\n\n`;
          });

          // 3. Vehicles
          sql += `-- 3. Company Lorries (${vehicles.length} records)\n`;
          vehicles.forEach(v => {
            sql += `INSERT INTO vehicles (vehicle_no, vehicle_type, capacity_kg, status, driver)\n`;
            sql += `VALUES ('${v.vehicle_no}', '${v.vehicle_type}', ${v.capacity_kg || 3500}, '${v.status || 'Available'}', '${v.driver || 'Senthil'}')\n`;
            sql += `ON CONFLICT (vehicle_no) DO UPDATE SET capacity_kg = EXCLUDED.capacity_kg, driver = EXCLUDED.driver;\n\n`;
          });

          // 4. Bookings
          sql += `-- 4. Existing Bookings (${bookings.length} records)\n`;
          bookings.forEach(b => {
            const esc = (v) => (v !== null && v !== undefined && v !== '') ? `'${String(v).replace(/'/g, "''")}'` : 'NULL';
            const num = (v, def = 0) => (v !== null && v !== undefined && !isNaN(v)) ? Number(v) : def;

            sql += `INSERT INTO bookings (\n`;
            sql += `  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,\n`;
            sql += `  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,\n`;
            sql += `  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,\n`;
            sql += `  booking_status, cancellation_reason, instructions, created_at\n`;
            sql += `) VALUES (\n`;
            sql += `  ${esc(b.booking_id)}, ${esc(b.customer_id)}, ${esc(b.pickup)}, ${esc(b.delivery)}, ${esc(b.customer_address)},\n`;
            sql += `  ${esc(b.pickup_address)}, ${esc(b.delivery_address)}, ${esc(b.distance)}, ${esc(b.vehicle_type || 'Pending Admin Lorry Assignment')},\n`;
            sql += `  ${b.assigned_vehicle && (b.assigned_vehicle.includes('3006') || b.assigned_vehicle.includes('1256')) ? esc(b.assigned_vehicle) : 'NULL'},\n`;
            sql += `  ${esc(b.load_type || 'Consignment')}, ${esc(b.average_weight)}, ${num(b.weight_kg, 1000)}, ${num(b.helpers, 0)},\n`;
            sql += `  ${num(b.helper_charge, 0)}, ${num(b.estimated_price, 2000)}, ${b.approved_fare ? num(b.approved_fare) : 'NULL'},\n`;
            sql += `  ${esc(b.expected_date ? b.expected_date.split('T')[0] : '2026-10-14')}, ${num(b.trip_duration_days, 1)}, ${esc(b.assigned_driver)},\n`;
            sql += `  ${esc(b.booking_status || 'Pending Review & Assignment')}, ${esc(b.cancellation_reason)}, ${esc(b.instructions)},\n`;
            sql += `  ${esc(b.created_at || 'NOW()')}\n`;
            sql += `) ON CONFLICT (booking_id) DO NOTHING;\n\n`;
          });

          sql += `COMMIT;\n`;

          const dumpPath = path.resolve(__dirname, 'migration_data.sql');
          fs.writeFileSync(dumpPath, sql, 'utf8');
          console.log(`✓ Migration dump generated successfully at: ${dumpPath}`);
          console.log(`- Customers dumped: ${customers.length}`);
          console.log(`- Vehicles dumped: ${vehicles.length}`);
          console.log(`- Drivers dumped: ${drivers.length}`);
          console.log(`- Bookings dumped: ${bookings.length}`);
          process.exit(0);
        });
      });
    });
  });
});
