<template>
    <div class="share mt-1">
        <b-button-group>
            <b-button v-if="stacUrl" size="sm" variant="outline-primary" id="popover-link" title="Details about the STAC source"><b-icon-link /> <span class="button-label">Source</span></b-button>
            <b-button size="sm" variant="outline-primary" id="popover-share" title="Share this page with others"><b-icon-share /> <span class="button-label">Share</span></b-button>
        </b-button-group>
        <b-popover v-if="stacUrl" target="popover-link" triggers="click blur" placement="bottom" container="stac-browser" title="Source Data" @show="validate">
            <template v-if="stacVersion">
                <b-row>
                    <b-col cols="2">STAC Version:</b-col>
                    <b-col>{{ stacVersion }}</b-col>
                </b-row>
                <b-row v-if="canValidate">
                    <b-col cols="2">Valid:</b-col>
                    <b-col>
                        <b-spinner v-if="valid === null" label="Validating..." small></b-spinner>
                        <template v-else-if="valid === true">✔️</template>
                        <template v-else-if="valid === false">❌</template>
                        <template v-else>n/a</template>
                    </b-col>
                </b-row>
                <hr />
            </template>
            <Url id="stacUrl" :url="stacUrl" label="The STAC metdata file is located at:" />
        </b-popover>
        <b-popover target="popover-share" triggers="click blur" placement="bottom" container="stac-browser" title="Share">
            <Url id="browserUrl" :url="browserUrl()" label="Share the URL of this page anywhere you like:" :open="false" />
            <hr />
            <b-button class="twitter mr-1" :href="twitterUrl"><b-icon-twitter /> Twitter</b-button>
            <b-button variant="dark" :href="mailTo"><b-icon-envelope /> Mail</b-button>
        </b-popover>
    </div>
</template>

<script>
import { BIconEnvelope, BIconLink, BIconShare, BIconTwitter, BPopover } from 'bootstrap-vue';
import { mapState } from 'vuex';

import Url from './Url.vue';

import URI from 'urijs';
import Utils from '../utils';

export default {
    name: "Share",
    components: {
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
            default: null
        },
        stacVersion: {
            type: String,
            default: null
        }
    },
    computed: {
        ...mapState(['privateQueryParameters', 'stacLint', 'stacProxyUrl', 'valid']),
        canValidate() {
            if (!this.stacLint || typeof this.stacUrl !== 'string') {
                return false;
            }
            else if (Utils.size(this.privateQueryParameters) > 0) {
                // Don't expose private query parameters to externals
                return false;
            }
            else if (Array.isArray(this.stacProxyUrl)) {
                // Don't validate if a proxy has been set
                return false;
            }
            let uri = new URI(this.stacUrl);
            let host = uri.hostname().toLowerCase();
            if (host === 'localhost' || host.startsWith('127.') || host === '::1') {
                // Can't validate localhost
                return false;
            }
            return true;
        },
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
        async validate() {
            await this.$store.dispatch('validate', this.stacUrl);
        },
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