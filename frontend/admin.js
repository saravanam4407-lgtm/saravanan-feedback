/**
 * AuraFeedback Admin Portal JavaScript Logic
 * 
 * Manages customer reviews, real-time MySQL synchronization,
 * status updates, replies, and CSV exports.
 */

// State Management
const adminState = {
  feedbacks: [],
  filters: {
    search: '',
    rating: 'all',
    sentiment: 'all',
    status: 'all'
  },
  activeTicket: null
};

// DOM Elements
let el = {};

function initDOMElements() {
  el = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    tableBody: document.getElementById('admin-table-body'),
    tableCount: document.getElementById('admin-table-count'),
    emptyState: document.getElementById('admin-empty-state'),

    // KPI stats
    totalReviewers: document.getElementById('admin-total-reviewers'),
    avgRating: document.getElementById('admin-avg-rating'),
    starsFooter: document.getElementById('admin-rating-stars-footer'),
    positivePct: document.getElementById('admin-positive-pct'),
    positiveCount: document.getElementById('admin-positive-count'),
    openCount: document.getElementById('admin-open-count'),

    // Filters
    searchInput: document.getElementById('admin-search-input'),
    filterRating: document.getElementById('admin-filter-rating'),
    filterSentiment: document.getElementById('admin-filter-sentiment'),
    filterStatus: document.getElementById('admin-filter-status'),

    // Global buttons
    btnRefresh: document.getElementById('btn-admin-refresh'),
    btnExport: document.getElementById('btn-admin-export'),
    btnTestReview: document.getElementById('btn-admin-test-review'),

    // Details Modal
    detailsModal: document.getElementById('admin-details-modal'),
    modalTicketId: document.getElementById('modal-ticket-id'),
    modalAvatar: document.getElementById('modal-avatar'),
    modalReviewerName: document.getElementById('modal-reviewer-name'),
    modalReviewerEmail: document.getElementById('modal-reviewer-email'),
    modalDate: document.getElementById('modal-date'),
    modalProductImg: document.getElementById('modal-product-img'),
    modalProductName: document.getElementById('modal-product-name'),
    modalRatingStars: document.getElementById('modal-rating-stars'),
    modalSentimentPill: document.getElementById('modal-sentiment-pill'),
    modalComment: document.getElementById('modal-comment'),
    modalTagsContainer: document.getElementById('modal-tags-container'),
    modalRepliesSection: document.getElementById('modal-replies-section'),
    modalRepliesList: document.getElementById('modal-replies-list'),
    modalDetailsClose: document.getElementById('modal-details-close'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalOpenReplyBtn: document.getElementById('modal-open-reply-btn'),

    // Reply Modal
    replyModal: document.getElementById('admin-reply-modal'),
    replyToName: document.getElementById('reply-to-name'),
    replyToQuote: document.getElementById('reply-to-quote'),
    replyTextarea: document.getElementById('admin-reply-textarea'),
    btnSendReply: document.getElementById('btn-send-reply-submit'),
    btnCancelReply: document.getElementById('btn-cancel-reply'),
    replyCloseX: document.getElementById('modal-reply-close-x'),

    // Templates
    tplThanks: document.getElementById('tpl-thanks'),
    tplApology: document.getElementById('tpl-apology'),
    tplResolved: document.getElementById('tpl-resolved')
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initDOMElements();
  initTheme();
  setupEventListeners();
  await loadAdminFeedbacks();
  renderAdminTable();
  updateKPIs();
  lucide.createIcons();
});

// Theme Management
function initTheme() {
  const storedTheme = localStorage.getItem('aurafeedback_theme') || 'light';
  document.body.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);
}

function updateThemeIcon(theme) {
  const iconName = theme === 'light' ? 'moon' : 'sun';
  el.themeToggleBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
  lucide.createIcons();
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('aurafeedback_theme', newTheme);
  updateThemeIcon(newTheme);
}

// Load feedbacks from Backend MySQL Database
async function loadAdminFeedbacks() {
  if (window.ApiService) {
    const apiData = await ApiService.getFeedbacks();
    if (Array.isArray(apiData)) {
      adminState.feedbacks = apiData;
      return;
    }
  }

  // Local fallback
  const stored = localStorage.getItem('aurafeedback_db');
  if (stored) {
    try {
      adminState.feedbacks = JSON.parse(stored);
    } catch {
      adminState.feedbacks = [];
    }
  } else {
    adminState.feedbacks = [];
  }
}

// Filtered List Helper
function getFilteredFeedbacks() {
  return adminState.feedbacks.filter(f => {
    // Search filter
    if (adminState.filters.search) {
      const q = adminState.filters.search.toLowerCase();
      const matchName = (f.name || '').toLowerCase().includes(q);
      const matchEmail = (f.email || '').toLowerCase().includes(q);
      const matchComment = (f.comment || '').toLowerCase().includes(q);
      const matchId = (f.id || '').toLowerCase().includes(q);
      const matchProduct = f.product && (f.product.name || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchComment && !matchId && !matchProduct) return false;
    }

    // Rating filter
    if (adminState.filters.rating !== 'all') {
      if (Number(f.rating) !== parseInt(adminState.filters.rating, 10)) return false;
    }

    // Sentiment filter
    if (adminState.filters.sentiment !== 'all') {
      if (f.sentiment !== adminState.filters.sentiment) return false;
    }

    // Status filter
    if (adminState.filters.status !== 'all') {
      const s = (f.status || 'open').toLowerCase();
      if (s !== adminState.filters.status.toLowerCase()) return false;
    }

    return true;
  });
}

// Helper: Get Initials for Avatar
function getInitials(name) {
  if (!name || name === 'Anonymous' || name === 'N/A') return '👤';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Render Reviewers Table
function renderAdminTable() {
  const filtered = getFilteredFeedbacks();
  el.tableCount.textContent = filtered.length;

  if (filtered.length === 0) {
    el.tableBody.innerHTML = '';
    el.emptyState.style.display = 'block';
    return;
  }

  el.emptyState.style.display = 'none';

  el.tableBody.innerHTML = filtered.map(item => {
    const initials = getInitials(item.name);
    const prod = item.product || {
      name: 'General Product',
      category: item.category || 'General',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'
    };

    const statusVal = (item.status || 'open').toLowerCase();
    const repliesCount = Array.isArray(item.replies) ? item.replies.length : 0;
    const shortComment = item.comment ? (item.comment.length > 80 ? item.comment.substring(0, 80) + '...' : item.comment) : 'No comment text';

    // Stars HTML
    const starsHtml = Array.from({ length: 5 }, (_, i) => {
      return `<i data-lucide="star" style="${i < item.rating ? 'fill: #f59e0b; color: #f59e0b;' : 'color: rgba(255,255,255,0.2);'}"></i>`;
    }).join('');

    const sentimentClass = {
      positive: 'color-success',
      neutral: 'text-secondary',
      negative: 'text-danger'
    }[item.sentiment] || 'text-secondary';

    return `
      <tr data-id="${item.id}">
        <!-- 1. Reviewer Customer Profile -->
        <td>
          <div class="reviewer-profile-cell">
            <div class="reviewer-avatar">${initials}</div>
            <div class="reviewer-info">
              <span class="reviewer-name">${escapeHtml(item.name || 'Anonymous Customer')}</span>
              <a href="mailto:${escapeHtml(item.email)}" class="reviewer-email">${escapeHtml(item.email || 'No email')}</a>
              <span style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">${item.id}</span>
            </div>
          </div>
        </td>

        <!-- 2. Purchased Product -->
        <td>
          <div class="product-cell-wrap">
            <img src="${prod.img || ''}" alt="${escapeHtml(prod.name)}" class="product-cell-img" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'">
            <div>
              <div class="product-cell-name">${escapeHtml(prod.name)}</div>
              <div class="product-cell-cat">${escapeHtml(prod.category || item.category || 'Quality')}</div>
            </div>
          </div>
        </td>

        <!-- 3. Rating & Sentiment -->
        <td>
          <div>
            <div class="admin-rating-stars">${starsHtml}</div>
            <div style="margin-top: 0.25rem;">
              <span class="badge sentiment-badge ${item.sentiment}">
                ${item.sentiment ? item.sentiment.toUpperCase() : 'NEUTRAL'}
              </span>
            </div>
          </div>
        </td>

        <!-- 4. Review Message -->
        <td style="max-width: 280px;">
          <div style="font-size: 0.88rem; line-height: 1.4; color: var(--text-primary);">
            ${escapeHtml(shortComment)}
          </div>
          ${repliesCount > 0 ? `
            <div class="reply-badge">
              <i data-lucide="check-check" style="width: 12px; height: 12px;"></i>
              <span>${repliesCount} Official Reply</span>
            </div>
          ` : ''}
        </td>

        <!-- 5. Date -->
        <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
          ${formatDate(item.date)}
        </td>

        <!-- 6. Status Selector -->
        <td>
          <select class="status-select-pill ${statusVal}" onchange="changeTicketStatus('${item.id}', this.value, this)">
            <option value="open" ${statusVal === 'open' ? 'selected' : ''}>🟡 Open</option>
            <option value="in-progress" ${statusVal === 'in-progress' ? 'selected' : ''}>🔵 In Progress</option>
            <option value="resolved" ${statusVal === 'resolved' ? 'selected' : ''}>🟢 Resolved</option>
          </select>
        </td>

        <!-- 7. Actions Group -->
        <td style="text-align: right;">
          <div class="admin-actions-cell" style="justify-content: flex-end;">
            <button class="btn-admin-icon" title="View Review Details" onclick="openDetailsModal('${item.id}')">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-admin-icon" title="Reply to Customer" onclick="openReplyModal('${item.id}')">
              <i data-lucide="message-square"></i>
            </button>
            <button class="btn-admin-icon danger" title="Delete Review from MySQL" onclick="confirmDelete('${item.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// Update Admin KPI Cards
function updateKPIs() {
  const all = adminState.feedbacks;
  const total = all.length;

  el.totalReviewers.textContent = total;
  el.totalReviewers.style.color = 'var(--text-primary)';

  if (total === 0) {
    el.avgRating.textContent = '0.0';
    el.starsFooter.textContent = 'No ratings received yet';
    el.positivePct.textContent = '0%';
    el.positiveCount.textContent = '0 positive reviews';
    el.openCount.textContent = '0';
    return;
  }

  // Average Rating
  const sum = all.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
  const avg = (sum / total).toFixed(1);
  el.avgRating.textContent = avg;
  el.starsFooter.textContent = `${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))} (${avg} / 5.0)`;

  // Positive %
  const positiveItems = all.filter(f => f.sentiment === 'positive').length;
  const pct = Math.round((positiveItems / total) * 100);
  el.positivePct.textContent = `${pct}%`;
  el.positiveCount.textContent = `${positiveItems} of ${total} positive`;

  // Open tickets count
  const openItems = all.filter(f => (f.status || 'open') !== 'resolved').length;
  el.openCount.textContent = openItems;
}

// Change Ticket Status Handler (Saved to MySQL)
window.changeTicketStatus = async function (ticketId, newStatus, selectElement) {
  if (selectElement) {
    selectElement.className = `status-select-pill ${newStatus}`;
  }

  // Update in state
  const item = adminState.feedbacks.find(f => f.id === ticketId);
  if (item) {
    item.status = newStatus;
  }

  // Sync to MySQL Backend
  if (window.ApiService) {
    await ApiService.updateStatus(ticketId, newStatus);
  }

  localStorage.setItem('aurafeedback_db', JSON.stringify(adminState.feedbacks));
  updateKPIs();
};

// Open Details Modal
window.openDetailsModal = function (ticketId) {
  const item = adminState.feedbacks.find(f => f.id === ticketId);
  if (!item) return;

  adminState.activeTicket = item;

  el.modalTicketId.textContent = item.id;
  el.modalAvatar.textContent = getInitials(item.name);
  el.modalReviewerName.textContent = item.name || 'Anonymous Customer';
  el.modalReviewerEmail.textContent = item.email ? `Email: ${item.email}` : 'No email provided';
  el.modalDate.textContent = `Submitted on ${formatDate(item.date)}`;

  const prod = item.product || {
    name: 'General Store Product',
    category: item.category || 'Quality',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'
  };

  el.modalProductImg.src = prod.img;
  el.modalProductName.textContent = `${prod.name} (${prod.category || 'Catalog'})`;

  // Stars
  el.modalRatingStars.innerHTML = Array.from({ length: 5 }, (_, i) => {
    return `<i data-lucide="star" style="${i < item.rating ? 'fill: #f59e0b; color: #f59e0b;' : 'color: rgba(255,255,255,0.2);'}"></i>`;
  }).join('');

  el.modalSentimentPill.className = `badge sentiment-badge ${item.sentiment}`;
  el.modalSentimentPill.textContent = `${item.sentiment ? item.sentiment.toUpperCase() : 'NEUTRAL'} SENTIMENT`;

  el.modalComment.textContent = item.comment || 'No comment text provided.';

  // Tags
  const tags = Array.isArray(item.tags) ? item.tags : [];
  if (tags.length > 0) {
    el.modalTagsContainer.innerHTML = tags.map(t => `<span class="tag-chip-btn" style="pointer-events: none; padding: 0.2rem 0.6rem; font-size: 0.75rem;">${escapeHtml(t)}</span>`).join('');
    el.modalTagsContainer.style.display = 'flex';
  } else {
    el.modalTagsContainer.style.display = 'none';
  }

  // Replies List
  const replies = Array.isArray(item.replies) ? item.replies : [];
  if (replies.length > 0) {
    el.modalRepliesSection.style.display = 'block';
    el.modalRepliesList.innerHTML = replies.map(r => `
      <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; font-weight: 600; color: #10b981; margin-bottom: 0.25rem;">
          <span>${escapeHtml(r.author || 'Customer Success Team')}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(r.date)}</span>
        </div>
        <div style="color: var(--text-primary); line-height: 1.4;">${escapeHtml(r.text || r.reply_text || '')}</div>
      </div>
    `).join('');
  } else {
    el.modalRepliesSection.style.display = 'none';
  }

  el.detailsModal.classList.add('active');
  lucide.createIcons();
};

// Open Reply Modal
window.openReplyModal = function (ticketId) {
  const item = adminState.feedbacks.find(f => f.id === ticketId);
  if (!item) return;

  adminState.activeTicket = item;

  // Close details modal if open
  el.detailsModal.classList.remove('active');

  el.replyToName.textContent = `${item.name || 'Customer'} (${item.id})`;
  el.replyToQuote.textContent = `"${item.comment ? (item.comment.length > 120 ? item.comment.substring(0, 120) + '...' : item.comment) : 'Review'}"`;
  el.replyTextarea.value = '';

  el.replyModal.classList.add('active');
  el.replyTextarea.focus();
  lucide.createIcons();
};

// Send Reply to Customer (Save to MySQL)
async function handleSendReply() {
  const replyText = el.replyTextarea.value.trim();
  if (!replyText) {
    alert("Please write a response message before sending.");
    return;
  }

  if (!adminState.activeTicket) return;
  const ticketId = adminState.activeTicket.id;

  el.btnSendReply.disabled = true;
  el.btnSendReply.innerHTML = `<span>Saving to MySQL...</span>`;

  try {
    if (window.ApiService) {
      await ApiService.addReply(ticketId, replyText, 'Customer Success Lead');
    }

    // Update local state
    const item = adminState.feedbacks.find(f => f.id === ticketId);
    if (item) {
      if (!Array.isArray(item.replies)) item.replies = [];
      item.replies.push({
        id: `REP-${Date.now()}`,
        author: 'Customer Success Lead',
        text: replyText,
        date: new Date().toISOString()
      });
      item.status = 'resolved';
    }

    localStorage.setItem('aurafeedback_db', JSON.stringify(adminState.feedbacks));
    el.replyModal.classList.remove('active');
    renderAdminTable();
    updateKPIs();
  } catch (err) {
    alert("Failed to save reply. Please ensure backend is running.");
  } finally {
    el.btnSendReply.disabled = false;
    el.btnSendReply.innerHTML = `<i data-lucide="send"></i> Send Reply (Save to Database)`;
    lucide.createIcons();
  }
}

// Delete Feedback
window.confirmDelete = async function (ticketId) {
  if (!confirm(`Are you sure you want to delete review ticket '${ticketId}' permanently from MySQL database?`)) {
    return;
  }

  if (window.ApiService) {
    await ApiService.deleteFeedback(ticketId);
  }

  adminState.feedbacks = adminState.feedbacks.filter(f => f.id !== ticketId);
  localStorage.setItem('aurafeedback_db', JSON.stringify(adminState.feedbacks));
  renderAdminTable();
  updateKPIs();
};

// Export to CSV
function exportReviewsToCSV() {
  const list = getFilteredFeedbacks();
  if (list.length === 0) {
    alert("No reviews to export.");
    return;
  }

  const headers = ['Ticket ID', 'Customer Name', 'Customer Email', 'Product Name', 'Category', 'Rating', 'Sentiment', 'Status', 'Date', 'Comment'];
  const rows = list.map(item => [
    `"${item.id || ''}"`,
    `"${(item.name || 'Anonymous').replace(/"/g, '""')}"`,
    `"${(item.email || 'N/A').replace(/"/g, '""')}"`,
    `"${(item.product ? item.product.name : item.category || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    item.rating || 0,
    item.sentiment || 'neutral',
    item.status || 'open',
    `"${item.date || ''}"`,
    `"${(item.comment || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `customer_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Quick Test Review
async function addQuickTestReview() {
  const demoUsers = [
    { name: 'Saravanan M', email: 'saravanan@example.com', rating: 5, comment: 'Phenomenal product quality! Super fast delivery and the packaging was top notch.', prodId: 'prod-1', sentiment: 'positive' },
    { name: 'Karthik Raja', email: 'karthik@example.com', rating: 4, comment: 'Very comfortable and stylish. Battery lasts well over two full days.', prodId: 'prod-2', sentiment: 'positive' },
    { name: 'Divya Ramesh', email: 'divya.r@outlook.com', rating: 2, comment: 'Delivery was late by 4 days. Customer support responded after a while.', prodId: 'prod-5', sentiment: 'negative' }
  ];

  const pick = demoUsers[Math.floor(Math.random() * demoUsers.length)];
  const ticketId = `AF-${Math.floor(10000 + Math.random() * 90000)}-TKT`;

  const newReview = {
    id: ticketId,
    name: pick.name,
    email: pick.email,
    rating: pick.rating,
    category: 'Product Quality',
    comment: pick.comment,
    tags: ['Quality', 'Verified Customer'],
    sentiment: pick.sentiment,
    status: 'open',
    date: new Date().toISOString(),
    product: { id: pick.prodId }
  };

  if (window.ApiService) {
    const res = await ApiService.submitFeedback(newReview);
    if (res && res.feedback) {
      adminState.feedbacks.unshift(res.feedback);
    } else {
      adminState.feedbacks.unshift(newReview);
    }
  } else {
    adminState.feedbacks.unshift(newReview);
  }

  localStorage.setItem('aurafeedback_db', JSON.stringify(adminState.feedbacks));
  renderAdminTable();
  updateKPIs();
  alert(`Added live review from '${pick.name}' to MySQL!`);
}

// Setup Event Listeners
function setupEventListeners() {
  el.themeToggleBtn.addEventListener('click', toggleTheme);

  // Filters
  el.searchInput.addEventListener('input', (e) => {
    adminState.filters.search = e.target.value;
    renderAdminTable();
  });

  el.filterRating.addEventListener('change', (e) => {
    adminState.filters.rating = e.target.value;
    renderAdminTable();
  });

  el.filterSentiment.addEventListener('change', (e) => {
    adminState.filters.sentiment = e.target.value;
    renderAdminTable();
  });

  el.filterStatus.addEventListener('change', (e) => {
    adminState.filters.status = e.target.value;
    renderAdminTable();
  });

  // Actions
  el.btnRefresh.addEventListener('click', async () => {
    el.btnRefresh.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Refreshing...`;
    lucide.createIcons();
    await loadAdminFeedbacks();
    renderAdminTable();
    updateKPIs();
    setTimeout(() => {
      el.btnRefresh.innerHTML = `<i data-lucide="refresh-cw"></i> Refresh`;
      lucide.createIcons();
    }, 400);
  });

  el.btnExport.addEventListener('click', exportReviewsToCSV);
  el.btnTestReview.addEventListener('click', addQuickTestReview);

  // Details Modal
  el.modalDetailsClose.addEventListener('click', () => el.detailsModal.classList.remove('active'));
  el.modalCloseBtn.addEventListener('click', () => el.detailsModal.classList.remove('active'));
  el.modalOpenReplyBtn.addEventListener('click', () => {
    if (adminState.activeTicket) openReplyModal(adminState.activeTicket.id);
  });

  // Reply Modal
  el.replyCloseX.addEventListener('click', () => el.replyModal.classList.remove('active'));
  el.btnCancelReply.addEventListener('click', () => el.replyModal.classList.remove('active'));
  el.btnSendReply.addEventListener('click', handleSendReply);

  // Quick Reply Templates
  el.tplThanks.addEventListener('click', () => {
    el.replyTextarea.value = `Dear ${adminState.activeTicket ? adminState.activeTicket.name : 'Customer'},\n\nThank you so much for taking the time to share your review! We are delighted to hear about your great experience. Your feedback means the world to our team.\n\nWarm regards,\nCustomer Success Team`;
  });

  el.tplApology.addEventListener('click', () => {
    el.replyTextarea.value = `Dear ${adminState.activeTicket ? adminState.activeTicket.name : 'Customer'},\n\nWe sincerely apologize for the inconvenience you faced. We hold our products and services to the highest standards, and we are investigating this issue right away. Our support team will follow up directly with you.\n\nBest regards,\nAuraFeedback Support Team`;
  });

  el.tplResolved.addEventListener('click', () => {
    el.replyTextarea.value = `Dear ${adminState.activeTicket ? adminState.activeTicket.name : 'Customer'},\n\nWe have reviewed your feedback and our team has resolved the issue. Thank you for helping us improve our services. Please feel free to reach out if you need any further assistance.\n\nSincerely,\nCustomer Care`;
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
