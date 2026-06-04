// =============================================

// Open document in viewer — cross-device compatible (desktop + iOS)
function openDoc(e, url) {
  e.preventDefault();
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMobile = isIOS || /Android/.test(navigator.userAgent);

  // PDFs
  if (ext === 'pdf') {
    if (isMobile) {
      // iOS Safari handles PDFs natively in a new tab — just open directly
      window.open(url, '_blank');
    } else {
      // Desktop: use in-page modal with Google Docs embedded viewer
      showDocModal('<iframe src="https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>');
    }
    return;
  }

  // Images — lightbox works on all devices
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;-webkit-overflow-scrolling:touch;';
    overlay.innerHTML = '<img src="'+url+'" style="max-width:92vw;max-height:88vh;border-radius:6px;box-shadow:0 0 40px rgba(0,0,0,0.8);object-fit:contain;"/><button style="position:absolute;top:18px;right:24px;background:rgba(0,0,0,0.6);border:none;color:#fff;font-size:2rem;cursor:pointer;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;" onclick="this.parentNode.remove()">✕</button>';
    overlay.onclick = function(ev){ if(ev.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    return;
  }

  // All other files
  window.open(url, '_blank');
}

// Modal for desktop PDF viewing
function showDocModal(innerHtml) {
  const existing = document.getElementById('nfa-doc-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'nfa-doc-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  modal.innerHTML = `
    <div style="width:100%;max-width:900px;height:85vh;background:#0a1628;border:1px solid rgba(197,160,70,0.4);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(197,160,70,0.2);flex-shrink:0;">
        <span style="color:#c9a84c;font-family:Oswald,sans-serif;font-size:13px;letter-spacing:2px;">📄 EVIDENCE DOCUMENT</span>
        <button onclick="document.getElementById('nfa-doc-modal').remove()" style="background:none;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:1rem;cursor:pointer;padding:4px 12px;border-radius:4px;">✕ CLOSE</button>
      </div>
      <div style="flex:1;overflow:hidden;">\${innerHtml}</div>
    </div>
  `;
  modal.onclick = function(ev){ if(ev.target===modal) modal.remove(); };
  document.body.appendChild(modal);
}

// NO FILTER AMERICA – Main App JS
// =============================================
// NEWS_CACHE_LAST_UPDATED: 2026-06-04 19:44 UTC
// Daily news import from newsdata.io API

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

const NEWS_API_KEY = 'pub_174f039e3cf945a3a0b9491b18a2befd';
const NFA_VIDEO_API = 'https://nofilteramerica-admin.netlify.app/.netlify/functions/videos';
let nextPageCursor = null;

// ---- FETCH: Politics + World + Domestic (NO sports) ----

// DAILY_NEWS_CACHE (auto-updated by NFA Super Agent)
const DAILY_NEWS_CACHE = [
  {"title":"Trump admits to critical remarks","description":"BEIRUT -- President Donald Trump acknowledged criticizing Israeli Prime Minister Benjamin Netanyahu as \"crazy\" in a phone call that involved expletives, saying he was \"a little bit perturbed\" that","link":"https://www.nwaonline.com/news/2026/jun/04/trump-admits-to-critical-remarks/","image_url":"","source_id":"nwaonline","pubDate":"2026-06-04 07:40:00","category":["politics"]},
  {"title":"Israel and Lebanon agree to conditional ceasefire","description":"Deal is made through US-brokered talks in Washington, DC, that did not include Hezbollah.","link":"https://www.aljazeera.com/news/2026/6/4/israel-and-lebanon-agree-to-conditional-ceasefire","image_url":"https://www.aljazeera.com/wp-content/uploads/2026/06/2026-06-04T012605Z_601431462_RC2NMLA4NGR5_RTRMADP_3_IRAN-CRISIS-LEBANON-ISRAEL-CEASEFIRE-1780555288.jpg?resize=1920%2C1440","source_id":"aljazeera_us","pubDate":"2026-06-04 07:37:33","category":["politics"]},
  {"title":"Netanyahu faces plunging support in north Israel as voters demand tougher Lebanon stance","description":"ONLY AVAILABLE IN PAID PLANS","link":"https://www.investing.com/news/world-news/netanyahu-faces-plunging-support-in-north-israel-as-voters-demand-tougher-lebanon-stance-4725776","image_url":"","source_id":"investing_us","pubDate":"2026-06-04 07:36:35","category":["politics"]},
  {"title":"Trump Criticizes CNN's Kaitlan Collins, Accusing Her of Bias and Lack of Professionalism","description":"President Donald Trump engaged in a heated exchange with CNN's Kaitlan Collins during a press briefing, criticizing the journalist's demeanor and questioning her professionalism. Trump singled out Col","link":"https://headtopics.com/news/trump-criticizes-cnn-s-kaitlan-collins-accusing-her-of-84115799","image_url":"https://i.headtopics.com/images/2026/6/4/usweekly/trump-criticizes-cnn-s-kaitlan-collins-accusing-he-trump-criticizes-cnn-s-kaitlan-collins-accusing-he-04E508B06278400067B62E7B98E7E324.webp","source_id":"headtopics","pubDate":"2026-06-04 07:35:59","category":["politics"]},
  {"title":"Oakland seniors raise alarm over conditions at affordable housing complex","description":"Dozens of Oakland seniors say they're living with roaches, garbage and unsafe conditions.","link":"https://us.headtopics.com/news/oakland-seniors-raise-alarm-over-conditions-at-affordable-84115565","image_url":"https://i.headtopics.com/images/2026/6/4/nbcbayarea/oakland-seniors-raise-alarm-over-conditions-at-aff-oakland-seniors-raise-alarm-over-conditions-at-aff-DED5A78C034F0F66DA75BB5B311DE2F1.webp","source_id":"headtopics","pubDate":"2026-06-04 07:35:21","category":["politics"]},
  {"title":"Indonesian nutrition leader arrested","description":"JAKARTA, Indonesia -- Indonesia's recently dismissed head of the National Nutrition Agency was arrested Wednesday on corruption charges related to a multibillion-dollar free-meals program.","link":"https://www.nwaonline.com/news/2026/jun/04/indonesian-nutrition-leader-arrested/","image_url":"","source_id":"nwaonline","pubDate":"2026-06-04 07:41:00","category":["crime"]},
  {"title":"Munnsville man arrested in two separate incidents","description":"A Munnsville man is facing several charges after a pair of incidents in late May.","link":"https://www.oneidadispatch.com/2026/06/04/munnsville-man-arrested-in-two-separate-incidents/","image_url":"https://www.oneidadispatch.com/wp-content/uploads/migration/2021/01/7721d2eb18cfc1816bec6ec0f26a095a.jpg?w=1600&resize=1600,900","source_id":"oneidadispatch","pubDate":"2026-06-04 07:35:26","category":["crime"]},
  {"title":"29 Arrests, Nine Crime Groups Dismantled: Another Blow to Illegal Streaming","description":"International Operation KRATOS led by Europol dismantled illegal streaming networks, leading to 29 arrests and nine crime groups taken down. An international law enforcement operation, codenamed Opera","link":"https://www.itsecuritynews.info/29-arrests-nine-crime-groups-dismantled-another-blow-to-illegal-streaming/","image_url":"","source_id":"itsecuritynews_info","pubDate":"2026-06-04 07:34:43","category":["crime"]},
  {"title":"NYSP Investigating Serious Crash in Lansing","description":"ITHACA, N.Y. (WENY) — New York State police are investigating a serious crash involving a bicyclist in Tompkins County.","link":"https://www.indianagazette.com/news/state/nysp-investigating-serious-crash-in-lansing/article_6607ba67-7d91-5859-931b-a2318d5802d2.html","image_url":"","source_id":"indianagazette","pubDate":"2026-06-04 07:32:00","category":["crime"]}
];


// BOTH_SIDES_NOW news feeds (divergent keywords for bias distribution)
const BOTH_SIDES_DEMOCRAT_CACHE = [
  {title: "California governor pushes back on Trump", description: "Gov. Newsom criticizes Trump policies on immigration and environmental protection during press conference.", link: "https://example.com/dem1", image_url: "", source_id: "example", pubDate: "2026-05-28 01:00:00", category: ["top","politics"]},
  {title: "House Democrats announce bipartisan infrastructure bill", description: "Democrats reach across the aisle with compromise bill attracting Republican support.", link: "https://example.com/dem2", image_url: "", source_id: "example", pubDate: "2026-05-28 01:00:00", category: ["top","politics"]}
];

const BOTH_SIDES_REPUBLICAN_CACHE = [
  {title: "Trump announces economic stimulus package", description: "President unveils plan to boost American manufacturing and create 500K jobs.", link: "https://example.com/rep1", image_url: "", source_id: "example", pubDate: "2026-05-28 01:00:00", category: ["top","politics"]},
  {title: "Senate Republicans pass border security measure", description: "GOP-led bill advances immigration enforcement with Democratic concerns noted.", link: "https://example.com/rep2", image_url: "", source_id: "example", pubDate: "2026-05-28 01:00:00", category: ["top","politics"]}
];

// Utility function to get random article from cache
function getRandomArticle(cache) {
  if (!cache || cache.length === 0) return null;
  return cache[Math.floor(Math.random() * cache.length)];
}

// Populate news sections on page load
function populateNewsFeeds() {
  const demArticle = getRandomArticle(BOTH_SIDES_DEMOCRAT_CACHE);
  const repArticle = getRandomArticle(BOTH_SIDES_REPUBLICAN_CACHE);
  
  if (demArticle) {
    const demCard = document.querySelector('[data-feed="democrat"]');
    if (demCard) {
      demCard.innerHTML = `<a href="${demArticle.link}" target="_blank" class="news-card" style="border-left:4px solid #0066cc;"><h4>${demArticle.title}</h4><p>${demArticle.description}</p></a>`;
    }
  }
  
  if (repArticle) {
    const repCard = document.querySelector('[data-feed="republican"]');
    if (repCard) {
      repCard.innerHTML = `<a href="${repArticle.link}" target="_blank" class="news-card" style="border-left:4px solid #cc0000;"><h4>${repArticle.title}</h4><p>${repArticle.description}</p></a>`;
    }
  }
}

// Initialize is now handled by the news rendering block below

// =============================================
// NEWS RENDERING FUNCTIONS
// =============================================

let newsIndex = 0;

function getCatClass(cat) {
  if (!cat) return 'neutral';
  const c = Array.isArray(cat) ? cat[0] : cat;
  if (['politics','government','top'].includes(c)) return 'neutral';
  if (['crime','domestic'].includes(c)) return 'rep';
  return 'neutral';
}

function getCatLabel(cat) {
  if (!cat) return 'NEWS';
  const c = (Array.isArray(cat) ? cat[0] : cat).toUpperCase();
  const labels = {POLITICS:'POLITICS',CRIME:'CRIME',TOP:'TOP NEWS',DOMESTIC:'DOMESTIC',HEALTH:'HEALTH',BUSINESS:'BUSINESS'};
  return labels[c] || c;
}

function buildFeaturedCard(article) {
  const hasImg = article.image_url && article.image_url.trim();
  const catClass = getCatClass(article.category);
  const catLabel = getCatLabel(article.category);
  const desc = (article.description || '').replace(/ONLY AVAILABLE IN PAID PLANS/gi, '').trim().substring(0, 180);
  return `
    <a href="${article.link}" target="_blank" rel="noopener" class="news-card" style="display:block;text-decoration:none;color:inherit;height:360px;overflow:hidden;border-radius:8px;border-top:3px solid var(--gold);background:var(--card);position:relative;">
      ${hasImg ? `<img src="${article.image_url}" class="card-img" alt="" style="width:100%;height:200px;object-fit:cover;" onerror="this.style.display='none'">` : `<div style="height:200px;background:linear-gradient(135deg,#0f1a2e,#152035);display:flex;align-items:center;justify-content:center;"><i class='fas fa-newspaper' style='font-size:3rem;color:rgba(201,168,76,0.2)'></i></div>`}
      <div style="padding:16px;">
        <div class="card-cat-wrap"><span class="card-cat ${catClass}">${catLabel}</span></div>
        <h3 style="font-family:Oswald,sans-serif;font-size:1.1rem;color:#fff;margin:0 0 8px;line-height:1.3;">${article.title}</h3>
        ${desc ? `<p style="font-size:0.82rem;color:#8a9bb5;margin:0;line-height:1.5;">${desc}</p>` : ''}
      </div>
    </a>`;
}

function buildStackCard(article) {
  const hasImg = article.image_url && article.image_url.trim();
  return `
    <a href="${article.link}" target="_blank" rel="noopener" class="stack-card" style="display:flex;gap:12px;padding:12px;text-decoration:none;color:inherit;background:var(--card);border-radius:6px;margin-bottom:10px;border-left:3px solid var(--gold);">
      ${hasImg ? `<img src="${article.image_url}" style="width:70px;height:70px;object-fit:cover;border-radius:4px;flex-shrink:0;" onerror="this.style.display='none'">` : `<div style="width:70px;height:70px;background:#152035;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><i class='fas fa-newspaper' style='color:rgba(201,168,76,0.3)'></i></div>`}
      <div style="flex:1;min-width:0;">
        <p style="font-size:0.83rem;font-weight:600;color:#e0e6ef;line-height:1.3;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${article.title}</p>
        <span style="font-size:0.72rem;color:#556070;margin-top:4px;display:block;">${article.source_id || ''}</span>
      </div>
    </a>`;
}

function buildNewsCard(article) {
  const hasImg = article.image_url && article.image_url.trim();
  const catClass = getCatClass(article.category);
  const catLabel = getCatLabel(article.category);
  const desc = (article.description || '').replace(/ONLY AVAILABLE IN PAID PLANS/gi, '').trim().substring(0, 150);
  return `
    <a href="${article.link}" target="_blank" rel="noopener" class="news-card ${catClass}" style="display:block;text-decoration:none;color:inherit;border-radius:8px;overflow:hidden;background:var(--card);border-top:3px solid ${catClass==='rep'?'var(--red-rep)':'var(--gold)'};">
      ${hasImg ? `<img src="${article.image_url}" class="card-img" alt="" onerror="this.style.display='none'">` : `<div style="height:160px;background:linear-gradient(135deg,#0f1a2e,#152035);display:flex;align-items:center;justify-content:center;"><i class='fas fa-newspaper' style='font-size:2.5rem;color:rgba(201,168,76,0.2)'></i></div>`}
      <div class="card-body">
        <div class="card-cat-wrap"><span class="card-cat ${catClass}">${catLabel}</span></div>
        <h4 class="card-title" style="font-size:0.95rem;line-height:1.35;">${article.title}</h4>
        ${desc ? `<p class="card-desc">${desc}</p>` : ''}
      </div>
    </a>`;
}

function renderFeaturedSection() {
  const container = document.getElementById('featuredLayout');
  if (!container || !DAILY_NEWS_CACHE.length) return;
  
  const featured = DAILY_NEWS_CACHE[0];
  const stackItems = DAILY_NEWS_CACHE.slice(1, 4);
  
  container.innerHTML = buildFeaturedCard(featured) +
    '<div class="side-stack">' + stackItems.map(buildStackCard).join('') + '</div>';
  
  newsIndex = 4;
}

function renderNewsGrid() {
  const grid = document.getElementById('newsGrid');
  if (!grid || !DAILY_NEWS_CACHE.length) return;
  
  const items = DAILY_NEWS_CACHE.slice(newsIndex, newsIndex + 4);
  if (!items.length) {
    grid.innerHTML = '<p style="color:#8a9bb5;text-align:center;grid-column:1/-1;padding:20px;">No more stories available.</p>';
    return;
  }
  grid.innerHTML = items.map(buildNewsCard).join('');
  newsIndex += items.length;
}

function loadMoreNews() {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;
  const items = DAILY_NEWS_CACHE.slice(newsIndex, newsIndex + 4);
  if (!items.length) return;
  grid.innerHTML += items.map(buildNewsCard).join('');
  newsIndex += items.length;
}

function updateBreakingTicker() {
  const t1 = document.getElementById('ticker-text');
  const t2 = document.getElementById('ticker-text-dupe');
  if (!t1 || !DAILY_NEWS_CACHE.length) return;
  
  const headlines = DAILY_NEWS_CACHE.slice(0, 6).map(a => a.title).join('  ◆  ');
  t1.textContent = '◆  ' + headlines + '  ◆';
  if (t2) t2.textContent = t1.textContent;
  if (window.resetTickerWidth) window.resetTickerWidth();
}

// Initialize all news on page load
document.addEventListener('DOMContentLoaded', function() {
  renderFeaturedSection();
  renderNewsGrid();
  updateBreakingTicker();
  populateNewsFeeds();
});
