# PawHomes REST API Documentation

### Base URL
`http://localhost:5000/api`

---

### 1. Auth APIs (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ name, email, password, phone, role, shelterName, district, city }`
  - Returns: `{ success, token, user }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ success, token, user }`
- `POST /api/auth/forgot-password`
  - Body: `{ email }`
- `POST /api/auth/reset-password`
  - Body: `{ resetToken, newPassword }`

---

### 2. User & Profile APIs (`/api/users`)
- `GET /api/users/profile` [Auth]
- `PUT /api/users/profile` [Auth]
- `PUT /api/users/change-password` [Auth]
- `POST /api/users/upload-avatar` [Auth]

---

### 3. Pet Management APIs (`/api/pets`)
- `GET /api/pets` [Optional Auth]
  - Query Params: `search`, `species`, `breed`, `district`, `userCity`, `userDistrict`
  - Returns categorized listings: `nearbyPets`, `otherTnPets`, `data`
- `GET /api/pets/:id`
- `POST /api/pets` [Auth: Verified Shelter/Admin]
- `PUT /api/pets/:id` [Auth: Owner/Admin]
- `DELETE /api/pets/:id` [Auth: Owner/Admin]

---

### 4. Adoption Applications (`/api/applications`)
- `POST /api/applications` [Auth: Adopter]
  - Validates district eligibility against pet adoption area rules.
- `GET /api/applications/my` [Auth]
- `PUT /api/applications/:id/status` [Auth: Shelter/Admin]
  - Statuses: `Pending` -> `Approved` -> `Successful` (Atomic completion) / `Rejected` / `Cancelled`.

---

### 5. Smart Pet Match (`/api/pets?limit=50`)
- Frontend rule-based engine comparing user preferences against pet attributes.

---

### 6. Rescue Management (`/api/rescue`)
- `GET /api/rescue` [Optional Auth]
- `POST /api/rescue` [Auth]
- `PUT /api/rescue/:id/verify` [Auth: Admin Only]

---

### 7. Post-Adoption Care (`/api/care`)
- `GET /api/care/:petId` [Auth: Owner/Admin]
- `POST /api/care/:petId/vaccinations` [Auth: Owner/Admin]
- `POST /api/care/:petId/vet-visits` [Auth: Owner/Admin]
- `POST /api/care/:petId/appointments` [Auth: Owner/Admin]

---

### 8. Favorites (`/api/favorites`)
- `GET /api/favorites` [Auth]
- `POST /api/favorites/toggle` [Auth]

---

### 9. Admin Dashboard APIs (`/api/admin`)
- `GET /api/admin/dashboard` [Auth: Admin]
- `GET /api/admin/users` [Auth: Admin]
- `GET /api/admin/pets` [Auth: Admin]
- `GET /api/admin/applications` [Auth: Admin]
- `PUT /api/admin/shelters/:id/verify` [Auth: Admin]
- `GET /api/admin/audit-logs` [Auth: Admin]
