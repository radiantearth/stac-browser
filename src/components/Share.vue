<template>
    <div class="share mt-1">
        <b-button-group>
            <b-button :disabled="!stacUrl" size="sm" variant="outline-primary" id="popover-link"><b-icon-link /></b-button>
            <b-button size="sm" variant="outline-primary" id="popover-share"><b-icon-share /></b-button>
        </b-button-group>
        <b-popover v-show="stacUrl" target="popover-link" triggers="click blur" placement="bottom" container="stac-browser" title="Source Data">
            <template v-if="stacVersion">
                <b-row>
                    <b-col cols="2">STAC Version:</b-col>
                    <b-col>{{ stacVersion }}</b-col>
                </b-row>
                <b-row v-if="stacLint">
                    <b-col cols="2">Valid:</b-col>
                    <b-col><Valid :stacUrl="stacUrl" /></b-col>
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
import Valid from './Valid.vue';

export default {
    name: "Share",
    components: {
        BIconEnvelope,
        BIconLink,
        BIconShare,
        BIconTwitter,
        BPopover,
        Url,
        Valid
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
        ...mapState(['stacLint']),
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