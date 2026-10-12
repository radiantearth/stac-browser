import Utils from "../utils";

function getScrollTop(target) {
  return target === window ? window.scrollY : target.scrollTop;
}

// Drives the page's sticky header: exposes `scrolled` (whether the content has
// scrolled past the top, for the shadow/border) and `hideSite` (whether the
// site row is slid out of view when scrolling down on small screens). The host
// component binds `scrolled` / `hideSite` to its header element and calls
//
// Usage:
// setupStickyHeader(headerEl) with that element once it exists.
export default {
  data() {
    return {
      scrolled: false,
      hideSite: false
    };
  },
  beforeUnmount() {
    if (this.scrollTarget && this.scrollHandler) {
      this.scrollTarget.removeEventListener('scroll', this.scrollHandler);
    }
    this.scrollTarget = null;
    this.scrollHandler = null;
  },
  methods: {
    getScrollTop(target) {
      return target === window ? window.scrollY : target.scrollTop;
    },
    setupStickyHeader(header) {
      if (!header) {
        return;
      }
      const target = Utils.resolveScrollTarget(header);
      this.scrollTarget = target;
      let lastScrollY = getScrollTop(target);
      let sticky = false;
      this.scrollHandler = () => {
        // The header is only sticky when built that way, and the web component's
        // stylesheet may still be loading when this first runs — so check live
        // (once) rather than gating setup on the position at mount time.
        if (!sticky) {
          if (window.getComputedStyle(header).position !== 'sticky') {
            return;
          }
          sticky = true;
        }
        const y = Math.max(getScrollTop(target), 0); // clamp for overscroll bounce
        this.scrolled = y > 0;

        // Hide the site row when scrolling down, bring it back when scrolling up.
        const delta = y - lastScrollY;
        lastScrollY = y;
        const site = header.querySelector('.site');
        if (!site) {
          this.hideSite = false;
          return;
        }
        if (delta > 0 && y > site.offsetHeight && !this.hideSite) {
          // Measure on each hide so the offset follows the current row height
          header.style.setProperty('--sb-site-height', `${site.offsetHeight}px`);
          this.hideSite = true;
        }
        else if (delta < 0 && this.hideSite) {
          this.hideSite = false;
        }
      };
      target.addEventListener('scroll', this.scrollHandler, { passive: true });
      // Initialize once, e.g. when loaded already scrolled down.
      this.scrollHandler();
    }
  }
};
