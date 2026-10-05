# PawHomes Testing & QA Verification Checklist

### Automated Test Suite Execution
Run the automated test runner in `server/`:
```bash
cd server
npm test
```

---

### Manual QA Verification Checklist

- [x] **Authentication & Security**
  - [x] User Registration (Adopter, Shelter)
  - [x] Login & JWT Token persistence
  - [x] Bcrypt password hashing check (no plain text passwords stored)
  - [x] Password Reset / Forgot Password flow
  - [x] Role-Based Route Protection (Admin, Shelter, Adopter)

- [x] **Shelter Verification Workflow**
  - [x] Unverified shelters blocked from creating pet listings (returns 403)
  - [x] Admin approval of shelter account in Admin Dashboard
  - [x] Verified shelter can create, edit, and delete pet listings

- [x] **Location Discovery & Filtering**
  - [x] "Pets Near You" vs "Other Pets Across Tamil Nadu" dynamic separation
  - [x] Updating profile city/district dynamically recalculates nearby listings
  - [x] Location adoption rules enforced ("Local Only", "Within District", "Anywhere in TN")

- [x] **Adoption Applications & Atomic Conflicts**
  - [x] Adopters can submit adoption applications with reason & experience
  - [x] Duplicate active applications for same pet by same user prevented
  - [x] Marking an application as "Successful" atomically sets pet status to "Adopted"
  - [x] Conflicting active applications automatically closed with recorded reason

- [x] **Smart Pet Match**
  - [x] Questionnaire collects species, home type, activity level, care time, age range, experience
  - [x] Recommendation score & match reasons displayed accurately

- [x] **Rescue & Lost Pet Alerts**
  - [x] Submit Lost Pet / Found Pet / Rescue Request reports
  - [x] Admin verification flag filters verified reports

- [x] **Interactive Pet Journey Map**
  - [x] Leaflet map displays shelter coordinates, adopter location, route line, animated pet marker, and journey milestones

- [x] **Post-Adoption Care & Certificate**
  - [x] Vaccination schedule records
  - [x] Vet visit journal records
  - [x] Feeding schedules & follow-up appointment tracking
  - [x] Official Adoption Certificate preview & print view
