// =============================================
// NO FILTER AMERICA – Main App JS
// =============================================
// NEWS_CACHE_LAST_UPDATED: 2026-05-16 13:02:41 UTC
// Daily news import from newsdata.io API

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

const NEWS_API_KEY = 'pub_174f039e3cf945a3a0b9491b18a2befd';
const NFA_VIDEO_API = 'https://nofilteramerica-admin.netlify.app/.netlify/functions/videos';
let nextPageCursor = null;

// ---- FETCH: Politics + World + Domestic (NO sports) ----
async function fetchTopNews(cursor = null) {
  try {
    let url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=us&language=en&category=politics,world,top&prioritydomain=top`;
    if (cursor) url += `&page=${cursor}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success') {
      nextPageCursor = data.nextPage || null;
      // Filter out sports/entertainment — keep enough articles for layout
      const blocked = ['sport','sports','entertainment','lifestyle','food'];
      const all = data.results || [];
      const filtered = all.filter(a => {
        const cats = (a.category || []).map(c => c.toLowerCase());
        return !cats.some(c => blocked.includes(c));
      });
      // If filtering leaves us short, fall back to unfiltered results
      return filtered.length >= 11 ? filtered : all;
    }
    return getSampleStories();
  } catch(e) {
    console.error('News fetch error:', e);
    return getSampleStories();
  }
}

// ---- FETCH: Democrat-leaning news (progressive/left keywords) ----
async function fetchDemNews() {
  try {
    // Search for left-leaning political keywords
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,top&q=healthcare OR climate OR immigration OR progressive OR democrats OR senate OR Biden OR voting rights&country=us&prioritydomain=top`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success' && data.results && data.results.length > 0) {
      // Prefer stories that lean left by filtering out obvious right-wing sources
      const rightSources = ['foxnews','breitbart','dailywire','oann','theblaze','nypost','washingtonexaminer'];
      const filtered = data.results.filter(a => !rightSources.some(s => (a.source_id||'').toLowerCase().includes(s)));
      return (filtered.length >= 3 ? filtered : data.results).slice(0, 4);
    }
    return getSampleDemStories();
  } catch(e) {
    return getSampleDemStories();
  }
}

// ---- FETCH: Republican-leaning news (conservative/right keywords) ----
async function fetchRepNews() {
  try {
    // Search for right-leaning political keywords
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,top&q=border security OR tax cuts OR second amendment OR republicans OR conservative OR Trump OR spending cuts OR election integrity&country=us&prioritydomain=top`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success' && data.results && data.results.length > 0) {
      // Prefer stories from right-leaning outlets
      const leftSources = ['nytimes','washingtonpost','nbcnews','cnn','msnbc','apnews','politico'];
      const filtered = data.results.filter(a => !leftSources.some(s => (a.source_id||'').toLowerCase().includes(s)));
      return (filtered.length >= 3 ? filtered : data.results).slice(0, 4);
    }
    return getSampleRepStories();
  } catch(e) {
    return getSampleRepStories();
  }
}

function getSampleStories() {
  return [
    { title: "Breaking: Major Political Developments Shake Washington", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80", category: ["politics"], link: "https://apnews.com/politics", source_id: "AP News", description: "The latest political developments from Capitol Hill." },
    { title: "World Leaders Respond to Growing International Crisis", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80", category: ["world"], link: "https://reuters.com/world", source_id: "Reuters", description: "Global leaders are meeting to discuss escalating tensions." },
    { title: "Congress Debates New Domestic Policy Package", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=600&q=80", category: ["politics"], link: "https://thehill.com/homenews/house", source_id: "The Hill", description: "A sweeping domestic policy bill is moving through Congress." },
    { title: "Government Accountability: What They're Not Telling You", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80", category: ["top"], link: "https://propublica.org", source_id: "ProPublica", description: "Investigative report uncovers what officials hoped would stay hidden." },
    { title: "America First: Economic Policies Fuel Debate", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=600&q=80", category: ["politics"], link: "https://foxnews.com/politics", source_id: "Fox News", description: "New economic proposals are dividing Washington along party lines." },
    { title: "Freedom Watch: Constitutional Rights in the Spotlight", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80", category: ["politics"], link: "https://thehill.com/regulation/court-battles", source_id: "The Hill", description: "Civil liberties groups raise alarms over proposed legislation." },
    { title: "Breaking: Senate Vote Expected on Key Legislation", pubDate: new Date().toISOString(), image_url: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=600&q=80", category: ["top"], link: "https://politico.com/congress", source_id: "Politico", description: "The Senate is preparing for a critical vote that could reshape policy." },
  ];
}

function getSampleDemStories() {
  return [
    { title: "Democrats Push for Expanded Healthcare Coverage Nationwide", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://apnews.com/hub/health-care-reform", source_id: "AP News", description: "Progressive lawmakers are advocating for broader healthcare access across all income levels." },
    { title: "Climate Legislation Gains Support Among Senate Democrats", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://thehill.com/policy/energy-environment", source_id: "The Hill", description: "Senate Democrats rally behind a new comprehensive climate bill." },
    { title: "Left: Immigration Reform Needed for Economic Growth", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://reuters.com/world/us/immigration", source_id: "Reuters", description: "Liberal economists argue that immigration reform is key to long-term prosperity." },
    { title: "Progressive Caucus Introduces New Social Safety Net Bill", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://politico.com/news/economy", source_id: "Politico", description: "The bill aims to strengthen unemployment benefits and housing assistance." },
  ];
}

function getSampleRepStories() {
  return [
    { title: "Republicans Demand Cuts to Federal Spending Amid Debt Concerns", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://foxnews.com/politics/federal-spending", source_id: "Fox News", description: "GOP lawmakers are calling for immediate action on the ballooning national debt." },
    { title: "Right: Border Security Must Be Priority Before Any Reform", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://breitbart.com/border", source_id: "Breitbart", description: "Conservative voices insist the southern border must be secured before immigration overhaul." },
    { title: "Republicans Unveil Tax Cut Plan to Boost Small Businesses", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://wsj.com/politics/policy", source_id: "Wall Street Journal", description: "A new GOP tax proposal targets relief for small business owners nationwide." },
    { title: "Conservative Groups Back New Election Integrity Measures", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "https://washingtonexaminer.com/politics", source_id: "Washington Examiner", description: "Right-leaning organizations are rallying behind stricter voter ID requirements." },
  ];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCatLabel(article) {
  const cats = (article.category || []).map(c => c.toLowerCase());
  if (cats.includes('world')) return { label: 'WORLD NEWS', cls: 'world' };
  if (cats.includes('politics')) return { label: 'POLITICS', cls: 'politics' };
  if (cats.includes('top')) return { label: 'BREAKING', cls: '' };
  return { label: 'NEWS', cls: '' };
}

// ---- RENDER: Featured big hero + side stack ----
// ---- CATEGORY FALLBACK IMAGES ----
// Rotating pool — cycles so no two cards ever share the same fallback
const _imgPool = [
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', // Capitol building
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', // Globe/world
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80', // Newspaper
  'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=800&q=80',    // US flag
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80', // Courtroom/law
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',    // Diplomats/summit
  'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&q=80', // Senate/government
  'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&q=80', // Press conference
  'https://images.unsplash.com/photo-1569163139394-de4e5f43e5ca?w=800&q=80', // White House
];
let _imgPoolIdx = 0;
function getCategoryImage(cats) {
  // Always return next unique image from pool — never repeats until all 9 used
  const img = _imgPool[_imgPoolIdx % _imgPool.length];
  _imgPoolIdx++;
  return img;
}

function renderFeatured(articles) {
  const layout = document.getElementById('featuredLayout');
  if (!layout || articles.length === 0) return;

  const hero = articles[0];
  const sideItems = articles.slice(1, 4); // hero=0, side=1,2,3
  const { label, cls } = getCatLabel(hero);

  // Use article image, or a category-specific fallback image
  const heroFallback = getCategoryImage(hero.category);
  const heroImgHtml = `<img class="featured-hero-img" src="${hero.image_url || heroFallback}" alt="${hero.title}" onerror="this.src='${heroFallback}'">`;

  const heroHtml = `
    <a class="featured-hero" href="${hero.link && hero.link !== '#' ? hero.link : 'javascript:void(0)'}" target="${hero.link && hero.link !== '#' ? '_blank' : ''}" rel="noopener">
      ${heroImgHtml}
      <div class="featured-hero-overlay">
        <div class="featured-cat ${cls}">${label}</div>
        <div class="featured-title">${hero.title}</div>
        ${hero.description ? `<div class="featured-desc">${hero.description}</div>` : ''}
        <div class="featured-meta">${hero.source_id || 'No Filter America'} · ${formatDate(hero.pubDate)}</div>
      </div>
    </a>`;

  const stackHtml = `
    <div class="side-stack">
      ${sideItems.map(a => {
        const { label: l, cls: c } = getCatLabel(a);
        const cardFallback = getCategoryImage(a.category);
        const imgHtml = `<img class="stack-card-img" src="${a.image_url || cardFallback}" alt="${a.title}" onerror="this.src='${cardFallback}'">`;
        return `
          <a class="stack-card" href="${a.link && a.link !== '#' ? a.link : 'javascript:void(0)'}" target="${a.link && a.link !== '#' ? '_blank' : ''}" rel="noopener">
            ${imgHtml}
            <div class="stack-card-body">
              <div class="stack-cat">${l}</div>
              <div class="stack-title">${a.title}</div>
              <div class="stack-meta">${a.source_id || ''} · ${formatDate(a.pubDate)}</div>
            </div>
          </a>`;
      }).join('')}
    </div>`;

  layout.innerHTML = heroHtml + stackHtml;
}

// ---- RENDER: More stories grid ----
function renderNewsCards(articles, append = false) {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  if (!append) grid.innerHTML = '';

  articles.forEach((article, i) => {
    const { label, cls } = getCatLabel(article);
    const isRep = i % 2 === 0;
    const partyClass = (article.category || []).some(c => ['politics','top','world'].includes(c.toLowerCase()))
      ? (isRep ? 'rep' : 'dem') : '';

    const card = document.createElement('a');
    card.className = `news-card ${partyClass}`;
    card.href = (article.link && article.link !== '#') ? article.link : 'javascript:void(0)';
    card.target = (article.link && article.link !== '#') ? '_blank' : '';
    card.rel = 'noopener';
    card.innerHTML = `
      <img class="card-img" src="${article.image_url || getCategoryImage(article.category)}" alt="${article.title}" onerror="this.style.display='none'"/>
      <div class="card-body">
        <div class="card-cat-wrap">
          <span class="card-cat ${partyClass}">${label}</span>
        </div>
        <div class="card-title">${article.title}</div>
        <div class="card-meta">${article.source_id || 'No Filter America'} · ${formatDate(article.pubDate)}</div>
      </div>`;
    grid.appendChild(card);
  });
}

// ---- RENDER: Both Sides panels ----
function renderBothSides(demArticles, repArticles) {
  const demEl = document.getElementById('demStories');
  const repEl = document.getElementById('repStories');

  // Separate pools for each side — LEFT = blue-toned, RIGHT = red-toned themes
  const demFallbackPool = [
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80', // newspaper front page
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', // globe world
    'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80',    // microphone podium
    'https://images.unsplash.com/photo-1521791055366-0d553872952f?w=800&q=80', // handshake diplomacy
  ];
  const repFallbackPool = [
    'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=800&q=80',    // US flag waving
    'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&q=80', // government building
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80', // courtroom/law
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80', // American flag close
  ];

  function buildStoryCards(articles, side) {
    const pool = side === 'dem' ? demFallbackPool : repFallbackPool;
    return articles.map((a, idx) => {
      // Use article's own image if available, otherwise pick unique fallback by index
      const fallback = pool[idx % pool.length];
      const imgSrc = a.image_url || fallback;
      return `
        <a class="sides-card" href="${a.link && a.link !== '#' ? a.link : 'javascript:void(0)'}" target="${a.link && a.link !== '#' ? '_blank' : ''}" rel="noopener">
          <img class="sides-card-img" src="${imgSrc}" alt="${a.title}" onerror="this.src='${pool[(idx + 1) % pool.length]}'">
          <div class="sides-card-body">
            <div class="sides-card-title">${a.title}</div>
            <div class="sides-card-meta">${a.source_id || ''} · ${formatDate(a.pubDate)}</div>
          </div>
        </a>`;
    }).join('');
  }

  if (demEl) demEl.innerHTML = buildStoryCards(demArticles, 'dem');
  if (repEl) repEl.innerHTML = buildStoryCards(repArticles, 'rep');
}

// ---- MAIN LOAD ----
async function loadNews() {
  // Fetch top political/world news
  const articles = await fetchTopNews();

  // Hero + side stack: first 4 articles (1 hero + 3 side)
  renderFeatured(articles.slice(0, 4));

  // More stories grid: exactly 6 cards — pad with samples if API is short
  const moreArticles = articles.slice(4);
  const samples = getSampleStories();
  let gridArticles = moreArticles;
  if (gridArticles.length < 6) {
    // Pad with sample stories to always hit exactly 6
    gridArticles = [...moreArticles, ...samples.slice(0, 6 - moreArticles.length)];
  }
  renderNewsCards(gridArticles.slice(0, 6), false);

  // Ticker — update both spans for seamless infinite loop
  if (articles.length > 0) {
    const headlines = articles.map(a => '▸ ' + a.title).join('   ·   ');
    const t1 = document.getElementById('ticker-text');
    const t2 = document.getElementById('ticker-text-dupe');
    if (t1) t1.textContent = headlines;
    if (t2) t2.textContent = headlines;
    // Tell the ticker engine to recalculate width now that real text is loaded
    if (window.resetTickerWidth) window.resetTickerWidth();
  }

  // Both Sides: fetch in parallel
  const [demNews, repNews] = await Promise.all([fetchDemNews(), fetchRepNews()]);
  renderBothSides(demNews, repNews);
}

async function loadMoreNews() {
  if (!nextPageCursor) return;
  const articles = await fetchTopNews(nextPageCursor);
  renderNewsCards(articles, true);
}

// ---- LOCAL VIDEO STORAGE ----
function getVideos(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
}
function saveVideos(key, videos) {
  localStorage.setItem(key, JSON.stringify(videos));
}

// ---- TOAST ----
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

// ---- VIDEO RENDERS ----
function getTikTokEmbedUrl(url) {
  // Convert TikTok share URLs (t/xxxxx or @user/video/id) to embed format
  if (!url) return null;
  // Already an embed URL
  if (url.includes('tiktok.com/embed')) return url;
  // Format: https://www.tiktok.com/t/XXXXXX/ (short share link)
  // Format: https://www.tiktok.com/@user/video/12345
  const videoMatch = url.match(/video\/([0-9]+)/);
  if (videoMatch) {
    return 'https://www.tiktok.com/embed/v2/' + videoMatch[1];
  }
  // Short share link — use blockquote embed via oEmbed or just link out
  return url;
}

async function renderPublicVideos(containerId, storageKey, gridClass = 'video-grid-3') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.className = 'nfz-grid';
  container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray);"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--gold);"></i></div>';

  // Fetch from Netlify serverless function
  let videos = [];
  try {
    const res = await fetch(NFA_VIDEO_API + '?action=list&section=nofilter');
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      videos = data.data.filter(v => v.video_url).sort((a,b) => a.slot - b.slot);
    }
  } catch(e) { videos = []; }

  container.innerHTML = '';

  // Always render 3 portrait (9:16) slots
  for (let i = 0; i < 3; i++) {
    const vid = videos.find(v => v.slot === i);
    const slot = document.createElement('div');
    slot.className = 'nfz-slot';
    if (vid && vid.video_url) {
      const hasThumbnail = vid.thumbnail_url && vid.thumbnail_url.trim();
      slot.innerHTML = `
        <a href="${vid.video_url}" target="_blank" rel="noopener" class="nfz-media nfz-thumb-link" style="${hasThumbnail ? `background-image:url('${vid.thumbnail_url}');background-size:cover;background-position:center top;` : ''}">
          <div class="nfz-thumb-overlay">
            <i class="fab fa-tiktok" style="font-size:2.2rem;"></i>
            <span style="font-size:13px;font-weight:700;letter-spacing:1px;">WATCH ON TIKTOK</span>
          </div>
        </a>
        <div class="nfz-info">
          <div class="nfz-title">${vid.title || 'No Filter Video ' + (i+1)}</div>
          ${vid.description ? `<div class="nfz-desc">${vid.description}</div>` : ''}
          <a href="${vid.video_url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:var(--gold);text-decoration:none;font-weight:600;letter-spacing:1px;"><i class="fab fa-tiktok"></i> Watch on TikTok</a>
        </div>`;
    } else {
      slot.innerHTML = `
        <div class="nfz-media nfz-empty">
          <i class="fab fa-tiktok"></i>
          <span>Slot ${i+1}</span>
          <small>Upload via Admin Panel</small>
        </div>
        <div class="nfz-info">
          <div class="nfz-title">TikTok Slot ${i+1}</div>
          <div class="nfz-date">1080 × 1920 · 9:16</div>
        </div>`;
    }
    container.appendChild(slot);
  }
}

async function renderTrueCrimeSlots(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.className = 'video-grid-3';
  container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray);"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--gold);"></i></div>';

  // Fetch from GitHub-backed cloud storage
  let allVideos = [];
  try {
    const res = await fetch('https://nofilteramerica-admin.netlify.app/.netlify/functions/videos?action=list&section=truecrime');
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      allVideos = data.data.filter(v => v.title).sort((a,b) => a.slot - b.slot);
    }
  } catch(e) { allVideos = []; }

  container.innerHTML = '';

  if (allVideos.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--gray);"><i class="fas fa-gavel" style="font-size:3rem;color:var(--gold);margin-bottom:16px;display:block;"></i><p style="font-size:16px;">Case files coming soon. Stay tuned.</p></div>';
    return;
  }

  allVideos.forEach((vid, idx) => {
    const slot = document.createElement('div');
    slot.className = 'nfz-card';
    const thumb = vid.thumbnail_url || '';
    const tiktokUrl = vid.video_url || '#';

    slot.innerHTML = `
      <a href="${tiktokUrl}" target="_blank" rel="noopener" style="text-decoration:none;display:block;">
        <div class="nfz-thumb" style="${thumb ? 'background-image:url(' + thumb + ');background-size:cover;background-position:center top;' : 'background:linear-gradient(135deg,#1a0a0a,#2d0a0a);'}">
          ${!thumb ? '<i class="fas fa-gavel" style="font-size:3rem;color:var(--gold);position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);opacity:0.4;"></i>' : ''}
          <div class="nfz-overlay">
            <span class="nfz-watch-badge"><i class="fab fa-tiktok"></i> WATCH ON TIKTOK</span>
          </div>
        </div>
      </a>
      <div class="nfz-info">
        <div class="nfz-title">${vid.title || 'Case File ' + (idx+1)}</div>
        ${vid.description ? '<div class="nfz-desc">' + vid.description + '</div>' : ''}
        ${tiktokUrl !== '#' ? '<a href="' + tiktokUrl + '" target="_blank" class="nfz-link"><i class="fab fa-tiktok"></i> Watch on TikTok</a>' : ''}
      </div>`;
    container.appendChild(slot);
  });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('newsGrid') || document.getElementById('featuredLayout')) loadNews();
  if (document.getElementById('noFilterVideos')) renderPublicVideos('noFilterVideos', 'nofilter_videos', 'video-grid-3');
  if (document.getElementById('trueCrimeSlots')) renderTrueCrimeSlots('trueCrimeSlots');
});
