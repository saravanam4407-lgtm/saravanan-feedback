// State Management specific to Feedback Form
const state = {
  feedbacks: [],
  currentRating: 0,
  selectedTags: [],
  theme: 'light',
  selectedProduct: null // loaded from URL parameter
};

// Purchased Products database (aligned with index.js)
const cartProducts = [
  {
    id: "prod-1",
    name: "Zenith Noise-Cancelling Headphones",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
    tags: ["Crisp Audio", "Bass Booster", "Glitchy Bluetooth", "Uncomfortable", "Long Battery Life"]
  },
  {
    id: "prod-2",
    name: "AuraFit Smart Watch",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
    tags: ["Stuttering Touch Screen", "Accurate HR sensor", "Sleek Look", "Weak Battery", "Waterproof"]
  },
  {
    id: "prod-3",
    name: "Summer Breeze Linen Dress",
    category: "Dress",
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80",
    tags: ["Soft Fabric", "Comfortable Fit", "Faded Color", "Shrunk in Wash", "Stylish Pattern"]
  },
  {
    id: "prod-4",
    name: "Urban Explorer Denim Jacket",
    category: "Dress",
    img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&auto=format&fit=crop&q=80",
    tags: ["Heavy Denim", "Torn Stitching", "Classic Look", "Too Tight", "Premium Hardware"]
  },
  {
    id: "prod-5",
    name: "Vagabond Leather Sandals",
    category: "Sandals",
    img: "https://images.unsplash.com/photo-1562273589-10447af56263?w=300&auto=format&fit=crop&q=80",
    tags: ["Ergonomic Sole", "Perfect Strap Fit", "Slippery Sole", "Chafing Leather", "Premium Style"]
  },
  {
    id: "prod-6",
    name: "Apex Air Cushion Shoes",
    category: "Shoes",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
    tags: ["Bouncy Cushion", "Squeaking Soles", "Extremely Light", "Runs Narrow", "Breathing Fabric"]
  }
];

// Sentiment Analysis wordlists
const sentimentWords = {
  positive: ['love', 'like', 'great', 'awesome', 'amazing', 'excellent', 'fast', 'easy', 'best', 'wonderful', 'good', 'perfect', 'helpful', 'beautiful', 'clean', 'intuitive', 'smooth', 'satisfied', 'thrilled', 'nice', 'friendly'],
  negative: ['slow', 'bad', 'bug', 'buggy', 'expensive', 'hate', 'fail', 'worst', 'broken', 'error', 'poor', 'terrible', 'hard', 'difficult', 'dislike', 'delay', 'delayed', 'rude', 'glitch', 'confusing', 'overpriced', 'flimsy', 'damaged']
};

// DOM Elements
let elements = {};

function initDOMElements() {
  elements = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    
    // Form Elements
    feedbackForm: document.getElementById('feedback-form'),
    formCardTitle: document.getElementById('form-card-title'),
    ratingStarsContainer: document.getElementById('rating-stars-container'),
    sentimentEmoji: document.getElementById('sentiment-emoji'),
    sentimentText: document.getElementById('sentiment-text'),
    liveSentimentPill: document.getElementById('live-sentiment-pill'),
    liveSentimentText: document.getElementById('live-sentiment-text'),
    feedbackComment: document.getElementById('feedback-comment'),
    quickTagsContainer: document.getElementById('quick-tags-container'),
    feedbackName: document.getElementById('feedback-name'),
    feedbackEmail: document.getElementById('feedback-email'),
    submitBtn: document.getElementById('submit-feedback-btn'),
    
    // Error Elements
    ratingError: document.getElementById('rating-error'),
    commentError: document.getElementById('comment-error'),
    emailError: document.getElementById('email-error'),
    
    // Selected Product Banner
    selectedProductBanner: document.getElementById('selected-product-banner'),
    selectedProductThumb: document.getElementById('selected-product-thumb'),
    selectedProductName: document.getElementById('selected-product-name'),
    selectedProductMeta: document.getElementById('selected-product-meta'),

    // Success Modal
    successModal: document.getElementById('success-modal'),
    modalTicketId: document.getElementById('modal-ticket-id'),
    modalFeedbackCategory: document.getElementById('modal-feedback-category'),
    modalFeedbackSentiment: document.getElementById('modal-feedback-sentiment'),
    modalViewDashboard: document.getElementById('modal-view-dashboard'),
    modalCloseSuccess: document.getElementById('modal-close-success')
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initTheme();
  loadProductFromUrl();
  loadFeedbacks();
  setupEventListeners();
  renderQuickTags();
  lucide.createIcons();
});

// Load product metadata passed via URL parameter
function loadProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  
  if (!productId) {
    // If no product is selected, redirect back to index.html (Selector)
    alert("Please select a purchased product to review first.");
    window.location.href = "index.html";
    return;
  }

  const product = cartProducts.find(p => p.id === productId);
  if (!product) {
    // Invalid product ID, redirect
    alert("Product not found. Returning to selector page.");
    window.location.href = "index.html";
    return;
  }

  state.selectedProduct = product;

  // Bind values to UI Banner
  elements.formCardTitle.textContent = `Review: ${product.name}`;
  elements.selectedProductThumb.src = product.img;
  elements.selectedProductThumb.alt = product.name;
  elements.selectedProductName.textContent = product.name;
  elements.selectedProductMeta.textContent = `Category: ${product.category}`;
}

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
    state.feedbacks = [];
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
  
  // Auto-predict sentiment
  triggerSentimentAnalysis();
}

// Render dynamic tag chips specific to product
function renderQuickTags() {
  if (!state.selectedProduct || !elements.quickTagsContainer) return;
  
  const list = state.selectedProduct.tags;
  elements.quickTagsContainer.innerHTML = list.map(tag => {
    const isActive = state.selectedTags.includes(tag);
    return `<button type="button" class="tag-chip-btn ${isActive ? 'active' : ''}" onclick="toggleTag('${tag}', this)">${tag}</button>`;
  }).join('');
}

// Toggle Tag Choice
window.toggleTag = function(tag, element) {
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
    category: "Product Quality", // Products reviews categorized as Quality
    comment: commentVal,
    tags: [...state.selectedTags],
    sentiment: finalSentiment,
    date: new Date().toISOString(),
    product: {
      id: state.selectedProduct.id,
      name: state.selectedProduct.name,
      category: state.selectedProduct.category,
      img: state.selectedProduct.img
    }
  };

  // Save to local cache
  loadFeedbacks();
  state.feedbacks.unshift(feedbackObj);
  saveFeedbacks();

  // Send to backend MySQL database
  if (window.ApiService) {
    ApiService.submitFeedback(feedbackObj).then(res => {
      if (res && res.success) {
        console.log('✅ Review saved to MySQL Database:', ticketId);
      }
    }).catch(err => {
      console.warn('Backend unavailable, stored locally.', err);
    });
  }

  // Populate success modal values
  elements.modalTicketId.textContent = ticketId;
  elements.modalFeedbackCategory.textContent = state.selectedProduct.name;
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
  state.selectedTags = [];

  // Reset star classes
  elements.ratingStarsContainer.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('active'));
  elements.sentimentEmoji.textContent = '😐';
  elements.sentimentText.textContent = 'Select a rating';
  
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

// Event Listeners Setup
function setupEventListeners() {
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Star ratings button click events
  const starButtons = elements.ratingStarsContainer.querySelectorAll('.star-btn');
  starButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'));
      setRating(rating);
    });
  });

  // Live sentiment feedback text area
  elements.feedbackComment.addEventListener('input', triggerSentimentAnalysis);

  // Form Submit Action
  elements.feedbackForm.addEventListener('submit', handleFormSubmit);

  // Modal Actions (Success Dialog)
  elements.modalViewDashboard.addEventListener('click', () => {
    elements.successModal.classList.remove('active');
    window.location.href = 'dashboard.html';
  });

  elements.modalCloseSuccess.addEventListener('click', () => {
    elements.successModal.classList.remove('active');
    // Redirect back to selector page to select another item
    window.location.href = 'index.html';
  });
}
