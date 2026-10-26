// State Management
const state = {
  feedbacks: [],
  currentRating: 0,
  selectedCategory: '',
  selectedTags: [],
  theme: 'dark',
  activeTab: 'portal', // 'portal' or 'dashboard'
  filters: {
    search: '',
    category: 'all',
    rating: 'all',
    sentiment: 'all'
  }
};

// Default Tags Library by Category
const tagsByCategory = {
  'UX/UI': ['Clean Design', 'Confusing Layout', 'Mobile Friendly', 'Glitchy', 'Intuitive Navigation'],
  'Product Quality': ['High Quality', 'Damaged Item', 'Durable Material', 'Flimsy', 'Premium Feel'],
  'Customer Service': ['Fast Response', 'Rude Agent', 'Very Helpful Support', 'No Follow-up', 'Polite Staff'],
  'Delivery': ['Super Fast Delivery', 'Late Delivery', 'Damaged Package', 'Accurate Tracking', 'Free Shipping'],
  'Pricing': ['Great Value', 'Overpriced', 'Expensive', 'Affordable', 'Good Discount'],
  'General': ['Highly Recommend', 'Needs Improvement', 'Satisfied Customer', 'Poor Experience']
};

const defaultTags = ['Helpful', 'Disappointed', 'Great Service', 'Buggy', 'Highly Recommend', 'Slow UI'];

// Sentiment Analysis wordlists
const sentimentWords = {
  positive: ['love', 'like', 'great', 'awesome', 'amazing', 'excellent', 'fast', 'easy', 'best', 'wonderful', 'good', 'perfect', 'helpful', 'beautiful', 'clean', 'intuitive', 'smooth', 'satisfied', 'thrilled', 'nice', 'friendly'],
  negative: ['slow', 'bad', 'bug', 'buggy', 'expensive', 'hate', 'fail', 'worst', 'broken', 'error', 'poor', 'terrible', 'hard', 'difficult', 'dislike', 'delay', 'delayed', 'rude', 'glitch', 'confusing', 'overpriced', 'flimsy', 'damaged']
};

// Demo Seed Data (Realistic submissions to immediately populate the dashboard)
const demoFeedbacks = [
  {
    id: "AF-18239-TKT",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    rating: 5,
    category: "UX/UI",
    comment: "The interface is absolutely gorgeous! Very fast and super easy to navigate. Love the dark mode theme and glassmorphic designs.",
    tags: ["Clean Design", "Intuitive Navigation"],
    sentiment: "positive",
    date: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
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
    date: new Date(Date.now() - 3600000 * 18).toISOString() // 18 hours ago
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
    date: new Date(Date.now() - 3600000 * 29).toISOString() // ~1 day ago
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
    date: new Date(Date.now() - 3600000 * 42).toISOString() // ~2 days ago
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
    // Navigation
    navTabs: document.getElementById('nav-tabs'),
    btnTabPortal: document.getElementById('btn-tab-portal'),
    btnTabDashboard: document.getElementById('btn-tab-dashboard'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),

    // Panels
    portalPanel: document.getElementById('feedback-portal-section'),
    dashboardPanel: document.getElementById('analytics-dashboard-section'),

    // Form Elements
    feedbackForm: document.getElementById('feedback-form'),
    ratingStarsContainer: document.getElementById('rating-stars-container'),
    sentimentEmoji: document.getElementById('sentiment-emoji'),
    sentimentText: document.getElementById('sentiment-text'),
    categoryChipsGrid: document.getElementById('category-chips-grid'),
    liveSentimentPill: document.getElementById('live-sentiment-pill'),
    liveSentimentText: document.getElementById('live-sentiment-text'),
    feedbackComment: document.getElementById('feedback-comment'),
    quickTagsContainer: document.getElementById('quick-tags-container'),
    feedbackName: document.getElementById('feedback-name'),
    feedbackEmail: document.getElementById('feedback-email'),
    submitBtn: document.getElementById('submit-feedback-btn'),

    // Error Elements
    ratingError: document.getElementById('rating-error'),
    categoryError: document.getElementById('category-error'),
    commentError: document.getElementById('comment-error'),
    emailError: document.getElementById('email-error'),

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

    // Success Modal
    successModal: document.getElementById('success-modal'),
    modalTicketId: document.getElementById('modal-ticket-id'),
    modalFeedbackCategory: document.getElementById('modal-feedback-category'),
    modalFeedbackSentiment: document.getElementById('modal-feedback-sentiment'),
    modalViewDashboard: document.getElementById('modal-view-dashboard'),
    modalCloseSuccess: document.getElementById('modal-close-success'),

    // AI Response Modal
    aiReplyModal: document.getElementById('ai-reply-modal'),
    aiDraftText: document.getElementById('ai-draft-text'),
    btnCopyReply: document.getElementById('btn-copy-reply'),
    btnCloseReply: document.getElementById('btn-close-reply'),
    aiReplyClose: document.getElementById('ai-reply-close')
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initTheme();
  loadFeedbacks();
  setupEventListeners();
  renderQuickTags();
  updateDashboardUI();
  lucide.createIcons();
});

// Theme Setup
function initTheme() {
  const storedTheme = localStorage.getItem('aurafeedback_theme');
  if (storedTheme) {
    state.theme = storedTheme;
  } else {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    state.theme = prefersLight ? 'light' : 'dark';
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

// Tab Navigation
function switchTab(tabName) {
  state.activeTab = tabName;
  if (tabName === 'portal') {
    elements.btnTabPortal.classList.add('active');
    elements.btnTabDashboard.classList.remove('active');
    elements.portalPanel.classList.add('active');
    elements.dashboardPanel.classList.remove('active');
  } else {
    elements.btnTabPortal.classList.remove('active');
    elements.btnTabDashboard.classList.add('active');
    elements.portalPanel.classList.remove('active');
    elements.dashboardPanel.classList.add('active');
    updateDashboardUI(); // Refresh dashboard calculations & list
  }
}

// Load feedback database
function loadFeedbacks() {
  const stored = localStorage.getItem('aurafeedback_db');
  if (stored) {
    try {
      state.feedbacks = JSON.parse(stored);
    } catch (e) {
      console.error("Failed parsing feedbacks database, starting empty", e);
      state.feedbacks = [];
    }
  } else {
    // Start with pre-populated demo data so dashboard isn't blank
    state.feedbacks = [...demoFeedbacks];
    saveFeedbacks();
  }
}

function saveFeedbacks() {
  localStorage.setItem('aurafeedback_db', JSON.stringify(state.feedbacks));
}

// Rating Selector Handler
function setRating(ratingValue) {
  state.currentRating = ratingValue;

  // Highlight stars
  const starButtons = elements.ratingStarsContainer.querySelectorAll('.star-btn');
  starButtons.forEach(btn => {
    const val = parseInt(btn.getAttribute('data-rating'));
    if (val <= ratingValue) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Map Rating to Emoji & Text
  const sentimentMap = {
    1: { emoji: '😠', text: 'Very Bad' },
    2: { emoji: '🙁', text: 'Bad' },
    3: { emoji: '😐', text: 'Okay / Neutral' },
    4: { emoji: '🙂', text: 'Good' },
    5: { emoji: '😍', text: 'Excellent!' }
  };

  const map = sentimentMap[ratingValue];
  elements.sentimentEmoji.textContent = map.emoji;
  elements.sentimentText.textContent = map.text;

  // Trigger animations on emoji container
  elements.sentimentEmoji.style.transform = 'scale(1.3) rotate(-8deg)';
  setTimeout(() => {
    elements.sentimentEmoji.style.transform = '';
  }, 250);

  // Clear rating error if active
  elements.ratingError.style.display = 'none';

  // Auto-predict sentiment if comment has content, else guess from stars
  triggerSentimentAnalysis();
}

// Category Selection Handler
function setCategory(category) {
  state.selectedCategory = category;

  // Select active chip visual
  const chips = elements.categoryChipsGrid.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    if (chip.getAttribute('data-category') === category) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  // Reset selected tags and render tags specific to category
  state.selectedTags = [];
  renderQuickTags();

  // Clear category error
  elements.categoryError.style.display = 'none';
}

// Render dynamic tag chips
function renderQuickTags() {
  const list = tagsByCategory[state.selectedCategory] || defaultTags;
  elements.quickTagsContainer.innerHTML = list.map(tag => {
    const isActive = state.selectedTags.includes(tag);
    return `<button type="button" class="tag-chip-btn ${isActive ? 'active' : ''}" onclick="toggleTag('${tag}', this)">${tag}</button>`;
  }).join('');
}

// Toggle Tag Choice
window.toggleTag = function (tag, element) {
  if (state.selectedTags.includes(tag)) {
    state.selectedTags = state.selectedTags.filter(t => t !== tag);
    element.classList.remove('active');
  } else {
    state.selectedTags.push(tag);
    element.classList.add('active');
  }
};

// Sentiment analysis engine
function predictSentiment(text) {
  if (!text.trim()) {
    // If no text, guess by star rating
    if (state.currentRating >= 4) return 'positive';
    if (state.currentRating === 3) return 'neutral';
    if (state.currentRating > 0 && state.currentRating <= 2) return 'negative';
    return 'neutral';
  }

  const cleanText = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  sentimentWords.positive.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) posCount += matches.length;
  });

  sentimentWords.negative.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) negCount += matches.length;
  });

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';

  // Tiebreaker using rating
  if (posCount === negCount && posCount > 0) {
    if (state.currentRating >= 4) return 'positive';
    if (state.currentRating <= 2) return 'negative';
  }

  if (state.currentRating >= 4) return 'positive';
  if (state.currentRating <= 2) return 'negative';

  return 'neutral';
}

function triggerSentimentAnalysis() {
  const text = elements.feedbackComment.value;
  const prediction = predictSentiment(text);

  // Update Live pill visual
  elements.liveSentimentPill.className = `live-sentiment-pill ${prediction}`;

  const iconAndText = {
    positive: 'Positive Sentiment Detected',
    neutral: 'Neutral Sentiment Analyzed',
    negative: 'Negative Sentiment Detected'
  };

  elements.liveSentimentText.textContent = iconAndText[prediction];
}

// Form Submission & Validation
function handleFormSubmit(e) {
  e.preventDefault();

  let isValid = true;

  // Validate Rating
  if (state.currentRating === 0) {
    elements.ratingError.style.display = 'block';
    isValid = false;
  } else {
    elements.ratingError.style.display = 'none';
  }

  // Validate Category
  if (!state.selectedCategory) {
    elements.categoryError.style.display = 'block';
    isValid = false;
  } else {
    elements.categoryError.style.display = 'none';
  }

  // Validate Comments
  const commentVal = elements.feedbackComment.value.trim();
  if (commentVal.length < 5) {
    elements.commentError.textContent = 'Please share more detail (at least 5 characters).';
    elements.commentError.style.display = 'block';
    isValid = false;
  } else {
    elements.commentError.style.display = 'none';
  }

  // Validate Email if provided
  const emailVal = elements.feedbackEmail.value.trim();
  if (emailVal) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      elements.emailError.style.display = 'block';
      isValid = false;
    } else {
      elements.emailError.style.display = 'none';
    }
  } else {
    elements.emailError.style.display = 'none';
  }

  if (!isValid) return;

  // Compile Submission
  const ticketId = `AF-${Math.floor(10000 + Math.random() * 90000)}-TKT`;
  const nameVal = elements.feedbackName.value.trim() || 'Anonymous';
  const finalSentiment = predictSentiment(commentVal);

  const feedbackObj = {
    id: ticketId,
    name: nameVal,
    email: emailVal || 'N/A',
    rating: state.currentRating,
    category: state.selectedCategory,
    comment: commentVal,
    tags: [...state.selectedTags],
    sentiment: finalSentiment,
    date: new Date().toISOString()
  };

  // Add to database
  state.feedbacks.unshift(feedbackObj);
  saveFeedbacks();

  // Populate success modal values
  elements.modalTicketId.textContent = ticketId;
  elements.modalFeedbackCategory.textContent = state.selectedCategory;
  elements.modalFeedbackSentiment.textContent = finalSentiment.charAt(0).toUpperCase() + finalSentiment.slice(1);

  const sentimentPillColorClass = {
    positive: 'color-success',
    neutral: 'text-secondary',
    negative: 'text-danger'
  };
  elements.modalFeedbackSentiment.className = `bold ${sentimentPillColorClass[finalSentiment]}`;

  // Reset Form state
  elements.feedbackForm.reset();
  state.currentRating = 0;
  state.selectedCategory = '';
  state.selectedTags = [];

  // Reset star classes
  elements.ratingStarsContainer.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('active'));
  elements.sentimentEmoji.textContent = '😐';
  elements.sentimentText.textContent = 'Select a rating';

  // Reset category chips
  elements.categoryChipsGrid.querySelectorAll('.chip-btn').forEach(chip => chip.classList.remove('active'));

  // Re-render tags
  renderQuickTags();

  // Reset Live sentiment predictor
  elements.liveSentimentPill.className = 'live-sentiment-pill neutral';
  elements.liveSentimentText.textContent = 'Analyzing sentiment...';

  // Trigger Confetti
  triggerConfetti();

  // Show Success Modal
  elements.successModal.classList.add('active');
}

// Confetti triggers
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 60,
      origin: { y: 0.7 }
    });
  }
}

// Calculate NPS, Sentiments, and average ratings to populate dashboard KPIs
function updateDashboardUI() {
  const list = state.feedbacks;
  const count = list.length;

  elements.kpiTotalCount.textContent = count;
  elements.kpiTotalFooter.textContent = count > 0 ? `Active records compiled` : 'No submissions received yet';

  if (count === 0) {
    // Blank values
    elements.kpiAvgRating.textContent = '0.0';
    elements.kpiAvgStars.innerHTML = '<i data-lucide="star"></i>'.repeat(5);
    elements.kpiNpsScore.textContent = '-';
    elements.kpiNpsLabel.textContent = '0 Promoters / 0 Detractors';
    elements.kpiSentimentPercent.textContent = '0%';
    elements.kpiSentimentCount.textContent = '0 out of 0 positive';

    // Zero bars
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

  // 2. NPS Calculation (NPS = % Promoters [Rating 5] - % Detractors [Rating 1-3])
  const promoters = list.filter(f => f.rating === 5).length;
  const detractors = list.filter(f => f.rating <= 3).length;
  const passives = list.filter(f => f.rating === 4).length;

  const promoterPct = (promoters / count) * 100;
  const detractorPct = (detractors / count) * 100;
  const nps = Math.round(promoterPct - detractorPct);

  // Format NPS score visual
  const npsPrefix = nps > 0 ? '+' : '';
  elements.kpiNpsScore.textContent = `${npsPrefix}${nps}`;
  elements.kpiNpsLabel.textContent = `${promoters} Prom / ${detractors} Det / ${passives} Pass`;

  // Apply visual colors depending on NPS level
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
  const negPct = 100 - posPct - neuPct; // Ensure totals sum to 100%

  elements.kpiSentimentPercent.textContent = `${posPct}%`;
  elements.kpiSentimentCount.textContent = `${positiveCount} out of ${count} positive`;

  // Update Sentiment Distribution segmented bar widths & tags
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

  // 5. Render Feed Cards with Active Filters
  renderFeedbackFeed();

  lucide.createIcons();
}

// Render Feedback Feed List based on filters
function renderFeedbackFeed() {
  const query = state.filters.search.toLowerCase().trim();

  const filtered = state.feedbacks.filter(feedback => {
    // 1. Search text filter
    const matchesSearch = !query ||
      feedback.name.toLowerCase().includes(query) ||
      feedback.comment.toLowerCase().includes(query) ||
      feedback.email.toLowerCase().includes(query) ||
      feedback.id.toLowerCase().includes(query);

    // 2. Category filter
    const matchesCategory = state.filters.category === 'all' || feedback.category === state.filters.category;

    // 3. Rating filter
    const matchesRating = state.filters.rating === 'all' || feedback.rating === parseInt(state.filters.rating);

    // 4. Sentiment filter
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
window.deleteFeedback = function (id) {
  if (confirm("Are you sure you want to delete this feedback record?")) {
    state.feedbacks = state.feedbacks.filter(f => f.id !== id);
    saveFeedbacks();
    updateDashboardUI();
  }
};

// AI Reply Dialog simulator
window.openAiReply = function (id, buttonElement) {
  const item = state.feedbacks.find(f => f.id === id);
  if (!item) return;

  // Visual loader spinner trigger on the button
  const originalText = buttonElement.innerHTML;
  buttonElement.disabled = true;
  buttonElement.innerHTML = `<i data-lucide="loader" class="animate-spin text-indigo"></i> <span>Analyzing Context...</span>`;
  lucide.createIcons();

  // Simulate server/AI generating response delay
  setTimeout(() => {
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalText;
    lucide.createIcons();

    // Draft response templates depending on sentiment
    let draftText = '';
    const tagsStr = item.tags.length > 0 ? item.tags.join(', ') : 'your highlighted points';

    if (item.sentiment === 'positive') {
      draftText = `Subject: Thank you for your review! (Ref: ${item.id})

Dear ${item.name},

Thank you so much for taking the time to share your feedback with us. We are absolutely thrilled to read your comments regarding the ${item.category}!

It is rewarding to hear that your experience was positive and that elements like "${tagsStr}" stood out to you. Your encouraging comments have been shared with our product layout and development teams.

We really appreciate your support and look forward to serving you again in the future!

Best regards,

Customer Success Team
AuraFeedback Solutions
support@aurafeedback.com`;
    } else if (item.sentiment === 'negative') {
      draftText = `Subject: We sincerely apologize for your experience (Ref: ${item.id})

Dear ${item.name},

Thank you for reaching out and sharing your detailed experience. We sincerely apologize for the frustrations you encountered with our ${item.category}, specifically regarding "${tagsStr}". 

We noticed your ${item.rating}-star rating and have analyzed your comments carefully:
"${item.comment}"

We hold ourselves to high standards, and it is clear we fell short in this instance. We have forwarded this incident report directly to our quality assurance and operations managers to prevent this from happening again.

We want to make this right for you. Please reply directly to this thread so we can coordinate a suitable correction or credit for your account.

Sincerely,

Operations Quality Manager
AuraFeedback Solutions
support@aurafeedback.com`;
    } else {
      draftText = `Subject: Thank you for your valuable input (Ref: ${item.id})

Dear ${item.name},

Thank you for sharing your thoughts regarding ${item.category}. We appreciate your rating of ${item.rating} stars and your constructive details.

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
  // Theme Toggle Button
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Tab switching buttons
  elements.btnTabPortal.addEventListener('click', () => switchTab('portal'));
  elements.btnTabDashboard.addEventListener('click', () => switchTab('dashboard'));

  // Star ratings button event delegation
  const starButtons = elements.ratingStarsContainer.querySelectorAll('.star-btn');
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'));
      setRating(rating);
    });
  });

  // Category chip button click events
  const categoryChips = elements.categoryChipsGrid.querySelectorAll('.chip-btn');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-category');
      setCategory(cat);
    });
  });

  // Live sentiment feedback text area
  elements.feedbackComment.addEventListener('input', triggerSentimentAnalysis);

  // Form Submit Action
  elements.feedbackForm.addEventListener('submit', handleFormSubmit);

  // Modal Actions (Success Dialog)
  elements.modalViewDashboard.addEventListener('click', () => {
    elements.successModal.classList.remove('active');
    switchTab('dashboard');
  });

  elements.modalCloseSuccess.addEventListener('click', () => {
    elements.successModal.classList.remove('active');
  });

  // Modal Actions (AI Draft Response dialog)
  elements.aiReplyClose.addEventListener('click', () => {
    elements.aiReplyModal.classList.remove('active');
  });
  elements.btnCloseReply.addEventListener('click', () => {
    elements.aiReplyModal.classList.remove('active');
  });

  // Copy reply to clipboard action
  elements.btnCopyReply.addEventListener('click', () => {
    elements.aiDraftText.select();
    elements.aiDraftText.setSelectionRange(0, 99999); // Mobile

    try {
      navigator.clipboard.writeText(elements.aiDraftText.value);

      // Temporary tooltip style check
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
      // Create new randomized timestamps for demo data
      const freshDemos = demoFeedbacks.map(df => ({
        ...df,
        id: `AF-${Math.floor(10000 + Math.random() * 90000)}-TKT`,
        date: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)).toISOString() // Random date within last 5 days
      }));
      state.feedbacks = [...freshDemos, ...state.feedbacks];
      saveFeedbacks();
      updateDashboardUI();
    }
  });

  // Clear Button
  elements.btnClearRecords.addEventListener('click', () => {
    if (confirm("Are you sure you want to permanently delete ALL feedback records? This action cannot be undone.")) {
      state.feedbacks = [];
      saveFeedbacks();
      updateDashboardUI();
    }
  });
}
