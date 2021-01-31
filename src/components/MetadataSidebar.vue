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
            <tr v-if="keywords">
                <td class="title">Keywords</td>
                <td>{{ keywords }}</td>
            </tr>
            <tr v-if="collectionLink">
            <td class="title">Collection</td>
                <td>
                    <router-link :to="linkToCollection">
                    {{ collection.title || "Untitled" }}
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
                <template v-for="(provider, index) in providers">
                <tr :key="provider.url + index">
                    <td colspan="2" class="provider">
                    <a :href="provider.url">{{ provider.name }}</a>
                    <em v-if="provider.roles"
                    >({{(Array.isArray(provider.roles) ? provider.roles : []).join(", ") }})</em
                    >
                    <div
                        v-if="provider.description"
                        class="description"
                        v-html="provider.description"
                    />
                    </td>
                </tr>
                </template>
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
    props: [
        "properties",
        "summaries",
        "stacVersion",
        "keywords",
        "collection", // Item-specific
        "collectionLink", // Item-specific
        "license",
        "temporalExtent", // Collection-specific
        "providers",
        "slugify",
    ],
    computed: {
        linkToCollection() {
            if (this.collectionLink.href != null) {
                return `/collection/${this.slugify(this.collectionLink.href)}`;
            }

            return null;
        },
        hasSummary() {
            return this.summaries && typeof this.summaries === 'object' && Object.keys(this.summaries).length > 0;
        },
        summariesList() {
            return StacFields.formatSummaries({summaries: this.summaries}, this.ignore, "");
        },
        propertyList() {
            return StacFields.formatItemProperties({properties: this.properties}, this.ignore, "");
        },
        temporalExtentReadable() {
            if (!Array.isArray(this.temporalExtent)) {
                return '';
            }
            return this.temporalExtent
                .map(interval => {
                    return [
                        interval[0] ? new Date(interval[0]).toLocaleString() : "beginning of time",
                        interval[1] ? new Date(interval[1]).toLocaleString() : "now"
                    ].join(" - ")
                }).join(', ');
        }
    },
    methods: {
        ignore(key) {
            if (key === 'eo:bands') {
                return false;
            }
            return true;
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
.table td.group.summary {
  background-color: #555;
}

.table td.group.summary h4 {
  font-weight: bold;
  color: #ddd;
}
.metadata-object .metadata-object {
    margin-left: 1em;
}
.metadata dl {
    margin: 0;
    margin-left: 1em;
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
</style>
