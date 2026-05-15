// =============================================
// NO FILTER AMERICA – Main App JS
// =============================================

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

const NEWS_API_KEY = 'pub_174f039e3cf945a3a0b9491b18a2befd';
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
      // Filter out sports/entertainment
      const blocked = ['sport','sports','entertainment','lifestyle','food','health','tech','science'];
      return (data.results || []).filter(a => {
        const cats = (a.category || []).map(c => c.toLowerCase());
        return !cats.some(c => blocked.includes(c));
      });
    }
    return getSampleStories();
  } catch(e) {
    console.error('News fetch error:', e);
    return getSampleStories();
  }
}

// ---- FETCH: Dem-leaning sources ----
async function fetchDemNews() {
  try {
    const demSources = 'nytimes,washingtonpost,nbcnews,cnn,msnbc,thehill,apnews,politico';
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,world,top&domainurl=${demSources}&country=us`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success' && data.results && data.results.length > 0) {
      return data.results.slice(0, 4);
    }
    return getSampleDemStories();
  } catch(e) {
    return getSampleDemStories();
  }
}

// ---- FETCH: Rep-leaning sources ----
async function fetchRepNews() {
  try {
    const repSources = 'foxnews,breitbart,nypost,washingtonexaminer,dailywire,nationalreview,theblaze,oann';
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,world,top&domainurl=${repSources}&country=us`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'success' && data.results && data.results.length > 0) {
      return data.results.slice(0, 4);
    }
    return getSampleRepStories();
  } catch(e) {
    return getSampleRepStories();
  }
}

function getSampleStories() {
  return [
    { title: "Breaking: Major Political Developments Shake Washington", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America", description: "The latest political developments from Capitol Hill." },
    { title: "World Leaders Respond to Growing International Crisis", pubDate: new Date().toISOString(), image_url: null, category: ["world"], link: "#", source_id: "No Filter America", description: "Global leaders are meeting to discuss escalating tensions." },
    { title: "Congress Debates New Domestic Policy Package", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America", description: "A sweeping domestic policy bill is moving through Congress." },
    { title: "Government Accountability: What They're Not Telling You", pubDate: new Date().toISOString(), image_url: null, category: ["top"], link: "#", source_id: "No Filter America", description: "Investigative report uncovers what officials hoped would stay hidden." },
    { title: "America First: Economic Policies Fuel Debate", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America", description: "New economic proposals are dividing Washington along party lines." },
    { title: "Freedom Watch: Constitutional Rights in the Spotlight", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "No Filter America", description: "Civil liberties groups raise alarms over proposed legislation." },
    { title: "Breaking: Senate Vote Expected on Key Legislation", pubDate: new Date().toISOString(), image_url: null, category: ["top"], link: "#", source_id: "No Filter America", description: "The Senate is preparing for a critical vote that could reshape policy." },
  ];
}

function getSampleDemStories() {
  return [
    { title: "Democrats Push for Expanded Healthcare Coverage Nationwide", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Left Perspective", description: "Progressive lawmakers are advocating for broader healthcare access across all income levels." },
    { title: "Climate Legislation Gains Support Among Senate Democrats", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Left Perspective", description: "Senate Democrats rally behind a new comprehensive climate bill." },
    { title: "Left: Immigration Reform Needed for Economic Growth", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Left Perspective", description: "Liberal economists argue that immigration reform is key to long-term prosperity." },
    { title: "Progressive Caucus Introduces New Social Safety Net Bill", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Left Perspective", description: "The bill aims to strengthen unemployment benefits and housing assistance." },
  ];
}

function getSampleRepStories() {
  return [
    { title: "Republicans Demand Cuts to Federal Spending Amid Debt Concerns", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Right Perspective", description: "GOP lawmakers are calling for immediate action on the ballooning national debt." },
    { title: "Right: Border Security Must Be Priority Before Any Reform", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Right Perspective", description: "Conservative voices insist the southern border must be secured before immigration overhaul." },
    { title: "Republicans Unveil Tax Cut Plan to Boost Small Businesses", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Right Perspective", description: "A new GOP tax proposal targets relief for small business owners nationwide." },
    { title: "Conservative Groups Back New Election Integrity Measures", pubDate: new Date().toISOString(), image_url: null, category: ["politics"], link: "#", source_id: "Right Perspective", description: "Right-leaning organizations are rallying behind stricter voter ID requirements." },
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
function renderFeatured(articles) {
  const layout = document.getElementById('featuredLayout');
  if (!layout || articles.length === 0) return;

  const hero = articles[0];
  const sideItems = articles.slice(1, 4);
  const { label, cls } = getCatLabel(hero);

  const heroImgHtml = hero.image_url
    ? `<img class="featured-hero-img" src="${hero.image_url}" alt="${hero.title}" onerror="this.parentNode.innerHTML='<div class=featured-hero-img-placeholder><i class=fas fa-newspaper></i></div>'">`
    : `<div class="featured-hero-img-placeholder"><i class="fas fa-newspaper"></i></div>`;

  const heroHtml = `
    <a class="featured-hero" href="${hero.link || '#'}" target="_blank" rel="noopener">
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
        const imgHtml = a.image_url
          ? `<img class="stack-card-img" src="${a.image_url}" alt="${a.title}" onerror="this.parentNode.innerHTML='<div class=stack-card-img-placeholder><i class=fas fa-newspaper></i></div>'">`
          : `<div class="stack-card-img-placeholder"><i class="fas fa-newspaper"></i></div>`;
        return `
          <a class="stack-card" href="${a.link || '#'}" target="_blank" rel="noopener">
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
    card.href = article.link || '#';
    card.target = '_blank';
    card.rel = 'noopener';
    card.innerHTML = `
      ${article.image_url ? `<img class="card-img" src="${article.image_url}" alt="${article.title}" onerror="this.style.display='none'"/>` : ''}
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

  function buildStoryCards(articles) {
    return articles.map(a => {
      const imgHtml = a.image_url
        ? `<img class="stack-card-img" src="${a.image_url}" alt="${a.title}" onerror="this.style.display='none'">`
        : '';
      return `
        <a class="stack-card" href="${a.link || '#'}" target="_blank" rel="noopener" style="margin-bottom:10px;">
          ${imgHtml ? `<div>${imgHtml}</div>` : ''}
          <div class="stack-card-body">
            <div class="stack-title" style="font-size:14px;">${a.title}</div>
            <div class="stack-meta">${a.source_id || ''} · ${formatDate(a.pubDate)}</div>
          </div>
        </a>`;
    }).join('');
  }

  if (demEl) demEl.innerHTML = buildStoryCards(demArticles);
  if (repEl) repEl.innerHTML = buildStoryCards(repArticles);
}

// ---- MAIN LOAD ----
async function loadNews() {
  // Fetch top political/world news
  const articles = await fetchTopNews();

  // Hero + side stack: first 4 articles
  renderFeatured(articles.slice(0, 4));

  // More stories grid: articles 4-9
  renderNewsCards(articles.slice(4, 10), false);

  // Ticker
  if (articles.length > 0) {
    const headlines = articles.map(a => '★ ' + a.title).join('   ·   ');
    const ticker = document.getElementById('ticker-text');
    if (ticker) ticker.textContent = headlines;
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
function renderPublicVideos(containerId, storageKey, gridClass = 'video-grid-2') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const videos = getVideos(storageKey);
  container.className = gridClass;
  container.innerHTML = '';
  if (videos.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--gray);">
      <i class="fas fa-film" style="font-size:3rem;display:block;margin-bottom:16px;"></i>Videos coming soon. Stay tuned!</div>`;
    return;
  }
  videos.forEach((vid, i) => {
    const slot = document.createElement('div');
    slot.className = 'video-slot';
    slot.innerHTML = `<video controls preload="none"><source src="${vid.dataUrl}" type="video/mp4"></video>
      <div class="video-info"><div class="video-title">${vid.title || 'No Filter Video ' + (i+1)}</div><div class="video-date">${vid.date || ''}</div></div>`;
    container.appendChild(slot);
  });
}

function renderTrueCrimeSlots(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const allVideos = getVideos('truecrime_videos');
  container.className = 'video-grid-3';
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const vid = allVideos[i];
    const slot = document.createElement('div');
    slot.className = 'video-slot';
    if (vid) {
      slot.innerHTML = `<video controls preload="none"><source src="${vid.dataUrl}" type="video/mp4"></video>
        <div class="video-info"><div class="video-title">${vid.title || 'Case File ' + (i+1)}</div><div class="video-date">${vid.date || ''}</div></div>`;
    } else {
      slot.innerHTML = `<div class="video-placeholder"><i class="fas fa-gavel"></i><span>Case File ${i+1}</span><small>Coming Soon</small></div>
        <div class="video-info"><div class="video-title">Case File ${i+1}</div><div class="video-date">Upload via Admin Panel</div></div>`;
    }
    container.appendChild(slot);
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('newsGrid') || document.getElementById('featuredLayout')) loadNews();
  if (document.getElementById('noFilterVideos')) renderPublicVideos('noFilterVideos', 'nofilter_videos', 'video-grid-2');
  if (document.getElementById('trueCrimeSlots')) renderTrueCrimeSlots('trueCrimeSlots');
});
