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
// NEWS_CACHE_LAST_UPDATED: 2026-05-28 08:16 UTC
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
  {"title":"Illinois official charged after allegedly submitting dead mothers mail-in ballot","description":"Waukegan 1st Ward alderperson Sylvia Sims Bolton faces felony charge after allegedly voting by mail in her deceased mothers name in Illinois primary.","link":"https://us.headtopics.com/news/illinois-official-charged-after-allegedly-submitting-dead-83847106","image_url":"https://i.headtopics.com/images/2026/5/27/foxnews/illinois-official-charged-after-allegedly-submitti-illinois-official-charged-after-allegedly-submitti-CD7A0A37315F6CA8FE4C2EA5547B5C67.webp","source_id":"headtopics","pubDate":"2026-05-28 00:07:13","category":["crime","top"]},
  {"title":"Former AG Pam Bondi Diagnosed With Thyroid Cancer","description":"Former U.S. Attorney General Pam Bondi has been diagnosed with thyroid cancer and is currently undergoing treatment.","link":"https://pjmedia.com/bryan-s-jung/2026/05/27/former-ag-pam-bondi-diagnosed-with-thyroid-cancer-n4953317","image_url":"https://media.townhall.com/cdn/hodl/2025/338/d417dbe3-9530-4c3d-a679-6c035ab0c694.jpg","source_id":"pjmedia","pubDate":"2026-05-28 01:16:00","category":["top","health"]},
  {"title":"Brazil presidential hopeful Bolsonaro adds Rubio, Vance talks to Washington trail","description":"Brazilian Senator and presidential contender Flavio Bolsonaro met with U.S. Vice President JD Vance and Secretary of State Marco Rubio in Washington.","link":"https://newspub.live/west/washington/brazil-presidential-hopeful-bolsonaro-adds-rubio-vance-talks-to-washington-trail/","image_url":"https://i1.wp.com/www.reuters.com/resizer/v2/T4X2OUIDPBNABMKKOLF7RNDLRA.jpg?auth=42dbeb86f68b262a531b563ee1f37a3598f0f26467dc55d1e04dd045110f4b8e&height=1005&width=1920&quality=80&smart=true&ssl=1","source_id":"newspub_live","pubDate":"2026-05-27 23:02:06","category":["top","politics"]},
  {"title":"CPD data shows juveniles make up 22% of violent crime arrests","description":"Columbia Police Department rolling out new data dashboard showing violent crime trending downward for fourth year in a row.","link":"https://abc17news.com/news/crime/2026/05/27/cpd-data-shows-juveniles-make-up-22-of-violent-crime-arrests-ages-10-17-make-up-largest-age-group-of-sex-crime-victims/","image_url":"https://abc17news.b-cdn.net/abc17news.com/2024/02/CPD-cruiser-and-tape-860x503.jpg","source_id":"abc17news","pubDate":"2026-05-28 00:58:04","category":["domestic"]},
  {"title":"Colorado Aurora Democrats Ban Police from Posting Mugshots, Suspect Names","description":"Aurora City Council passed controversial policy restricting police from releasing mug shots and suspect names until conviction.","link":"http://lawenforcementtoday.com/colorado-aurora-democrats-ban-police-from-posting-mugshots-suspect-names","image_url":"https://mr.cdn.ignitecdn.com/client_assets/lawenforcementtoday_com/media/picture/6a16/48be/a68a/d8da/ebeb/3d94/article_Screenshot_2026-05-26_21.28.06.png?1779845312","source_id":"lawenforcementtoday","pubDate":"2026-05-28 00:52:24","category":["crime","top"]},
  {"title":"Skeletal remains found in Kewanees Northeast Park","description":"The remains were discovered by a company working in the park Wednesday afternoon.","link":"https://qconline.com/news/local/crime-courts/article_4389e26b-061d-5a36-ace7-51a32767fcea.html","image_url":"","source_id":"qconline","pubDate":"2026-05-28 00:50:00","category":["crime"]},
  {"title":"Trump administration begins making new requests of green-card applicants","description":"Immigration officers have begun making new requests that lawyers believe will stress an already overwhelmed processing system.","link":"https://www.dailyherald.com/20260527/nation-and-world-politics/trump-administration-begins-making-new-requests-of-green-card-applicants/","image_url":"https://imengine.public.prod.pdh.navigacloud.com/?uuid=f8840da5-a2ab-53ef-9189-73f8becce7a2&function=fit&type=preview","source_id":"dailyherald","pubDate":"2026-05-28 01:10:45","category":["top","politics"]},
  {"title":"Here are the California proposals that are halfway to becoming state law","description":"California state lawmakers face a key bill deadline Friday to pass or kill hundreds of new proposed laws.","link":"https://www.kcra.com/article/california-proposals-halfway-to-becoming-state-law/71423847","image_url":"https://kubrick.htvapps.com/htv-prod/ibmig/cms/image/kcra/25180634-capitol-2-jpg.jpg?crop=1.00xw:0.753xh;0,0&resize=1200:*","source_id":"kcra","pubDate":"2026-05-28 01:07:00","category":["top","politics"]},
  {"title":"What to expect in Wyomings Grand Teton, Yellowstone parks as summer kicks off","description":"Parks preparing for summer tourist season with updated infrastructure and safety measures.","link":"https://newspub.live/west/wyoming/what-to-expect-in-wyomings-grand-teton-yellowstone-parks-as-summer-kicks-off/","image_url":"https://i0.wp.com/county17.com/wp-content/uploads/2026/05/20250926_094545-scaled-1.jpg?fit=2560%2C1196&ssl=1","source_id":"newspub_live","pubDate":"2026-05-27 22:44:11","category":["tourism","top"]},
  {"title":"14 Best 52-Week High Stocks to Invest In According to Short Sellers","description":"US stock markets have been on a tear, extending last years rally and powering to record highs.","link":"https://www.insidermonkey.com/blog/14-best-52-week-high-stocks-to-invest-in-according-to-short-sellers-1767005/","image_url":"https://d2w7kw43nye0pi.cloudfront.net/a1YNERVMqt-BESChbC0xeEvjulSYlkMfa_DRMUcFXJk/resize:fit:1279:854:0/plain/https://imonkeyblog.s3.us-east-1.amazonaws.com/blog/wp-content/uploads/2026/04/30124203/pexels-kampus-8353777.jpg","source_id":"insidermonkey","pubDate":"2026-05-28 00:48:53","category":["business"]}
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  populateNewsFeeds();
});

