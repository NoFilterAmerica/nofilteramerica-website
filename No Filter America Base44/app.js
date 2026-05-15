// =============================================
// NO FILTER AMERICA – Main App JS
// =============================================

// Mobile menu toggle
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ---- NEWS FEED (News.io API) ----
// Replace YOUR_NEWSIO_API_KEY with your actual News.io API key
const NEWS_API_KEY = 'YOUR_NEWSIO_API_KEY';
const NEWS_CATEGORIES = ['politics','crime','breaking','us-news','world'];
let currentPage = 1;

async function fetchNews(page = 1) {
  try {
    // News.io endpoint - adjust endpoint if your plan differs
    const url = `https://api.thenewsapi.com/v1/news/top?api_token=${NEWS_API_KEY}&locale=us&language=en&limit=6&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.data || [];
  } catch(e) {
    // Fallback sample stories if API not configured
    return getSampleStories();
  }
}

function getSampleStories() {
  return [
    { title: "Breaking: Major Political Shake-Up Rocks Washington D.C.", published_at: new Date().toISOString(), image_url: null, categories: ["politics"], url: "#", source: "No Filter America" },
    { title: "Exclusive: The Story Mainstream Media Won't Cover", published_at: new Date().toISOString(), image_url: null, categories: ["breaking"], url: "#", source: "No Filter America" },
    { title: "True Crime Bombshell: Cold Case Gets New Evidence", published_at: new Date().toISOString(), image_url: null, categories: ["crime"], url: "#", source: "No Filter America" },
    { title: "Government Accountability Report: What They're Hiding", published_at: new Date().toISOString(), image_url: null, categories: ["politics"], url: "#", source: "No Filter America" },
    { title: "America First: Economic Policies That Actually Work", published_at: new Date().toISOString(), image_url: null, categories: ["us-news"], url: "#", source: "No Filter America" },
    { title: "Freedom Watch: Your Constitutional Rights Under Threat", published_at: new Date().toISOString(), image_url: null, categories: ["us-news"], url: "#", source: "No Filter America" },
  ];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function categoryLabel(article) {
  if (article.categories && article.categories.length > 0) {
    return article.categories[0].toUpperCase().replace('-', ' ');
  }
  return 'NEWS';
}

function renderNewsCards(articles, append = false) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  if (!append) grid.innerHTML = '';

  articles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => { if(article.url && article.url !== '#') window.open(article.url, '_blank'); };
    card.innerHTML = `
      ${article.image_url ? `<img class="card-img" src="${article.image_url}" alt="${article.title}" onerror="this.style.display='none'"/>` : ''}
      <div class="card-body">
        <div class="card-category">${categoryLabel(article)}</div>
        <div class="card-title">${article.title}</div>
        <div class="card-meta">${article.source || 'No Filter America'} · ${formatDate(article.published_at)}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadNews() {
  const articles = await fetchNews(1);
  renderNewsCards(articles, false);

  // Update ticker with headlines
  if (articles.length > 0) {
    const headlines = articles.map(a => a.title).join('   ·   ');
    const ticker = document.getElementById('ticker-text');
    if (ticker) ticker.textContent = headlines;
  }
}

async function loadMoreNews() {
  currentPage++;
  const articles = await fetchNews(currentPage);
  renderNewsCards(articles, true);
}

// ---- LOCAL VIDEO STORAGE (localStorage for demo; swap for backend in production) ----
function getVideos(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
}
function saveVideos(key, videos) {
  localStorage.setItem(key, JSON.stringify(videos));
}

// ---- TOAST NOTIFICATION ----
function showToast(msg, type = 'success') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + (type === 'error' ? 'error' : '');
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ---- RENDER VIDEOS ON FRONT-END PAGES ----
function renderPublicVideos(containerId, storageKey, gridClass = 'video-grid-2') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const videos = getVideos(storageKey);
  container.className = gridClass;
  container.innerHTML = '';

  if (videos.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--gray);">
      <i class="fas fa-film" style="font-size:3rem;display:block;margin-bottom:16px;color:var(--border);"></i>
      Videos coming soon. Stay tuned!
    </div>`;
    return;
  }

  videos.forEach((vid, i) => {
    const slot = document.createElement('div');
    slot.className = 'video-slot';
    slot.innerHTML = `
      <video controls preload="none" poster="">
        <source src="${vid.dataUrl}" type="video/mp4">
        Your browser does not support video.
      </video>
      <div class="video-info">
        <div class="video-title">${vid.title || 'No Filter Video ' + (i+1)}</div>
        <div class="video-date">${vid.date || ''}</div>
      </div>
    `;
    container.appendChild(slot);
  });
}

function renderTrueCrimeSlots(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const allVideos = getVideos('truecrime_videos');
  const slots = 6;
  container.className = 'video-grid-3';
  container.innerHTML = '';

  for (let i = 0; i < slots; i++) {
    const vid = allVideos[i];
    const slot = document.createElement('div');
    slot.className = 'video-slot';
    if (vid) {
      slot.innerHTML = `
        <video controls preload="none">
          <source src="${vid.dataUrl}" type="video/mp4">
        </video>
        <div class="video-info">
          <div class="video-title">${vid.title || 'Case File ' + (i+1)}</div>
          <div class="video-date">${vid.date || ''}</div>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <div class="video-placeholder">
          <i class="fas fa-gavel"></i>
          <span>Case File ${i+1}</span>
          <small style="font-size:11px;">Coming Soon</small>
        </div>
        <div class="video-info">
          <div class="video-title">Case File ${i+1}</div>
          <div class="video-date">Upload via Admin Panel</div>
        </div>
      `;
    }
    container.appendChild(slot);
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Load news on homepage
  if (document.getElementById('newsGrid')) loadNews();

  // Render public no-filter zone videos
  if (document.getElementById('noFilterVideos')) {
    renderPublicVideos('noFilterVideos', 'nofilter_videos', 'video-grid-2');
  }

  // Render true crime slots
  if (document.getElementById('trueCrimeSlots')) {
    renderTrueCrimeSlots('trueCrimeSlots');
  }
});
