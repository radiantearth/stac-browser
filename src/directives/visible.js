/**
 * v-visible directive - replacement for v-b-visible from Bootstrap Vue 2
 * 
 * Usage:
 * - v-visible="callback" - triggers when element becomes visible
 * - v-visible.once="callback" - triggers only once when element becomes visible
 * - v-visible.100="callback" - triggers when the element is within 100px of the viewport (100px root margin)
 * - v-visible.0.5="callback" - triggers when 50% of the element is visible (intersection ratio threshold)
 * 
 * The callback receives two parameters:
 *   - isVisible (boolean): true if the element is visible/intersecting
 *   - entry (IntersectionObserverEntry): the observer entry object
 */

const observerMap = new WeakMap();

function createObserver(el, binding) {
  // Parse modifiers for threshold and options
  const modifiers = Object.keys(binding.modifiers);
  let threshold = 0;
  let rootMargin = '0px';
  let once = false;

  // Check for 'once' modifier
  if (modifiers.includes('once')) {
    once = true;
  }

  // Parse numeric modifiers for threshold or rootMargin
  for (const modifier of modifiers) {
    const num = parseFloat(modifier);
    if (!isNaN(num)) {
      if (num > 1) {
        // Values > 1 are treated as pixel margins
        rootMargin = `${num}px`;
      } else {
        // Values 0-1 are treated as intersection ratio thresholds
        threshold = num;
      }
    }
  }

  const options = {
    root: null, // viewport
    rootMargin,
    threshold
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const isVisible = entry.isIntersecting;
      
      if (typeof binding.value === 'function') {
        binding.value(isVisible, entry);
      }

      // If 'once' modifier is used and element is visible, disconnect observer
      if (once && isVisible) {
        observer.unobserve(el);
        observerMap.delete(el);
      }
    });
  }, options);

  return observer;
}

export default {
  mounted(el, binding) {
    // Don't observe if no callback provided
    if (typeof binding.value !== 'function') {
      return;
    }

    const observer = createObserver(el, binding);
    observer.observe(el);
    observerMap.set(el, observer);
  },

  updated(el, binding) {
    // If the callback changes, recreate the observer
    if (binding.value !== binding.oldValue) {
      const oldObserver = observerMap.get(el);
      if (oldObserver) {
        oldObserver.unobserve(el);
        observerMap.delete(el);
      }

      if (typeof binding.value === 'function') {
        const observer = createObserver(el, binding);
        observer.observe(el);
        observerMap.set(el, observer);
      }
    }
  },

  unmounted(el) {
    const observer = observerMap.get(el);
    if (observer) {
      observer.unobserve(el);
      observerMap.delete(el);
    }
  }
};
