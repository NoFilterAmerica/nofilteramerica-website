// =============================================

// Open document in viewer — cross-device compatible (desktop + iOS)
function openDoc(e, url) {
  e.preventDefault();
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMobile = isIOS || /Android/.test(navigator.userAgent);

  // PDFs
  if (ext === 'pdf') {
    // Convert raw.githubusercontent.com URLs to a proxy-friendly URL
    // Google Docs Viewer and direct open both fail on raw GitHub URLs —
    // use a CORS-safe PDF.js CDN viewer instead
    const isRawGitHub = url.includes('raw.githubusercontent.com');
    if (isMobile) {
      // On mobile: use Google Docs Viewer (works reliably on Android/iOS Chrome)
      // For raw GitHub URLs, encode properly
      if (isRawGitHub) {
        window.open('https://docs.google.com/viewer?url=' + encodeURIComponent(url), '_blank');
      } else {
        window.open(url, '_blank');
      }
    } else {
      // Desktop: use Mozilla PDF.js viewer (no CORS issues, works with any URL)
      const pdfJsUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(url);
      showDocModal('<iframe src="' + pdfJsUrl + '" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>');
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
// NEWS_CACHE_LAST_UPDATED: 2026-05-18 13:03:35 UTC
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
  {title: "Whisman convincingly wins 6th District magistrate Democratic nod", description: "Sixth District Magistrate Eric Whisman convincingly won a crowded Democratic primary Tuesday. Whisman, who is seeking his second term on the court, was the only fiscal court member in a [...]", link: "https://state-journal.com/2026/05/19/whisman-convincingly-wins-6th-district-magistrate-democratic-nod/", image_url: "https://state-journal.com/wp-content/uploads/sites/22/2026/05/Franklin-County-Magistrate-Eric-Whisman-6th-District-talks-Cathy-Lindsey-director-of-marketin.jpg", source_id: "state_journal", pubDate: "2026-05-20 01:01:00", category: ["top"]},
  {title: "Mikesell, Keiko", description: "Keiko (Carrie) Mikesell passed away peacefully on September 4, 2025 in Garden City, Idaho. We want to honor her and celebrate her life. Family and friends are invited to join us on May 30th at 10am at", link: "https://magicvalley.com/obituaries/article_3719abef-0987-5b0c-871f-78604546545a.html", image_url: "", source_id: "magicvalley", pubDate: "2026-05-20 01:00:31", category: ["top"]},
  {title: "Sutton, Gary", description: "ONLY AVAILABLE IN PAID PLANS", link: "https://columbustelegram.com/obituaries/article_4c116bf9-fee7-59c7-96e2-c3d66ae6087a.html", image_url: "", source_id: "columbustelegram", pubDate: "2026-05-20 01:00:10", category: ["top"]},
  {title: "In Georgia, Republican primary for governor goes to a runoff between Trump backers", description: "People wait in a line at a precinct before voting during a Georgia primary. Brynn Anderson/AP hide caption toggle caption Brynn Anderson/AP The race for the Republican nomination for Georgia governor", link: "https://newspub.live/south/georgia/in-georgia-republican-primary-for-governor-goes-to-a-runoff-between-trump-backers/", image_url: "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/6000x3375+0+313/resize/1400/quality/85/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F6e%2F7e%2F036441904ee5849f096969f2ce8f%2Fap26139464634089.jpg", source_id: "newspub_live", pubDate: "2026-05-20 01:00:06", category: ["top"]},
  {title: "Multiple local elections decided Tuesday", description: "Primary Election Day in Kentucky has concluded, and a number of local races have been decided, including those for Grayson County Clerk, Grayson County Sheriff, and the 3rd and 4th district magistrate", link: "https://www.messenger-inquirer.com/grayson_county/news/multiple-local-elections-decided-tuesday/article_923e30ea-79d6-5036-8299-dc45f46e45fb.html", image_url: "https://bloximages.chicago2.vip.townnews.com/messenger-inquirer.com/content/tncms/assets/v3/editorial/6/1e/61ec27ac-d55a-59b8-b11e-63110bb42ceb/6a0d07b2ee06a.image.jpg?crop=1402%2C737%2C0%2C147&resize=1200%2C631&order=crop%2Cresize", source_id: "messenger_inquirer", pubDate: "2026-05-20 01:00:00", category: ["top"]},
  {title: "Primary Election Results (Greenup County)", description: "ONLY AVAILABLE IN PAID PLANS", link: "https://www.dailyindependent.com/news/primary-election-results-greenup-county/article_da6b5e1f-7574-4b18-8fe5-77fef7e07b3c.html", image_url: "https://bloximages.chicago2.vip.townnews.com/dailyindependent.com/content/tncms/custom/image/9734531e-73c5-11e7-88f6-4bc49c7f448b.jpg", source_id: "dailyindependent", pubDate: "2026-05-20 01:00:00", category: ["top"]},
  {title: "Police: Bicyclist taken to hospital after crash near Flamingo, Maryland", description: "Las Vegas police say a bicyclist was taken to the hospital in stable condition after a crash with a truck near Flamingo Road and Maryland Parkway. Maryland Parkway is closed between Flamingo and Cotta", link: "https://www.fox5vegas.com/2026/05/20/police-bicyclist-taken-hospital-after-crash-near-flamingo-maryland/", image_url: "https://gray-kvvu-prod.gtv-cdn.com/resizer/v2/LTN25KCY2BFV5E4B5XY2M27CSI.png?auth=84a9ca2cb2aff94907940ee6643a4846c91f77c8818fc9a36b1be6327ebb18fd&width=1200&height=600&smart=true", source_id: "fox5vegas", pubDate: "2026-05-20 01:00:54", category: ["top"]},
  {title: "Gabbie Gonzalez: FBI Seized Phones, Electronics in 2022 Hawaii Raid, On Video", description: "Federal agents tore through Gabbie Gonzalez\'s home to search phones, SD cards, and Apple devices during an raid connected to the alleged murder-for-hire plot to kill Jack Avery ... and TMZ has obtaine", link: "https://www.tmz.com/2026/05/19/gabbie-gonzalez-hawaii-fbi-raid/", image_url: "https://imagez.tmz.com/image/52/4by3/2026/05/19/52ae224e8a93422ebc4cd376dfc99f26_xl.jpg", source_id: "tmz", pubDate: "2026-05-20 01:00:32", category: ["top"]},
  {title: "Single-vehicle crash leads to one dead", description: "A single-vehicle crash on Thursday, May 14, left one woman dead in the early morning hours. The Mississippi Highway Patrol responded to the incident on Interstate 59 in Pearl [...]", link: "https://picayuneitem.com/2026/05/single-vehicle-crash-leads-to-one-dead/", image_url: "https://picayuneitem.com/wp-content/themes/2024-picayune-child/media/img/brand/default-logo.png", source_id: "picayuneitem", pubDate: "2026-05-20 01:00:00", category: ["top"]},
  {title: "On Hayden Manis\' 11th birthday, prosecutor \'leaning toward\' criminal charges in boy\'s disappearance", description: "While Hayden is still missing and now feared dead, the prosecutor says investigators did learn more information that could result in criminal charges.", link: "https://www.wthr.com/article/news/investigations/13-investigates/hayden-manis-disappearance-muncie-prosecutor-criminal-charges-13-investigates/531-113f107b-7925-4c6c-b9b1-c4eade7eeed8", image_url: "", source_id: "wthr", pubDate: "2026-05-20 01:00:00", category: ["top"]},
  {title: "Trump administration gives green light for use of \'cyanide bombs\' on US soil", description: "Sodium cyanide is a highly toxic compound that can be fatal if inhaled, swallowed or absorbed through the skin", link: "https://www.express.co.uk/news/us/2207472/trump-administration-cyanide-bombs-us", image_url: "https://cdn.images.express.co.uk/img/dynamic/198/590x/2207472_1.jpg", source_id: "expresscouk", pubDate: "2026-05-20 01:01:00", category: ["top"]},
  {title: "Whisman convincingly wins 6th District magistrate Democratic nod", description: "Sixth District Magistrate Eric Whisman convincingly won a crowded Democratic primary Tuesday. Whisman, who is seeking his second term on the court, was the only fiscal court member in a [...]", link: "https://state-journal.com/2026/05/19/whisman-convincingly-wins-6th-district-magistrate-democratic-nod/", image_url: "https://state-journal.com/wp-content/uploads/sites/22/2026/05/Franklin-County-Magistrate-Eric-Whisman-6th-District-talks-Cathy-Lindsey-director-of-marketin.jpg", source_id: "state_journal", pubDate: "2026-05-20 01:01:00", category: ["top"]},
  {title: "Oscar-nominated filmmaker disappointed his AI girlfriend dumped him", description: "Oscar-nominated screenwriter Paul Schrader went viral for a Facebook post revealing he had \"procured an online AI girlfriend\" who ultimately called it quits.", link: "https://www.foxnews.com/media/oscar-nominated-filmmaker-disappointed-his-ai-girlfriend-dumped-him", image_url: "https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2026/05/931/523/paul-schrader-2024.jpg?ve=1&tl=1", source_id: "foxnews", pubDate: "2026-05-20 01:00:59", category: ["top"]},
  {title: "Police: Bicyclist taken to hospital after crash near Flamingo, Maryland", description: "Las Vegas police say a bicyclist was taken to the hospital in stable condition after a crash with a truck near Flamingo Road and Maryland Parkway. Maryland Parkway is closed between Flamingo and Cotta", link: "https://www.fox5vegas.com/2026/05/20/police-bicyclist-taken-hospital-after-crash-near-flamingo-maryland/", image_url: "https://gray-kvvu-prod.gtv-cdn.com/resizer/v2/LTN25KCY2BFV5E4B5XY2M27CSI.png?auth=84a9ca2cb2aff94907940ee6643a4846c91f77c8818fc9a36b1be6327ebb18fd&width=1200&height=600&smart=true", source_id: "fox5vegas", pubDate: "2026-05-20 01:00:54", category: ["top"]},
  {title: "Brandin Podziemski returns to alma mater as keynote speaker after standout Warriors season", description: "Golden State Warriors guard Brandin Podziemski is heading home to Greenfield this weekend to serve as the keynote speaker at St. John\'s Northwestern Academy — just five years after graduating.", link: "https://www.tmj4.com/sports/brandin-podziemski-returns-to-alma-mater-as-keynote-speaker-after-standout-warriors-season", image_url: "https://ewscripps.brightspotcdn.com/dims4/default/f58abcc/2147483647/strip/true/crop/4200x2205+0+298/resize/1200x630!/quality/90/?url=http%3A%2F%2Fewscripps-brightspot.s3.amazonaws.com%2F9e%2Fae%2Fc8ba553c45ea80e3b8274997eafc%2Fap26103136989607.jpg", source_id: "tmj4", pubDate: "2026-05-20 01:00:46", category: ["top"]},
];
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
  // Step 1: Render cached/sample data IMMEDIATELY so the page never hangs on mobile
  const cached = getSampleStories();
  renderFeatured(cached.slice(0, 4));
  renderNewsCards(cached.slice(4, 10), false);

  // Set ticker with cached headlines right away
  const setTicker = (articles) => {
    if (articles.length > 0) {
      const headlines = articles.map(a => '▸ ' + a.title).join('   ·   ');
      const t1 = document.getElementById('ticker-text');
      const t2 = document.getElementById('ticker-text-dupe');
      if (t1) t1.textContent = headlines;
      if (t2) t2.textContent = headlines;
      if (window.resetTickerWidth) window.resetTickerWidth();
    }
  };
  setTicker(cached);

  // Render cached Both Sides immediately too
  renderBothSides(getSampleDemStories(), getSampleRepStories());

  // Step 2: Try live API in background — update page if it succeeds, silently skip if it fails/times out
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout — abort on slow mobile

    const res = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=us&language=en&category=politics,world,top&prioritydomain=top`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const data = await res.json();

    if (data.status === 'success' && data.results && data.results.length > 0) {
      nextPageCursor = data.nextPage || null;
      const blocked = ['sport','sports','entertainment','lifestyle','food'];
      const all = data.results;
      const filtered = all.filter(a => {
        const cats = (a.category || []).map(c => c.toLowerCase());
        return !cats.some(c => blocked.includes(c));
      });
      const articles = filtered.length >= 6 ? filtered : all;

      // Update UI with live data
      renderFeatured(articles.slice(0, 4));
      const moreArticles = articles.slice(4);
      const samples = getSampleStories();
      let gridArticles = moreArticles.length >= 6 ? moreArticles : [...moreArticles, ...samples.slice(0, 6 - moreArticles.length)];
      renderNewsCards(gridArticles.slice(0, 6), false);
      setTicker(articles);

      // Both Sides live update — also with timeout
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 8000);
      const [demRes, repRes] = await Promise.allSettled([
        fetch(`https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,top&q=healthcare OR climate OR immigration OR progressive OR democrats OR senate OR Biden OR voting rights&country=us&prioritydomain=top`, { signal: controller2.signal }),
        fetch(`https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en&category=politics,top&q=border security OR tax cuts OR second amendment OR republicans OR conservative OR Trump OR spending cuts OR election integrity&country=us&prioritydomain=top`, { signal: controller2.signal })
      ]);
      clearTimeout(timeout2);

      let demNews = getSampleDemStories();
      let repNews = getSampleRepStories();

      if (demRes.status === 'fulfilled') {
        const dd = await demRes.value.json().catch(() => null);
        if (dd && dd.status === 'success' && dd.results && dd.results.length > 0) {
          const rightSources = ['foxnews','breitbart','dailywire','oann','theblaze','nypost','washingtonexaminer'];
          const df = dd.results.filter(a => !rightSources.some(s => (a.source_id||'').toLowerCase().includes(s)));
          demNews = (df.length >= 3 ? df : dd.results).slice(0, 4);
        }
      }
      if (repRes.status === 'fulfilled') {
        const rd = await repRes.value.json().catch(() => null);
        if (rd && rd.status === 'success' && rd.results && rd.results.length > 0) {
          const leftSources = ['nytimes','washingtonpost','nbcnews','cnn','msnbc','apnews','politico'];
          const rf = rd.results.filter(a => !leftSources.some(s => (a.source_id||'').toLowerCase().includes(s)));
          repNews = (rf.length >= 3 ? rf : rd.results).slice(0, 4);
        }
      }
      renderBothSides(demNews, repNews);
    }
  } catch(e) {
    // API failed or timed out — cached data already displayed, nothing to do
    console.log('Live news update skipped:', e.message);
  }
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
    const youtubeUrl = vid.video_url || '';
    const youtubeId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || '';

    slot.innerHTML = `
      <div class="nfz-thumb" style="${thumb ? 'background-image:url(' + thumb + ');background-size:cover;background-position:center top;' : 'background:linear-gradient(135deg,#1a0a0a,#2d0a0a);'}">
        ${!thumb ? '<i class="fas fa-gavel" style="font-size:3rem;color:var(--gold);position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);opacity:0.4;"></i>' : ''}
        <div class="nfz-overlay">
          <span class="nfz-watch-badge"><i class="fab fa-youtube" style="color:#ff0000;"></i> WATCH ON YOUTUBE</span>
        </div>
      </div>
      <div class="nfz-info">
        <div class="nfz-title">${vid.title || 'Case File ' + (idx+1)}</div>
        ${vid.description ? '<div class="nfz-desc">' + vid.description + '</div>' : ''}
        ${youtubeUrl ? '<a href="' + youtubeUrl + '" target="_blank" class="nfz-link"><i class="fab fa-youtube" style="color:#ff0000;"></i> Watch on YouTube</a>' : ''}
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

// ============================================================
// NFA INVESTIGATIONS — PUBLIC RENDERING
// ============================================================
const INV_API = 'https://nofilteramerica-admin.netlify.app/.netlify/functions/videos';

async function renderInvestigationsGrid() {
  const container = document.getElementById('invGrid');
  if (!container) return;

  let investigations = [];
  try {
    const res = await fetch(INV_API + '?action=list&section=investigations');
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      investigations = data.data.filter(i => i && i.title && i.status !== 'draft' && i.status !== 'archived' && i.id !== 'inv_template_nfa');
    }
  } catch(e) { investigations = []; }

  if (investigations.length === 0) {
    container.innerHTML = `<div class="inv-empty"><i class="fas fa-search"></i><h3>INVESTIGATIONS COMING SOON</h3><p style="margin-top:12px;font-size:14px;color:rgba(255,255,255,0.3);">The first case files are being prepared. Check back soon.</p></div>`;
    return;
  }

  const statusLabel = { active:'🔴 ACTIVE', developing:'🟠 DEVELOPING', ongoing:'🔵 ONGOING', updated:'⭐ UPDATED', archived:'⬛ ARCHIVED' };

  container.innerHTML = investigations.map(inv => {
    const thumb = inv.cover_url || '';
    const status = inv.status || 'active';
    const date = inv.updated ? new Date(inv.updated).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : '';
    return `
      <a href="investigation.html?id=${inv.id}" class="inv-card" style="text-decoration:none;">
        <div class="inv-card-thumb" style="${thumb ? 'background-image:url('+thumb+');background-size:cover;background-position:center;' : ''}">
          ${!thumb ? '<div class="inv-card-thumb-placeholder"><i class="fas fa-search" style="font-size:2.5rem;color:var(--gold);opacity:0.35;"></i></div>' : ''}
          <span class="inv-status-badge ${status}">${statusLabel[status] || status.toUpperCase()}</span>
        </div>
        <div class="inv-card-body">
          <div class="inv-card-title">${inv.title}</div>
          ${inv.summary ? `<div class="inv-card-summary">${inv.summary}</div>` : ''}
          <div class="inv-card-meta">
            <span>${date}</span>
            <span class="inv-card-cta">READ CASE FILE →</span>
          </div>
        </div>
      </a>`;
  }).join('');
}

async function renderInvestigationPage() {
  const container = document.getElementById('invPage');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:60px;">No investigation ID provided.</p>'; return; }

  try {
    const res = await fetch(INV_API + '?action=get&section=investigations&id=' + id);
    const data = await res.json();
    if (!data.ok || !data.data) throw new Error('Investigation not found');
    const inv = data.data;

    const statusLabel = { active:'🔴 ACTIVE', developing:'🟠 DEVELOPING', ongoing:'🔵 ONGOING', updated:'⭐ UPDATED', archived:'⬛ ARCHIVED' };
    const statusClass = inv.status || 'active';
    const date = inv.updated ? new Date(inv.updated).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) : '';

    // Update page title
    document.title = inv.title + ' – NFA Investigations | No Filter America';

    let html = `
      <a href="investigations.html" class="inv-back-btn"><i class="fas fa-arrow-left"></i> BACK TO INVESTIGATIONS</a>
      <div class="inv-page-header">
        <div class="inv-page-status"><span class="inv-status-badge ${statusClass}">${statusLabel[statusClass] || statusClass.toUpperCase()}</span></div>
        <h1 class="inv-page-title">${inv.title}</h1>
        <div class="inv-page-meta">NFA INVESTIGATIONS · ${date}${inv.status ? ' · STATUS: ' + (statusLabel[inv.status]||inv.status).toUpperCase() : ''}</div>
      </div>`;

    // Cover image
    if (inv.cover_url) {
      html += `<img src="${inv.cover_url}" alt="${inv.title}" style="width:100%;max-height:420px;object-fit:cover;border-radius:8px;margin-bottom:40px;border:1px solid var(--border);"/>`;
    }

    // Key Findings
    if (inv.findings && inv.findings.length > 0) {
      html += `<div class="inv-section-label"><i class="fas fa-exclamation-triangle"></i> KEY FINDINGS</div>
        <div class="inv-findings" style="margin-bottom:40px;">
          ${inv.findings.map((f,i) => `<div class="inv-finding-item"><div class="inv-finding-num">${i+1}</div><div>${f}</div></div>`).join('')}
        </div>`;
    }

    // Full Story
    if (inv.story) {
      html += `<div class="inv-section-label"><i class="fas fa-file-alt"></i> FULL INVESTIGATION</div>
        <div class="inv-story-box">
          <div class="inv-story-content">${inv.story.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}</div>
        </div>`;
    }

    // Timeline
    if (inv.timeline && inv.timeline.length > 0) {
      html += `<div class="inv-section-label"><i class="fas fa-history"></i> TIMELINE OF EVENTS</div>
        <div class="inv-timeline" style="margin-bottom:40px;">
          ${inv.timeline.map(t => `<div class="inv-timeline-item"><div class="inv-timeline-date">${t.date}</div><div class="inv-timeline-event">${t.event}</div></div>`).join('')}
        </div>`;
    }

    // Documents — always render section
    {
      const docIcon = (type) => {
        if (!type) return 'fa-file';
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('image')) return 'fa-file-image';
        if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
        return 'fa-file-alt';
      };
      const docClass = (type) => {
        if (!type) return 'inv-doc-other';
        if (type.includes('pdf')) return 'inv-doc-pdf';
        if (type.includes('image')) return 'inv-doc-img';
        if (type.includes('word') || type.includes('doc')) return 'inv-doc-doc';
        return 'inv-doc-other';
      };
      const docs = inv.documents || [];
      html += `<div class="inv-section-label"><i class="fas fa-folder-open"></i> EVIDENCE & DOCUMENTS</div>
        <div class="inv-docs-grid" style="margin-bottom:40px;">
          ${docs.length > 0
            ? docs.map(d => `
            <a href="${d.url}" target="_blank" rel="noopener noreferrer" onclick="openDoc(event, '${d.url}')" class="inv-doc-item ${docClass(d.type)}">
              <i class="fas ${docIcon(d.type)}" style="font-size:2rem;"></i>
              <div class="doc-name">${d.name}</div>
              <div class="doc-type">${(d.type||'file').split('/').pop().toUpperCase()}</div>
            </a>`).join('')
            : `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;border:2px dashed rgba(197,160,70,0.2);border-radius:8px;color:rgba(255,255,255,0.25);font-family:'Oswald',sans-serif;letter-spacing:2px;font-size:13px;"><i class="fas fa-file-pdf" style="font-size:2.5rem;color:rgba(231,76,60,0.3);display:block;margin-bottom:14px;"></i>EVIDENCE DOCUMENTS PENDING<br><span style="font-size:11px;letter-spacing:1px;margin-top:8px;display:block;opacity:0.6;">Upload via Admin Panel</span></div>`
          }
        </div>`;
    }

    // TikTok references — always render section
    {
      const tiktoks = inv.tiktoks || [];
      html += `<div class="inv-section-label"><i class="fab fa-tiktok"></i> TIKTOK REFERENCES</div>
        <div class="inv-tiktok-list" style="margin-bottom:40px;">
          ${tiktoks.length > 0
            ? tiktoks.map((url, i) => `
            <a href="${url}" target="_blank" rel="noopener" class="inv-tiktok-item">
              <i class="fab fa-tiktok"></i>
              <span>TikTok Reference ${i+1} — Watch Clip</span>
              <i class="fas fa-external-link-alt" style="margin-left:auto;font-size:11px;opacity:0.4;"></i>
            </a>`).join('')
            : `<div style="display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.03);border:1px dashed rgba(197,160,70,0.15);border-radius:8px;padding:18px 20px;color:rgba(255,255,255,0.2);font-size:13px;font-family:'Oswald',sans-serif;letter-spacing:1px;"><i class="fab fa-tiktok" style="font-size:1.4rem;opacity:0.3;"></i>NO TIKTOK CLIPS LINKED YET</div>`
          }
        </div>`;
    }

    // Sources
    if (inv.sources && inv.sources.length > 0) {
      const srcClass = { primary:'inv-source-primary', govt:'inv-source-govt', news:'inv-source-news', social:'inv-source-social', unverified:'inv-source-unverified' };
      const srcLabel = { primary:'PRIMARY SOURCE', govt:'GOV\'T DOCUMENT', news:'NEWS ARTICLE', social:'SOCIAL MEDIA', unverified:'UNVERIFIED' };
      html += `<div class="inv-section-label"><i class="fas fa-link"></i> SOURCE CREDIBILITY</div>
        <div class="inv-sources-list">
          ${inv.sources.map(s => `
            <div class="inv-source-item">
              <span class="inv-source-badge ${srcClass[s.type]||'inv-source-news'}">${srcLabel[s.type]||s.type.toUpperCase()}</span>
              <div class="inv-source-text">${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>` : s.label}</div>
            </div>`).join('')}
        </div>`;
    }

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<div style="text-align:center;padding:80px 30px;"><i class="fas fa-exclamation-circle" style="font-size:3rem;color:var(--gold);opacity:0.4;margin-bottom:20px;display:block;"></i><p style="color:var(--gray);">Case file not found or could not be loaded.</p><a href="investigations.html" style="color:var(--gold);margin-top:16px;display:inline-block;">← Back to Investigations</a></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('invGrid')) renderInvestigationsGrid();
  if (document.getElementById('invPage')) renderInvestigationPage();
});


const newsCache = {
  "politics": [
    {
      "article_id": "12d148e690c993746d7306320e9ac89e",
      "link": "https://www.kvue.com/article/news/nation-world/britney-spears-dui-stop-police-report/507-11747941-3fb7-4b62-8e7e-9c2a6e767560",
      "title": "Britney Spears was 'confrontational' and 'flamboyant' but tested low for alcohol during DUI stop",
      "description": "The singer refused to get out of her vehicle for 10 minutes, according to the California Highway Patrol.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": [
        "andrew dalton (associated press)"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "politics",
        "entertainment"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:28",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:04:38",
      "image_url": "https://media.kvue.com/assets/CCT/images/f1e48e5a-b6c4-4d3b-87ad-f9f733e4ea88/20260407T153909/f1e48e5a-b6c4-4d3b-87ad-f9f733e4ea88_1920x1080.jpg",
      "video_url": null,
      "source_id": "kvue",
      "source_name": "Kvue",
      "source_priority": 24029,
      "source_url": "https://www.kvue.com",
      "source_icon": "https://n.bytvi.com/kvue.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "dc2148e683a3bdc39ceda3b839a83950",
      "link": "https://www.12news.com/article/news/nation-world/britney-spears-dui-stop-police-report/507-11747941-3fb7-4b62-8e7e-9c2a6e767560",
      "title": "Britney Spears was 'confrontational' and 'flamboyant' but tested low for alcohol during DUI stop",
      "description": "The singer refused to get out of her vehicle for 10 minutes, according to the California Highway Patrol.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": [
        "andrew dalton (associated press)"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "politics",
        "entertainment"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:28",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:59:57",
      "image_url": "https://media.12news.com/assets/CCT/images/f7febb6e-cd48-4bf4-a9f4-3887a2692072/20260523T005634/f7febb6e-cd48-4bf4-a9f4-3887a2692072_1920x1080.jpg",
      "video_url": null,
      "source_id": "a12news",
      "source_name": "12news",
      "source_priority": 24546,
      "source_url": "https://www.12news.com",
      "source_icon": "https://n.bytvi.com/a12news.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "d5908d9f00f157773fe0b74bff6cffb0",
      "link": "https://www.wgrz.com/article/news/nation-world/britney-spears-dui-stop-police-report/507-11747941-3fb7-4b62-8e7e-9c2a6e767560",
      "title": "Britney Spears was 'confrontational' and 'flamboyant' but tested low for alcohol during DUI stop",
      "description": "The singer refused to get out of her vehicle for 10 minutes, according to the California Highway Patrol.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": [
        "andrew dalton (associated press)"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "politics",
        "entertainment"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:28",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:10:32",
      "image_url": "https://media.wgrz.com/assets/WGRZ/images/fabf7afd-d384-4c0e-89a3-09caa88c734e/20260403T201310/fabf7afd-d384-4c0e-89a3-09caa88c734e_1920x1080.jpg",
      "video_url": null,
      "source_id": "wgrz",
      "source_name": "Buffalo",
      "source_priority": 154114,
      "source_url": "https://www.wgrz.com",
      "source_icon": "https://n.bytvi.com/wgrz.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "4ceda817030fc2d1e3f42dd4d3b5e241",
      "link": "https://www.khou.com/article/news/nation-world/britney-spears-dui-stop-police-report/507-11747941-3fb7-4b62-8e7e-9c2a6e767560",
      "title": "Britney Spears was 'confrontational' and 'flamboyant' but tested low for alcohol during DUI stop",
      "description": "The singer refused to get out of her vehicle for 10 minutes, according to the California Highway Patrol.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "politics",
        "entertainment"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:28",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:34:14",
      "image_url": null,
      "video_url": null,
      "source_id": "khou",
      "source_name": "Khou",
      "source_priority": 14652,
      "source_url": "https://www.khou.com",
      "source_icon": "https://n.bytvi.com/khou.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "e79f870d620206b2578865485bbb2732",
      "link": "https://www.kens5.com/article/news/nation-world/britney-spears-dui-stop-police-report/507-11747941-3fb7-4b62-8e7e-9c2a6e767560",
      "title": "Britney Spears was 'confrontational' and 'flamboyant' but tested low for alcohol during DUI stop",
      "description": "The singer refused to get out of her vehicle for 10 minutes, according to the California Highway Patrol.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "politics",
        "entertainment"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:28",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:36:19",
      "image_url": null,
      "video_url": null,
      "source_id": "kens5",
      "source_name": "Kens5.com",
      "source_priority": 34349,
      "source_url": "https://www.kens5.com",
      "source_icon": "https://n.bytvi.com/kens5.jpeg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "6d32077f93792b30c8ef1b588920757c",
      "link": "https://townhall.com/tipsheet/scott-mcclallen/2026/05/22/man-bilked-taxpayers-for-20-years-out-of-283k-by-stealing-dead-boys-identity-n2676560",
      "title": "Man Allegedly Bilked Taxpayers for 20 Years Out of $283k by Stealing Dead Boy's Identity",
      "description": "After a three-day trial, a federal jury sitting in Pocatello, Idaho found a man whose identity remains unknown guilty of...",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "snap",
        "doj",
        "social security",
        "medicaid",
        "crime"
      ],
      "creator": [
        "scott mcclallen"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "politics"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:27",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:03:45",
      "image_url": "https://media.townhall.com/cdn/hodl/2026/110/1fdc0ce6-0bc3-4b54-98e2-7f2c363e5ccb-1200x630.jpg",
      "video_url": null,
      "source_id": "townhall",
      "source_name": "Townhall",
      "source_priority": 13454,
      "source_url": "https://townhall.com",
      "source_icon": null,
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "3ff021a66069989f69ad9bef7d4a87cb",
      "link": "https://nwitimes.com/obituaries/article_9385c795-4d27-5b7c-8a3d-517c36abfb2b.html",
      "title": "Szafranski, Joseph",
      "description": null,
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "politics",
        "top"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:16",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 04:30:16",
      "image_url": null,
      "video_url": null,
      "source_id": "nwitimes",
      "source_name": "The Times Of Northwest Indiana | Breaking News | R",
      "source_priority": 10623,
      "source_url": "https://www.nwitimes.com",
      "source_icon": "https://n.bytvi.com/nwitimes.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "7e19dc7bc8b5f61e8ecfe442de73f34a",
      "link": "https://www.wsj.com/politics/policy/david-sacks-trump-ai-executive-order-6019242d",
      "title": "President Trump postponed signing an order on the dangers of artificial intelligence, heeding an adviser\u2019s warning that industry guardrails could slow down U.S. models in the race with tools from China",
      "description": "President Trump postponed signing an order on the dangers posed by artificial intelligence after an adviser warned that industry guardrails could slow down U.S. models in the race against tools from China.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "china",
        "united states of america"
      ],
      "category": [
        "politics"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:32:20",
      "image_url": null,
      "video_url": null,
      "source_id": "wsj",
      "source_name": "Wsj",
      "source_priority": 311,
      "source_url": "http://www.wsj.com",
      "source_icon": "https://n.bytvi.com/wsj.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "203169bf1b236c971fe7fbcdca5b0767",
      "link": "https://www.crescent-news.com/opinion/opinion_columnists/star-parker---democratic-control-means-redefining-america/article_96d2062e-c107-4ee2-8342-7c06b166f395.html",
      "title": "Star Parker - Democratic control means redefining America",
      "description": "Per USA Today columnist Chris Brennan, the Rededicate 250 event, held on the National Mall to rededicate our country as One Nation Under God, violated both our national spirit and our Constitution.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "politics and race",
        "corporation",
        "dan caine",
        "religion",
        "human pregnancy",
        "murder of george floyd",
        "arab\u2013israeli conflict",
        "due process clause",
        "poverty",
        "child",
        "hezbollah",
        "political law",
        "courts",
        "society of the united states",
        "democracy in america",
        "donald trump controversies",
        "presidencies of the united states",
        "zohran mamdani",
        "business roundtable",
        "good and evil"
      ],
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "politics"
      ],
      "datatype": "opinion",
      "pubDate": "2026-05-23 01:00:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 06:02:39",
      "image_url": "https://bloximages.newyork1.vip.townnews.com/crescent-news.com/content/tncms/assets/v3/editorial/4/d8/4d8068de-baa9-5e2b-b4d9-361e7cb6518a/5f0fedd2ee869.image.jpg?crop=200%2C200%2C0%2C75",
      "video_url": null,
      "source_id": "crescentnews",
      "source_name": "Crescent-news",
      "source_priority": 529263,
      "source_url": "https://www.crescent-news.com",
      "source_icon": "https://n.bytvi.com/crescentnews.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "ee3be4e3dd86592c2be4b2bf2653785d",
      "link": "https://www.crescent-news.com/opinion/opinion_columnists/cal-thomas---being-wrong-means-never-having-to-say-sorry/article_a5c19c54-b789-443d-b138-db7c0384e802.html",
      "title": "Cal Thomas - Being wrong means never having to say \u2018sorry\u2019",
      "description": "It\u2019s so easy and comfortable being a liberal. You never have to admit you\u2019re wrong when you\u2019re demonstrably wrong.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "judaism and warfare",
        "secularism",
        "lymphoma",
        "national security",
        "mass media",
        "hezbollah",
        "social ethics",
        "society of the united states",
        "energy and the environment",
        "presidencies of the united states",
        "gender dysphoria",
        "presidency of the united states",
        "alien and sedition acts",
        "abigail spanberger",
        "trump administration controversies",
        "new testament content",
        "george w. bush",
        "politics of israel",
        "personal income",
        "rainbow/push"
      ],
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "politics"
      ],
      "datatype": "opinion",
      "pubDate": "2026-05-23 01:00:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 06:02:39",
      "image_url": "https://bloximages.newyork1.vip.townnews.com/crescent-news.com/content/tncms/assets/v3/editorial/2/ec/2ec715ed-78bd-5f85-95ef-e565da83f889/5a733e709baa7.image.jpg?crop=200%2C200%2C0%2C75",
      "video_url": null,
      "source_id": "crescentnews",
      "source_name": "Crescent-news",
      "source_priority": 529263,
      "source_url": "https://www.crescent-news.com",
      "source_icon": "https://n.bytvi.com/crescentnews.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    }
  ],
  "crime": [
    {
      "article_id": "80df85d742e4da6b73f90ac7ce623911",
      "link": "https://www.kold.com/2026/05/23/hikers-warned-after-recent-rash-car-break-ins-telegraph-pass-east-yuma/",
      "title": "Hikers warned after recent rash of car break-ins at Telegraph Pass east of Yuma",
      "description": "The weather may be heating up, but that hasn\u2019t stopped people from hitting the trails at mountain parks and more remote areas of the state. In Yuma County, however, deputies say trailheads can also attract thieves.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "yuma news",
        "yuma county sheriff's office",
        "memorial day weekend",
        "phoenix news",
        "telegraph pass",
        "azfamily",
        "hiking trail thefts",
        "vehicle burglaries"
      ],
      "creator": [
        "kold"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "environment",
        "crime"
      ],
      "datatype": "multimedia",
      "pubDate": "2026-05-23 01:01:07",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 04:41:21",
      "image_url": "https://gray-kold-prod.gtv-cdn.com/resizer/v2/LG66BOF45RD4NO6QRWN3RWPZXM.png?auth=91dd5792be70a333a798cfebb8d9f0950b98510dff897a4519df3e784d38dd0d&width=1200&height=600&smart=true",
      "video_url": "https://d1l66zlxaqpl1u.cloudfront.net/wp-gray/azfamily/20260523/6a10f16fca617458d84631f7/file_1920x1080-5400-v4/file_1280x720-2000-v3_1.mp4",
      "source_id": "kold",
      "source_name": "Https://www.kold.com",
      "source_priority": 253037,
      "source_url": "https://www.kold.com",
      "source_icon": "https://n.bytvi.com/kold.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "6a65288f66d23e35844edf90448e87c2",
      "link": "https://www.carscoops.com/2026/05/camaro-z28-sebago-lake-discovery/",
      "title": "Lost A 1974 Camaro Z28 In Maine? Someone Found It 55 Feet Underwater",
      "description": "An underwater drone hunting for a sunken snowmobile in Maine pulled up something far older, rarer, and a lot more confusing",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "chevrolet videos",
        "chevrolet camaro",
        "chevrolet",
        "offbeat news",
        "usa",
        "video"
      ],
      "creator": [
        "brad anderson"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:08:41",
      "image_url": "https://www.carscoops.com/wp-content/uploads/2026/05/Chevrolet-Camaro-Z28-underwater-copy.jpg",
      "video_url": null,
      "source_id": "carscoops",
      "source_name": "Carscoops",
      "source_priority": 105136,
      "source_url": "https://www.carscoops.com",
      "source_icon": "https://n.bytvi.com/carscoops.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "13283860bb85768ec9871b9f8bb79d82",
      "link": "https://patch.com/new-jersey/paramus/man-masturbated-exposed-self-children-bergen-county-mall-police",
      "title": "Man Masturbated, Exposed Self To Children At Bergen County Mall: Police",
      "description": "Police were called to a mall in Bergen County after witnesses said a man masturbated while in line at Old Navy.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "new jersey",
        "crime",
        "safety",
        "paramus"
      ],
      "creator": [
        "caren lissner"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:58",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:01:53",
      "image_url": "https://patch.com/img/cdn20/users/23738927/20260522/085736/styles/patch_image/public/pd-car2-copy-3___22204832710.jpg",
      "video_url": null,
      "source_id": "patch",
      "source_name": "Patch",
      "source_priority": 5510,
      "source_url": "https://patch.com",
      "source_icon": "https://n.bytvi.com/patch.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "e57f9b4a8dcfb421638fb1c6a7932edf",
      "link": "https://www.klfy.com/louisiana/five-vehicle-collision-on-louisiana-hwy-27-results-in-fatality/",
      "title": "Five-vehicle collision on Louisiana Hwy 27 results in fatality",
      "description": "A multi-vehicle crash occurred on Louisiana Highway 27 near Louisiana Highway 384 in Cameron Parish on Thursday shortly after 6 p.m. The incident claimed the life of Danny Hillebrandt, 71, of Westlake, officials said.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:52",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:16:20",
      "image_url": null,
      "video_url": null,
      "source_id": "klfy",
      "source_name": "Klfy.com",
      "source_priority": 766991,
      "source_url": "https://www.klfy.com",
      "source_icon": "https://n.bytvi.com/klfy.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "e4feeb9523ef47129d0cc69ddb08fe36",
      "link": "https://www.clarksvilleonline.com/2026/05/22/clarksville-obituary-rebecca-suzanne-drenth/",
      "title": "Clarksville Obituary: Rebecca Suzanne Drenth",
      "description": "Clarksville, TN \u2013 A visitation for Rebecca Suzanne Drenth, 38, of Clarksville, TN will be May 27th, 2026 from 1:00pm until 3:00pm. Rebecca was born on July 29th, 1987 in Clarksville, TN. She passed away on May 20th, 2026. Rebecca was a creative and kind-hearted person who found joy in the little things. She loved [...] The post Clarksville Obituary: Rebecca Suzanne Drenth appeared first on Clarksville Online - Clarksville News, Sports, Events and Information .",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "clarksville",
        "clarksville obituary",
        "featured",
        "obituary",
        "clarksville tn",
        "sykes funeral home"
      ],
      "creator": [
        "news staff"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:47",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:16:30",
      "image_url": "https://www.clarksvilleonline.com/wp-content/uploads/2025/09/Candles.jpg",
      "video_url": null,
      "source_id": "clarksvilleonline",
      "source_name": "Clarksville Online",
      "source_priority": 806456,
      "source_url": "https://www.clarksvilleonline.com",
      "source_icon": "https://n.bytvi.com/ClarksvilleOnline.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "009df9fc037641ae1b1974e461c2f909",
      "link": "https://patch.com/california/napavalley/judgment-paris-5-things-we-think-we-know",
      "title": "Judgment of Paris: 5 Things We Think We Know",
      "description": "A list of five \"on second sip\" stories about the \"Judgment of Paris, the May 24, 1976 tasting whose legacy continue 50 years later.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "restaurants",
        "napa valley",
        "california",
        "bars"
      ],
      "creator": [
        "angela woodall"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:13",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:01:53",
      "image_url": "https://patch.com/img/cdn20/users/27173486/20260522/125930/styles/patch_image/public/img-3848___22005802517.jpg",
      "video_url": null,
      "source_id": "patch",
      "source_name": "Patch",
      "source_priority": 5510,
      "source_url": "https://patch.com",
      "source_icon": "https://n.bytvi.com/patch.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "2756e365bf7a58aeb5b6f9ad5e4c3dd6",
      "link": "https://www.kotatv.com/2026/05/23/two-students-expelled-spearfish-high-school-after-gun-brought-campus/",
      "title": "Two students expelled from Spearfish High School after gun brought on campus",
      "description": "The Spearfish School District says two students were expelled for 12 months after an investigation into a gun believed brought to Spearfish High School on May 5.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "kota territory",
        "spearfish school district expulsions",
        "gun brought to school may 5 spearfish",
        "south dakota school expulsion",
        "ongoing investigation spearfish police",
        "kota territory news",
        "spearfish students expelled 12 months",
        "no plan to harm spearfish high",
        "spearfish school safety investigation",
        "kota",
        "spearfish police weapon found off-campus",
        "kota tv",
        "black hills school gun report",
        "spearfish high school gun investigation"
      ],
      "creator": [
        "matt chibe"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "multimedia",
      "pubDate": "2026-05-23 01:00:13",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:18:00",
      "image_url": "https://gray-kota-prod.gtv-cdn.com/resizer/v2/WHUEEHNP6ZEL3CHF3QG7DRUPSA.jpg?auth=e9c01ad69a69467fc9180679f758e61a98a95a4d84bb434341dfcc3f8d0f422f&width=1200&height=600&smart=true",
      "video_url": "https://d1l66zlxaqpl1u.cloudfront.net/wp-gray/20260523/6a10fa201f4cb9048fa00280/t_a9d00cae5e9045a2a65636e25d9ec905_name_file_1920x1080_5400_v4_cropped/file_1280x720-2000-v3_1.mp4",
      "source_id": "kotatv",
      "source_name": "Https://www.kotatv.com",
      "source_priority": 936958,
      "source_url": "https://www.kotatv.com",
      "source_icon": "https://n.bytvi.com/kotatv.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "004d6174232812aaf712fbc011ca55e8",
      "link": "https://www.conwaydailysun.com/lifestyles/entertainment/deadliest-catch-fire-breaks-out-aboard-rick-shelford-s-aleutian-lady/article_971881fb-29a2-5e6b-9f76-4e9ec7504b22.html",
      "title": "\u2018Deadliest Catch\u2019: Fire Breaks Out Aboard Rick Shelford\u2019s Aleutian Lady",
      "description": "Plus, things get heated between members of Johnathan Hillstrand's team.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:11",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 05:22:41",
      "image_url": null,
      "video_url": null,
      "source_id": "conwaydailysun",
      "source_name": "Conwaydailysun",
      "source_priority": 90245,
      "source_url": "https://www.conwaydailysun.com",
      "source_icon": "https://n.bytvi.com/conwaydailysun.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "7a4acede53eacf642998ff55e6c39e68",
      "link": "https://carrollspaper.com/lifestyles/entertainment/deadliest-catch-fire-breaks-out-aboard-rick-shelford-s-aleutian-lady/article_42fdbd89-d54f-5be8-8dbe-96ba89227580.html",
      "title": "\u2018Deadliest Catch\u2019: Fire Breaks Out Aboard Rick Shelford\u2019s Aleutian Lady",
      "description": "Plus, things get heated between members of Johnathan Hillstrand's team.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:11",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 03:44:12",
      "image_url": null,
      "video_url": null,
      "source_id": "carrollspaper",
      "source_name": "Carrollspaper",
      "source_priority": 1047475,
      "source_url": "https://carrollspaper.com",
      "source_icon": "https://n.bytvi.com/carrollspaper.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "01167aae28d309efa6896cf35a07403e",
      "link": "https://www.shelbynews.com/lifestyles/entertainment/deadliest-catch-fire-breaks-out-aboard-rick-shelford-s-aleutian-lady/article_e7fafaf4-4652-5bab-a4b0-3823ff75d2ca.html",
      "title": "\u2018Deadliest Catch\u2019: Fire Breaks Out Aboard Rick Shelford\u2019s Aleutian Lady",
      "description": "Plus, things get heated between members of Johnathan Hillstrand's team.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "crime"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:00:11",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 11:12:09",
      "image_url": null,
      "video_url": null,
      "source_id": "shelbynews",
      "source_name": "Shelbynews Com",
      "source_priority": 143184,
      "source_url": "https://www.shelbynews.com",
      "source_icon": "https://n.bytvi.com/shelbynews.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    }
  ],
  "top": [
    {
      "article_id": "08affdc0c16850293ae94fd115820562",
      "link": "https://sports.yahoo.com/articles/softball-arcanum-bats-reign-d-010200714.html",
      "title": "Softball: Arcanum bats reign in D-V district title win over Williamsburg",
      "description": "May 22\u2014Four days of sitting in the dugout, watching the sky, getting to play a few innings, only to repeatedly be told you'll have to come back tomorrow could have weighed more on Arcanum. It did on the coaches. Mike Morris wanted another day to be able to prepare his squad for its next game in the district championship round. The players proved they were itching the whole time to just get a ...",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "jordyn garbig",
        "cam garbig",
        "arcanum",
        "mike morris",
        "williamsburg"
      ],
      "creator": [
        "steven wright",
        "ohio",
        "dayton daily news"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "breaking",
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:02:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:33:45",
      "image_url": "https://s.yimg.com/cv/apiv2/sports/share/PD_010626-Social_Share_GENRIC_YAHOO_SPORTS-1200x630.jpg",
      "video_url": null,
      "source_id": "yahoo",
      "source_name": "Yahoo! News",
      "source_priority": 17,
      "source_url": "https://news.yahoo.com",
      "source_icon": "https://n.bytvi.com/yahoo.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "c1de8526c316ec9c326de8ba786dfb4a",
      "link": "https://www.davisenterprise.com/sports/aggie-track-wraps-up-postseason-run/article_dc288f5e-9ca5-4d14-bc1c-0b2e8a4ae058.html",
      "title": "Aggie track wraps up postseason run",
      "description": "LONG BEACH \u2014 Earning the first NCAA regional qualification of her career, UC Davis junior long jumper Kylee Davis qualified for the 2026 NCAA West First Round in Fayetteville, Ark. Davis advanced to the national stage after capturing the individual...",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "track and field",
        "sport of athletics",
        "formula racing",
        "auto racing",
        "solo activities",
        "athletic sports",
        "sports",
        "games of physical skill",
        "formula racing series",
        "b1",
        "individual sports",
        "motorsport competitions",
        "052426",
        "motorsport",
        "fia world championships",
        "uc davis aggies",
        "motor racing competitions"
      ],
      "creator": [
        "enterprise staff"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:02:00",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 08:14:01",
      "image_url": "https://bloximages.chicago2.vip.townnews.com/davisenterprise.com/content/tncms/custom/image/86db99ca-ccc8-11ed-9099-0b776fc1e8b8.png?resize=600%2C315",
      "video_url": null,
      "source_id": "davisenterprise",
      "source_name": "Davis Enterprise",
      "source_priority": 98093,
      "source_url": "https://www.davisenterprise.com",
      "source_icon": "https://n.bytvi.com/davisenterprise.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "f8d3dfee987bb7d5b9af384ca0050248",
      "link": "https://sports.yahoo.com/articles/rams-qb-ty-simpson-details-010152991.html",
      "title": "Rams QB Ty Simpson Details Los Angeles \u2018Culture Shock\u2019",
      "description": "The Los Angeles Rams made quarterback Ty Simpson the talk of the 2026 NFL Draft by surprisingly taking him 13th overall.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "los angeles rams",
        "ty simpson",
        "los angeles",
        "nfl",
        "rams quarterback"
      ],
      "creator": [
        "megan armstrong"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "breaking",
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:52",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:33:45",
      "image_url": "https://s.yimg.com/ny/api/res/1.2/WQgCH3KRhxA.O.EptbMgyA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTIwNDg7aD0xMzY0O2NmPXdlYnA-/https://media.zenfs.com/en/newsweek_sports_200/b7b226ddfb63ed4f464baf3d77192baa",
      "video_url": null,
      "source_id": "yahoo",
      "source_name": "Yahoo! News",
      "source_priority": 17,
      "source_url": "https://news.yahoo.com",
      "source_icon": "https://n.bytvi.com/yahoo.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "4bb671cf2f9abb10751a8923d2300da8",
      "link": "https://deadspin.com/victor-wembanyama-a-unanimous-all-defensive-first-team-selection/",
      "title": "Victor Wembanyama a unanimous All-Defensive first-team selection",
      "description": "After being named the unanimous Defensive Player of the Year last month, dominant San Antonio Spurs superstar Victor Wembanyama was also the lone unan",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": [
        "field level media"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:52",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 05:34:28",
      "image_url": "https://lineup-publishing.s3.amazonaws.com/28661422.jpg",
      "video_url": null,
      "source_id": "deadspin",
      "source_name": "Deadspin",
      "source_priority": 22768,
      "source_url": "https://deadspin.com",
      "source_icon": "https://n.bytvi.com/deadspin.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "948c5eb555aa05213838eeb58715337a",
      "link": "https://www.newsweek.com/sports/nfl/rams-qb-ty-simpson-details-los-angeles-culture-shock-11985586",
      "title": "Rams QB Ty Simpson Details Los Angeles 'Culture Shock'",
      "description": "The Los Angeles Rams made quarterback Ty Simpson the talk of the 2026 NFL Draft by surprisingly taking him 13th overall.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "nfl",
        "alabama",
        "los angeles rams"
      ],
      "creator": [
        "megan armstrong"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:52",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:32:15",
      "image_url": "https://assets.newsweek.com/wp-content/uploads/2026/05/GettyImages-2272974812-e1779498064958.jpg?w=1600&h=900&q=88",
      "video_url": null,
      "source_id": "newsweek",
      "source_name": "Newsweek",
      "source_priority": 2129,
      "source_url": "https://www.newsweek.com",
      "source_icon": "https://n.bytvi.com/newsweek.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "9d340e45db12e248e509333df6a947f3",
      "link": "https://sports.yahoo.com/articles/pitt-stuns-fsu-baseball-8-010148019.html",
      "title": "Pitt stuns FSU baseball, 8-6, to knock Seminoles out of ACC Tournament",
      "description": "Down to his final strike and behind 6-5, Pitt\u2019s Kai Wagner hit a three-run home run to knock Florida State baseball out of the ACC Tournament.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "fsu",
        "seminoles",
        "kai wagner",
        "ninth inning",
        "fsu baseball",
        "pitt baseball",
        "chris knier",
        "ben barrett",
        "brodie purcell"
      ],
      "creator": [
        "tallahassee democrat",
        "liam rooney"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "breaking",
        "sports"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:48",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:33:45",
      "image_url": "https://s.yimg.com/ny/api/res/1.2/JbSTb2oW_G_12pwYzc0Z3Q--/YXBwaWQ9aGlnaGxhbmRlcjt3PTI0MDA7aD0xMzUwO2NmPXdlYnA-/https://media.zenfs.com/en/tallahassee-democrat/9e8489b4786532ce1540199b03298d74",
      "video_url": null,
      "source_id": "yahoo",
      "source_name": "Yahoo! News",
      "source_priority": 17,
      "source_url": "https://news.yahoo.com",
      "source_icon": "https://n.bytvi.com/yahoo.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "af897231d669ea605fe4e72a27760445",
      "link": "https://www.investing.com/news/insider-trading-news/slide-insurance-coo-lucas-shannon-sells-343279-in-company-stock-93CH-4707908",
      "title": "Slide insurance COO Lucas Shannon sells $343,279 in company stock",
      "description": null,
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": null,
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "business",
        "top"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:45",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:03:46",
      "image_url": null,
      "video_url": null,
      "source_id": "investing_us",
      "source_name": "Investing Us",
      "source_priority": 12473,
      "source_url": "https://www.investing.com",
      "source_icon": "https://n.bytvi.com/investing_us.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": true
    },
    {
      "article_id": "8845512f2254eb9e50a0d70479cfb56f",
      "link": "https://www.therooseveltreview.com/the-big-six-of-small-business/",
      "title": "The Big Six of Small Business",
      "description": "Dave, In your opinion, why do most small businesses fail? I\u2019d also be interested to know which business reports you believe are most valuable to a small business owner. Prater Prater, There are many different reasons why small businesses go under. But in my mind, most fail due to poor financial management relating to cash [...] The post The Big Six of Small Business appeared first on The Roosevelt Review .",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "the entreleadership podcast"
      ],
      "creator": [
        "quaylene parkey"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:42",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:22:31",
      "image_url": "https://i0.wp.com/www.therooseveltreview.com/wp-content/uploads/2019/03/Dave-Ramsey-1-e1582722599521.jpg?fit=2708%2C1956&ssl=1",
      "video_url": null,
      "source_id": "therooseveltreview",
      "source_name": "The Roosevelt Review",
      "source_priority": 5508617,
      "source_url": "https://www.therooseveltreview.com",
      "source_icon": null,
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "7fa1a30748ab47a7b486d46bfef58845",
      "link": "https://www.investing.com/news/insider-trading-news/slide-insurance-ceo-lucas-bruce-sells-347-million-in-shares-93CH-4707907",
      "title": "Slide insurance CEO Lucas Bruce sells $3.47 million in shares",
      "description": "Slide insurance CEO Lucas Bruce sells $3.47 million in shares",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": null,
      "creator": [
        "investing.com"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "business"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:35",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:03:46",
      "image_url": "https://i-invdn-com.investing.com/news/moved_LYNXNPEL3803O_L.jpg",
      "video_url": null,
      "source_id": "investing_us",
      "source_name": "Investing Us",
      "source_priority": 12473,
      "source_url": "https://www.investing.com",
      "source_icon": "https://n.bytvi.com/investing_us.jpg",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    },
    {
      "article_id": "e8183b36a491c8b54ceb4ff0cc39f300",
      "link": "https://patch.com/california/napavalley/judgment-paris-wines-power-shift-50-years-later",
      "title": "Judgment Of Paris: Wine's Power Shift 50 Years Later",
      "description": "The \"Judgment of Paris\" was a geopolitical event in food culture that still reverberates 50 years later.",
      "content": "ONLY AVAILABLE IN PAID PLANS",
      "keywords": [
        "corner",
        "community",
        "california",
        "napa valley"
      ],
      "creator": [
        "angela woodall"
      ],
      "language": "english",
      "country": [
        "united states of america"
      ],
      "category": [
        "top",
        "food"
      ],
      "datatype": "news",
      "pubDate": "2026-05-23 01:01:31",
      "pubDateTZ": "UTC",
      "fetched_at": "2026-05-23 01:01:53",
      "image_url": "https://patch.com/img/cdn20/users/27173486/20260522/090127/styles/patch_image/public/napajopwinemapj___22205819379.png",
      "video_url": null,
      "source_id": "patch",
      "source_name": "Patch",
      "source_priority": 5510,
      "source_url": "https://patch.com",
      "source_icon": "https://n.bytvi.com/patch.png",
      "sentiment": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "sentiment_stats": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_tag": "ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLANS",
      "ai_region": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_org": "ONLY AVAILABLE IN CORPORATE PLANS",
      "ai_summary": "ONLY AVAILABLE IN PAID PLANS",
      "duplicate": false
    }
  ],
  "last_updated": "2026-05-23T13:02:00.425052Z"
};