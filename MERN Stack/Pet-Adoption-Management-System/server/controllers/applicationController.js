import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { createNotification } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';
import { getDistrictCoordinates, checkAdoptionEligibility } from '../utils/locationUtils.js';

export const createApplication = async (req, res) => {
  try {
    const {
      petId, reasonForAdoption, experienceWithPets, livingSituation, hasOtherPets,
      preferredContact, applicantDistrict, whoWillCare, caretaker, whereStay,
      hasChildren, medicalCommitment, vaccinationCommitment, longTermCommitment
    } = req.body;

    if (!petId || !reasonForAdoption || !experienceWithPets) {
      return res.status(400).json({ success: false, message: 'Please provide all required application details' });
    }

    if (!ObjectId.isValid(petId)) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    }

    const db = getDB();
    const pet = await db.collection('pets').findOne({ _id: new ObjectId(petId) });

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (pet.adoptionStatus !== 'Available') {
      return res.status(400).json({ success: false, message: 'This pet is no longer available for adoption' });
    }

    // Location & adoption eligibility rule check
    const userForCheck = {
      ...req.user,
      district: applicantDistrict || req.user.district || req.user.city
    };

    const eligibility = checkAdoptionEligibility(userForCheck, pet);
    if (!eligibility.eligible) {
      console.log('[Application Blocked] Reason:', eligibility.reason);
      return res.status(403).json({
        success: false,
        message: eligibility.reason
      });
    }

    // Prevent duplicate pending/approved active applications by same user for same pet
    const existingApp = await db.collection('adoptionapplications').findOne({
      petId: new ObjectId(petId),
      applicantId: new ObjectId(req.user._id),
      applicationStatus: { $in: ['Pending', 'Under Review', 'Needs Information', 'Approved'] }
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active application submitted for this pet'
      });
    }

    const userDistrict = applicantDistrict || req.user.district || req.user.city || 'Tamil Nadu';

    const newApp = {
      petId: new ObjectId(petId),
      applicantId: new ObjectId(req.user._id),
      ownerId: new ObjectId(pet.ownerId),
      applicantDistrict: userDistrict,
      applicantDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        address: req.user.address || req.user.doorStreet || '',
        city: req.user.city || '',
        district: userDistrict,
        occupation: req.user.occupation || '',
        profileImage: req.user.profileImage || ''
      },
      reasonForAdoption,
      experienceWithPets,
      livingSituation: livingSituation || 'Owns Home - Fenced Yard',
      hasOtherPets: hasOtherPets || 'No',
      preferredContact: preferredContact || 'Email',
      whoWillCare: whoWillCare || caretaker || 'Applicant',
      whereStay: whereStay || 'Indoors with Family',
      hasChildren: hasChildren || 'No',
      medicalCommitment: medicalCommitment !== undefined ? medicalCommitment : true,
      vaccinationCommitment: vaccinationCommitment !== undefined ? vaccinationCommitment : true,
      longTermCommitment: longTermCommitment !== undefined ? longTermCommitment : true,
      applicationStatus: 'Pending',
      rejectionReason: '',
      informationRequest: '',
      closingReason: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: null,
      successfulAt: null,
      completedAt: null,
      rejectedAt: null,
      cancelledAt: null
    };

    const result = await db.collection('adoptionapplications').insertOne(newApp);
    newApp._id = result.insertedId;

    // Send real notification to shelter owner
    await createNotification({
      userId: pet.ownerId,
      title: 'New Adoption Application',
      message: `${req.user.name} submitted a new adoption application for ${pet.petName}.`,
      type: 'application',
      relatedId: newApp._id
    });

    // Audit Log
    await createAuditLog({
      req,
      entityType: 'application',
      entityId: newApp._id,
      action: 'APPLICATION_CREATED',
      module: 'APPLICATIONS',
      status: 'SUCCESS',
      authorizedUser: req.user,
      previousStatus: null,
      newStatus: 'Pending',
      details: `Application submitted by ${req.user.name} for pet ${pet.petName}`,
      reason: `Application submitted by ${req.user.name} for pet ${pet.petName}`
    });

    res.status(201).json({ success: true, data: newApp });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const db = getDB();
    let filter = {};

    if (req.user.role === 'adopter') {
      filter = { applicantId: new ObjectId(req.user._id) };
    } else if (req.user.role === 'shelter') {
      filter = { ownerId: new ObjectId(req.user._id) };
    } else if (req.user.role === 'admin') {
      filter = {};
    }

    const apps = await db.collection('adoptionapplications')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate pet, applicant, & shelter coordinates
    const populatedApps = await Promise.all(
      apps.map(async (app) => {
        const pet = await db.collection('pets').findOne({ _id: new ObjectId(app.petId) });
        const applicant = await db.collection('users').findOne(
          { _id: new ObjectId(app.applicantId) },
          { projection: { password: 0 } }
        );
        const owner = await db.collection('users').findOne(
          { _id: new ObjectId(app.ownerId) },
          { projection: { password: 0 } }
        );

        // Calculate location coordinates for route map visualization
        const applicantDistrict = app.applicantDistrict || (applicant ? applicant.district || applicant.city : '');
        const shelterDistrict = owner ? (owner.district || owner.city) : (pet ? pet.district || pet.location : '');

        const applicantCoordinates = getDistrictCoordinates(applicantDistrict);
        const shelterCoordinates = getDistrictCoordinates(shelterDistrict);

        return {
          ...app,
          pet,
          applicant: applicant ? { ...applicant, coordinates: applicantCoordinates } : null,
          owner: owner ? { ...owner, coordinates: shelterCoordinates } : null,
          routeCoordinates: {
            shelter: shelterCoordinates,
            adopter: applicantCoordinates
          }
        };
      })
    );

    res.json({ success: true, data: populatedApps });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve applications' });
  }
};

export const getApplicationsByPet = async (req, res) => {
  try {
    const { petId } = req.params;
    if (!ObjectId.isValid(petId)) {
      return res.status(400).json({ success: false, message: 'Invalid pet ID' });
    }

    const db = getDB();
    const apps = await db.collection('adoptionapplications')
      .find({ petId: new ObjectId(petId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: apps });
  } catch (error) {
    console.error('Get applications by pet error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving applications' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationStatus, rejectionReason, informationRequest, reason } = req.body;

    const allowedStatuses = ['Pending', 'Under Review', 'Needs Information', 'Approved', 'Rejected', 'Successful', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(applicationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status requested' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const db = getDB();
    const app = await db.collection('adoptionapplications').findOne({ _id: new ObjectId(id) });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const currentStatus = app.applicationStatus;

    // Strict Backend Transition Validation
    if (currentStatus === 'Pending' && !['Under Review', 'Needs Information', 'Approved', 'Rejected', 'Cancelled'].includes(applicationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${applicationStatus}. Pending applications must be Approved or Rejected first.`
      });
    }

    if (['Under Review', 'Needs Information'].includes(currentStatus) && !['Under Review', 'Needs Information', 'Approved', 'Rejected', 'Cancelled'].includes(applicationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${applicationStatus}.`
      });
    }

    if (currentStatus === 'Approved' && !['Successful', 'Completed', 'Rejected', 'Cancelled'].includes(applicationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${currentStatus} to ${applicationStatus}.`
      });
    }

    if (['Successful', 'Completed', 'Rejected', 'Cancelled'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status of an application that is already ${currentStatus}.`
      });
    }

    // Role-based authorization
    if (['Approved', 'Rejected', 'Successful', 'Completed', 'Under Review', 'Needs Information'].includes(applicationStatus)) {
      if (app.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to change application status' });
      }
    }

    if (applicationStatus === 'Cancelled') {
      if (app.applicantId.toString() !== req.user._id.toString() && app.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this application' });
      }
    }

    const pet = await db.collection('pets').findOne({ _id: new ObjectId(app.petId) });
    const petName = pet ? pet.petName : 'pet';

    // ATOMIC CONFLICT HANDLING FOR SUCCESSFUL / COMPLETED ADOPTION
    if (applicationStatus === 'Successful' || applicationStatus === 'Completed') {
      const canonicalStatus = applicationStatus; // Keep requested status
      // Atomic update on pets collection: ensure pet is still Available
      const petUpdateResult = await db.collection('pets').findOneAndUpdate(
        { _id: new ObjectId(app.petId), adoptionStatus: 'Available' },
        { $set: { adoptionStatus: 'Adopted', updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!petUpdateResult) {
        return res.status(409).json({
          success: false,
          message: 'Pet is no longer available for adoption. Another application may have already been completed.'
        });
      }

      // Mark target application as Successful / Completed
      const updateFields = {
        applicationStatus: canonicalStatus,
        successfulAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('adoptionapplications').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      // Record in permanent adoptions collection
      await db.collection('adoptions').insertOne({
        applicationId: app._id,
        petId: new ObjectId(app.petId),
        petName,
        userId: new ObjectId(app.applicantId),
        shelterId: new ObjectId(app.ownerId),
        adoptionDate: new Date(),
        createdAt: new Date()
      });

      await db.collection('adoptionapplications').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      // Resolve all remaining active applications for this pet consistently
      const remainingApps = await db.collection('adoptionapplications').find({
        petId: new ObjectId(app.petId),
        _id: { $ne: new ObjectId(id) },
        applicationStatus: { $in: ['Pending', 'Approved'] }
      }).toArray();

      const closingReason = 'Pet adopted by another applicant';

      // Update remaining applications to Cancelled with closingReason
      await db.collection('adoptionapplications').updateMany(
        {
          petId: new ObjectId(app.petId),
          _id: { $ne: new ObjectId(id) },
          applicationStatus: { $in: ['Pending', 'Approved'] }
        },
        {
          $set: {
            applicationStatus: 'Cancelled',
            closingReason,
            cancelledAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Notify winning applicant
      await createNotification({
        userId: app.applicantId,
        title: 'Adoption Application Successful!',
        message: `Congratulations! Your adoption application for ${petName} has been approved and finalized.`,
        type: 'application',
        relatedId: app._id
      });

      // Notify other applicants whose applications were closed
      for (const otherApp of remainingApps) {
        await createNotification({
          userId: otherApp.applicantId,
          title: 'Application Closed',
          message: `Your application for ${petName} was closed because the pet was adopted by another applicant.`,
          type: 'application',
          relatedId: otherApp._id
        });

        await createAuditLog({
          req,
          entityType: 'application',
          entityId: otherApp._id,
          action: 'APPLICATION_CONFLICT_CLOSED',
          module: 'APPLICATIONS',
          status: 'SUCCESS',
          authorizedUser: req.user,
          previousStatus: otherApp.applicationStatus,
          newStatus: 'Cancelled',
          details: closingReason,
          reason: closingReason
        });
      }

      // Audit Log for successful adoption
      await createAuditLog({
        req,
        entityType: 'application',
        entityId: app._id,
        action: 'ADOPTION_COMPLETED',
        module: 'ADOPTIONS',
        status: 'SUCCESS',
        authorizedUser: req.user,
        previousStatus: currentStatus,
        newStatus: 'Successful',
        details: `Adoption completed successfully for pet ${petName}`,
        reason: 'Adoption completed successfully'
      });

      const updatedApp = await db.collection('adoptionapplications').findOne({ _id: new ObjectId(id) });
      return res.json({ success: true, data: updatedApp });
    }

    // Normal Status Updates (Approved, Rejected, Cancelled)
    const updateFields = {
      applicationStatus,
      updatedAt: new Date()
    };

    if (applicationStatus === 'Approved') {
      updateFields.approvedAt = new Date();
      updateFields.driverInfo = {
        name: req.body.driverName || 'Ramesh (Pet Transport Specialist)',
        phone: req.body.driverPhone || '+91 98765 43210',
        vehicleNumber: req.body.vehicleNumber || 'TN-01-AB-1234'
      };
      updateFields.scheduledDeliveryDate = req.body.scheduledDeliveryDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
      updateFields.scheduledDeliveryTime = req.body.scheduledDeliveryTime || '10:00 AM - 01:00 PM';
      updateFields.deliveryStatus = 'Scheduled';
    }

    if (applicationStatus === 'Under Review') {
      updateFields.underReviewAt = new Date();
    }

    if (applicationStatus === 'Needs Information') {
      updateFields.needsInfoAt = new Date();
      updateFields.informationRequest = informationRequest || reason || 'Please provide additional details regarding your application.';
    }

    if (applicationStatus === 'Rejected') {
      updateFields.rejectedAt = new Date();
      updateFields.rejectionReason = rejectionReason || reason || 'Application did not meet adoption requirements at this time.';
    }

    if (applicationStatus === 'Cancelled') {
      updateFields.cancelledAt = new Date();
      if (!updateFields.closingReason) {
        updateFields.closingReason = app.applicantId.toString() === req.user._id.toString()
          ? 'Cancelled by applicant'
          : 'Cancelled by shelter';
      }
    }

    await db.collection('adoptionapplications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    // Notifications for Status Changes
    if (applicationStatus === 'Approved') {
      const deliveryDateText = updateFields.scheduledDeliveryDate;
      const deliveryTimeText = updateFields.scheduledDeliveryTime;
      const driverNameText = updateFields.driverInfo.name;
      const driverPhoneText = updateFields.driverInfo.phone;

      await createNotification({
        userId: app.applicantId,
        title: 'Application Approved! 🎉',
        message: `Your adoption application for ${petName} has been approved! Delivery scheduled on ${deliveryDateText} (${deliveryTimeText}) by Driver ${driverNameText} (${driverPhoneText}).`,
        type: 'application',
        relatedId: app._id
      });
    } else if (applicationStatus === 'Under Review') {
      await createNotification({
        userId: app.applicantId,
        title: 'Application Under Review 🔍',
        message: `Your adoption application for ${petName} is currently under active review by the shelter.`,
        type: 'application',
        relatedId: app._id
      });
    } else if (applicationStatus === 'Needs Information') {
      await createNotification({
        userId: app.applicantId,
        title: 'Additional Information Requested 📝',
        message: `The shelter requested more information for ${petName}: "${updateFields.informationRequest}"`,
        type: 'application',
        relatedId: app._id
      });
    } else if (applicationStatus === 'Rejected') {
      await createNotification({
        userId: app.applicantId,
        title: 'Application Update',
        message: `Your adoption application for ${petName} was not approved. Reason: ${updateFields.rejectionReason}`,
        type: 'application',
        relatedId: app._id
      });
    } else if (applicationStatus === 'Cancelled') {
      const targetUserId = (req.user._id.toString() === app.applicantId.toString()) ? app.ownerId : app.applicantId;
      await createNotification({
        userId: targetUserId,
        title: 'Application Cancelled',
        message: `The application for ${petName} was cancelled.`,
        type: 'application',
        relatedId: app._id
      });
    }

    // Audit Log
    let logAction = `APPLICATION_${applicationStatus.toUpperCase()}`;
    if (applicationStatus === 'Approved') logAction = 'APPLICATION_APPROVED';
    if (applicationStatus === 'Rejected') logAction = 'APPLICATION_REJECTED';

    await createAuditLog({
      req,
      entityType: 'application',
      entityId: app._id,
      action: logAction,
      module: 'APPLICATIONS',
      status: 'SUCCESS',
      authorizedUser: req.user,
      previousStatus: currentStatus,
      newStatus: applicationStatus,
      details: req.body.reason || `Application status changed from ${currentStatus} to ${applicationStatus}`,
      reason: req.body.reason || `Status updated from ${currentStatus} to ${applicationStatus}`
    });

    const updatedApp = await db.collection('adoptionapplications').findOne({ _id: new ObjectId(id) });
    res.json({ success: true, data: updatedApp });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const db = getDB();
    const app = await db.collection('adoptionapplications').findOne({ _id: new ObjectId(id) });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await createAuditLog({
      entityType: 'application',
      entityId: id,
      action: 'APPLICATION_DELETED',
      authorizedUser: req.user,
      previousStatus: app.applicationStatus,
      newStatus: 'Deleted',
      reason: 'Application removed'
    });

    await db.collection('adoptionapplications').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
};
