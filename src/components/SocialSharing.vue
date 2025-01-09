<template>
  <section>
    <b-button v-for="href, service in urls" :key="service" class="service mr-1" :class="service" :href="href" target="_blank">
      <component :is="service" /> {{ $t(`source.share.${service}`) }}
    </b-button>
  </section>
</template>


<script>
import { BIconEnvelope as Email } from 'bootstrap-vue';
import { mapState } from 'vuex';


export default {
  name: "Source",
  components: {
    Email,
    Bsky: () => import('../media/bsky.svg'),
    Mastodon: () => import('../media/mastodon.svg'),
    X: () => import('../media/x.svg'),
  },
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
.service svg {
  vertical-align: sub;
  height: 16px;
  width: auto;
}
</style>
