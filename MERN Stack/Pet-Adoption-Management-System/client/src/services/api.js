const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('pawhomes_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const safeJson = async (response) => {
  try {
    const text = await response.text();
    if (!text) return { success: false, message: 'Server returned empty response' };
    return JSON.parse(text);
  } catch (err) {
    return {
      success: false,
      message: 'Server is currently offline or unreachable (500/504). Please ensure node server.js is running.'
    };
  }
};

// Custom fetch wrapper to handle expired sessions and unauthorized access consistently
const fetchWithAuth = async (url, options = {}) => {
  try {
    const headers = {
      ...getAuthHeader(),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('pawhomes_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return response;
  } catch (err) {
    return {
      ok: false,
      status: 503,
      json: async () => ({
        success: false,
        message: 'Unable to connect to backend server. Please make sure server is running on http://localhost:5000.'
      })
    };
  }
};

export const authAPI = {
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await safeJson(res);
    } catch (e) {
      return { success: false, message: 'Server connection failed.' };
    }
  },

  getAdminIdentifier: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/admin-identifier`);
      return await safeJson(res);
    } catch (e) {
      return { success: false };
    }
  },

  logout: async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/logout`, {
        method: 'POST'
      });
      return await safeJson(res);
    } catch (e) {
      return { success: true };
    }
  },

  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await safeJson(res);
    } catch (e) {
      return { success: false, message: 'Server connection failed.' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await safeJson(res);
    } catch (e) {
      return { success: false, message: 'Server connection failed.' };
    }
  },

  resetPassword: async (resetToken, newPassword) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword })
      });
      return await safeJson(res);
    } catch (e) {
      return { success: false, message: 'Server connection failed.' };
    }
  },

  sendEmailVerification: async () => {
    const res = await fetchWithAuth(`${API_BASE}/auth/send-verification`, {
      method: 'POST'
    });
    return await safeJson(res);
  },

  verifyEmail: async (token) => {
    const res = await fetch(`${API_BASE}/auth/verify-email/${token}`);
    return await safeJson(res);
  }
};

export const userAPI = {
  getProfile: async () => {
    const res = await fetchWithAuth(`${API_BASE}/users/profile`);
    return await safeJson(res);
  },

  updateProfile: async (userData) => {
    const res = await fetchWithAuth(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await safeJson(res);
  },

  changePassword: async (passwordData) => {
    const res = await fetchWithAuth(`${API_BASE}/users/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
    });
    return await safeJson(res);
  },

  uploadAvatar: async (formData) => {
    const res = await fetchWithAuth(`${API_BASE}/users/upload-avatar`, {
      method: 'POST',
      body: formData
    });
    return await safeJson(res);
  }
};

export const petAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_BASE}/pets?${query}`);
    return await safeJson(res);
  },

  getPets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_BASE}/pets?${query}`);
    return await safeJson(res);
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/pets/${id}`);
    return await safeJson(res);
  },

  create: async (petData) => {
    const res = await fetchWithAuth(`${API_BASE}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petData)
    });
    return await safeJson(res);
  },

  update: async (id, petData) => {
    const res = await fetchWithAuth(`${API_BASE}/pets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petData)
    });
    return await safeJson(res);
  },

  getMyPets: async () => {
    const res = await fetchWithAuth(`${API_BASE}/pets/my/pets`);
    return await safeJson(res);
  },

  delete: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/pets/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  }
};

export const shelterAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/shelters?${query}`);
    return await safeJson(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_BASE}/shelters/${id}`);
    return await safeJson(res);
  },
  getDashboardStats: async () => {
    const res = await fetchWithAuth(`${API_BASE}/shelters/dashboard-stats`);
    return await safeJson(res);
  }
};

export const rescueAPI = {
  getReports: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchWithAuth(`${API_BASE}/rescue?${query}`);
    return await safeJson(res);
  },

  createReport: async (reportData) => {
    const res = await fetchWithAuth(`${API_BASE}/rescue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    return await safeJson(res);
  },

  verifyReport: async (id, data) => {
    const res = await fetchWithAuth(`${API_BASE}/rescue/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeJson(res);
  }
};

export const careAPI = {
  getRecords: async (petId) => {
    const res = await fetchWithAuth(`${API_BASE}/care/${petId}`);
    return await safeJson(res);
  },

  addVaccination: async (petId, data) => {
    const res = await fetchWithAuth(`${API_BASE}/care/${petId}/vaccinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeJson(res);
  },

  addVetVisit: async (petId, data) => {
    const res = await fetchWithAuth(`${API_BASE}/care/${petId}/vet-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeJson(res);
  },

  addAppointment: async (petId, data) => {
    const res = await fetchWithAuth(`${API_BASE}/care/${petId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await safeJson(res);
  }
};

export const favoriteAPI = {
  getMyFavorites: async () => {
    const res = await fetchWithAuth(`${API_BASE}/favorites`);
    return await safeJson(res);
  },

  toggleFavorite: async (petId) => {
    const res = await fetchWithAuth(`${API_BASE}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId })
    });
    return await safeJson(res);
  }
};

export const applicationAPI = {
  create: async (appData) => {
    const res = await fetchWithAuth(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    return await safeJson(res);
  },

  getMyApplications: async () => {
    const res = await fetchWithAuth(`${API_BASE}/applications/my`);
    return await safeJson(res);
  },

  getByPet: async (petId) => {
    const res = await fetchWithAuth(`${API_BASE}/applications/pet/${petId}`);
    return await safeJson(res);
  },

  updateStatus: async (id, applicationStatus, reason = '') => {
    const res = await fetchWithAuth(`${API_BASE}/applications/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationStatus, reason })
    });
    return await safeJson(res);
  },

  delete: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/applications/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  }
};

export const notificationAPI = {
  getNotifications: async () => {
    const res = await fetchWithAuth(`${API_BASE}/notifications`);
    return await safeJson(res);
  },

  markAsRead: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    });
    return await safeJson(res);
  },

  markAllAsRead: async () => {
    const res = await fetchWithAuth(`${API_BASE}/notifications/read-all`, {
      method: 'PUT'
    });
    return await safeJson(res);
  }
};

export const adminAPI = {
  getStats: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/dashboard`);
    return await safeJson(res);
  },

  getUsers: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/users`);
    return await safeJson(res);
  },

  getPets: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/pets`);
    return await safeJson(res);
  },

  getApplications: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/applications`);
    return await safeJson(res);
  },

  verifyShelter: async (id, verificationStatus, verificationReason = '') => {
    const res = await fetchWithAuth(`${API_BASE}/admin/shelters/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus, verificationReason })
    });
    return await safeJson(res);
  },

  getAuditLogs: async (params = {}) => {
    // Clean up empty params
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetchWithAuth(`${API_BASE}/admin/audit-logs${query ? `?${query}` : ''}`);
    return await safeJson(res);
  },

  getRescues: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/rescues`);
    return await safeJson(res);
  },

  getAdoptions: async () => {
    const res = await fetchWithAuth(`${API_BASE}/admin/adoptions`);
    return await safeJson(res);
  },

  deleteUser: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  },

  deletePet: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/admin/pets/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  },

  deleteApplication: async (id) => {
    const res = await fetchWithAuth(`${API_BASE}/admin/applications/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  }
};
