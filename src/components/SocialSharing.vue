<template>
  <section>
    <b-button v-for="href, service in urls" :key="service" class="service mr-1" :class="service" :href="href" target="_blank">
      <i class="svg" :class="service" /> {{ $t(`source.share.${service}`) }}
    </b-button>
  </section>
</template>


<script>
import { mapState } from 'vuex';

export default {
  name: "Source",
  props: {
    text: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      urlTemplates: {
        email: 'mailto:?subject={title}&body={text}',
        bsky: 'https://bsky.app/intent/compose?text={text}',
        mastodon: 'https://mastodon.social/share?text={text}',
        x: 'https://x.com/intent/tweet?text={text}'
      }
    };
  },
  computed: {
    ...mapState(['socialSharing']),
    urls() {
      const uriText = encodeURIComponent(this.text);
      const uriTitle = encodeURIComponent(this.title);
      const uriUrl = encodeURIComponent(this.url);
      const urls = {};
      for (const id of this.socialSharing) {
        if (!this.urlTemplates[id]) {
          continue;
        }
        const url = this.urlTemplates[id];
        urls[id] = url
          .replace('{text}', uriText)
          .replace('{title}', uriTitle)
          .replace('{url}', uriUrl);
      }
      return urls;
    }
  }
};
</script>

<style lang="scss" scoped>
.service .svg {
  display: inline-block;
  vertical-align: sub;
  height: 1em;
  width: 1em;
  background-color: #fff;
  mask-size: 1em 1em;
  mask-repeat: no-repeat;
  mask-position: center;

  &.email {
    mask-image: url('@/media/email.svg');
  }
  &.bsky {
    mask-image: url('@/media/bsky.svg');
  }
  &.mastodon {
    mask-image: url('@/media/mastodon.svg');
  }
  &.x {
    mask-image: url('@/media/x.svg');
  }
}
</style>
