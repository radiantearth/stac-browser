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
                <!-- eslint-disable-next-line vue/no-v-html -->
                <td v-html="license" />
            </tr>
            <tr v-if="temporalExtent">
                <td class="title">Temporal Extent</td>
                <td>{{ temporalExtent }}</td>
            </tr>
            <template v-for="(props, ext) in propertyList">
                <tr v-if="ext" :key="ext">
                <td class="group" colspan="2">
                    <h4>{{ ext }}</h4>
                </td>
                </tr>
                <tr v-for="prop in props" :key="prop.key">
                <td class="title">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span :title="prop.key" v-html="prop.label" />
                </td>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <td v-html="prop.value" />
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
                    <!-- eslint-disable-next-line vue/no-v-html vue/max-attributes-per-line -->
                    <div
                        v-if="provider.description"
                        class="description"
                        v-html="provider.description"
                    />
                    </td>
                </tr>
                </template>
            </template>
            <template v-if="summaries">
                <tr>
                <td colspan="2" class="group">
                    <h4>Summaries</h4>
                </td>
                </tr>
                <template v-for="(props, ext) in summariesList">
                <tr v-if="ext" :key="ext">
                    <td class="group" colspan="2">
                    <h4>{{ ext }}</h4>
                    </td>
                </tr>
                <tr v-for="prop in props" :key="prop.key">
                    <td class="summary-title" >
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span :title="prop.key" v-html="prop.label" />
                    </td>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <td v-html="prop.value" />
                </tr>
                </template>
            </template>
        </tbody>
    </table>
</div>
</template>

<script>
import isEmpty from "lodash.isempty";

import { getPropertyDefinitions } from "../properties.js";

const propertyDefinitions = getPropertyDefinitions(),
  propertyMap = propertyDefinitions.properties,
  groupMap = propertyDefinitions.groups;

const constructPropList = (props, skip = () => false) => {
    return Object.entries(props || [])
                .filter(([, v]) => Number.isFinite(v) || !isEmpty(v))
                .filter(([k]) => !skip(k))
                .sort(([a], [b]) => a - b)
                .map(([key, value]) => ({
                    key,
                    label: propertyDefinitions.formatPropertyLabel(key),
                    value: propertyDefinitions.formatPropertyValue(key, value)
                }))
                .reduce((acc, prop) => {
                    let ext = "";
                    if (prop.key.includes(":")) {
                        const prefix = prop.key.split(":")[0];
                        ext = groupMap[prefix] || prefix;
                    }

                    acc[ext] = acc[ext] || [];
                    acc[ext].push(prop);

                    return acc;
                }, {});
};

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
        summariesList() {
            return constructPropList(this.summaries);
        },
        propertyList() {
            const skip = key => propertyMap[key] && propertyMap[key].skip;

            return constructPropList(this.properties, skip);
        },
    }
};

</script>

<style scoped lang="css">
.summary-title {
    font-weight: bold;
    width: 40%;
}
</style>