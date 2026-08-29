const express = require('express');
const cors = require('cors');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend server is running correctly!' });
});

// City Coordinates for realistic distance calculation
const cities = {
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "coimbatore": { lat: 11.0168, lon: 76.9558 },
  "madurai": { lat: 9.9252, lon: 78.1198 },
  "tiruchirappalli": { lat: 10.7905, lon: 78.7047 },
  "salem": { lat: 11.6643, lon: 78.1460 },
  "tiruppur": { lat: 11.1085, lon: 77.3411 },
  "erode": { lat: 11.3410, lon: 77.7172 },
  "vellore": { lat: 12.9165, lon: 79.1325 },
  "thoothukudi": { lat: 8.7642, lon: 78.1348 },
  "dindigul": { lat: 10.3673, lon: 77.9803 },
  "thanjavur": { lat: 10.7870, lon: 79.1378 },
  "ranipet": { lat: 12.9273, lon: 79.3331 },
  "sivakasi": { lat: 9.4533, lon: 77.8024 },
  "karur": { lat: 10.9601, lon: 78.0766 },
  "ooty": { lat: 11.4100, lon: 76.6950 },
  "kanyakumari": { lat: 8.0883, lon: 77.5385 }
};

function calculateDistance(city1, city2) {
  const c1 = cities[city1.toLowerCase().trim()];
  const c2 = cities[city2.toLowerCase().trim()];
  
  if (!c1 || !c2) return null;

  const R = 6371; // km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLon = (c2.lon - c1.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLine = R * c;
  
  // Multiply by 1.35 to approximate driving distance on roads
  return Math.round(straightLine * 1.35);
}

// 1. Search Availability Endpoint
app.get('/api/availability', (req, res) => {
  const { pickup, delivery } = req.query;
  
  if (!pickup || !delivery) {
    return res.status(400).json({ error: 'Pickup and Delivery locations are required.' });
  }

  // Use realistic coordinate distance if known, otherwise fallback to 250
  let distanceValue = calculateDistance(pickup, delivery);
  if (!distanceValue) {
    distanceValue = 250; 
  }

  db.all("SELECT * FROM vehicles WHERE status = 'Available'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Remove the hardcoded estimated price since it's now dynamically calculated in Step 3
    res.json({
      distance: `${distanceValue} km`,
      distanceValue: distanceValue,
      vehicles: rows
    });
  });
});

// 2. Create Customer Endpoint
app.post('/api/customers', (req, res) => {
  const { name, phone, email, gst_number, company } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required.' });
  }

  db.get("SELECT COUNT(id) as count FROM customers", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Generate Customer ID: CUS000001
    const nextId = row.count + 1;
    const customerId = `CUS${String(nextId).padStart(6, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO customers (customer_id, name, phone, email, gst_number, company) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([customerId, name, phone, email || '', gst_number || '', company || ''], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ customer_id: customerId });
    });
    stmt.finalize();
  });
});

// 3. Create Booking Endpoint
app.post('/api/bookings', (req, res) => {
  const { customer_id, pickup, delivery, distance, load_type, average_weight, helpers, estimated_price, expected_date } = req.body;
  
  db.get("SELECT COUNT(*) AS count FROM bookings", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const sequence = (row.count + 1).toString().padStart(5, '0');
    const booking_id = `BK2026${sequence}`;

    const stmt = db.prepare(`
      INSERT INTO bookings (booking_id, customer_id, pickup, delivery, distance, load_type, average_weight, helpers, estimated_price, expected_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(booking_id, customer_id, pickup, delivery, distance, load_type, average_weight, helpers, estimated_price, expected_date, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ booking_id: booking_id, status: 'Pending' });
    });
    stmt.finalize();
  });
});

// 4. Track Booking Endpoint
app.get('/api/bookings/:booking_id', (req, res) => {
  const { booking_id } = req.params;
  db.get("SELECT * FROM bookings WHERE booking_id = ?", [booking_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Booking not found' });
    res.json(row);
  });
});

// 5. Get All Bookings Endpoint (Admin)
app.get('/api/bookings', (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 7. Get Drivers Endpoint (Admin)
app.get('/api/drivers', (req, res) => {
  db.all("SELECT driver, vehicle_type, vehicle_no FROM vehicles WHERE status = 'Available'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 6. Assign Driver Endpoint (Admin)
app.put('/api/bookings/:booking_id/assign', (req, res) => {
  const { booking_id } = req.params;
  const { driver } = req.body;
  
  if (!driver) {
    return res.status(400).json({ error: 'Driver is required' });
  }

  const stmt = db.prepare("UPDATE bookings SET booking_status = 'Accepted', assigned_driver = ? WHERE booking_id = ?");
  stmt.run(driver, booking_id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Driver assigned and order accepted.' });
  });
});

// 7. Reject Booking Endpoint (Admin)
app.put('/api/bookings/:booking_id/reject', (req, res) => {
  const { booking_id } = req.params;
  
  const stmt = db.prepare("UPDATE bookings SET booking_status = 'Rejected' WHERE booking_id = ?");
  stmt.run(booking_id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Booking rejected.' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
