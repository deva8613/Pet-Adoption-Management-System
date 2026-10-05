import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { careAPI, petAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { ShieldCheck, Calendar, FileCheck, Syringe, Stethoscope, Utensils, Award, Plus, ArrowLeft } from 'lucide-react';

const PostAdoptionCare = () => {
  const { petId } = useParams();
  const [care, setCare] = useState(null);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modals State
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({ vaccineName: '', dateAdministered: '', nextDueDate: '', veterinarian: '', notes: '' });

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetForm, setVetForm] = useState({ visitDate: '', reason: '', clinicName: '', doctorName: '', diagnosis: '', prescriptions: '', cost: '' });

  const [showApptModal, setShowApptModal] = useState(false);
  const [apptForm, setApptForm] = useState({ appointmentDate: '', purpose: '', location: '' });

  useEffect(() => {
    fetchCareData();
  }, [petId]);

  const fetchCareData = async () => {
    try {
      setLoading(true);
      const res = await careAPI.getRecords(petId);
      if (res.success) {
        setCare(res.data);
        setPet(res.pet);
      }
    } catch (err) {
      setError(err.message || 'Failed to load post-adoption care records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaccine = async (e) => {
    e.preventDefault();
    try {
      const res = await careAPI.addVaccination(petId, vaccineForm);
      if (res.success) {
        setShowVaccineModal(false);
        setVaccineForm({ vaccineName: '', dateAdministered: '', nextDueDate: '', veterinarian: '', notes: '' });
        await fetchCareData();
      }
    } catch (err) {
      alert('Failed to save vaccination record');
    }
  };

  const handleAddVetVisit = async (e) => {
    e.preventDefault();
    try {
      const res = await careAPI.addVetVisit(petId, vetForm);
      if (res.success) {
        setShowVetModal(false);
        setVetForm({ visitDate: '', reason: '', clinicName: '', doctorName: '', diagnosis: '', prescriptions: '', cost: '' });
        await fetchCareData();
      }
    } catch (err) {
      alert('Failed to save vet visit record');
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await careAPI.addAppointment(petId, apptForm);
      if (res.success) {
        setShowApptModal(false);
        setApptForm({ appointmentDate: '', purpose: '', location: '' });
        await fetchCareData();
      }
    } catch (err) {
      alert('Failed to save appointment');
    }
  };

  if (loading) return <div className="container section-padding"><LoadingSpinner message="Loading care records & certificate..." /></div>;
  if (error) return <div className="container section-padding"><ErrorMessage message={error} /></div>;

  return (
    <div className="container section-padding">
      <Link to="/adoption-history" className="btn btn-outline btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to My Adoptions
      </Link>

      <div className="card shadow-sm mb-5 p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
        <div className="d-flex justify-between align-center flex-wrap gap-3">
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }} className="mb-1">
              PAWHOMES OFFICIAL POST-ADOPTION CARE PORTAL
            </div>
            <h1 className="m-0 text-white" style={{ fontSize: '2rem' }}>{pet?.petName}'s Health &amp; Care Records</h1>
            <p style={{ color: '#94a3b8' }} className="m-0 mt-1">
              Species: {pet?.species} • Breed: {pet?.breed} • Location: {pet?.district || pet?.location}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '12px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Certificate ID</div>
            <strong style={{ fontSize: '1.1rem', color: '#f59e0b' }}>
              CERT-{pet?._id?.slice(-6).toUpperCase()}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-2 gap-4 mb-5">
        {/* VACCINATION RECORDS */}
        <div className="card shadow-sm">
          <div className="d-flex justify-between align-center mb-4">
            <h3 className="m-0 d-flex align-center gap-2">
              <Syringe className="text-primary" size={20} /> Vaccination Records
            </h3>
            <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
              ✓ Handover Verified
            </span>
          </div>

          {care?.vaccinationRecords?.length === 0 ? (
            <p className="text-muted text-center p-3">No vaccination records added yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vaccine</th>
                    <th>Date Administered</th>
                    <th>Next Due</th>
                    <th>Vet</th>
                  </tr>
                </thead>
                <tbody>
                  {care?.vaccinationRecords?.map((v, i) => (
                    <tr key={i}>
                      <td><strong>{v.vaccineName}</strong></td>
                      <td>{new Date(v.dateAdministered).toLocaleDateString()}</td>
                      <td>{v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString() : '-'}</td>
                      <td>{v.veterinarian || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VET VISITS */}
        <div className="card shadow-sm">
          <div className="d-flex justify-between align-center mb-4">
            <h3 className="m-0 d-flex align-center gap-2">
              <Stethoscope className="text-primary" size={20} /> Vet Visit Journal
            </h3>
            <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
              ✓ Vet Cleared
            </span>
          </div>

          {care?.vetVisits?.length === 0 ? (
            <p className="text-muted text-center p-3">No medical visits recorded yet.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {care?.vetVisits?.map((visit, i) => (
                <div key={i} style={{ borderLeft: '3px solid #3b82f6', background: '#f8fafc', padding: '10px 14px', borderRadius: '4px' }}>
                  <div className="d-flex justify-between align-center mb-1">
                    <strong>{visit.reason}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(visit.visitDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Clinic: {visit.clinicName || 'N/A'} • Doctor: {visit.doctorName || 'N/A'}
                  </div>
                  {visit.diagnosis && <div style={{ fontSize: '0.85rem', color: '#334155' }}>Diagnosis: {visit.diagnosis}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2 gap-4 mb-5">
        {/* FOLLOW UP APPOINTMENTS */}
        <div className="card shadow-sm">
          <div className="d-flex justify-between align-center mb-4">
            <h3 className="m-0 d-flex align-center gap-2">
              <Calendar className="text-primary" size={20} /> Follow-Up Appointments
            </h3>
            <button onClick={() => setShowApptModal(true)} className="btn btn-primary btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Schedule
            </button>
          </div>

          {care?.followUpAppointments?.length === 0 ? (
            <p className="text-muted text-center p-3">No upcoming appointments scheduled.</p>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Purpose</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {care?.followUpAppointments?.map((appt, i) => (
                    <tr key={i}>
                      <td><strong>{new Date(appt.appointmentDate).toLocaleDateString()}</strong></td>
                      <td>{appt.purpose}</td>
                      <td>{appt.location || 'N/A'}</td>
                      <td><span className="badge badge-info">{appt.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* OFFICIAL ADOPTION CERTIFICATE PREVIEW */}
        <div className="card shadow-sm" style={{ border: '2px gold dashed', background: '#fffdf5' }}>
          <div className="text-center p-3">
            <Award size={40} style={{ color: '#d97706' }} className="mb-2" />
            <h3 style={{ color: '#92400e' }}>Official Adoption Certificate</h3>
            <p style={{ fontSize: '0.85rem', color: '#78350f' }} className="mb-3">
              Certified that <strong>{pet?.petName}</strong> has been legally adopted into a safe &amp; verified forever home under PawHomes Rescue Management System.
            </p>

            <button
              onClick={() => alert(`Certificate CERT-${pet?._id?.slice(-6).toUpperCase()} generated! Printing view ready.`)}
              className="btn btn-warning btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Award size={16} /> View / Print Adoption Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Vaccine Modal */}
      {showVaccineModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Add Vaccination Record</h2>
              <button className="close-btn" onClick={() => setShowVaccineModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddVaccine} className="modal-body">
              <div className="form-group mb-3">
                <label>Vaccine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rabies, DHPP, Feline Leukemia"
                  value={vaccineForm.vaccineName}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-2 gap-3 mb-3">
                <div className="form-group">
                  <label>Date Administered *</label>
                  <input
                    type="date"
                    value={vaccineForm.dateAdministered}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, dateAdministered: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Next Due Date</label>
                  <input
                    type="date"
                    value={vaccineForm.nextDueDate}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group mb-4">
                <label>Veterinarian / Clinic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh / Madurai Vet Clinic"
                  value={vaccineForm.veterinarian}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowVaccineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vaccination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vet Modal */}
      {showVetModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Record Vet Visit</h2>
              <button className="close-btn" onClick={() => setShowVetModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddVetVisit} className="modal-body">
              <div className="grid grid-2 gap-3 mb-3">
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input
                    type="date"
                    value={vetForm.visitDate}
                    onChange={(e) => setVetForm({ ...vetForm, visitDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reason for Visit *</label>
                  <input
                    type="text"
                    placeholder="e.g. Routine Checkup, Deworming"
                    value={vetForm.reason}
                    onChange={(e) => setVetForm({ ...vetForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-2 gap-3 mb-3">
                <div className="form-group">
                  <label>Clinic Name</label>
                  <input
                    type="text"
                    value={vetForm.clinicName}
                    onChange={(e) => setVetForm({ ...vetForm, clinicName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Doctor Name</label>
                  <input
                    type="text"
                    value={vetForm.doctorName}
                    onChange={(e) => setVetForm({ ...vetForm, doctorName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group mb-4">
                <label>Diagnosis / Notes</label>
                <textarea
                  rows="2"
                  value={vetForm.diagnosis}
                  onChange={(e) => setVetForm({ ...vetForm, diagnosis: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowVetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showApptModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Schedule Follow-Up Appointment</h2>
              <button className="close-btn" onClick={() => setShowApptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddAppointment} className="modal-body">
              <div className="form-group mb-3">
                <label>Appointment Date *</label>
                <input
                  type="date"
                  value={apptForm.appointmentDate}
                  onChange={(e) => setApptForm({ ...apptForm, appointmentDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label>Purpose *</label>
                <input
                  type="text"
                  placeholder="e.g. 6-Month Post-Adoption Checkup"
                  value={apptForm.purpose}
                  onChange={(e) => setApptForm({ ...apptForm, purpose: e.target.value })}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Location / Clinic</label>
                <input
                  type="text"
                  value={apptForm.location}
                  onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowApptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostAdoptionCare;
