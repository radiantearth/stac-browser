<template>
    <div class="share mt-1">
        <b-button-group>
            <b-button size="sm" variant="primary" id="popover-link"><b-icon-link /></b-button>
            <b-button size="sm" variant="primary" id="popover-share"><b-icon-share /></b-button>
        </b-button-group>
        <b-popover target="popover-link" triggers="hover" placement="bottom" container="body" title="URL to Source Data">
            <Url id="stacUrl" :url="stacUrl" label="The STAC metdata file is located at:" />
        </b-popover>
        <b-popover target="popover-share" triggers="hover" placement="bottom" container="body" title="Share">
            <Url id="stacUrl" :url="browserUrl()" label="Share the URL of this page anywhere you like:" :open="false" />
            <hr />
            <b-button class="twitter mr-1" :href="twitterUrl"><b-icon-twitter /> Twitter</b-button>
            <b-button variant="dark" :href="mailTo"><b-icon-envelope /> Mail</b-button>
        </b-popover>
    </div>
</template>

<script>
import { 
    BButton, BButtonGroup,
    BIconEnvelope, BIconLink, BIconShare, BIconTwitter,
    BPopover } from 'bootstrap-vue';

import Url from './Url.vue';

export default {
    name: "Share",
    components: {
        BButton,
        BButtonGroup,
        BIconEnvelope,
        BIconLink,
        BIconShare,
        BIconTwitter,
        BPopover,
        Url
    },
    props: {
        title: {
            type: String,
            required: true
        },
        stacUrl: {
            type: String,
            required: true
        }
    },
    computed: {
        message() {
            return `${this.title} is available at ${this.browserUrl()}`;
        },
        twitterUrl() {
            let text = encodeURIComponent(this.message);
            return `https://twitter.com/intent/tweet?text=${text}`;
        },
        mailTo() {
            let title = encodeURIComponent(this.title);
            let text = encodeURIComponent(this.message);
            return `mailto:?subject=${title}&body=${text}`;
        }
    },
    methods: {
        browserUrl() {
            return window.location.toString();
        }
    }
}
</script>

<style lang="scss" scoped>
.popover {
    width: 100%;
    max-width: 800px;
}
</style>