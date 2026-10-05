# PawHomes Database Schema Documentation

**Database Name**: `pawhomes_db`

### Collections Overview

1. **`users`**
   - `_id`: ObjectId
   - `name`: String (Required)
   - `email`: String (Unique, Indexed, Lowercase)
   - `password`: String (Bcrypt Hash)
   - `phone`: String
   - `shelterName`: String
   - `address`: String
   - `city`: String
   - `district`: String (Indexed)
   - `state`: String
   - `licenseNumber`: String
   - `role`: String ('adopter' | 'shelter' | 'admin')
   - `verificationStatus`: String ('Pending' | 'Approved' | 'Rejected' | 'Suspended')
   - `isEmailVerified`: Boolean
   - `profileImage`: String
   - `createdAt`: Date, `updatedAt`: Date

2. **`pets`**
   - `_id`: ObjectId
   - `petName`: String (Required)
   - `species`: String (Dog, Cat, etc.)
   - `breed`: String
   - `age`: String
   - `gender`: String ('Male' | 'Female')
   - `size`: String ('Small' | 'Medium' | 'Large')
   - `location`: String
   - `district`: String (Indexed)
   - `adoptionArea`: String ('Anywhere in Tamil Nadu' | 'Within District' | 'Local Only')
   - `description`: String
   - `healthStatus`: String
   - `vaccinationStatus`: String
   - `neuteredStatus`: String
   - `adoptionStatus`: String ('Available' | 'Reserved' | 'Adopted')
   - `images`: Array of Strings
   - `ownerId`: ObjectId -> ref `users` (Indexed)
   - `createdAt`: Date, `updatedAt`: Date

3. **`adoptionapplications`**
   - `_id`: ObjectId
   - `petId`: ObjectId -> ref `pets` (Indexed)
   - `applicantId`: ObjectId -> ref `users` (Indexed)
   - `ownerId`: ObjectId -> ref `users` (Indexed)
   - `applicantDistrict`: String
   - `reasonForAdoption`: String
   - `experienceWithPets`: String
   - `applicationStatus`: String ('Pending' | 'Approved' | 'Rejected' | 'Successful' | 'Cancelled')
   - `closingReason`: String
   - `createdAt`: Date, `updatedAt`: Date

4. **`adoptions`**
   - `_id`: ObjectId
   - `petId`: ObjectId -> ref `pets`
   - `adopterId`: ObjectId -> ref `users`
   - `shelterId`: ObjectId -> ref `users`
   - `applicationId`: ObjectId -> ref `adoptionapplications`
   - `certificateNumber`: String (Unique)
   - `adoptionDate`: Date

5. **`shelters`**
   - `_id`: ObjectId
   - `userId`: ObjectId -> ref `users` (Unique)
   - `shelterName`: String
   - `licenseNumber`: String
   - `verificationStatus`: String ('Pending' | 'Approved' | 'Rejected' | 'Suspended')

6. **`rescuereports`**
   - `_id`: ObjectId
   - `reporterId`: ObjectId -> ref `users`
   - `reportType`: String ('Lost' | 'Found' | 'Rescue Request')
   - `petName`: String
   - `species`: String
   - `location`: String
   - `district`: String
   - `contactPhone`: String
   - `images`: Array of Strings
   - `isVerified`: Boolean (Admin approval flag)
   - `status`: String ('Open' | 'Resolved' | 'Closed')

7. **`petcares`**
   - `_id`: ObjectId
   - `petId`: ObjectId -> ref `pets` (Unique)
   - `ownerId`: ObjectId -> ref `users`
   - `vaccinationRecords`: Array of objects (vaccineName, dateAdministered, nextDueDate, veterinarian)
   - `vetVisits`: Array of objects (visitDate, reason, clinicName, doctorName, diagnosis)
   - `feedingSchedules`: Array of objects (mealName, time, foodType, portionSize)
   - `followUpAppointments`: Array of objects (appointmentDate, purpose, location, status)

8. **`favorites`**
   - `_id`: ObjectId
   - `userId`: ObjectId -> ref `users`
   - `petId`: ObjectId -> ref `pets`
   - Unique Compound Index: `{ userId: 1, petId: 1 }`

9. **`notifications`**
   - `_id`: ObjectId
   - `userId`: ObjectId -> ref `users` (Indexed)
   - `title`: String
   - `message`: String
   - `type`: String
   - `read`: Boolean
