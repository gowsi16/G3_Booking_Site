-- =====================================================================
-- G3 Transport Management System - PostgreSQL Production Schema
-- Database: g3_transport
-- Compatible with PostgreSQL 13+ & pgAdmin 4
-- =====================================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    customer_address TEXT,
    gst_number VARCHAR(50),
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- 2. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Trip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed company drivers
INSERT INTO drivers (name, status) 
VALUES 
    ('Senthil', 'Active'),
    ('Chithiraj', 'Active'),
    ('Prabhu', 'Active')
ON CONFLICT (name) DO NOTHING;

-- 3. Vehicles Table (The two registered company lorries)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_no VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(100) NOT NULL,
    capacity_kg INTEGER NOT NULL DEFAULT 3500 CHECK (capacity_kg > 0),
    status VARCHAR(30) DEFAULT 'Available' CHECK (status IN ('Available', 'Maintenance', 'On Trip', 'Archived')),
    driver VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed company lorries
INSERT INTO vehicles (vehicle_no, vehicle_type, capacity_kg, status, driver)
VALUES 
    ('TN 77AY 3006', 'Heavy Commercial Lorry (8 Ton)', 8000, 'Available', 'Senthil'),
    ('TN28 BF 1256', 'Medium Commercial Lorry (3.5 Ton)', 3500, 'Available', 'Chithiraj')
ON CONFLICT (vehicle_no) DO UPDATE 
SET vehicle_type = EXCLUDED.vehicle_type,
    capacity_kg = EXCLUDED.capacity_kg,
    driver = EXCLUDED.driver;

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(32) NOT NULL UNIQUE,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    pickup VARCHAR(255) NOT NULL,
    delivery VARCHAR(255) NOT NULL,
    customer_address TEXT,
    pickup_address TEXT,
    delivery_address TEXT,
    distance VARCHAR(50),
    vehicle_type VARCHAR(100) DEFAULT 'Pending Admin Lorry Assignment',
    assigned_vehicle VARCHAR(50) REFERENCES vehicles(vehicle_no) ON DELETE SET NULL,
    load_type VARCHAR(100) NOT NULL,
    average_weight VARCHAR(50),
    weight_kg INTEGER NOT NULL CHECK (weight_kg >= 0),
    helpers INTEGER DEFAULT 0 CHECK (helpers >= 0),
    helper_charge NUMERIC(10, 2) DEFAULT 0 CHECK (helper_charge >= 0),
    estimated_price NUMERIC(10, 2) NOT NULL CHECK (estimated_price >= 0),
    approved_fare NUMERIC(10, 2),
    expected_date DATE NOT NULL,
    trip_duration_days INTEGER DEFAULT 1 CHECK (trip_duration_days > 0),
    assigned_driver VARCHAR(100),
    booking_status VARCHAR(50) DEFAULT 'Pending Review & Assignment' 
        CHECK (booking_status IN ('Pending', 'Pending Review & Assignment', 'Confirmed', 'Accepted', 'In Transit', 'Completed', 'Cancelled', 'Rejected')),
    cancellation_reason TEXT,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_vehicle ON bookings(assigned_vehicle);
CREATE INDEX IF NOT EXISTS idx_bookings_expected_date ON bookings(expected_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- 5. Pricing Settings Table
CREATE TABLE IF NOT EXISTS pricing_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
