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
// NEWS_CACHE_LAST_UPDATED: 2026-06-04 20:09 UTC
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
  {"title":"Trump Reveals His ‘Permanent’ Plan For Next Attorney General","description":"President Donald Trump said Wednesday that he planned to make Todd Blanche’s position as acting attorney general “permanent.” “Tomorrow I’m instructing Dan [Scavino] and everybody else that’s involved","link":"https://www.dailywire.com/news/trump-reveals-his-permanent-plan-for-next-attorney-general","image_url":"https://dw-wp-production.imgix.net/2026/06/GettyImages-2270246382.jpg?ar=16%3A9&amp;auto=compress&amp;crop=faces&amp;cs=origin&amp;fit=crop&amp;w=1200&amp;h=800&amp;ixlib=react-9.11.0","source_id":"dailywire","pubDate":"2026-06-04 08:08:01","category":["politics"]},
  {"title":"Trump to nominate Todd Blanche for attorney general","description":"Blanche sought quickly to position himself as the favorite for the permanent job after Pam Bondi’s firing in April.","link":"https://www.cleveland.com/nation/2026/06/trump-to-nominate-todd-blanche-for-attorney-general.html","image_url":"https://www.cleveland.com/resizer/v2/HE6Y6EC5EBHFLCTEP6HH7O7ZKU.jpg?auth=6d6334c8fa8b8efec8107abe27b81b52b5d5561b9b274a2e974870f0ab0594a0&smart=true&height=1200","source_id":"cleveland","pubDate":"2026-06-04 08:06:02","category":["politics"]},
  {"title":"Trump accuses ‘Dumocrats’ of cheating in California","description":"Final results in the Los Angeles Mayoral and California gubernatorial races are still potentially days - if not weeks - away.","link":"https://us.headtopics.com/news/trump-accuses-dumocrats-of-cheating-in-california-84116488","image_url":"https://i.headtopics.com/images/2026/6/4/newsweek/trump-accuses-dumocrats-of-cheating-in-california-trump-accuses-dumocrats-of-cheating-in-california-FF2C7AAB0D0FB716A959F210CF49F2C0.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["politics"]},
  {"title":"First look at Obama Presidential Center","description":"CNN Style’s Jacqui Palumbo speaks to the architects behind the $850 million design in Chicago.","link":"https://us.headtopics.com/news/first-look-at-obama-presidential-center-84116581","image_url":"https://i.headtopics.com/images/2026/6/4/cnni/first-look-at-obama-presidential-center-first-look-at-obama-presidential-center-7A7EFBD006285BB282E13D487298B73F.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["politics"]},
  {"title":"US Democrats Push for FTC Investigation Into Prediction Markets","description":"Nine House Democrats are urging the FTC to investigate prediction market platforms over alleged deceptive practices, consumer risks and attempts to evade gambling regulations.","link":"https://us.headtopics.com/news/us-democrats-push-for-ftc-investigation-into-prediction-84116696","image_url":"https://i.headtopics.com/images/2026/6/4/cointelegraph/us-democrats-push-for-ftc-investigation-into-predi-us-democrats-push-for-ftc-investigation-into-predi-A89C0A3AAD951955BC372B818EFDB297.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["politics"]},
  {"title":"Lebanese Americans open their wallets and hearts as war rages back home","description":"Lebanese Americans are both grieving and taking action to support loved ones in their homeland who have been affected by the war between Israel and Hezbollah militants.","link":"https://us.headtopics.com/news/lebanese-americans-open-their-wallets-and-hearts-as-war-84116779","image_url":"https://i.headtopics.com/images/2026/6/4/wjxt4/lebanese-americans-open-their-wallets-and-hearts-a-lebanese-americans-open-their-wallets-and-hearts-a-A3818C43E6A95FD1532C049E18D28E58.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["politics"]},
  {"title":"Trump says won't end Iran ceasefire unless Tehran kills American troops: WSJ","description":"The US president’s reluctance to reignite the conflict suggests he might be willing to 'withstand smaller flare-ups' for weeks or months, the Wall Street Journal reports.","link":"https://us.headtopics.com/news/trump-says-won-t-end-iran-ceasefire-unless-tehran-kills-84116778","image_url":"https://i.headtopics.com/images/2026/6/4/trtworld/trump-says-won-t-end-iran-ceasefire-unless-tehran--trump-says-won-t-end-iran-ceasefire-unless-tehran--C1DEE29574B5E8D51FE273A7F243FDF9.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["politics"]},
  {"title":"Rubio States US Has Nothing to do With Plan to Control Seventy Per Cent of Gaza","description":"(MENAFN) According to reports, US Secretary of State Marco Rubio told lawmakers that an Israeli plan to expand control over roughly 70% of the Gaza Strip is not included in the Trump ...","link":"https://menafn.com/1111211156/Rubio-States-US-Has-Nothing-to-do-With-Plan-to-Control-Seventy-Per-Cent-of-Gaza","image_url":"https://menafn.com/updates/pr/Menafn_News_Images/local_media_248.jpg","source_id":"menafn","pubDate":"2026-06-04 08:08:15","category":["politics"]},
  {"title":"US brokers Israel-Lebanon ceasefire framework tied to Hezbollah withdrawal","description":"The US has secured a new ceasefire framework between Israel and Lebanon on June 3 that would require Hezbollah to halt all attacks and withdraw its ...","link":"https://www.intellinews.com/us-brokers-israel-lebanon-ceasefire-framework-tied-to-hezbollah-withdrawal-446456/","image_url":"https://d39raawggeifpx.cloudfront.net/styles/16_9_desktop/s3/articleimages/bneGeneric_bneIcon_Lebanon-_miliaray_war_missile_strikes_poster_-_child_boy_running__smoke_explosion_building_fire_AI_0.jpg","source_id":"intellinews","pubDate":"2026-06-04 08:06:37","category":["politics"]},
  {"title":"Lula: ‘We cannot accept the way the United States has treated Brazil this week’","description":"The Brazilian president wants to negotiate with Donald Trump, but he also warns that, if not, he will seek new partners","link":"https://english.elpais.com/international/2026-06-04/lula-we-cannot-accept-the-way-the-united-states-has-treated-brazil-this-week.html","image_url":"https://images.english.elpais.com/resizer/v2/XGEP3Z5UHVK6DL3OB4ZAQVQQFM.jpg?auth=2dac037069a6cb2b2d6ff6e4c874432827448e2b42e4d4225298aeae004dd0b6","source_id":"elpais","pubDate":"2026-06-04 08:06:30","category":["politics"]},
  {"title":"Trump: US and Iran Close to Nuclear Deal","description":"US President Donald Trump announced that Washington and Tehran are on the verge of signing a landmark agreement that would see Iran permanently abandon its nuclear weapons program. Despite recent mili","link":"https://iha.news/trump-us-and-iran-close-to-nuclear-deal/","image_url":"https://iha.news/wp-content/uploads/2026/06/iha-auto-draft-2026-06-04_07-18-42_746717.png","source_id":"iha","pubDate":"2026-06-04 08:06:05","category":["politics"]},
  {"title":"North Korea unveils new plant to produce fuel for nuclear weapons","description":"North Korea on Thursday unveiled a new facility to produce nuclear bomb fuels, with leader Kim Jong Un announcing plans to bolster the country’s nuclear forces “at an exponential rate.”","link":"https://nypost.com/2026/06/04/world-news/north-korea-unveils-a-new-plant-to-produce-fuel-for-nuclear-weapons/","image_url":"https://nypost.com/wp-content%2Fuploads%2Fsites%2F2%2F2026%2F06%2Fphoto-kcna-via-kns-afp-129658995.jpg?w%3D1024","source_id":"nypost","pubDate":"2026-06-04 08:05:25","category":["politics"]},
  {"title":"Ukraine's drone strikes set a gloomy tone for Putin's economic showcase","description":"A massive black cloud rising above the St. Petersburg skyline from a Ukrainian drone strike set a gloomy tone for the opening of President Vladimir Putin’s annual showcase of Russia’s economic achieve","link":"https://us.headtopics.com/news/ukraine-s-drone-strikes-set-a-gloomy-tone-for-putin-s-84117255","image_url":"https://i.headtopics.com/images/2026/6/4/wjxt4/ukraine-s-drone-strikes-set-a-gloomy-tone-for-puti-ukraine-s-drone-strikes-set-a-gloomy-tone-for-puti-F2ECD8F89DE068BA83D382DA9052ADC0.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Kuwait says Iranian drones hit airport and killed 1 as ceasefire is tested again","description":"Kuwait has reported that Iranian drones hit an airport and killed one person as the ceasefire is being tested again. In other news, attitudes toward same-sex marriage and transgender issues are shifti","link":"https://us.headtopics.com/news/kuwait-says-iranian-drones-hit-airport-and-killed-1-as-84116515","image_url":"https://i.headtopics.com/images/2026/6/4/ap/kuwait-says-iranian-drones-hit-airport-and-killed--kuwait-says-iranian-drones-hit-airport-and-killed--CC03CA2A7A78A18765027AE407D36753.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Multiple shot at high school graduation event","description":"One person died, and three others were injured in a shooting at Fairfield High School, according to police.","link":"https://us.headtopics.com/news/multiple-shot-at-high-school-graduation-event-84116587","image_url":"https://i.headtopics.com/images/2026/6/4/cnni/multiple-shot-at-high-school-graduation-event-multiple-shot-at-high-school-graduation-event-DF13910EBE57C9A948FD9F27410DD213.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Fairfield high school shooting—at least one dead after graduation ceremony","description":"Gunfire erupted in the parking lot of the school following a graduation ceremony in Fairfield, California.","link":"https://us.headtopics.com/news/fairfield-high-school-shooting-at-least-one-dead-after-84116937","image_url":"https://i.headtopics.com/images/2026/6/4/newsweek/fairfield-high-school-shooting-at-least-one-dead-a-fairfield-high-school-shooting-at-least-one-dead-a-EE3B6AA1F3384E4743BD7D67D0745D25.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Woman plummets down manhole in Brazil","description":"Authorities in Brazil say two men tampered with a utility hole cover before a woman fell through it hours later.","link":"https://us.headtopics.com/news/woman-plummets-down-manhole-in-brazil-84116965","image_url":"https://i.headtopics.com/images/2026/6/4/cnn/woman-plummets-down-manhole-in-brazil-woman-plummets-down-manhole-in-brazil-7690E1D57664AFBF078D7AC138A51F29.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Security Guard Arrested After Shooting Unarmed Shoplifter","description":"A security guard at Spirit Halloween in New Mexico was arrested after he allegedly shot and killed an unarmed shoplifter that was trying to make off with less than $90 worth of merchandise.","link":"https://us.headtopics.com/news/security-guard-arrested-after-shooting-unarmed-shoplifter-84117236","image_url":"https://i.headtopics.com/images/2026/6/4/wsyx6/security-guard-arrested-after-shooting-unarmed-sho-security-guard-arrested-after-shooting-unarmed-sho-A89F73F3732A175CDA9DBBCC629218CC.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Pennsylvania kindergarten graduation ceremony descends into chaos as baby caught up in brawl among adults","description":"A baby was caught in the middle of a brawl involving two men at a Pennsylvania kindergarten graduation ceremony, shocking video showed. The two adults scrapped near chairs as all hell broke loose i...","link":"https://us.headtopics.com/news/pennsylvania-kindergarten-graduation-ceremony-descends-into-84117298","image_url":"https://i.headtopics.com/images/2026/6/4/nypost/pennsylvania-kindergarten-graduation-ceremony-desc-pennsylvania-kindergarten-graduation-ceremony-desc-CFC2677264949663EEEB1FE847F9B4E9.webp","source_id":"headtopics","pubDate":"2026-06-04 08:05:57","category":["crime"]},
  {"title":"Child beaten, killed by father over field trip money, police say","description":"A 10-year-old girl was beaten and killed by her father in Smyrna after she lied to her parents about field trip money, police say.","link":"https://www.yahoo.com/news/us/articles/child-beaten-killed-father-over-080536812.html","image_url":"https://media.zenfs.com/en/delaware-online-the-news-journal/e29a74dafbfe07002c1b3010d2980273","source_id":"yahoo","pubDate":"2026-06-04 08:05:36","category":["crime"]},
  {"title":"Man claiming to be armed robs Culver City bank, gets away with $10,000","description":"Police are searching for a man who claimed to be armed inside a bank and reportedly made off with $10,000 in cash before disappearing into a nearby Culver City neighborhood. The robbery occurred short","link":"https://newspub.live/southwest/los-angeles-ca/man-claiming-to-be-armed-robs-culver-city-bank-gets-away-with-10000/","image_url":"https://i1.wp.com/ktla.com/wp-content/uploads/sites/4/2026/05/culver-city-police-canonical.jpg?w=900&ssl=1","source_id":"newspub_live","pubDate":"2026-06-04 08:05:12","category":["crime"]},
  {"title":"Trump beschimpft CNN-Journalistin Kaitlan Collins","description":"Dass Donald Trump kritische Journalisten nicht mag, ist allen bekannt. Aber seine Abneigung ist für niemanden so gross wie für die CNN-Journalistin Kaitlan Collins. Nun hat er sie in einer Presskonf","link":"https://www.blick.ch/video/aktuell/du-solltest-dich-schaemen-trump-beschimpft-cnn-journalistin-aus-id22001465.html","image_url":"https://img.blick.ch/incoming/22001466-v2-imago-st-0604-07000001-0858281341.jpg?width=7387&height=4159&x=0&y=136&ratio=16_9&imwidth=2000","source_id":"blick","pubDate":"2026-06-04 08:07:35","category":["top"]}
];


// BOTH_SIDES_NOW news feeds
var NFA_DEM_ARTICLES = [
  {t:'Hilton, Pratt surge in California primary. Can they pull it off? | Opinion',d:'That Steve Hilton and Spencer Pratt have secured as many votes as they have at this point suggests many Californians are fed up with the status quo.',l:'https://www.usatoday.com/story/opinion/columnist/2026/06/04/california-primary-election-la-mayoral-race-hilton-pratt/90370261007/',i:'https://www.usatoday.com/gcdn/authoring/authoring-images/2026/06/03/USAT/90388009007-getty-images-2279564952.jpg?crop=1023,576,x0,y0&width=1023&height=511&format=pjpg&auto=webp'},
  {t:'Human Trafficking in Sri Lanka: Protecting Vulnerable Women',d:'Human trafficking in Sri Lanka continues to affect economically vulnerable communities, particularly women seeking work abroad due to limited local em',l:'https://borgenproject.org/human-trafficking-in-sri-lanka/',i:'https://borgenproject.org/wp-content/uploads/Human-trafficking-in-Sri-Lanka.jpg'},
  {t:'Maine Republicans cant afford a flawed candidate on governor ticket | Opinion',d:'If we nominate Jonathan Bush or Bobby Charles for governor, the ripple effects will be devastating for other party candidates.',l:'https://www.pressherald.com/2026/06/04/maine-republicans-cant-afford-a-flawed-candidate-on-governor-ticket-opinion/',i:'https://www.pressherald.com/wp-content/uploads/sites/4/2026/03/43504607_20260324_08debate.jpg?w=780'},
  {t:'China bans four New Zealand lawmakers over visit to Taiwan',d:'China says the MPs\' visit sends the \'wrong signals\' to Taiwan\'s ruling party.',l:'https://www.aljazeera.com/news/2026/6/4/china-bans-four-new-zealand-lawmakers-over-visit-to-taiwan',i:'https://www.aljazeera.com/wp-content/uploads/2026/06/2026-05-31T115201Z_600555281_RC2QCLALR6WE_RTRMADP_3_TAIWAN-CHINA-USA-1780557739.jpg?resize=1920%2C1440'},
  {t:'Manic Trump, 79, Pushes Bonkers Conspiracy in 1AM Meltdown',d:'Kevin Lamarque / Kevin Lamarque/Reuters Donald Trump pushed an unsubstantiated conspiracy theory that Democrats are cheating in high-profile elections',l:'https://www.thedailybeast.com/manic-trump-79-pushes-bonkers-conspiracy-in-1am-meltdown/',i:'https://thedailybeast-thedailybeast-prod.web.arc-cdn.net/resizer/v2/7CFW5KTLG5C7NLUVV3C5BUDTEQ.JPG?auth=656508d7d451aaea2d3d2378265584a33c931deff387ec1f774d8db4f5382d37&smart=true&width=2806&height=1579'},
  {t:'Trump To Nominate Blanche as Attorney General on Thursday',d:'The acting attorney general likely has a smooth path to serving as the nations top law enforcement officer.',l:'https://www.nysun.com/article/trump-to-nominate-blanche-as-attorney-general-on-thursday',i:'https://wp.nysun.com/wp-content/uploads/2026/05/Blanche-Getty-2-scaled.jpg'},
];

var NFA_REP_ARTICLES = [
  {t:'Detention threats spur voluntary deportations',d:'A surge in voluntary departure agreements in immigration courts is raising concerns that Trump administration tactics are unfairly pressuring immigran',l:'https://chippewa.com/article_5f2690d2-2e05-56a4-b988-f5af4e4a394d.html',i:'https://bloximages.chicago2.vip.townnews.com/chippewa.com/content/tncms/custom/image/4530796a-c2de-11ea-8111-1b2170be1764.jpg?resize=600%2C348'},
  {t:'Trump is stuck between two realities in the war with Iran',d:'Normally, I worry that events may overtake a column. But not so with the Iran war.',l:'https://chippewa.com/article_64b1da2b-6369-5645-989d-5f3e3c545180.html',i:'https://bloximages.chicago2.vip.townnews.com/chippewa.com/content/tncms/custom/image/4530796a-c2de-11ea-8111-1b2170be1764.jpg?resize=600%2C348'},
  {t:'How China could help solve Trump\'s Iran nuclear problem',d:'If China mediates a U.S.-Iran deal and extracts nuclear material, \'it would be a huge diplomatic win for the PRC,\' an expert said.',l:'https://us.headtopics.com/news/how-china-could-help-solve-trump-s-iran-nuclear-problem-84118112',i:'https://i.headtopics.com/images/2026/6/4/newsweek/how-china-could-help-solve-trump-s-iran-nuclear-pr-how-china-could-help-solve-trump-s-iran-nuclear-pr-7349093FD051BDFDE63B28100B57AE4D.webp'},
  {t:'Disciplined Investors L.L.C. Purchases Shares of 13,709 Rio Tinto PLC $RIO',d:'Disciplined Investors L.L.C. purchased a new stake in shares of Rio Tinto PLC (NYSE:RIO  Free Report) during the 4th quarter, according to the company',l:'https://www.dailypolitical.com/2026/06/04/disciplined-investors-l-l-c-purchases-shares-of-13709-rio-tinto-plc-rio.html',i:'https://www.marketbeat.com/logos/rio-tinto-logo-1200x675.jpg'},
  {t:'Cibc World Market Inc. Grows Stock Holdings in Chevron Corporation $CVX',d:'Cibc World Market Inc. increased its stake in shares of Chevron Corporation (NYSE:CVX  Free Report) by 63.8% in the 4th quarter, according to its most',l:'https://www.dailypolitical.com/2026/06/04/cibc-world-market-inc-grows-stock-holdings-in-chevron-corporation-cvx.html',i:'https://www.marketbeat.com/logos/chevron-co-logo-1200x675.jpg?v=20210524093101'},
  {t:'Cibc World Market Inc. Boosts Stake in Visa Inc. $V',d:'Cibc World Market Inc. increased its stake in shares of Visa Inc. (NYSE:V  Free Report) by 1.9% in the fourth quarter, HoldingsChannel.com reports. Th',l:'https://www.dailypolitical.com/2026/06/04/cibc-world-market-inc-boosts-stake-in-visa-inc-v.html',i:'https://www.marketbeat.com/logos/visa-inc-logo-1200x675.png?v=20210709134004'},
  {t:'Donald Trump Accuses CNNs Kaitlan Collins of Having Hatred in Her Eyes',d:'Trumps latest attack on a female journalist just escalated to a whole new level. President Donald Trump targets CNNs Kaitlan Collins with personal cri',l:'https://www.mandatory.com/news/1785330-donald-trump-cnn-kaitlan-collins-oval-office-clash',i:'https://www.mandatory.com/wp-content/uploads/sites/10/2026/06/MixCollage-04-Jun-2026-10-29-AM-4729.jpg'},
];

function getRandomArticle(cache) {
  if (!cache || cache.length === 0) return null;
  return cache[Math.floor(Math.random() * cache.length)];
}

function populateNewsFeeds() {
  function makeCard(a, color) {
    var img = a.i ? '<img src="' + a.i + '" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:4px;margin-bottom:8px;">' : '';
    return '<a href="' + a.l + '" target="_blank" style="display:block;background:#0d1f3c;border-left:4px solid ' + color + ';border-radius:4px;padding:12px;margin-bottom:10px;text-decoration:none;">' +
      img +
      '<div style="font-family:Oswald,sans-serif;font-size:13px;font-weight:600;color:#fff;line-height:1.35;margin-bottom:5px;">' + a.t + '</div>' +
      '<div style="font-size:11px;color:#8a9bb5;line-height:1.4;">' + a.d + '</div></a>';
  }
  var demEl = document.getElementById('demStories');
  var repEl = document.getElementById('repStories');
  if (!demEl || !repEl) return;
  // Build sets of titles to prevent cross-panel duplicates
  var demTitles = (NFA_DEM_ARTICLES||[]).map(function(a){return a.t;});
  var repFiltered = (NFA_REP_ARTICLES||[]).filter(function(a){ return demTitles.indexOf(a.t) === -1; });
  var repTitles = repFiltered.map(function(a){return a.t;});
  var demFiltered = (NFA_DEM_ARTICLES||[]).filter(function(a){ return repTitles.indexOf(a.t) === -1; });
  if (demFiltered.length) demEl.innerHTML = demFiltered.slice(0,3).map(function(a){ return makeCard(a,'#0066cc'); }).join('');
  if (repFiltered.length) repEl.innerHTML = repFiltered.slice(0,3).map(function(a){ return makeCard(a,'#cc0000'); }).join('');
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
