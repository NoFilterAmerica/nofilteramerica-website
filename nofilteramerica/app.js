// =============================================
// NO FILTER AMERICA – Main App JS
// =============================================

// Mobile menu toggle
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ---- NEWS FEED (newsdata.io API) ----
const NEWS_API_KEY = 'pub_174f039e3cf945a3a0b9491b18a2befd';
let currentPage = null; // newsdata.io uses cursor-based pagination
let nextPageCursor = null;

async function fetchNews(nextCursor = null) {
  try {
    let url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=us&language=en&category=politics,crime,world,top`;
    if (nextCursor) url += `&page=${nextCursor}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success') {
      nextPageCursor = data.nextPage || null;
      return data.results || [];
    }
    return getSampleStories();
  } catch(e) {
    return getSampleStories();
  }
}

function getSampleStories() {
  return [
    { title: "Breaking: Major Political Shake-Up Rocks Washington D.C.", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America" },
    { title: "Exclusive: The Story Mainstream Media Won't Cover", pubDate: new Date().toISOString(), image_url: null, category: ["top"], link: "#", source_id: "No Filter America" },
    { title: "True Crime Bombshell: Cold Case Gets New Evidence", pubDate: new Date().toISOString(), image_url: null, category: ["crime"], link: "#", source_id: "No Filter America" },
    { title: "Government Accountability Report: What They're Hiding", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America" },
    { title: "America First: Economic Policies That Actually Work", pubDate: new Date().toISOString(), image_url: null, category: ["top"], link: "#", source_id: "No Filter America" },
    { title: "Freedom Watch: Your Constitutional Rights Under Threat", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America" },
  ];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function categoryLabel(article) {
  if (article.category && article.category.length > 0) {
    return article.category[0].toUpperCase();
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
    card.onclick = () => { if(article.link && article.link !== '#') window.open(article.link, '_blank'); };
    card.innerHTML = `
      ${article.image_url ? `<img class="card-img" src="${article.image_url}" alt="${article.title}" onerror="this.style.display='none'"/>` : ''}
      <div class="card-body">
        <div class="card-category">${categoryLabel(article)}</div>
        <div class="card-title">${article.title}</div>
        <div class="card-meta">${article.source_id || 'No Filter America'} · ${formatDate(article.pubDate)}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadNews() {
  const articles = await fetchNews();
  renderNewsCards(articles, false);

  // Update ticker with live headlines
  if (articles.length > 0) {
    const headlines = articles.map(a => a.title).join('   ·   ');
    const ticker = document.getElementById('ticker-text');
    if (ticker) ticker.textContent = headlines;
  }
}

async function loadMoreNews() {
  if (!nextPageCursor) return;
  const articles = await fetchNews(nextPageCursor);
  renderNewsCards(articles, true);
}

// ---- LOCAL VIDEO STORAGE ----
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
      <video controls preload="none">
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
  if (document.getElementById('newsGrid')) loadNews();
  if (document.getElementById('noFilterVideos')) {
    renderPublicVideos('noFilterVideos', 'nofilter_videos', 'video-grid-2');
  }
  if (document.getElementById('trueCrimeSlots')) {
    renderTrueCrimeSlots('trueCrimeSlots');
  }
});
