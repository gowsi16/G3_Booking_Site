# G3 Transport - PostgreSQL Migration Guide

This guide describes how to safely migrate from the local SQLite database (`g3transport.db`) to the production PostgreSQL database (`g3_transport`) in pgAdmin 4 without losing existing customer accounts or booking records.

---

## 1. Prerequisites in pgAdmin 4

1. Open **pgAdmin 4**.
2. Connect to your PostgreSQL server.
3. Under Databases, ensure the database named **`g3_transport`** exists. (If not, right-click *Databases* -> *Create* -> *Database* -> Name: `g3_transport`).

---

## 2. Step 1: Run Schema DDL in pgAdmin 4

1. In pgAdmin 4, expand the **`g3_transport`** database.
2. Click **Tools** -> **Query Tool**.
3. Open or paste the contents of `backend/postgres/schema.sql`.
4. Click **Execute / Run (F5)**.
5. Verify that the following tables are created:
   - `customers`
   - `drivers` (seeded with Senthil, Chithiraj, Prabhu)
   - `vehicles` (seeded with TN 77AY 3006, TN28 BF 1256)
   - `bookings`
   - `pricing_settings`
   - `audit_logs`

---

## 3. Step 2: Import Existing SQLite Data into PostgreSQL

We have created an automated dump tool `backend/postgres/generate_pg_migration_dump.js` that extracts all current customers and historical bookings into a transaction-safe SQL script `migration_data.sql`.

1. To regenerate the dump with the latest SQLite data anytime, run:
   ```bash
   cd D:\Project\G3-BookingSite\backend
   node postgres/generate_pg_migration_dump.js
   ```
2. Open `backend/postgres/migration_data.sql` in the pgAdmin 4 Query Tool.
3. Click **Execute (F5)**.
4. Verify all records have migrated:
   ```sql
   SELECT COUNT(*) FROM customers;
   SELECT COUNT(*) FROM vehicles;
   SELECT COUNT(*) FROM drivers;
   SELECT COUNT(*) FROM bookings;
   ```

---

## 4. SQLite Safety & Backup Instructions

The original SQLite database file `backend/g3transport.db` remains completely untouched as your safe local fallback.

To create an extra manual backup of SQLite before any deployment:
```powershell
Copy-Item "D:\Project\G3-BookingSite\backend\g3transport.db" -Destination "D:\Project\G3-BookingSite\backend\g3transport_backup.db"
```
