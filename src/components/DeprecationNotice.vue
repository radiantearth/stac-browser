<template>
	<b-alert variant="warning" show>
		<strong>Deprecated</strong>&nbsp;
		<small>Please note that this {{ type }} is deprecated with the potential to be removed in any of the next versions. It should be transitioned out of usage as soon as possible. Refrain from using it in new projects.</small>
		<ul v-if="latestLink || successorLink">
			<li v-if="latestLink"><small><StacLink :link="latestLink" fallbackTitle="Go to latest version" /></small></li>
			<li v-if="successorLink"><small><StacLink :link="successorLink" fallbackTitle="Go to successor version" /></small></li>
		</ul>
	</b-alert>
</template>

<script>
import Utils from '../utils';

export default {
	name: 'DeprecationNotice',
	components: {
		StacLink: () => import('./StacLink.vue')
	},
	props: {
		data: {
			type: Object,
			default: null
		}
	},
	computed: {
		latestLink() {
			return this.getLink('latest-version');
		},
		successorLink() {
			return this.getLink('successor-version');
		},
		type() {
			if (!this.data) {
				return "";
			}
			else if (this.data.isItem()) {
				return "Item";
			}
			else {
				return this.data.type;
			}
		}
	},
  methods: {
    getLink(rel) {
      let links = this.data.getLinksWithRels(rel).filter(link => Utils.isStacMediaType(link.type, true));
			if (links.length > 0) {
				return links[0]
			}
			else {
				return null;
			}
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
	margin-top: 0.5em;
	margin-bottom: 0;
}
</style>