// =============================================

// Open document in viewer — prevents forced download
function openDoc(e, url) {
  e.preventDefault();
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  // PDFs: use Google Docs viewer for inline viewing
  if (ext === 'pdf') {
    window.open('https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true', '_blank');
    return;
  }
  // Images: open lightbox overlay
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = '<img src="'+url+'" style="max-width:92vw;max-height:90vh;border-radius:6px;box-shadow:0 0 40px rgba(0,0,0,0.8);"/><button style="position:absolute;top:20px;right:28px;background:none;border:none;color:#fff;font-size:2.2rem;cursor:pointer;opacity:0.8;" onclick="this.parentNode.remove()">✕</button>';
    overlay.onclick = function(ev){ if(ev.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    return;
  }
  // All other file types — just open in new tab
  window.open(url, '_blank');
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
  {title: "GOP caucus May 31 to fill county council seat", description: "PRINCETON — Gibson County Republican Party precinct committee chairs from precincts within the Gibson County Council District 2 boundaries will caucus at 9 a.m. May 30 at Dick Clark\'s Family Restaurant in Princeton to fill the remaining term of the...", link: "https://www.pdclarion.com/news/gop-caucus-may-31-to-fill-county-council-seat/article_076bcd8b-6c9f-5eb2-add5-ca3c4d85c39a.html", image_url: "https://bloximages.chicago2.vip.townnews.com/pdclarion.com/content/tncms/custom/image/0bba6ddc-4f9a-11e6-9108-23de2f8f3dcb.png?crop=100%2C100%2C162%2C0&resize=200%2C200&order=crop%2Cresize", source_id: "pdclarion", pubDate: "2026-05-18 01:03:00", category: ["politics"]},
  {title: "Revolutionary War memorial convoy coming through Colonie on May 20", description: "COLONIE — A special convoy carrying the remains of 44 Revolutionary War soldiers will pass through Colonie on May 20 between 10-10:20 a.m.", link: "https://www.dailygazette.com/spotlightnews/revolutionary-war-memorial-convoy-coming-through-colonie-on-may-20/article_95253d50-894d-4ea6-a337-a9dcb8d2ae07.html", image_url: "https://bloximages.chicago2.vip.townnews.com/dailygazette.com/content/tncms/assets/v3/editorial/9/47/9472e054-0d80-4d87-8535-cd6f65f8dbfd/6a0a6600e37a7.image.jpg?crop=1920%2C1008%2C48%2C0&resize=1200%2C630&order=crop%2Cresize", source_id: "dailygazette", pubDate: "2026-05-18 01:03:00", category: ["top"]},
  {title: "Detectives investigating fatal shooting in a St. Nicholas neighborhood", description: "", link: "https://www.actionnewsjax.com/news/local/detectives-investigating-fatal-shooting-st-nicholas-neighborhood-jso-says/T2DMA2LCZRA7HLKAXRQK5PQWDY/", image_url: "https://www.actionnewsjax.com/resizer/v2/T7XUFHEAWBH3RLVMDCHR5JRFQE.jpg?auth=0795dcbe52c2cb6c5ee7cf7355dc1f0f02303229fe0440d6d4b660431f443911&smart=true&width=800&height=449", source_id: "actionnewsjax", pubDate: "2026-05-18 01:02:49", category: ["top"]},
  {title: "FactFinder 12 helps Wichita family get hazardous pole removed", description: "“We have this pole here that is about to fall over. Evergy says it’s not their pole anymore. Cox says it’s not their pole, they just use it. So nobody’s claiming it.”", link: "https://www.kwch.com/2026/05/18/factfinder-12-helps-wichita-family-get-hazardous-pole-removed/", image_url: "https://gray-kwch-prod.gtv-cdn.com/resizer/v2/R32N5AXQSJAIBDBCMMPCPZNSHQ.jpeg?auth=87808e463b7e86daf99b90d294118b55541938ffc9260701ac6dec6acb52c52b&width=1200&height=600&smart=true", source_id: "kwch", pubDate: "2026-05-18 01:01:42", category: ["top"]},
  {title: "Byington Bombshell Report: Trump Declares America, \"One Nation Under God\"; Dissolves privately owned Fed & IRS;", description: "President Trump declared Sun. 17 May 2026, the nation’s 250th birthday, a national day of prayer “to rededicate America as one nation under God.” On Sunday thousands of Americans converged on the National Mall to mark the anniversary with a [...]", link: "https://beforeitsnews.com/politics/2026/05/byington-bombshell-report-trump-declares-america-one-nation-under-god-dissolves-privately-owned-fed-irs-3360782.html", image_url: "https://beforeitsnews.com/img/v3/no-img.png", source_id: "beforeitsnews", pubDate: "2026-05-18 01:01:17", category: ["politics"]},
  {title: "2 teens arrested, 1 suspect sought after Austin shooting spree injures 4 - Austin American-Statesman", description: "2 teens arrested, 1 suspect sought after Austin shooting spree injures 4 Austin American-Statesman 4 shot in random Austin attacks, fire stations among targets, police say KWTX Austin Police Arrest 2 Teens in Connection with 10 Shootings Across City, One Suspect Is Still at Large People.com APD: 2 suspects in custody, another ‘at large’ in connection with 10 south Austin shootings KXAN Austin Manor under shelter-in-place notice as 1 suspect remains at large in Austin shootings; 2 in custody KUT", link: "https://news.google.com/rss/articles/CBMinwFBVV95cUxNemtkTi1IT3dCaC16T1ZFQW9Rd184aEJzSEZNSU1pblVzN0FEenY4cXlJQ2tia19BbjRCaGhYTUkwX0tYYXJMRGUyTnB3cjB6QVlVSl9BcmVxeDNjY2tQTTdpYjRVTlJac3VIQktlRU82QkluTzUzOEo4cEFEQmxxSlJJRWR4dTFwbEdKZzM2ck9fenBaMWhjcWRZN3hRYjA?oc=5", image_url: "", source_id: "google", pubDate: "2026-05-18 01:01:12", category: ["top"]},
  {title: "Deaths from May 18, 2026", description: "", link: "https://www.sharonherald.com/obituaries/deaths-from-may-18-2026/article_d89a2753-531a-4e22-af05-c15a5bfa043a.html", image_url: "", source_id: "sharonherald", pubDate: "2026-05-18 01:01:00", category: ["top"]},
  {title: "10 Random Weekend Shootings Leave At Least 4 Injured In Austin", description: "Officials say two people are in custody and a third suspect is being sought for the attacks.", link: "https://www.huffpost.com/entry/austin-texas-shootings_n_6a0a60a0e4b0a33000e278f5", image_url: "https://img.huffingtonpost.com/asset/6a0a63d31d0000719fa13f70.jpeg?cache=GRYLiShvns&ops=1778_1000", source_id: "huffpost", pubDate: "2026-05-18 01:00:56", category: ["top"]},
  {title: "Trial of accused Boston serial rapist Alvin Campbell Jr. begins today", description: "", link: "https://www.nbcboston.com/news/local/trial-of-accused-boston-serial-rapist-alvin-campbell-jr-begins-today/3951468/", image_url: "https://media.nbcboston.com/2026/05/Video-2026-05-18T050544.637.jpg?quality=85&strip=all&fit=1920,1080", source_id: "necn", pubDate: "2026-05-18 01:00:53", category: ["politics"]},
  {title: "Man critically injured in motorcycle crash in Syracuse", description: "", link: "https://www.syracuse.com/crime/2026/05/man-critically-injured-in-motorcycle-crash-in-syracuse.html", image_url: "https://www.syracuse.com/resizer/v2/IDB2YUZS7ZFTPN6VLMWIKXNQQY.JPG?auth=054ea795104e7d56e76c4f6a73e5cbbad46462c9ff3e913254d567229385866b&smart=true&height=1200", source_id: "syracuse", pubDate: "2026-05-18 01:00:35", category: ["top"]},
  {title: "Starks woman killed in crash deadly Vinton crash", description: "According to investigators, a Mazda CX-5 was traveling east on Niblett Bluff Road and approached La. 109 as a Chevrolet Malibu driven by Hyatt was traveling south on La. 109. State police said the Mazda entered the roadway and the Chevrolet struck it.", link: "https://www.kplctv.com/2026/05/18/starks-woman-killed-crash-deadly-vinton-crash/", image_url: "https://gray-kplc-prod.gtv-cdn.com/resizer/v2/6QWELKQXLFA7NB6ODB2GPUDQPA.jpg?auth=cc80bd1557bcaf99b86a249485a139dadf3a02598545794823e449f44c724e05&width=1200&height=600&smart=true", source_id: "kplctv", pubDate: "2026-05-18 01:00:17", category: ["top"]},
  {title: "Some parents don\'t want their kids to use tech at school. But districts are pushing back", description: "Parents across the country who are worried about excessive screen time in schools are lobbying educators to go back to pencils and paper. In places like Pennsylvania\'s Lower Merion School District, some families are taking it even further. Over 600...", link: "https://www.santafenewmexican.com/news/education/some-parents-dont-want-their-kids-to-use-tech-at-school-but-districts-are-pushing/article_6ae137b2-1393-5b6d-86fb-17f75951a0a0.html", image_url: "https://bloximages.newyork1.vip.townnews.com/santafenewmexican.com/content/tncms/assets/v3/editorial/3/aa/3aa73788-9e0d-50c6-a94b-6ebc0c31c751/6a0a03d2535e3.image.jpg?crop=1763%2C926%2C0%2C124&resize=1200%2C630&order=crop%2Cresize", source_id: "santafenewmexican", pubDate: "2026-05-18 01:00:00", category: ["politics"]},
  {title: "Rap superstar Nicki Minaj is throwing her weight behind the White House agenda after being courted by Trump’s 29-year-old celebrity whisperer.", description: "The rap superstar is throwing her weight behind the White House agenda after being courted by Trump’s 29-year-old celebrity whisperer.", link: "https://www.wsj.com/politics/elections/nicki-minaj-trump-fan-d27d189c", image_url: "", source_id: "wsj", pubDate: "2026-05-18 01:00:00", category: ["politics"]},
  {title: "These Lincoln street closures begin Monday. What you need to know.", description: "Lincoln Transportation and Utilities announced two street will be closed beginning Monday.", link: "https://fremonttribune.com/news/state-regional/nebraska/article_0eb54ae2-5ca9-5976-92e7-00dd4c40ec08.html", image_url: "https://bloximages.chicago2.vip.townnews.com/fremonttribune.com/content/tncms/assets/v3/editorial/a/23/a230390e-33d7-5269-aa73-06403ec6fee6/69fcc8cdc786a.image.jpg?resize=1200%2C674", source_id: "fremonttribune", pubDate: "2026-05-18 01:00:00", category: ["top"]},
  {title: "These Lincoln street closures begin Monday. What you need to know.", description: "Lincoln Transportation and Utilities announced two street will be closed beginning Monday.", link: "https://theindependent.com/news/state-regional/nebraska/article_286425c6-3305-5d53-83b3-6fe5e9d94823.html", image_url: "", source_id: "theindependent", pubDate: "2026-05-18 01:00:00", category: ["top"]},
  {title: "Hantavirus-Hit Cruise Ship Due to Arrive at Rotterdam Port as Final Destination", description: "The hantavirus-hit cruise ship MV Hondius was due to dock in Rotterdam on Monday morning for disinfection, with Dutch authorities preparing quarantine arrangements for the 25 crew members and two medical staff remaining on board.", link: "https://www.newsmax.com/newsfront/hantavirus-cruise-ship-rotterdam/2026/05/17/id/1256578", image_url: "https://www.newsmax.com/CMSPages/GetFile.aspx?guid=283d97da-b657-4e6b-af0b-93e62e9ef612&SiteName=Newsmax", source_id: "newsmax", pubDate: "2026-05-18 00:59:15", category: ["politics"]},
  {title: "Trump allies and Christian leaders kick off America’s 250th birthday with religious rally on National Mall", description: "Thousands gathered on the National Mall on Sunday for a day of prayer, worship music and patriotic speeches for an event celebrating the nation’s 250th anniversary that supporters hail as a public affirmation of faith in America but critics view as an exclusionary display that blurs the line between religion and politics.", link: "https://www.nbcnews.com/politics/trump-administration/white-house-prayer-250-birthday-rcna345326", image_url: "https://media-cldnry.s-nbcnews.com/image/upload/t_fit_1500w/rockcms/2026-05/260517-zc-jubilee-dc-ww-1640-66efa5.jpg", source_id: "nbcnews", pubDate: "2026-05-18 00:58:58", category: ["politics"]},
  {title: "AP News Summary at 8:58 p.m. EDT", description: "Drone strikes UAE nuclear plant as US and Iran signal they are prepared to resume war", link: "https://www.hastingstribune.com/ap/personal_finance/ap-news-summary-at-8-58-p-m-edt/article_ff7f4535-4677-5f85-9245-268b4aba28ee.html", image_url: "https://bloximages.newyork1.vip.townnews.com/hastingstribune.com/content/tncms/custom/image/7b43d562-eeac-11e4-8a7b-970670abfcb2.jpg?resize=600%2C315", source_id: "hastingstribune", pubDate: "2026-05-18 00:58:19", category: ["politics"]},
  {title: "AP News Summary at 8:58 p.m. EDT", description: "Drone strikes UAE nuclear plant as US and Iran signal they are prepared to resume war", link: "https://www.swoknews.com/ap/national/ap-news-summary-at-8-58-p-m-edt/article_a68943a2-6e3e-5463-bea9-e90634fd0e2d.html", image_url: "", source_id: "swoknews", pubDate: "2026-05-18 00:58:19", category: ["politics"]},
  {title: "AP News Summary at 8:58 p.m. EDT", description: "Drone strikes UAE nuclear plant as US and Iran signal they are prepared to resume war", link: "https://www.mcalesternews.com/region/ap-news-summary-at-8-58-p-m-edt/article_459f7153-f524-5358-b5aa-a5be2df715ee.html", image_url: "https://bloximages.chicago2.vip.townnews.com/mcalesternews.com/content/tncms/custom/image/2fc1ee00-018c-11e6-9e6b-a7c5ea2c23fd.jpg?resize=600%2C315", source_id: "mcalesternews", pubDate: "2026-05-18 00:58:19", category: ["politics"]},
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
      investigations = data.data.filter(i => i && i.title && i.status !== 'draft' && i.status !== 'archived');
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
        <div class="inv-story-content">${inv.story.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}</div>`;
    }

    // Timeline
    if (inv.timeline && inv.timeline.length > 0) {
      html += `<div class="inv-section-label"><i class="fas fa-history"></i> TIMELINE OF EVENTS</div>
        <div class="inv-timeline" style="margin-bottom:40px;">
          ${inv.timeline.map(t => `<div class="inv-timeline-item"><div class="inv-timeline-date">${t.date}</div><div class="inv-timeline-event">${t.event}</div></div>`).join('')}
        </div>`;
    }

    // Documents
    if (inv.documents && inv.documents.length > 0) {
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
      html += `<div class="inv-section-label"><i class="fas fa-folder-open"></i> EVIDENCE & DOCUMENTS</div>
        <div class="inv-docs-grid" style="margin-bottom:40px;">
          ${inv.documents.map(d => `
            <a href="${d.url}" target="_blank" rel="noopener noreferrer" onclick="openDoc(event, '${d.url}')" class="inv-doc-item ${docClass(d.type)}">
              <i class="fas ${docIcon(d.type)}" style="font-size:2rem;"></i>
              <div class="doc-name">${d.name}</div>
              <div class="doc-type">${(d.type||'file').split('/').pop().toUpperCase()}</div>
            </a>`).join('')}
        </div>`;
    }

    // TikTok references
    if (inv.tiktoks && inv.tiktoks.length > 0) {
      html += `<div class="inv-section-label"><i class="fab fa-tiktok"></i> TIKTOK REFERENCES</div>
        <div class="inv-tiktok-list" style="margin-bottom:40px;">
          ${inv.tiktoks.map((url, i) => `
            <a href="${url}" target="_blank" rel="noopener" class="inv-tiktok-item">
              <i class="fab fa-tiktok"></i>
              <span>TikTok Reference ${i+1} — Watch Clip</span>
              <i class="fas fa-external-link-alt" style="margin-left:auto;font-size:11px;opacity:0.4;"></i>
            </a>`).join('')}
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
