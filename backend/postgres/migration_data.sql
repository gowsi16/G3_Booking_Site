-- =====================================================================
-- G3 Transport - Data Migration Dump (SQLite -> PostgreSQL)
-- Generated on: 2026-10-14T04:56:46.340Z
-- Target Database: g3_transport
-- =====================================================================

BEGIN;

-- 1. Existing Customers (5 records)
INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)
VALUES ('CUS000001', 'Jeeva ', '9876543210', '48448136af56e481448aeb9b8052fb5a:c1424752b2043faa6d5b2dff58fcf805b70a539146004c1b0b1673888a448d97f05e96149123ef0cdac191aa5e067ab6e7818c04318f9f0e0649c61fce03e269', NULL, '3/93, Kalaignar Street, Vellalagundam, Salem', NULL, NULL, '2026-07-10 11:34:13')
ON CONFLICT (customer_id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,
  customer_address = EXCLUDED.customer_address;

INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)
VALUES ('CUS000002', 'Gowsilan B', '09080942982', '48448136af56e481448aeb9b8052fb5a:c1424752b2043faa6d5b2dff58fcf805b70a539146004c1b0b1673888a448d97f05e96149123ef0cdac191aa5e067ab6e7818c04318f9f0e0649c61fce03e269', 'gowsilan16@gmail.com', NULL, NULL, NULL, '2026-08-28 16:58:15')
ON CONFLICT (customer_id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,
  customer_address = EXCLUDED.customer_address;

INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)
VALUES ('CUS000003', 'Gowsilan B', '9080942982', '48448136af56e481448aeb9b8052fb5a:c1424752b2043faa6d5b2dff58fcf805b70a539146004c1b0b1673888a448d97f05e96149123ef0cdac191aa5e067ab6e7818c04318f9f0e0649c61fce03e269', 'gowsilan16@gmail.com', NULL, NULL, NULL, '2026-08-29 06:28:33')
ON CONFLICT (customer_id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,
  customer_address = EXCLUDED.customer_address;

INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)
VALUES ('CUS000004', 'Gowsilan B', '09080942982', '48448136af56e481448aeb9b8052fb5a:c1424752b2043faa6d5b2dff58fcf805b70a539146004c1b0b1673888a448d97f05e96149123ef0cdac191aa5e067ab6e7818c04318f9f0e0649c61fce03e269', 'gowsilan16@gmail.com', NULL, NULL, NULL, '2026-08-29 06:29:52')
ON CONFLICT (customer_id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,
  customer_address = EXCLUDED.customer_address;

INSERT INTO customers (customer_id, name, phone, password, email, customer_address, gst_number, company, created_at)
VALUES ('CUS000005', 'Karthik Raja', '9123456789', 'a89cc3fd27e2f4e62f06aa3e365ddccf:4b4b0fe99931743f882d2cc97769f7cba9e60ca7f58830881b8b72129726fade30d659a7437960260be33a959c8158604fd06bed76f6b26d3438574c0cf961a9', 'karthik@gmail.com', NULL, NULL, 'Raja Mill', '2026-10-13 11:20:20')
ON CONFLICT (customer_id) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password,
  customer_address = EXCLUDED.customer_address;

-- 2. Company Drivers (3 records)
INSERT INTO drivers (name, status, created_at)
VALUES ('Senthil', 'Active', '2026-10-13 12:55:02' )
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO drivers (name, status, created_at)
VALUES ('Chithiraj', 'Active', '2026-10-13 12:55:02' )
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO drivers (name, status, created_at)
VALUES ('Prabhu', 'Active', '2026-10-13 12:55:02' )
ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;

-- 3. Company Lorries (2 records)
INSERT INTO vehicles (vehicle_no, vehicle_type, capacity_kg, status, driver)
VALUES ('TN 77AY 3006', 'Heavy Commercial Lorry (8 Ton)', 8000, 'Available', 'Senthil')
ON CONFLICT (vehicle_no) DO UPDATE SET capacity_kg = EXCLUDED.capacity_kg, driver = EXCLUDED.driver;

INSERT INTO vehicles (vehicle_no, vehicle_type, capacity_kg, status, driver)
VALUES ('TN28 BF 1256', 'Medium Commercial Lorry (3.5 Ton)', 3500, 'Available', 'Chithiraj')
ON CONFLICT (vehicle_no) DO UPDATE SET capacity_kg = EXCLUDED.capacity_kg, driver = EXCLUDED.driver;

-- 4. Existing Bookings (10 records)
INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600001', 'CUS000001', 'Salem', 'Chennai', NULL,
  NULL, NULL, '377 km', 'Pending Admin Lorry Assignment',
  NULL,
  'Sugarcane', '7 Tons', 1000, 1,
  0, 22310, NULL,
  '2026-07-17', 1, NULL,
  'Pending', NULL, NULL,
  '2026-07-10 11:34:13'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600002', 'CUS000002', 'Chennai', 'Salem', NULL,
  NULL, NULL, '377 km', 'Pending Admin Lorry Assignment',
  NULL,
  'Jaggery', 'Up to 500 kg', 1000, 0,
  0, 12060, NULL,
  '2026-08-29', 1, NULL,
  'Pending', NULL, NULL,
  '2026-08-28 16:58:15'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600003', 'CUS000003', 'Chennai', 'Salem', NULL,
  NULL, NULL, '377 km', 'Pending Admin Lorry Assignment',
  NULL,
  'Sugarcane', '7 Tons', 1000, 1,
  0, 22310, NULL,
  '2026-09-01', 1, NULL,
  'Pending', NULL, NULL,
  '2026-08-29 06:28:33'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600004', 'CUS000004', 'Chennai', 'Salem', NULL,
  NULL, NULL, '377 km', 'Pending Admin Lorry Assignment',
  NULL,
  'Jaggery', '7 Tons', 1000, 1,
  0, 22310, NULL,
  '2026-09-01', 1, NULL,
  'Pending', NULL, NULL,
  '2026-08-29 06:29:53'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600005', 'CUS000005', 'Salem', 'Chennai', NULL,
  NULL, NULL, '336 km', '17 Feet',
  NULL,
  'Sugarcane', '7 Tons', 1000, 1,
  0, 16940, NULL,
  '2026-10-20', 1, NULL,
  'Pending', NULL, NULL,
  '2026-10-13 11:20:33'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600006', 'CUS000001', 'Salem', 'Chennai', NULL,
  NULL, NULL, '336 km', '17 Feet',
  NULL,
  'Sugarcane', '7 Tons', 1000, 1,
  0, 16940, NULL,
  '61020-02-20', 1, NULL,
  'Pending', NULL, NULL,
  '2026-10-13 11:26:33'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600007', 'CUS000001', 'Salem', 'Chennai', NULL,
  NULL, NULL, '336 km', '17 Feet',
  NULL,
  'Sugarcane', '7 Tons', 1000, 1,
  0, 16940, NULL,
  '2026-10-13', 1, 'Murugan (17 Feet)',
  'Accepted', NULL, NULL,
  '2026-10-13 12:46:43'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600008', 'CUS000001', 'Salem', 'Chennai', '3/93, Kalaignar Street, Vellalagundam, Salem',
  'Salem Steel Plant, Door 4', 'Chennai Port Container Terminal', '336 km', 'Heavy Commercial Lorry (8 Ton)',
  'TN 77AY 3006',
  'Textiles', '3.5 Tons', 3500, 2,
  1600, 14364, 15000,
  '2026-11-15', 1, 'Senthil',
  'Confirmed', NULL, NULL,
  '2026-10-14 04:56:05'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600009', 'CUS000002', 'Salem', 'Coimbatore', NULL,
  'Warehouse A', 'Warehouse B', '172 km', 'Pending Admin Lorry Assignment',
  NULL,
  'Machinery', '2 Tons', 2000, 1,
  800, 8028, NULL,
  '2026-11-15', 1, NULL,
  'Pending Review & Assignment', NULL, NULL,
  '2026-10-14 04:56:06'
) ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  booking_id, customer_id, pickup, delivery, customer_address, pickup_address, delivery_address,
  distance, vehicle_type, assigned_vehicle, load_type, average_weight, weight_kg, helpers,
  helper_charge, estimated_price, approved_fare, expected_date, trip_duration_days, assigned_driver,
  booking_status, cancellation_reason, instructions, created_at
) VALUES (
  'BK202600010', 'CUS000001', 'Salem', 'Madurai', '3/93, Kalaignar Street, Vellalagundam, Salem',
  'Quarry #2', 'Construction Site #5', '234 km', 'Heavy Commercial Lorry (8 Ton)',
  'TN 77AY 3006',
  'Granite', '7 Tons', 7000, 0,
  0, 14316, 14316,
  '2026-11-20', 1, 'Senthil',
  'Confirmed', NULL, NULL,
  '2026-10-14 04:56:06'
) ON CONFLICT (booking_id) DO NOTHING;

COMMIT;
