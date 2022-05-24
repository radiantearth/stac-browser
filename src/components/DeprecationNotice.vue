<template>
	<b-alert :variant="variant" show>
		<strong>{{ title }}</strong>&nbsp;
		<small v-if="isDeprecated">
			Please note that this {{ type }} is deprecated with the potential to be removed in any of the next versions.
			It should be transitioned out of usage as soon as possible. Refrain from using it in new projects.
		</small>
		<small v-else>This {{ type }} is <em>not</em> deprecated, but there are other versions available:</small>
		<ul v-if="latestLink || successorLink || predecessorLink">
			<li v-if="latestLink"><small><StacLink :data="latestLink" fallbackTitle="Go to latest version" tooltip="Go to latest version" /></small></li>
			<li v-if="successorLink"><small><StacLink :data="successorLink" fallbackTitle="Go to newer version" tooltip="Go to newer version" /></small></li>
			<li v-if="predecessorLink"><small><StacLink :data="predecessorLink" fallbackTitle="Go to previous version" tooltip="Go to previous version" /></small></li>
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
		predecessorLink() {
			return !this.isDeprecated && this.getLink('predecessor-version'); // Show prev. link only if not deprecated
		},
		variant() {
			return this.isDeprecated ? 'warning' : 'info';
		},
		isDeprecated() {
			return Boolean(this.data.isItem() ? this.data.properties.deprecated : this.data.deprecated);
		},
		title() {
			if (this.isDeprecated) {
				return 'Deprecated';
			}
			else if (this.latestLink || this.successorLink) {
				return 'Outdated';
			}
			else {
				return 'Other Versions';
			}
		},
		type() {
			if (this.data.isItem()) {
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