<template>
  <div
    class="text-overflow"
    :class="{ 
      expanded: expanded,
      'no-overflow': inMaxRange 
    }"
  >
    <div ref="contentRef" class="text-overflow-content">
      <slot />
    </div>

    <div ref="shadowRef" class="hide-text" v-if="!noShadow" />

    <div @click="toggle" class="button-read-more" v-if="!noButton">
      <slot name="more" :open="expanded">
        <div class="read-more-button" :class="{ 'show-less': !noLess }">
          <span>{{ expanded ? textLess : text }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';

export default defineComponent({
  name: 'ReadMore',
  props: {
    lines: {
      type: Number,
      default: 3
    },
    gLines: {
      type: Number,
      default: null
    },
    maxLines: {
      type: Number,
      default: null
    },
    text: {
      type: String,
      default: 'Read more'
    },
    textLess: {
      type: String,
      default: 'Read less'
    },
    noLess: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: null
    },
    noButton: {
      type: Boolean,
      default: false
    },
    noShadow: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:open'],
  setup(props, { emit }) {
    const expanded = ref(false);
    const inMaxRange = ref(false);
    const contentRef = ref(null);
    const shadowRef = ref(null);
    const localMaxLines = ref(1);

    // Watch for open prop changes
    watch(() => props.open, (newVal) => {
      if (newVal !== null && newVal !== expanded.value) {
        toggle(!newVal);
      }
    });

    const getLineHeight = (element) => {
      if (!element || !element.children[0]) {return 20;} // fallback
      
      const temp = document.createElement(element.children[0].nodeName);
      const cpStyle = getComputedStyle(element.children[0]);
      
      temp.setAttribute(
        'style',
        `position:absolute;left:-999em;margin:0px;padding:0px;font-family:${cpStyle.fontFamily};font-size:${cpStyle.fontSize}`
      );
      temp.innerHTML = 'test';
      document.body.appendChild(temp);
      const ret = temp.clientHeight;
      temp.parentNode.removeChild(temp);
      return ret;
    };

    const toggle = (val) => {
      const valExp = typeof val === 'boolean' ? val : expanded.value;

      if (valExp) {
        if (!props.noLess) {
          contentRef.value.style.removeProperty('max-height');
          expanded.value = false;
          emit('update:open', false);
        }
      } else {
        expanded.value = true;
        emit('update:open', true);
        contentRef.value.style.setProperty(
          'max-height',
          contentRef.value.scrollHeight + 'px'
        );
      }
    };

    onMounted(() => {
      // Calculate local max lines
      if (props.lines && !props.maxLines) {
        localMaxLines.value = props.lines + 1;
      } else {
        localMaxLines.value = props.maxLines - 1;
      }

      // Set initial expanded state
      if (props.open === true) {
        expanded.value = true;
      }

      const lh = getLineHeight(contentRef.value);

      // Set CSS custom properties
      if (props.lines) {
        contentRef.value.style.setProperty('--nlines', props.lines);
      }

      // Calculate shadow gradient lines
      let gLines = 2;
      if (props.gLines) {
        gLines = props.gLines;
      } else if (props.lines > 12) {
        gLines = 4;
      } else if (props.lines > 6) {
        gLines = 3;
      }

      if (shadowRef.value) {
        shadowRef.value.style.setProperty('--nlines', gLines);
      }

      // Set initial expanded state styles
      if (props.open === true) {
        contentRef.value.style.setProperty('max-height', '100%');
      }

      // Use setTimeout to ensure content is rendered
      setTimeout(() => {
        const needsReadMore = contentRef.value.offsetHeight < contentRef.value.scrollHeight;

        if (contentRef.value.scrollHeight <= localMaxLines.value * lh) {
          inMaxRange.value = true;
        }

        contentRef.value.style.setProperty('--lineHeight', lh + 'px');
        
        if (shadowRef.value) {
          shadowRef.value.style.setProperty('--lineHeight', lh + 'px');
        }

        if (props.open === true) {
          contentRef.value.style.setProperty(
            'max-height',
            contentRef.value.scrollHeight + 'px'
          );
        }
      }, 0);
    });

    return {
      expanded,
      inMaxRange,
      contentRef,
      shadowRef,
      toggle
    };
  }
});
</script>

<style scoped lang="scss">
.text-overflow-content {
  --nlines: 3;
  --lineHeight: 1.5;
  max-height: calc(var(--nlines) * var(--lineHeight));
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.text-overflow {
  position: relative;
}

.no-overflow {
  .text-overflow-content {
    max-height: 100%;
    overflow: visible;
  }
  .hide-text,
  .button-read-more {
    display: none;
  }
}

.read-more-button {
  cursor: pointer;
  display: block;
  position: relative;
  border-top: 1px solid #dbdbdb;
  height: 0.1em;
  margin: 2em auto;
  width: 95%;
  text-align: center;

  span {
    background: #fff;
    color: #b5b5b5;
    display: inline-block;
    font-size: 0.75em;
    padding: 0.4em 0.8em;
    transform: translateY(-1.1em);
    text-align: center;
  }
}

.hide-text {
  --nlines: 6;
  --lineHeight: 1.5;
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 1) 90%,
    rgba(255, 255, 255, 1) 100%
  );
  width: 100%;
  height: calc(var(--nlines) * var(--lineHeight));
  position: absolute;
  transform: translateY(calc(var(--nlines) * -1 * var(--lineHeight)));
}

.hide-text,
.read-more-button {
  transition: opacity 0.3s ease, margin 0.3s ease;
  opacity: 1;
}

.expanded {
  .hide-text,
  .read-more-button:not(.show-less) {
    opacity: 0;
    margin-top: 0;
    margin-bottom: 0;
    pointer-events: none;
  }
}
</style>