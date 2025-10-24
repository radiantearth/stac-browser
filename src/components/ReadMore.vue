<template>
  <div class="read-more" :class="{ expanded, 'hide-button': hideButton }">
    <div ref="content" class="content" :style="{ '--lines': lines }">
      <slot />
    </div>
    
    <div v-if="!noShadow" class="gradient" />
    
    <div v-if="!noButton" @click="toggle" class="toggle">
      <slot name="more" :open="expanded">
        <span>{{ expanded ? textLess : text }}</span>
      </slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, watch, nextTick } from 'vue';

export default defineComponent({
  name: 'ReadMore',
  props: {
    lines: { type: Number, default: 3 },
    text: { type: String, default: 'Read more' },
    textLess: { type: String, default: 'Read less' },
    noLess: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    noButton: { type: Boolean, default: false },
    noShadow: { type: Boolean, default: false }
  },
  emits: ['update:open'],
  setup(props, { emit }) {
    const expanded = ref(props.open);
    const hideButton = ref(false);
    const content = ref(null);

    watch(() => props.open, (val) => expanded.value = val);

    const toggle = () => {
      if (expanded.value && props.noLess) return;
      expanded.value = !expanded.value;
      emit('update:open', expanded.value);
    };

    const checkOverflow = async () => {
      await nextTick();
      if (!content.value) return;
      
      const style = getComputedStyle(content.value);
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
      const maxHeight = lineHeight * props.lines;
      
      hideButton.value = content.value.scrollHeight <= maxHeight;
    };

    onMounted(checkOverflow);

    return { expanded, hideButton, content, toggle };
  }
});
</script>

<style scoped>
.read-more {
  position: relative;
}

.content {
  max-height: calc(var(--lines) * 1.4em);
  overflow: hidden;
  transition: max-height 0.3s ease;
  line-height: 1.4;
}

.expanded .content {
  max-height: none;
}

.gradient {
  position: absolute;
  bottom: 3em;
  left: 0;
  right: 0;
  height: 2em;
  background: linear-gradient(transparent, white);
  pointer-events: none;
}

.expanded .gradient,
.hide-button .gradient,
.hide-button .toggle {
  display: none;
}

.toggle {
  cursor: pointer;
  text-align: center;
  margin-top: 1em;
  padding: 0.5em;
  border-top: 1px solid #ddd;
  color: #666;
  font-size: 0.9em;
}

.toggle:hover {
  color: #333;
}
</style>