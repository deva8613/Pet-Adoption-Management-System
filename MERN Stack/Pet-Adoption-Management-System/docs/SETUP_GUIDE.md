# PawHomes Installation & Setup Guide

Follow these step-by-step instructions to run PawHomes locally on your machine.

---

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB Community Edition / Service** running locally on port 27017 (or MongoDB Atlas connection URI).
- **MongoDB Compass** (Optional GUI for database inspection).

---

### Step 1: Clone or Navigate to Project Folder
```bash
cd "d:\MERN Stack\Pet-Adoption-Management-System"
```

---

### Step 2: Configure Environment Variables
Verify or edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pawhomes_db
JWT_SECRET=pawhomes_super_secret_jwt_key_2026
```

---

### Step 3: Install Server Dependencies
```bash
cd server
npm install
```

---

### Step 4: Install Client Dependencies
```bash
cd ../client
npm install
```

---

### Step 5: Start MongoDB & Inspect via Compass
1. Ensure your MongoDB service is running on `127.0.0.1:27017`.
2. Open **MongoDB Compass**.
3. Connect to URI: `mongodb://127.0.0.1:27017`.
4. You will see database: `pawhomes_db`.

---

### Step 6: Initialize Database & Seed Data
Run the database initialization script to create required collections, indexes, default Admin (`admin@pawhomes.com`), Shelter (`shelter@pawhomes.com`), and sample pets:
```bash
cd ../server
npm run db:init
```

---

### Step 7: Start Backend REST API
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

---

### Step 8: Start Frontend React App
In a separate terminal:
```bash
cd client
npm run dev
# App will run on http://localhost:5173
```

---

### Step 9: Testing Accounts & Workflows
- **System Admin Login**: `admin@pawhomes.com` / `Admin@123456`
- **Verified Shelter Login**: `shelter@pawhomes.com` / `Admin@123456`
- **Register New Adopter**: Click "Sign Up" on Navbar, select "Adopter" role, enter location (e.g. Madurai/Chennai), and explore listings, smart match, rescue reports, adoption applications, and post-adoption care.
