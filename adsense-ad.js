/**
 * Wreckship Reusable AdSense Ad Component
 * Client ID: ca-pub-5454138632654579
 * Slot ID: 1719684429
 */
(function (window) {
  'use strict';

  const DEFAULT_CLIENT = 'ca-pub-5454138632654579';
  const DEFAULT_SLOT = '1719684429';

  /**
   * Create an AdSense unit node safely with CLS-preventing container wrapper.
   */
  function createAdUnit(options) {
    options = options || {};
    const client = options.client || DEFAULT_CLIENT;
    const slot = options.slot || DEFAULT_SLOT;
    const format = options.format || 'auto';
    const responsive = options.responsive !== false ? 'true' : 'false';
    const className = options.className || '';
    const minHeight = options.minHeight || '100px';

    const container = document.createElement('div');
    container.className = ('wreckship-ad-container ' + className).trim();
    container.style.minHeight = minHeight;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slot);
    ins.setAttribute('data-ad-format', format);
    ins.setAttribute('data-full-width-responsive', responsive);

    container.appendChild(ins);

    // Safely trigger adsbygoogle push after insertion
    setTimeout(function () {
      try {
        if (ins && !ins.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.warn('AdSense push safe notice:', err);
      }
    }, 60);

    return container;
  }

  /**
   * Inject ad into target element
   */
  function renderAdInto(targetElement, options) {
    if (!targetElement) return null;
    targetElement.innerHTML = ''; // clear any prior ad node if re-rendering
    const adNode = createAdUnit(options);
    targetElement.appendChild(adNode);
    return adNode;
  }

  window.WreckshipAd = {
    create: createAdUnit,
    renderInto: renderAdInto,
    CLIENT_ID: DEFAULT_CLIENT,
    SLOT_ID: DEFAULT_SLOT
  };
})(window);
