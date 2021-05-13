<template>
<div class="table-responsive metadata">
    <table class="table">
        <tbody>
            <tr>
                <td class="group" colspan="2">
                <h4>Metadata</h4>
                </td>
            </tr>
            <tr v-if="stacVersion">
                <td class="title">STAC Version</td>
                <td>{{ stacVersion }}</td>
            </tr>
            <tr v-if="keywords.length > 0">
                <td class="title">Keywords</td>
                <td>{{ keywords.join(', ') }}</td>
            </tr>
            <tr v-if="collectionLink">
            <td class="title">Collection</td>
                <td>
                    <router-link :to="linkToCollection">
                    {{ collectionTitle }}
                    </router-link>
                </td>
            </tr>
            <tr v-if="license">
                <td class="title">License</td>
                <td v-html="license" />
            </tr>
            <tr v-if="temporalExtentReadable.length > 0">
                <td class="title">Temporal Extent</td>
                <td>{{ temporalExtentReadable }}</td>
            </tr>
            <template v-for="group in propertyList">
                <tr v-if="group.extension" :key="group.extension">
                    <td class="group" colspan="2">
                        <h4 v-html="group.label" />
                    </td>
                </tr>
                <tr v-for="(prop, key) in group.properties" :key="key">
                    <td class="title" :title="key" v-html="prop.label" />
                    <td v-html="prop.formatted" />
                </tr>
            </template>
            <template v-if="Array.isArray(providers) && providers.length > 0">
                <tr>
                <td colspan="2" class="group">
                    <h4>
                    <template v-if="providers.length === 1">
                        Provider
                    </template>
                    <template v-if="providers.length !== 1">
                        Providers
                    </template>
                    </h4>
                </td>
                </tr>
                <tr>
                    <td colspan="2" class="provider" v-html="providerHtml" />
                </tr>
            </template>
            <template v-if="hasSummary">
                <tr>
                <td colspan="2" class="group summary">
                    <h4>Item Summary</h4>
                </td>
                </tr>
                <template v-for="group in summariesList">
                    <tr v-if="group.extension" :key="group.extension">
                        <td class="group" colspan="2">
                            <h4 v-html="group.label" />
                        </td>
                    </tr>
                    <tr v-for="(prop, key) in group.properties" :key="key">
                        <td class="title summary-title" :title="key" v-html="prop.label" />
                        <td v-html="prop.formatted" />
                    </tr>
                </template>
            </template>
        </tbody>
    </table>
</div>
</template>

<script>
import StacFields from "@radiantearth/stac-fields";

export default {
    name: "MetadataSidebar",
    props: {
        properties: {
            type: Object,
            default: () => ({})
        },
        summaries: {
            type: Object,
            default: () => ({})
        },
        stacVersion: {
            type: String
        },
        keywords: {
            type: Array,
            default: () => ([])
        },
        collection: { // Item-specific
            type: Object,
            default: () => ({})
        },
        collectionLink: {}, // Item-specific
        license: {},
        temporalExtent: {}, // Collection-specific
        providers: {},
        slugify: {}
    },
    computed: {
        linkToCollection() {
            if (this.collectionLink.href != null) {
                return `/collection/${this.slugify(this.collectionLink.href)}`;
            }

            return null;
        },
        collectionTitle() {
            if (this.collection && this.collection.title) {
                return this.collection.title;
            }
            return "Untitled";
        },
        hasSummary() {
            return this.summaries && typeof this.summaries === 'object' && Object.keys(this.summaries).length > 0;
        },
        providerHtml() {
            return StacFields.Formatters.formatProviders(this.providers);
        },
        summariesList() {
            // ToDo: Pass full collection json
            return StacFields.formatSummaries({summaries: this.summaries}, this.ignore, "");
        },
        propertyList() {
            // ToDo: Pass full item json
            return StacFields.formatItemProperties({properties: this.properties}, this.ignore, "");
        },
        temporalExtentReadable() {
            if (!Array.isArray(this.temporalExtent)) {
                return '';
            }

            let temporalExtent;
            if (this.temporalExtent.length > 1) {
                // Remove union temporal extent in favor of more concrete extents
                temporalExtent = this.temporalExtent.slice(1);
            }
            else {
                temporalExtent = this.temporalExtent;
            }
            return temporalExtent.map(this.formatTemporalInterval).join(', ');
        }
    },
    methods: {
        formatTemporalInterval(interval) {
            return [
                interval[0] ? new Date(interval[0]).toLocaleString() : "beginning of time",
                interval[1] ? new Date(interval[1]).toLocaleString() : "now"
            ].join(" - ");
        },
        ignore(key) {
            switch(key) {
                case 'eo:bands':
                case 'providers':
                    return false;
                default:
                    return true;
            }
        }
    }
};

</script>

<style scoped lang="css">
.summary-title {
    font-weight: bold;
    width: 40%;
}
</style>
<style>
.metadata td.group.summary {
  background-color: #555;
}

.metadata  td.group.summary h4 {
  font-weight: bold;
  color: #ddd;
}
.metadata td.title {
  font-weight: bold;
  width: 33%;
  text-align: right;
  vertical-align: top;
}
.metadata ul, .metadata ol {
    padding-left: 2em;
}
.metadata-object .metadata-object {
    margin-left: 1em;
}
.metadata dl {
    margin: 0;
    margin-left: 1em;
}
.metadata ul > li > dl, .metadata ol > li > dl {
    margin-left: 0;
}
.metadata dt {
    display: inline;
}
.metadata dt:after {
    content: ': ';
}
.metadata dd {
    display: inline;
}
.metadata dd:after {
    content: "\A";
    white-space: pre;
    line-height: 1px;
}
.metadata dd:last-of-type:after {
    content: "";
    white-space: normal;
}
.metadata .provider .description {
    font-size: 0.9em;
    line-height: 1.5em;
    margin-bottom: 0.5em;
}
</style>
