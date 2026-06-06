/**
 * NFA Paywall — nofilteramerica.com
 * Drop <script src="paywall.js"></script> into any page to gate it.
 * Free preview: first 300px of content is visible, rest blurred + overlayed.
 */

(function () {
  const VERIFY_URL = "https://nfa-super-agent-3fda6201.base44.app/functions/verifyToken";
  const SUBSCRIBE_URL = "https://form.jotform.com/261566870518062";
  const MEMBERS_URL = "/members.html";
  const COOKIE_NAME = "nfa_token";
  const PREVIEW_HEIGHT = 320; // px of free content to show

  function getCookie(name) {
    const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return v ? v.pop() : null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + value + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function injectPaywallStyles() {
    if (document.getElementById("nfa-paywall-styles")) return;
    const style = document.createElement("style");
    style.id = "nfa-paywall-styles";
    style.textContent = `
      .nfa-paywall-wrap { position: relative; }
      .nfa-paywall-blur { filter: blur(6px); pointer-events: none; user-select: none; max-height: ${PREVIEW_HEIGHT}px; overflow: hidden; }
      .nfa-paywall-overlay {
        position: absolute; bottom: 0; left: 0; right: 0;
        background: linear-gradient(to bottom, rgba(13,27,42,0) 0%, rgba(13,27,42,0.97) 35%, #0d1b2a 100%);
        padding: 60px 20px 40px;
        text-align: center;
        z-index: 100;
      }
      .nfa-paywall-badge {
        display: inline-block; background: #cc0000; color: #fff;
        font-family: 'Oswald', Georgia, sans-serif; font-size: 11px;
        letter-spacing: 2px; text-transform: uppercase; padding: 4px 14px;
        margin-bottom: 14px;
      }
      .nfa-paywall-title {
        font-family: 'Oswald', Georgia, sans-serif; font-size: 26px;
        color: #fff; letter-spacing: 1px; margin-bottom: 8px; line-height: 1.2;
      }
      .nfa-paywall-sub {
        font-family: 'Open Sans', Arial, sans-serif; font-size: 13px;
        color: #aaa; margin-bottom: 24px; line-height: 1.6;
      }
      .nfa-paywall-btn {
        display: inline-block; background: #cc0000; color: #fff;
        text-decoration: none; padding: 14px 36px;
        font-family: 'Oswald', Georgia, sans-serif; font-size: 15px;
        letter-spacing: 1px; margin: 0 6px 10px; cursor: pointer; border: none;
      }
      .nfa-paywall-btn-gold {
        background: #c5a459; color: #0d1b2a;
      }
      .nfa-paywall-login {
        display: block; margin-top: 14px; font-size: 12px; color: #777;
      }
      .nfa-paywall-login a { color: #c5a459; text-decoration: none; }
      @media (max-width: 480px) {
        .nfa-paywall-title { font-size: 20px; }
        .nfa-paywall-btn { padding: 12px 24px; font-size: 13px; display: block; margin: 0 0 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function showPaywall(targetEl) {
    injectPaywallStyles();

    const wrap = document.createElement("div");
    wrap.className = "nfa-paywall-wrap";

    // Wrap the target element
    targetEl.parentNode.insertBefore(wrap, targetEl);
    wrap.appendChild(targetEl);
    targetEl.classList.add("nfa-paywall-blur");

    const overlay = document.createElement("div");
    overlay.className = "nfa-paywall-overlay";
    overlay.innerHTML = `
      <div class="nfa-paywall-badge">🔒 Members Only</div>
      <div class="nfa-paywall-title">Full Access — $9.99 / Month</div>
      <div class="nfa-paywall-sub">
        Unlock all NFA Investigations, No-Filter Zone videos,<br>
        True Crime case files, and deep-dive daily news.
      </div>
      <a href="${SUBSCRIBE_URL}" class="nfa-paywall-btn" target="_blank">Subscribe Now</a>
      <a href="${MEMBERS_URL}" class="nfa-paywall-btn nfa-paywall-btn-gold">I Already Subscribe</a>
      <span class="nfa-paywall-login">
        Have your access link? <a href="${MEMBERS_URL}">Click here to log in →</a>
      </span>
    `;
    wrap.appendChild(overlay);
  }

  function unlockPage() {
    // Remove any existing paywall elements
    document.querySelectorAll(".nfa-paywall-overlay").forEach(el => el.remove());
    document.querySelectorAll(".nfa-paywall-blur").forEach(el => {
      el.classList.remove("nfa-paywall-blur");
      el.style.maxHeight = "";
      el.style.overflow = "";
    });
    document.querySelectorAll(".nfa-paywall-wrap").forEach(wrap => {
      const parent = wrap.parentNode;
      while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
      parent.removeChild(wrap);
    });
  }

  async function checkAccess() {
    // Token from URL param or cookie
    const urlToken = getParam("token");
    const cookieToken = getCookie(COOKIE_NAME);
    const token = urlToken || cookieToken;

    if (!token) {
      applyPaywall();
      return;
    }

    try {
      const res = await fetch(VERIFY_URL + "?token=" + encodeURIComponent(token));
      const data = await res.json();

      if (data.valid) {
        // Save/refresh cookie
        setCookie(COOKIE_NAME, token, 30);
        unlockPage();
        // Clean URL if token was in params
        if (urlToken) {
          const clean = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, clean);
        }
      } else {
        applyPaywall();
      }
    } catch (e) {
      // On network error, show paywall to be safe
      applyPaywall();
    }
  }

  function applyPaywall() {
    // Find the main content area — try common selectors
    const targets = [
      document.querySelector(".content"),
      document.querySelector("main"),
      document.querySelector("article"),
      document.querySelector(".page-content"),
      document.querySelector(".gated-content"),
    ].filter(Boolean);

    if (targets.length > 0) {
      showPaywall(targets[0]);
    } else {
      // Fallback: gate the body's main sections after header
      const sections = document.querySelectorAll("section, .section, .story-body");
      if (sections.length > 0) {
        showPaywall(sections[0]);
      }
    }
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAccess);
  } else {
    checkAccess();
  }

})();
