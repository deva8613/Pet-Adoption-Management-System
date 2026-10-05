# PawHomes – Complete Smart Pet Adoption & Rescue Management System

## Project Architecture Overview

PawHomes is a modern, production-grade MERN (MongoDB, Express, React, Node.js) web application engineered for pet adoption, rescue operations, shelter verifications, and post-adoption pet care management.

### Key Highlights & Features
1. **Multi-Role Authorization**: Support for Adopters, Verified Shelters, and System Administrators.
2. **Dynamic Location Discovery**: Intelligent location matching across Tamil Nadu districts (e.g. Madurai, Chennai, Coimbatore, Theni). Categorizes pets into "Pets Near You" and "Other Pets Across Tamil Nadu" based on user location profile.
3. **Location-Based Adoption Rules**: Supports "Local Only", "Within District", and "Anywhere in Tamil Nadu" adoption boundaries.
4. **Smart Pet Match Engine**: Preference-based scoring algorithm matching user lifestyle, home type, activity level, care time, and pet experience against live database pets with clear explanation criteria.
5. **Shelter Verification Enforcement**: Shelters register with "Pending" status and are blocked from listing pets until an Admin inspects credentials and approves the shelter.
6. **Atomic Application Conflict Resolution**: When an admin/shelter marks an application as "Successful", the pet status is atomically set to "Adopted" and conflicting active applications for the same pet are automatically cancelled with recorded closing reasons.
7. **Rescue & Lost Pet Alert Management**: Public submission and admin verification of Lost Pets, Found Pets, and Emergency Rescue Requests.
8. **Interactive Pet Journey**: Leaflet & OpenStreetMap interactive route map displaying shelter location, user destination, animated pet marker, and journey milestone tracking.
9. **Post-Adoption Care & Certificate Generator**: Dedicated portal for adopters to store vaccination schedules, vet visit journals, feeding schedules, follow-up appointments, and view official adoption certificates.
10. **Recharts Analytics & Security Audit Logs**: Live administrative dashboard showing visual analytics distribution of pet status, application pipelines, species catalog breakdown, and immutable security audit logs.
