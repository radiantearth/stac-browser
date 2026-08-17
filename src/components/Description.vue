<template>
  <div class="styled-description" :class="{compact, inline}" v-html="formatted" />
</template>

<script>
import * as commonmark from 'commonmark';

export default {
  name: 'Description',
  props: {
    description: {
      type: String,
      default: ''
    },
    compact: {
      type: Boolean,
      default: false
    },
    inline: {
      type: Boolean,
      default: false
    },
    allowHTML: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    formatted: function() {
      return this.markup(this.description);
    }
  },
  methods: {
    markup(text) {
      if (typeof text !== 'string') {
        return '';
      }

      // Parse CommonMark
      let reader = new commonmark.Parser();
      let writer = new commonmark.HtmlRenderer({safe: !this.allowHTML, smart: true});
      let parsed = reader.parse(text);
      return writer.render(parsed);
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser .styled-description {
  line-height: $line-height-base;

  h1, h2, h3, h4, h5, h6 {
    color: var(--bs-secondary);
    font-weight: 600;
  }
  h1 {
    font-size: 1.5rem;
  }
  h2 {
    font-size: 1.4rem;
  }
  h3 {
    font-size: 1.3rem;
  }
  h4 {
    font-size: 1.2rem;
  }
  h5 {
    font-size: 1.1rem;
  }
  h6 {
    font-size: 1.0rem;
  }

  &.compact {
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      font-size: 1.1em;
      margin: 0 0 $headings-margin-bottom 0;
    }
    p {
      margin: 0 0 $paragraph-margin-bottom * 0.5 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
    pre {
      max-height: 8rem;
    }
  }

  &.inline {
    display: inline;
    p, pre, code, h1, h2, h3, h4, h5, h6 {
      display: inline;
    }
  }
}
</style>
