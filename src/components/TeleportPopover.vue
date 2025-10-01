<template>
  <!-- Keep trigger in original location for layout -->
  <div ref="triggerRef" class="teleport-popover-trigger">
    <slot name="trigger" />
  </div>
  
  <!-- Teleport custom popover content to preserve full Vue context -->
  <Teleport to="#stac-browser">
    <div
      v-if="isVisible"
      ref="popoverElement"
      :class="['popover', 'bs-popover-' + placement, customClass]"
      :style="popoverStyle"
      role="tooltip"
      @mouseenter="onPopoverMouseEnter"
      @mouseleave="onPopoverMouseLeave"
    >
      <div class="popover-arrow" :style="arrowStyle" />
      <h3 v-if="title" class="popover-header">{{ title }}</h3>
      <div class="popover-body">
        <slot name="content" />
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'TeleportPopover',
  props: {
    title: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'bottom',
      validator: value => ['top', 'bottom', 'left', 'right'].includes(value)
    },
    customClass: {
      type: String,
      default: ''
    },
    triggerMode: {
      type: String,
      default: 'hover',
      validator: value => ['hover', 'manual'].includes(value)
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['show', 'hide'],
  data() {
    return {
      isVisible: false,
      popoverStyle: {},
      arrowStyle: {},
      hideTimeout: null,
      scrollTimeout: null
    };
  },
  watch: {
    show: {
      immediate: true,
      handler(newValue) {
        if (this.triggerMode === 'manual') {
          if (newValue) {
            this.showPopover();
          } else {
            this.hidePopover();
          }
        }
      }
    }
  },
  mounted() {
    if (this.triggerMode === 'hover') {
      this.$refs.triggerRef.addEventListener('mouseenter', this.onTriggerMouseEnter);
      this.$refs.triggerRef.addEventListener('mouseleave', this.onTriggerMouseLeave);
      this.$refs.triggerRef.addEventListener('focusin', this.onTriggerMouseEnter);
      this.$refs.triggerRef.addEventListener('focusout', this.onTriggerMouseLeave);
    }
    
    // Add scroll listener to update position during scroll
    window.addEventListener('scroll', this.onScroll, true);
    window.addEventListener('resize', this.onScroll);
  },
  beforeUnmount() {
    if (this.triggerMode === 'hover') {
      this.$refs.triggerRef?.removeEventListener('mouseenter', this.onTriggerMouseEnter);
      this.$refs.triggerRef?.removeEventListener('mouseleave', this.onTriggerMouseLeave);
      this.$refs.triggerRef?.removeEventListener('focusin', this.onTriggerMouseEnter);
      this.$refs.triggerRef?.removeEventListener('focusout', this.onTriggerMouseLeave);
    }
    
    // Remove scroll and resize listeners
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onScroll);
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.scrollTimeout) {
      cancelAnimationFrame(this.scrollTimeout);
    }
  },
  methods: {
    onTriggerMouseEnter() {
      if (this.triggerMode === 'hover') {
        this.showPopover();
      }
    },
    onTriggerMouseLeave() {
      if (this.triggerMode === 'hover') {
        this.scheduleHide();
      }
    },
    onPopoverMouseEnter() {
      if (this.triggerMode === 'hover') {
        this.cancelHide();
      }
    },
    onPopoverMouseLeave() {
      if (this.triggerMode === 'hover') {
        this.scheduleHide();
      }
    },
    onScroll() {
      if (this.isVisible) {
        // Throttle scroll updates for better performance
        if (this.scrollTimeout) {
          cancelAnimationFrame(this.scrollTimeout);
        }
        this.scrollTimeout = requestAnimationFrame(() => {
          this.updatePosition();
        });
      }
    },
    showPopover() {
      this.cancelHide();
      this.isVisible = true;
      this.$emit('show');
      this.$nextTick(() => {
        this.updatePosition();
      });
    },
    hidePopover() {
      this.isVisible = false;
      this.$emit('hide');
    },
    scheduleHide() {
      this.hideTimeout = setTimeout(() => {
        this.hidePopover();
      }, 100);
    },
    cancelHide() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    },
    updatePosition() {
      if (!this.$refs.popoverElement || !this.$refs.triggerRef) {return;}
      
      const trigger = this.$refs.triggerRef;
      const popover = this.$refs.popoverElement;
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const offset = 8;
      
      let top, left, arrowTop = '50%', arrowLeft = '50%';
      
      switch (this.placement) {
        case 'top':
          top = triggerRect.top - popoverRect.height - offset;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          arrowTop = '100%';
          arrowLeft = '50%';
          break;
        case 'bottom':
          top = triggerRect.bottom + offset;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          arrowTop = '-6px';
          arrowLeft = '50%';
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.left - popoverRect.width - offset;
          arrowTop = '50%';
          arrowLeft = '100%';
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.right + offset;
          arrowTop = '50%';
          arrowLeft = '-6px';
          break;
      }
      
      // Ensure popover stays within viewport
      const margin = 10;
      if (left < margin) {left = margin;}
      if (left + popoverRect.width > window.innerWidth - margin) {
        left = window.innerWidth - popoverRect.width - margin;
      }
      if (top < margin) {top = margin;}
      if (top + popoverRect.height > window.innerHeight - margin) {
        top = window.innerHeight - popoverRect.height - margin;
      }
      
      this.popoverStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1060
      };
      
      this.arrowStyle = {
        top: arrowTop,
        left: arrowLeft,
        transform: 'translate(-50%, -50%)'
      };
    }
  }
};
</script>

<style scoped>
.teleport-popover-trigger {
  display: inline-block;
}

/* Bootstrap popover styling */
.popover {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1060;
  display: block;
  max-width: 276px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-style: normal;
  font-weight: 400;
  line-height: 1.5;
  text-align: left;
  text-decoration: none;
  text-shadow: none;
  text-transform: none;
  letter-spacing: normal;
  word-break: normal;
  word-spacing: normal;
  white-space: normal;
  line-break: auto;
  font-size: 0.875rem;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
}

.popover-arrow {
  position: absolute;
  display: block;
  width: 1rem;
  height: 0.5rem;
}

.popover-arrow::before,
.popover-arrow::after {
  position: absolute;
  display: block;
  content: "";
  border-color: transparent;
  border-style: solid;
}

.bs-popover-top .popover-arrow,
.bs-popover-auto[x-placement^="top"] .popover-arrow {
  bottom: calc((0.5rem + 1px) * -1);
}

.bs-popover-top .popover-arrow::before,
.bs-popover-auto[x-placement^="top"] .popover-arrow::before {
  bottom: 0;
  border-width: 0.5rem 0.5rem 0;
  border-top-color: rgba(0, 0, 0, 0.25);
}

.bs-popover-top .popover-arrow::after,
.bs-popover-auto[x-placement^="top"] .popover-arrow::after {
  bottom: 1px;
  border-width: 0.5rem 0.5rem 0;
  border-top-color: #fff;
}

.bs-popover-right .popover-arrow,
.bs-popover-auto[x-placement^="right"] .popover-arrow {
  left: calc((0.5rem + 1px) * -1);
  width: 0.5rem;
  height: 1rem;
}

.bs-popover-right .popover-arrow::before,
.bs-popover-auto[x-placement^="right"] .popover-arrow::before {
  left: 0;
  border-width: 0.5rem 0.5rem 0.5rem 0;
  border-right-color: rgba(0, 0, 0, 0.25);
}

.bs-popover-right .popover-arrow::after,
.bs-popover-auto[x-placement^="right"] .popover-arrow::after {
  left: 1px;
  border-width: 0.5rem 0.5rem 0.5rem 0;
  border-right-color: #fff;
}

.bs-popover-bottom .popover-arrow,
.bs-popover-auto[x-placement^="bottom"] .popover-arrow {
  top: calc((0.5rem + 1px) * -1);
}

.bs-popover-bottom .popover-arrow::before,
.bs-popover-auto[x-placement^="bottom"] .popover-arrow::before {
  top: 0;
  border-width: 0 0.5rem 0.5rem 0.5rem;
  border-bottom-color: rgba(0, 0, 0, 0.25);
}

.bs-popover-bottom .popover-arrow::after,
.bs-popover-auto[x-placement^="bottom"] .popover-arrow::after {
  top: 1px;
  border-width: 0 0.5rem 0.5rem 0.5rem;
  border-bottom-color: #fff;
}

.bs-popover-left .popover-arrow,
.bs-popover-auto[x-placement^="left"] .popover-arrow {
  right: calc((0.5rem + 1px) * -1);
  width: 0.5rem;
  height: 1rem;
}

.bs-popover-left .popover-arrow::before,
.bs-popover-auto[x-placement^="left"] .popover-arrow::before {
  right: 0;
  border-width: 0.5rem 0 0.5rem 0.5rem;
  border-left-color: rgba(0, 0, 0, 0.25);
}

.bs-popover-left .popover-arrow::after,
.bs-popover-auto[x-placement^="left"] .popover-arrow::after {
  right: 1px;
  border-width: 0.5rem 0 0.5rem 0.5rem;
  border-left-color: #fff;
}

.popover-header {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0;
  font-size: 1rem;
  color: inherit;
  background-color: #f7f7f7;
  border-bottom: 1px solid #ebebeb;
  border-top-left-radius: calc(0.3rem - 1px);
  border-top-right-radius: calc(0.3rem - 1px);
}

.popover-header:empty {
  display: none;
}

.popover-body {
  padding: 0.5rem 0.75rem;
  color: #212529;
}
</style>
