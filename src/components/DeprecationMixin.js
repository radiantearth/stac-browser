export default {
  computed: {
    isDeprecated() {
      return Boolean(this.data.getMetadata('deprecated'));
    },
    showDeprecation() {
      return this.isDeprecated || this.latestLink || this.successorLink || this.predecessorLink;
    },
    latestLink() {
      return this.data.getStacLinkWithRel('latest-version');
    },
    successorLink() {
      const successor = this.data.getStacLinkWithRel('successor-version');
      if (successor && this.latestLink && successor.href === this.latestLink.href) {
        // Don't show successor if it's the same as latest
        return null;
      }
      return successor;
    },
    predecessorLink() {
      // Show prev. link only if not deprecated
      return !this.isDeprecated && this.data.getStacLinkWithRel('predecessor-version');
    }
  }
};
