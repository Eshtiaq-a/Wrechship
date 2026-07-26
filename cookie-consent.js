/**
 * Wreckship Cookie Consent & Google Consent Mode v2 Manager
 */
(function () {
  const STORAGE_KEY = 'wreckship_cookie_consent';

  function updateConsent(consentState) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', consentState);
    }
  }

  function getStoredConsent() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Unable to save cookie consent preference', e);
    }
  }

  function createConsentState(analytics, advertising) {
    const grantedOrDenied = (val) => (val ? 'granted' : 'denied');
    return {
      analytics_storage: grantedOrDenied(analytics),
      ad_storage: grantedOrDenied(advertising),
      ad_user_data: grantedOrDenied(advertising),
      ad_personalization: grantedOrDenied(advertising)
    };
  }

  function initConsentUI() {
    if (document.getElementById('wreckshipConsentBanner')) return;

    const stored = getStoredConsent();

    // Banner Element
    const banner = document.createElement('div');
    banner.id = 'wreckshipConsentBanner';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie Consent Notice');

    banner.innerHTML = `
      <div class="consent-banner-content">
        <div class="consent-banner-text">
          <h3 class="consent-banner-title">Cookie & Privacy Choices</h3>
          <p class="consent-banner-desc">
            Wreckship uses essential cookies to operate. We may also use analytics & advertising cookies (including Google AdSense) to understand site usage and deliver personalized ads. You can accept all, reject non-essential cookies, or customize your preferences anytime. View our <a href="privacy/">Privacy Policy</a> and <a href="cookies/">Cookie Policy</a>.
          </p>
        </div>
        <div class="consent-banner-actions">
          <button id="consentAcceptAll" class="consent-btn consent-btn-primary">Accept All</button>
          <button id="consentRejectNonEssential" class="consent-btn consent-btn-secondary">Reject Non-Essential</button>
          <button id="consentCustomize" class="consent-btn consent-btn-outline">Customize</button>
        </div>
      </div>
    `;

    // Modal Element
    const modal = document.createElement('div');
    modal.id = 'wreckshipConsentModal';
    modal.className = 'consent-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'consentModalTitle');
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="consent-modal-content">
        <div class="consent-modal-header">
          <h2 id="consentModalTitle" class="consent-modal-title">Cookie Preferences</h2>
          <button id="consentModalClose" class="consent-modal-close" aria-label="Close cookie settings">&times;</button>
        </div>
        <div class="consent-modal-body">
          <p class="consent-modal-intro">Manage your privacy choices below. Essential cookies are required for fundamental site operation and cannot be disabled.</p>

          <div class="consent-category">
            <div class="consent-category-header">
              <label class="consent-toggle-label">
                <input type="checkbox" checked disabled>
                <span class="consent-toggle-title">Essential Cookies</span>
              </label>
              <span class="consent-badge">Always Active</span>
            </div>
            <p class="consent-category-desc">Required for security, site navigation, and 3D map rendering.</p>
          </div>

          <div class="consent-category">
            <div class="consent-category-header">
              <label class="consent-toggle-label">
                <input type="checkbox" id="consentAnalyticsToggle">
                <span class="consent-toggle-title">Analytics Cookies</span>
              </label>
            </div>
            <p class="consent-category-desc">Allows us to analyze site performance, vessel searches, and traffic trends to improve Wreckship.</p>
          </div>

          <div class="consent-category">
            <div class="consent-category-header">
              <label class="consent-toggle-label">
                <input type="checkbox" id="consentAdToggle">
                <span class="consent-toggle-title">Advertising & Personalization Cookies</span>
              </label>
            </div>
            <p class="consent-category-desc">Used by advertising partners (including Google AdSense) to serve, measure, limit, and personalize advertisements.</p>
          </div>
        </div>
        <div class="consent-modal-footer">
          <button id="consentSaveCustom" class="consent-btn consent-btn-primary">Save Preferences</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    document.body.appendChild(modal);

    if (!stored) {
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }

    const analyticsToggle = document.getElementById('consentAnalyticsToggle');
    const adToggle = document.getElementById('consentAdToggle');

    function applyConsent(analytics, advertising) {
      const state = createConsentState(analytics, advertising);
      saveConsent(state);
      updateConsent(state);
      banner.style.display = 'none';
      modal.style.display = 'none';
    }

    document.getElementById('consentAcceptAll').addEventListener('click', function () {
      applyConsent(true, true);
    });

    document.getElementById('consentRejectNonEssential').addEventListener('click', function () {
      applyConsent(false, false);
    });

    document.getElementById('consentCustomize').addEventListener('click', function () {
      const current = getStoredConsent() || { analytics_storage: 'denied', ad_storage: 'denied' };
      analyticsToggle.checked = current.analytics_storage === 'granted';
      adToggle.checked = current.ad_storage === 'granted';
      modal.style.display = 'flex';
    });

    document.getElementById('consentModalClose').addEventListener('click', function () {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    document.getElementById('consentSaveCustom').addEventListener('click', function () {
      applyConsent(analyticsToggle.checked, adToggle.checked);
    });

    // Global listener for Cookie Settings links
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a[href="#cookie-settings"], .open-cookie-settings, [data-open-cookie-settings]');
      if (target) {
        e.preventDefault();
        const current = getStoredConsent() || { analytics_storage: 'denied', ad_storage: 'denied' };
        analyticsToggle.checked = current.analytics_storage === 'granted';
        adToggle.checked = current.ad_storage === 'granted';
        modal.style.display = 'flex';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsentUI);
  } else {
    initConsentUI();
  }
})();
