<template>
  <div class="text-overflow" :class="{ expanded: expanded, 'no-overflow': inMaxRange }">
    <div ref="to" class="text-overflow-content">
      <slot />
    </div>
    <div ref="ht" class="hide-text" />
    <div @click="toggle" class="button-read-more">
      <div class="read-more-button">
        <span>{{ expanded ? textLess : text }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: "ReadMore",
  props: {
    lines: {
      type: Number,
      default: 3
    },
    text: {
      type: String,
      default: "Read more"
    },
    textLess: {
      type: String,
      default: "Read less"
    }
  },
  data() {
    return {
      readmore: false,
      expanded: false,
      inMaxRange: false
    };
  },
  mounted() {
    const lh = this.getLineHeight(this.$refs.to);

    if (this.lines) {
      this.$refs.to.style.setProperty("--nlines", this.lines);
    }
    let gLines = 2;
    if (this.lines > 12) {
      gLines = 4;
    } else if (this.lines > 6) {
      gLines = 3;
    }

    this.$refs.ht.style.setProperty("--nlines", gLines);

    setTimeout(() => {
      this.readmore = this.$refs.to.offsetHeight < this.$refs.to.scrollHeight;

      const localMaxLines = this.lines + 1 * lh;
      if (this.$refs.to.scrollHeight <= localMaxLines) {
        this.inMaxRange = true;
      }

      this.$refs.to.style.setProperty("--lineHeight", lh + "px");
      this.$refs.ht.style.setProperty("--lineHeight", lh + "px");
    });
  },
  methods: {
    toggle() {
      if (this.expanded) {
        this.$refs.to.style.removeProperty("max-height");
        this.expanded = false;
      } else {
        this.expanded = true;
        this.$refs.to.style.setProperty(
          "max-height",
          this.$refs.to.scrollHeight + "px"
        );
      }
    },
    getLineHeight(element) {
      let temp = document.createElement(element.children[0].nodeName);
      const cpStyle = getComputedStyle(element.children[0]);
      temp.setAttribute(
        "style",
        "position:absolute;left:-999em;margin:0px;padding:0px;font-family:" +
          cpStyle.fontFamily +
          ";font-size:" +
          cpStyle.fontSize
      );
      temp.innerHTML = "test";
      temp = document.body.appendChild(temp);
      const ret = temp.clientHeight;
      temp.parentNode.removeChild(temp);
      return ret;
    }
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
  margin: 0.5em auto 1.5em auto;
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
  //noinspection CssInvalidFunction
  transform: translateY(calc(var(--nlines) * -1 * var(--lineHeight)));
}

.hide-text,
.read-more-button {
  transition: opacity 0.3s ease, margin 0.3s ease;
  opacity: 1;
}

.expanded .hide-text {
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
  pointer-events: none;
}
</style>
