// State Management specific to Selection Portal
const state = {
  theme: 'light'
};

// Purchased Products database
const cartProducts = [
  {
    id: "prod-1",
    name: "Zenith Noise-Cancelling Headphones",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-2",
    name: "AuraFit Smart Watch",
    category: "Electronics",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-3",
    name: "Summer Breeze Linen Dress",
    category: "Dress",
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-4",
    name: "Urban Explorer Denim Jacket",
    category: "Dress",
    img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-5",
    name: "Vagabond Leather Sandals",
    category: "Sandals",
    img: "https://images.unsplash.com/photo-1562273589-10447af56263?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-6",
    name: "Apex Air Cushion Shoes",
    category: "Shoes",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80"
  }
];

// DOM Elements
let elements = {};

function initDOMElements() {
  elements = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    cartSelectionGrid: document.getElementById('cart-selection-grid')
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initDOMElements();
  initTheme();
  setupEventListeners();
  await renderSelectionGrid();
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

// Render product list inside the selector grid
async function renderSelectionGrid() {
  if (!elements.cartSelectionGrid) return;
  
  let products = cartProducts;
  if (window.ApiService) {
    const apiProducts = await ApiService.getProducts();
    if (Array.isArray(apiProducts) && apiProducts.length > 0) {
      products = apiProducts;
    }
  }

  elements.cartSelectionGrid.innerHTML = products.map(p => {
    return `
      <div class="product-card glass-card" data-id="${p.id}">
        <div class="product-img-wrapper">
          <img src="${p.img}" alt="${p.name}" class="product-img" loading="lazy">
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h4 class="product-title">${p.name}</h4>
        </div>
        <span class="product-select-badge">Write Review</span>
      </div>
    `;
  }).join('');

  // Setup click handlers
  const cards = elements.cartSelectionGrid.querySelectorAll('.product-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-id');
      window.location.href = `feedback.html?product=${pid}`;
    });
  });
}

function setupEventListeners() {
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
}
