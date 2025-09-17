<template>
  <div class="teleport-popover-trigger" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide">
    <slot name="trigger" />
    
    <Teleport to="#stac-browser" v-if="isVisible">
      <div 
        ref="popover"
        class="teleport-popover"
        :class="customClass"
        :style="popoverStyle"
        @mouseenter="cancelHide"
        @mouseleave="hide"
      >
        <div class="popover-arrow" :style="arrowStyle"></div>
        <div class="popover-header" v-if="title">
          {{ title }}
        </div>
        <div class="popover-body">
          <slot name="content" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
export default {
  name: 'TeleportPopover',
  props: {
    title: {
      type: String,
      default: null
    },
    placement: {
      type: String,
      default: 'right',
      validator: value => ['top', 'bottom', 'left', 'right'].includes(value)
    },
    customClass: {
      type: String,
      default: ''
    },
    offset: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      isVisible: false,
      popoverStyle: {},
      arrowStyle: {},
      hideTimeout: null
    };
  },
  methods: {
    show() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      
      this.isVisible = true;
      this.$emit('show');
      this.$nextTick(() => {
        this.updatePosition();
      });
    },
    
    hide() {
      this.hideTimeout = setTimeout(() => {
        this.isVisible = false;
      }, 100); // Small delay to allow moving to popover
    },
    
    cancelHide() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    },
    
    updatePosition() {
      if (!this.$refs.popover || !this.$el) return;
      
      const trigger = this.$el;
      const popover = this.$refs.popover;
      const triggerRect = trigger.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top, left, arrowTop, arrowLeft;
      
      switch (this.placement) {
        case 'right':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.right + this.offset;
          arrowTop = popoverRect.height / 2 - 6;
          arrowLeft = -6;
          break;
          
        case 'left':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.left - popoverRect.width - this.offset;
          arrowTop = popoverRect.height / 2 - 6;
          arrowLeft = popoverRect.width - 6;
          break;
          
        case 'top':
          top = triggerRect.top - popoverRect.height - this.offset;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          arrowTop = popoverRect.height - 6;
          arrowLeft = popoverRect.width / 2 - 6;
          break;
          
        case 'bottom':
          top = triggerRect.bottom + this.offset;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          arrowTop = -6;
          arrowLeft = popoverRect.width / 2 - 6;
          break;
      }
      
      // Viewport boundary adjustments
      if (left < 0) left = 10;
      if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - 10;
      }
      if (top < 0) top = 10;
      if (top + popoverRect.height > viewportHeight) {
        top = viewportHeight - popoverRect.height - 10;
      }
      
      this.popoverStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1060
      };
      
      this.arrowStyle = {
        position: 'absolute',
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`
      };
    }
  },
  
  beforeUnmount() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
};
</script>

<style scoped>
.teleport-popover-trigger {
  display: inline-block;
}

.teleport-popover {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  width: max-content;
  max-width: 90vw;
}

.popover-header {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0;
  font-size: 0.875rem;
  color: #495057;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: calc(0.375rem - 1px) calc(0.375rem - 1px) 0 0;
}

.popover-body {
  padding: 0.75rem;
  color: #212529;
  white-space: nowrap;
  min-width: max-content;
}

.popover-arrow {
  width: 12px;
  height: 12px;
  background: white;
  border: 1px solid #dee2e6;
  transform: rotate(45deg);
}

/* Custom styling similar to Bootstrap Vue popover */
.teleport-popover.link-more {
  width: auto;
  max-width: 600px;
}

.teleport-popover.link-more .popover-body h3 {
  font-size: 0.85rem;
  color: #6c757d;
  text-align: center;
  padding: 0;
  font-weight: 600;
  margin: 1rem 0 0.7rem;
}

.teleport-popover.link-more .popover-body h3.first {
  margin-top: 0;
}

.teleport-popover.link-more .metadata {
  min-width: 400px;
}
</style>
