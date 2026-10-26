// State Management specific to Analytics Dashboard
const state = {
  feedbacks: [],
  theme: 'light',
  filters: {
    search: '',
    category: 'all',
    rating: 'all',
    sentiment: 'all'
  }
};

// Demo Seed Data (Realistic submissions to immediately populate the dashboard)
const demoFeedbacks = [
  {
    id: "AF-18239-TKT",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    rating: 5,
    category: "Product Quality",
    comment: "The interface is absolutely gorgeous! Very fast and super easy to navigate. Love the dark mode theme and glassmorphic designs.",
    tags: ["Clean Design", "Intuitive Navigation"],
    sentiment: "positive",
    date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    product: {
      id: "prod-1",
      name: "Zenith Noise-Cancelling Headphones",
      category: "Electronics",
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "AF-89472-TKT",
    name: "Priya Sharma",
    email: "priya.sharma@yahoo.com",
    rating: 2,
    category: "Delivery",
    comment: "My order was delayed by three days. The box arrived slightly dented too. Customer support took a while to give updates.",
    tags: ["Late Delivery", "Damaged Package"],
    sentiment: "negative",
    date: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
    product: {
      id: "prod-5",
      name: "Vagabond Leather Sandals",
      category: "Sandals",
      img: "https://images.unsplash.com/photo-1562273589-10447af56263?w=300&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "AF-62548-TKT",
    name: "Karthik R.",
    email: "karthik.r@outlook.com",
    rating: 4,
    category: "Product Quality",
    comment: "Quality of the stitching and cotton is top-notch. Very premium feel. However, sizes run a bit larger than standard charts.",
    tags: ["High Quality", "Premium Feel"],
    sentiment: "positive",
    date: new Date(Date.now() - 3600000 * 29).toISOString(), // ~1 day ago
    product: {
      id: "prod-3",
      name: "Summer Breeze Linen Dress",
      category: "Dress",
      img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "AF-47392-TKT",
    name: "Sneha Patel",
    email: "sneha.p@gmail.com",
    rating: 1,
    category: "Pricing",
    comment: "Way too expensive for basic catalog items! The extra delivery charge was unexpected. Not worth the high price tag in my opinion.",
    tags: ["Overpriced", "Expensive"],
    sentiment: "negative",
    date: new Date(Date.now() - 3600000 * 42).toISOString(), // ~2 days ago
    product: {
      id: "prod-2",
      name: "AuraFit Smart Watch",
      category: "Electronics",
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "AF-39485-TKT",
    name: "Vikram Singh",
    email: "vikram.s@gmail.com",
    rating: 3,
    category: "Customer Service",
    comment: "The support executive solved my query, but it took almost two hours of back-and-forth chat. Average support experience.",
    tags: ["Very Helpful Support", "No Follow-up"],
    sentiment: "neutral",
    date: new Date(Date.now() - 3600000 * 96).toISOString() // 4 days ago
  }
];

// DOM Elements
let elements = {};

function initDOMElements() {
  elements = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    
    // KPI metrics
    kpiTotalCount: document.getElementById('kpi-total-count'),
    kpiTotalFooter: document.getElementById('kpi-total-footer'),
    kpiAvgRating: document.getElementById('kpi-avg-rating'),
    kpiAvgStars: document.getElementById('kpi-avg-stars'),
    kpiNpsScore: document.getElementById('kpi-nps-score'),
    kpiNpsLabel: document.getElementById('kpi-nps-label'),
    kpiSentimentPercent: document.getElementById('kpi-sentiment-percent'),
    kpiSentimentCount: document.getElementById('kpi-sentiment-count'),
    
    // Charts
    ratingBreakdownList: document.getElementById('rating-breakdown-list'),
    segmentPos: document.getElementById('segment-pos'),
    segmentNeu: document.getElementById('segment-neu'),
    segmentNeg: document.getElementById('segment-neg'),
    legendPosPct: document.getElementById('legend-pos-pct'),
    legendNeuPct: document.getElementById('legend-neu-pct'),
    legendNegPct: document.getElementById('legend-neg-pct'),
    
    // Filters & Actions
    searchInput: document.getElementById('search-input'),
    filterCategory: document.getElementById('filter-category'),
    filterRating: document.getElementById('filter-rating'),
    filterSentiment: document.getElementById('filter-sentiment'),
    btnSeedData: document.getElementById('btn-seed-data'),
    btnClearRecords: document.getElementById('btn-clear-records'),
    filteredFeedCount: document.getElementById('filtered-feed-count'),
    feedListContainer: document.getElementById('feed-list-container'),
    
    // AI Response Modal
    aiReplyModal: document.getElementById('ai-reply-modal'),
    aiDraftText: document.getElementById('ai-draft-text'),
    btnCopyReply: document.getElementById('btn-copy-reply'),
    btnCloseReply: document.getElementById('btn-close-reply'),
    aiReplyClose: document.getElementById('ai-reply-close')
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initDOMElements();
  initTheme();
  setupEventListeners();
  await loadFeedbacks();
  updateDashboardUI();
  lucide.createIcons();
});

// Theme Setup
function initTheme() {
  const storedTheme = localStorage.getItem('aurafeedback_theme');
  if (storedTheme) {
    state.theme = storedTheme;
  } else {
    state.theme = 'light';
  }
  applyTheme();
}

function applyTheme() {
  document.body.setAttribute('data-theme', state.theme);
  const iconName = state.theme === 'light' ? 'moon' : 'sun';
  elements.themeToggleBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
  lucide.createIcons();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('aurafeedback_theme', state.theme);
  applyTheme();
}

// Load feedback database
async function loadFeedbacks() {
  // 1. Try to fetch live from backend API (MySQL)
  if (window.ApiService) {
    const apiFeedbacks = await ApiService.getFeedbacks();
    if (Array.isArray(apiFeedbacks)) {
      state.feedbacks = apiFeedbacks;
      saveFeedbacks();
      return;
    }
  }

  // 2. Fallback to localStorage if backend is offline
  const stored = localStorage.getItem('aurafeedback_db');
  if (stored) {
    try {
      state.feedbacks = JSON.parse(stored);
    } catch (e) {
      console.error("Failed parsing feedbacks database, starting empty", e);
      state.feedbacks = [];
    }
  } else {
    state.feedbacks = [];
  }
}

function saveFeedbacks() {
  localStorage.setItem('aurafeedback_db', JSON.stringify(state.feedbacks));
}

// Calculate NPS, Sentiments, and average ratings to populate dashboard KPIs
function updateDashboardUI() {
  const list = state.feedbacks;
  const count = list.length;

  elements.kpiTotalCount.textContent = count;
  elements.kpiTotalFooter.textContent = count > 0 ? `Active records compiled` : 'No submissions received yet';

  if (count === 0) {
    elements.kpiAvgRating.textContent = '0.0';
    elements.kpiAvgStars.innerHTML = '<i data-lucide="star"></i>'.repeat(5);
    elements.kpiNpsScore.textContent = '-';
    elements.kpiNpsLabel.textContent = '0 Promoters / 0 Detractors';
    elements.kpiSentimentPercent.textContent = '0%';
    elements.kpiSentimentCount.textContent = '0 out of 0 positive';
    
    elements.ratingBreakdownList.innerHTML = '<div class="text-center text-muted py-3">No rating distributions available</div>';
    
    elements.segmentPos.style.width = '0%';
    elements.segmentNeu.style.width = '0%';
    elements.segmentNeg.style.width = '0%';
    elements.legendPosPct.textContent = '0%';
    elements.legendNeuPct.textContent = '0%';
    elements.legendNegPct.textContent = '0%';
    
    elements.feedListContainer.innerHTML = `
      <div class="empty-dashboard-feed text-center">
        <i data-lucide="inbox" class="empty-feed-icon"></i>
        <p>No feedback entries found matching active criteria.</p>
      </div>
    `;
    elements.filteredFeedCount.textContent = '0';
    
    lucide.createIcons();
    return;
  }

  // 1. Average Rating Calculation
  const totalStars = list.reduce((sum, f) => sum + f.rating, 0);
  const avg = (totalStars / count).toFixed(1);
  elements.kpiAvgRating.textContent = avg;
  
  const fullStars = Math.floor(avg);
  const halfStar = (avg % 1) >= 0.4 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHtml = '';
  starsHtml += `<i data-lucide="star" class="star-filled"></i>`.repeat(fullStars);
  if (halfStar) starsHtml += `<i data-lucide="star-half" class="star-filled"></i>`;
  starsHtml += `<i data-lucide="star"></i>`.repeat(emptyStars);
  elements.kpiAvgStars.innerHTML = starsHtml;

  // 2. NPS Calculation
  const promoters = list.filter(f => f.rating === 5).length;
  const detractors = list.filter(f => f.rating <= 3).length;
  const passives = list.filter(f => f.rating === 4).length;
  
  const promoterPct = (promoters / count) * 100;
  const detractorPct = (detractors / count) * 100;
  const nps = Math.round(promoterPct - detractorPct);
  
  const npsPrefix = nps > 0 ? '+' : '';
  elements.kpiNpsScore.textContent = `${npsPrefix}${nps}`;
  elements.kpiNpsLabel.textContent = `${promoters} Prom / ${detractors} Det / ${passives} Pass`;
  
  if (nps >= 30) {
    elements.kpiNpsScore.className = 'kpi-value text-success';
  } else if (nps >= 0) {
    elements.kpiNpsScore.className = 'kpi-value text-info';
  } else {
    elements.kpiNpsScore.className = 'kpi-value text-danger';
  }

  // 3. Sentiment Percentages
  const positiveCount = list.filter(f => f.sentiment === 'positive').length;
  const neutralCount = list.filter(f => f.sentiment === 'neutral').length;
  const negativeCount = list.filter(f => f.sentiment === 'negative').length;
  
  const posPct = Math.round((positiveCount / count) * 100);
  const neuPct = Math.round((neutralCount / count) * 100);
  const negPct = 100 - posPct - neuPct;

  elements.kpiSentimentPercent.textContent = `${posPct}%`;
  elements.kpiSentimentCount.textContent = `${positiveCount} out of ${count} positive`;

  elements.segmentPos.style.width = `${posPct}%`;
  elements.segmentNeu.style.width = `${neuPct}%`;
  elements.segmentNeg.style.width = `${negPct}%`;
  
  elements.legendPosPct.textContent = `${posPct}%`;
  elements.legendNeuPct.textContent = `${neuPct}%`;
  elements.legendNegPct.textContent = `${negPct}%`;

  // 4. Rating Breakdown Progress List
  let breakdownHtml = '';
  for (let r = 5; r >= 1; r--) {
    const rCount = list.filter(f => f.rating === r).length;
    const rPct = Math.round((rCount / count) * 100);
    breakdownHtml += `
      <div class="rating-breakdown-row">
        <span class="rating-num">${r} ★</span>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: ${rPct}%;"></div>
        </div>
        <span class="rating-count-val">${rCount} (${rPct}%)</span>
      </div>
    `;
  }
  elements.ratingBreakdownList.innerHTML = breakdownHtml;

  // 5. Render Feed Cards
  renderFeedbackFeed();
  lucide.createIcons();
}

// Render Feedback Feed List based on filters
function renderFeedbackFeed() {
  const query = state.filters.search.toLowerCase().trim();
  
  const filtered = state.feedbacks.filter(feedback => {
    const matchesSearch = !query || 
      feedback.name.toLowerCase().includes(query) || 
      feedback.comment.toLowerCase().includes(query) ||
      feedback.email.toLowerCase().includes(query) ||
      feedback.id.toLowerCase().includes(query) ||
      (feedback.product && feedback.product.name.toLowerCase().includes(query));
      
    const matchesCategory = state.filters.category === 'all' || feedback.category === state.filters.category;
    const matchesRating = state.filters.rating === 'all' || feedback.rating === parseInt(state.filters.rating);
    const matchesSentiment = state.filters.sentiment === 'all' || feedback.sentiment === state.filters.sentiment;

    return matchesSearch && matchesCategory && matchesRating && matchesSentiment;
  });

  elements.filteredFeedCount.textContent = filtered.length;

  if (filtered.length === 0) {
    elements.feedListContainer.innerHTML = `
      <div class="empty-dashboard-feed text-center py-5">
        <i data-lucide="search-x" class="empty-feed-icon" style="width: 48px; height: 48px; color: var(--text-muted); stroke-width: 1.5; margin-bottom: 0.75rem;"></i>
        <p class="text-muted">No feedbacks found matching the current search parameters.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  elements.feedListContainer.innerHTML = filtered.map(item => {
    const dateFormatted = new Date(item.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const starIcons = `<i data-lucide="star" class="star-filled"></i>`.repeat(item.rating) +
                      `<i data-lucide="star"></i>`.repeat(5 - item.rating);
    
    const sentimentEmojiMap = {
      positive: '😍 Positive',
      neutral: '😐 Neutral',
      negative: '😠 Negative'
    };

    const chipsHtml = item.tags.map(t => `<span class="feed-card-chip">${t}</span>`).join('');
    
    // Product badge layout if available
    const productBadgeHtml = item.product ? `
      <div class="feedback-product-badge">
        <img src="${item.product.img}" alt="${item.product.name}" class="feedback-product-badge-img">
        <span>Reviewed Item: <span class="feedback-product-badge-name">${item.product.name}</span></span>
      </div>
    ` : '';

    return `
      <div class="feedback-feed-card glass-card" id="card-${item.id}">
        <div class="feed-card-header">
          <div class="user-meta-info">
            <div class="user-profile-circle">${item.name.charAt(0).toUpperCase()}</div>
            <div>
              <h4 class="user-name">${item.name}</h4>
              <span class="user-email text-muted">${item.email}</span>
            </div>
          </div>
          <div class="feed-card-identifiers">
            <span class="ticket-id-tag">${item.id}</span>
            <span class="feed-date text-muted">${dateFormatted}</span>
          </div>
        </div>

        <div class="feed-card-body">
          <div class="rating-sentiment-row">
            <div class="feed-card-stars">${starIcons}</div>
            <span class="badge sentiment-badge ${item.sentiment}">${sentimentEmojiMap[item.sentiment]}</span>
            <span class="badge category-badge"><i data-lucide="tag" class="inline-icon"></i> ${item.category}</span>
            ${productBadgeHtml}
          </div>
          
          <p class="feedback-comment-text">"${item.comment}"</p>
          
          ${item.tags.length > 0 ? `<div class="feed-card-chips-wrapper">${chipsHtml}</div>` : ''}
        </div>

        <div class="feed-card-footer">
          <button class="btn btn-secondary btn-sm btn-draft-reply" onclick="openAiReply('${item.id}', this)">
            <i data-lucide="sparkles" class="text-indigo"></i> Draft AI Reply
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-card text-danger-hover" aria-label="Delete entry" onclick="deleteFeedback('${item.id}')">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Delete individual feedback card
window.deleteFeedback = function(id) {
  if (confirm("Are you sure you want to delete this feedback record?")) {
    state.feedbacks = state.feedbacks.filter(f => f.id !== id);
    saveFeedbacks();
    updateDashboardUI();
  }
};

// AI Reply Dialog simulator
window.openAiReply = function(id, buttonElement) {
  const item = state.feedbacks.find(f => f.id === id);
  if (!item) return;

  const originalText = buttonElement.innerHTML;
  buttonElement.disabled = true;
  buttonElement.innerHTML = `<i data-lucide="loader" class="animate-spin text-indigo"></i> <span>Analyzing Context...</span>`;
  lucide.createIcons();

  setTimeout(() => {
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalText;
    lucide.createIcons();

    let draftText = '';
    const tagsStr = item.tags.length > 0 ? item.tags.join(', ') : 'your highlighted points';
    const itemReferenceStr = item.product ? `reviewed item "${item.product.name}"` : `feedback on "${item.category}"`;

    if (item.sentiment === 'positive') {
      draftText = `Subject: Thank you for your review! (Ref: ${item.id})

Dear ${item.name},

Thank you so much for taking the time to share your feedback with us. We are absolutely thrilled to read your comments regarding your ${itemReferenceStr}!

It is rewarding to hear that your experience was positive and that elements like "${tagsStr}" stood out to you. Your encouraging comments have been shared with our product quality and operations teams.

We really appreciate your support and look forward to serving you again in the future!

Best regards,

Customer Success Team
AuraFeedback Solutions
support@aurafeedback.com`;
    } else if (item.sentiment === 'negative') {
      draftText = `Subject: We sincerely apologize for your experience (Ref: ${item.id})

Dear ${item.name},

Thank you for reaching out and sharing your detailed experience. We sincerely apologize for the frustrations you encountered with your ${itemReferenceStr}, specifically regarding "${tagsStr}". 

We noticed your ${item.rating}-star rating and have analyzed your comments carefully:
"${item.comment}"

We hold ourselves to high standards, and it is clear we fell short in this instance. We have forwarded this incident report directly to our quality assurance and operations managers to ensure corrections are enacted.

We want to make this right for you. Please reply directly to this thread so we can coordinate a replacement, refund, or direct account credit.

Sincerely,

Operations Quality Manager
AuraFeedback Solutions
support@aurafeedback.com`;
    } else {
      draftText = `Subject: Thank you for your valuable input (Ref: ${item.id})

Dear ${item.name},

Thank you for sharing your thoughts regarding your ${itemReferenceStr}. We appreciate your rating of ${item.rating} stars and your constructive details.

We have logged your comments regarding "${tagsStr}":
"${item.comment}"

We are continuously updating our services, and user suggestions are the key drivers for our roadmap. Your notes will be factored into our next iteration review cycles.

If you have any further questions or ideas, please feel free to reach out to us at any time.

Kind regards,

Product Relations Team
AuraFeedback Solutions
support@aurafeedback.com`;
    }

    elements.aiDraftText.value = draftText;
    elements.aiReplyModal.classList.add('active');
  }, 1000);
};

// Event Listeners Setup
function setupEventListeners() {
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Search & Filter Events on Dashboard
  elements.searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderFeedbackFeed();
  });

  elements.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderFeedbackFeed();
  });

  elements.filterRating.addEventListener('change', (e) => {
    state.filters.rating = e.target.value;
    renderFeedbackFeed();
  });

  elements.filterSentiment.addEventListener('change', (e) => {
    state.filters.sentiment = e.target.value;
    renderFeedbackFeed();
  });

  // Seed Button
  elements.btnSeedData.addEventListener('click', () => {
    if (confirm("Would you like to seed the dashboard with 5 realistic demo feedback records? This will prepend to any existing feedback.")) {
      const freshDemos = demoFeedbacks.map(df => ({
        ...df,
        id: `AF-${Math.floor(10000 + Math.random() * 90000)}-TKT`,
        date: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)).toISOString()
      }));
      state.feedbacks = [...freshDemos, ...state.feedbacks];
      saveFeedbacks();
      updateDashboardUI();
    }
  });

  // Clear Button
  elements.btnClearRecords.addEventListener('click', async () => {
    if (confirm("Are you sure you want to permanently delete ALL feedback records? This action cannot be undone.")) {
      if (window.ApiService && ApiService.isBackendAvailable) {
        for (const item of state.feedbacks) {
          if (item.id) await ApiService.deleteFeedback(item.id);
        }
      }
      state.feedbacks = [];
      saveFeedbacks();
      updateDashboardUI();
    }
  });

  // Modal Close Actions
  elements.aiReplyClose.addEventListener('click', () => {
    elements.aiReplyModal.classList.remove('active');
  });
  elements.btnCloseReply.addEventListener('click', () => {
    elements.aiReplyModal.classList.remove('active');
  });

  // Copy reply to clipboard action
  elements.btnCopyReply.addEventListener('click', () => {
    elements.aiDraftText.select();
    elements.aiDraftText.setSelectionRange(0, 99999);
    
    try {
      navigator.clipboard.writeText(elements.aiDraftText.value);
      
      const originalCopyText = elements.btnCopyReply.innerHTML;
      elements.btnCopyReply.innerHTML = `<i data-lucide="check"></i> <span>Copied!</span>`;
      lucide.createIcons();
      
      setTimeout(() => {
        elements.btnCopyReply.innerHTML = originalCopyText;
        lucide.createIcons();
      }, 1500);
    } catch (err) {
      alert("Failed copying response draft, please select and copy manually.");
    }
  });
}
