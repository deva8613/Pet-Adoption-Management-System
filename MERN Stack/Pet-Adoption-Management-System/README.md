# 🐾 PawHomes — Pet Adoption Management System

> **Find Your Perfect Companion**

PawHomes is a complete, production-grade, full-stack **Pet Adoption Management System** built using **React.js**, **Node.js**, **Express.js**, and **MongoDB** (utilizing the official native `mongodb` Node.js driver — strictly **No ODM**).

PawHomes seamlessly connects verified animal shelters with prospective pet adopters. It handles the complete pet adoption lifecycle with strict status transitions, backend security authorization, MongoDB indexing, and responsive UI design.

---

## 🌟 Key Features

### 🐶 Adopters
- **Browse & Filter Pets**: Filter pets by species (Dog, Cat, Bird, Rabbit, etc.), breed, gender, age, size, location, and status.
- **Detailed Pet Insights**: View pet age, size, gender, health & care details (vaccination, neutered status, special needs), and shelter contact information.
- **Digital Adoption Application**: Apply for available pets with detailed living situation and pet experience background.
- **Application Tracking**: Real-time status updates on submitted applications (`Pending`, `Approved`, `Rejected`, `Successful`, `Cancelled`).
- **Adoption History**: View verified successful adoption milestones.
- **User Profile Management**: Update contact info, address, and profile settings stored in MongoDB.

### 🏠 Shelters & Rescues
- **Pet Management**: List new pets for adoption, update pet details, or remove listings.
- **Adoption Workflow Dashboard**: Oversee all incoming applications for shelter pets.
- **Status Workflow Control**: Transition applications through strict workflow state rules (`Pending` → `Approved` → `Successful`).
- **Automatic Inventory Updates**: Marking an adoption as `Successful` automatically sets the pet's status to `Adopted` in MongoDB and cancels competing active applications for that pet.

### 🛡️ System Administrators
- **Platform Analytics**: Monitor user counts, listed pets, available/adopted metrics, and total adoption applications.
- **Oversight**: Manage users, pets, and application records across the platform.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, React Router DOM, JavaScript (ES6+), Vanilla CSS (Custom Design System with CSS variables).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Local or MongoDB Atlas) using the official `mongodb` driver (`MongoClient`, `Db`, `Collection`, `ObjectId`).
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` for secure password hashing.
- **Build Tool**: Vite.

---

## 📁 Directory Structure

```text
Pet-Adoption-Management-System/
├── client/                      # React Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Static media & visual assets
│   │   ├── components/          # Reusable UI components (Navbar, Footer, PetCard, PetGrid, FilterPanel, StatusBadge, StatCard, Sidebar, etc.)
│   │   ├── context/             # AuthContext state provider
│   │   ├── pages/               # Application routes (Home, PetListing, PetDetails, UserDashboard, ShelterApplications, AdoptionHistory, Profile, AdminDashboard, etc.)
│   │   ├── services/            # REST API service wrappers (authAPI, petAPI, applicationAPI, userAPI, adminAPI)
│   │   ├── App.jsx              # Main App component & route map
│   │   ├── main.jsx             # React DOM entrypoint
│   │   └── index.css            # Vanilla CSS design system
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js / Express REST API Backend
│   ├── config/
│   │   └── db.js                # MongoDB MongoClient connection & auto-indexing
│   ├── controllers/             # Auth, User, Pet, Application, Admin controllers
│   ├── middleware/              # JWT protection & Role-based authorization
│   ├── routes/                  # Express route handlers
│   ├── uploads/                 # Static uploads directory
│   ├── .env                     # Server environment configuration
│   ├── .env.example             # Template environment variables
│   ├── package.json
│   └── server.js                # Express app entrypoint
│
└── README.md                    # Project Documentation
```

---

## 🔒 Status Workflow & Security Rules

PawHomes enforces a strict state machine for adoption applications on the backend:

```text
Pending  ───>  Approved   ───>  Successful (Pet becomes 'Adopted')
   │              │
   ├───> Rejected ├───> Rejected
   │              │
   └───> Cancelled └───> Cancelled
```

### Transition & Authorization Matrix:
1. **Pending → Approved / Rejected**: Authorized Shelter (Pet Owner) or Admin.
2. **Approved → Successful**: Authorized Shelter or Admin. Automatically updates `pet.adoptionStatus` to `'Adopted'`, stores `successfulAt` timestamp, and cancels competing pending/approved applications for the pet.
3. **Pending / Approved → Cancelled**: Applicant or Shelter.
4. **Invalid Transitions**: Direct jump from `Pending` to `Successful` is rejected by backend validation rules.

---

## 🚀 Environment Setup & Installation

### 1. Prerequisites
- **Node.js**: v18+ installed
- **MongoDB**: Installed locally and running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI.

### 2. Backend Setup
1. Navigate to `server/`:
   ```bash
   cd server
   ```
2. Verify environment file `server/.env`:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/pet_adoption_management
   JWT_SECRET=pawhomes_secure_jwt_secret_key_2026
   PORT=5000
   ```
3. Install dependencies and start server:
   ```bash
   npm install
   npm run dev
   ```
   *The server runs on http://localhost:5000 and automatically verifies MongoDB indexes.*

### 3. Frontend Setup
1. Navigate to `client/`:
   ```bash
   cd client
   ```
2. Install dependencies and start Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
   *The client app will be accessible at http://localhost:5173.*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new account (`adopter`, `shelter`, `admin`)
- `POST /api/auth/login` — Authenticate user & return JWT token

### User Profile
- `GET /api/users/profile` — Fetch authenticated user profile
- `PUT /api/users/profile` — Update user details in MongoDB

### Pet Management
- `GET /api/pets` — Query pets with search, filters & pagination (`species`, `breed`, `gender`, `size`, `location`, `adoptionStatus`, `page`, `limit`)
- `GET /api/pets/:id` — Get pet details by ObjectId
- `POST /api/pets` — Add new pet listing (Shelter/Admin protected)
- `PUT /api/pets/:id` — Update pet details (Shelter/Admin protected)
- `DELETE /api/pets/:id` — Remove pet listing (Shelter/Admin protected)

### Adoption Applications
- `POST /api/applications` — Submit adoption request (Adopter protected)
- `GET /api/applications/my` — Fetch applications for current user (Filtered by role)
- `GET /api/applications/pet/:petId` — Get applications for a specific pet
- `PUT /api/applications/:id/status` — Update application status with backend state validation
- `DELETE /api/applications/:id` — Delete application (Admin protected)

### Admin Operations
- `GET /api/admin/dashboard` — Platform statistics from MongoDB
- `GET /api/admin/users` — List all registered users
- `GET /api/admin/pets` — List all pets across shelters
- `GET /api/admin/applications` — List all system adoption applications

---

## 📄 License

© PawHomes. All rights reserved. Built for compassionate pet adoption.


## Database requirement
This version uses the official `mongodb` Node.js driver directly. ODM is not used anywhere in the runtime or source tree. Use MongoDB Compass to inspect the `pet_adoption_management` database and collections. The server does not seed sample users, pets, admin accounts, or applications automatically.

## Adoption workflow
Pending -> Approved -> Successful. Alternative terminal states are Pending -> Rejected and Pending -> Cancelled. Only an Approved application can become Successful; successful completion marks the pet Adopted and closes competing active applications.
