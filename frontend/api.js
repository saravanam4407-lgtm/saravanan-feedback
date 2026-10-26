/**
 * AuraFeedback API Client
 * 
 * Seamlessly connects Frontend to Backend (http://localhost:5000/api)
 * Powered by MySQL 8.0 with graceful fallback to local storage if offline.
 */

const API_BASE_URL = 'http://localhost:5000/api';

const ApiService = {
  isBackendAvailable: null,
  databaseType: 'MySQL',

  // Update navbar visual indicator
  updateStatusBadge(isOnline, dbName = 'MySQL') {
    const badge = document.getElementById('db-status-badge');
    const text = document.getElementById('db-status-text');
    if (!badge || !text) return;

    if (isOnline) {
      badge.className = 'db-status-badge online';
      text.textContent = `${dbName} Connected`;
      badge.title = `Connected to live ${dbName} database via backend`;
    } else {
      badge.className = 'db-status-badge offline';
      text.textContent = 'Local Mode';
      badge.title = 'Backend offline. Data saved in browser local storage.';
    }
  },

  // Check backend health & database status
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        this.isBackendAvailable = true;
        this.databaseType = data.database || 'MySQL';
        this.updateStatusBadge(true, this.databaseType);
        return data;
      }
    } catch (e) {
      // Backend is currently offline
    }
    this.isBackendAvailable = false;
    this.updateStatusBadge(false);
    return null;
  },

  // Fetch product catalog
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          return data.products;
        }
      }
    } catch (e) {
      console.warn("Backend API unavailable, using local catalog fallback.");
    }
    return null;
  },

  // Fetch feedbacks with optional filters
  async getFeedbacks(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/feedbacks?${query}`);
      if (res.ok) {
        const data = await res.json();
        this.isBackendAvailable = true;
        this.updateStatusBadge(true, data.database || 'MySQL');
        return data.feedbacks;
      }
    } catch (e) {
      console.warn("Backend API unavailable, falling back to local storage.");
      this.isBackendAvailable = false;
      this.updateStatusBadge(false);
    }
    return null;
  },

  // Fetch calculated stats & analytics
  async getStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/stats`);
      if (res.ok) {
        const data = await res.json();
        return data.stats;
      }
    } catch (e) {
      console.warn("Backend API unavailable, falling back to local calculations.");
    }
    return null;
  },

  // Submit feedback directly to MySQL Database
  async submitFeedback(feedbackPayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload)
      });
      if (res.ok) {
        const data = await res.json();
        this.isBackendAvailable = true;
        this.updateStatusBadge(true, data.database || 'MySQL');
        return data;
      }
    } catch (e) {
      console.warn("Backend API unavailable, saving to local storage.");
      this.isBackendAvailable = false;
      this.updateStatusBadge(false);
    }
    return null;
  },

  // Add reply to feedback ticket
  async addReply(ticketId, replyText, author = 'Customer Success') {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/${encodeURIComponent(ticketId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText, author })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend API unavailable, updated locally.");
    }
    return null;
  },

  // Delete feedback from database
  async deleteFeedback(ticketId) {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/${encodeURIComponent(ticketId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend API unavailable, deleted locally.");
    }
    return null;
  },

  // Update feedback ticket status
  async updateStatus(ticketId, status) {
    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/${encodeURIComponent(ticketId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend API unavailable, status updated locally.");
    }
    return null;
  }
};

window.ApiService = ApiService;

// Automatically ping backend when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  ApiService.checkHealth();
});
