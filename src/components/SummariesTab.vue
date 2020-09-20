<template>
<b-tab

    key="summaries"
    title="Summaries"
>
    <table class="table table-striped">
        <tbody>
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
        </tbody>
    </table>
</b-tab>
</template>

<script>
import isEmpty from "lodash.isempty";

import getPropertyDefinitions from "../properties.js";

const propertyDefinitions = getPropertyDefinitions(),
       propertyMap = propertyDefinitions.properties,
       groupMap = propertyDefinitions.groups;

export default {
    name: "SummariesTab",
    props: ["summaries"],
    computed: {
        summariesList() {
            const label = key => {
                if (typeof propertyMap[key] === "object") {
                return propertyMap[key].label;
                }

                return propertyMap[key] || key;
            };

            const format = (key, value) => {
                let suffix = "";

                if (typeof propertyMap[key] === "object") {
                if (propertyMap[key].suffix != null) {
                    suffix = propertyMap[key].suffix;
                }

                if (propertyMap[key].type === "date") {
                    return escape(
                    new Date(value).toLocaleString([], {
                        timeZone: "UTC",
                        timeZoneName: "short"
                    }) + suffix
                    );
                }

                if (propertyMap[key].type === "label:property") {
                    if (value == null) {
                    return undefined;
                    }

                    return value.map(x => `<code>${x}</code>`).join(", ");
                }

                if (propertyMap[key].type === "label:classes") {
                    if (Array.isArray(value)) {
                    return value
                        .map(o =>
                        Object.entries(o)
                                .map(([k, v]) => {
                                if (k === "name") {
                                    if (v === "raster") {
                                    return undefined;
                                    }

                                    return `<code><b>${v}</b></code>:`;
                                }

                                if (Array.isArray(v)) {
                                    return v.map(x => `<code>${x}</code>`).join(", ");
                                }

                                return v;
                                })
                                .join(" ")
                        )
                        .join("<br>\n");
                    }

                    return Object.entries(value)
                                .map(([k, v]) => {
                                if (k === "name") {
                                    if (v === "raster") {
                                    return undefined;
                                    }

                                    return `<code><b>${v}</b></code>:`;
                                }

                                if (Array.isArray(v)) {
                                    return v.map(x => `<code>${x}</code>`).join(", ");
                                }

                                return v;
                                })
                                .join(" ");
                }

                if (propertyMap[key].type === "label:overviews") {
                    return value
                    .map(v => {
                        const prop = v.property_key;

                        if (v.counts != null) {
                        return `<code><b>${prop}</b></code>: ${v.counts
                            .map(c => `<code>${c.name}</code> (${c.count})`)
                            .join(", ")}`;
                        }

                        if (v.statistics != null) {
                        return `<code><b>${prop}</b></code>: ${v.statistics
                            .map(c => `<code>${c.name}</code> (${c.count})`)
                            .join(", ")}`;
                        }

                        return "";
                    })
                    .join("<br>\n");
                }
            }

            if (key === "eo:epsg") {
                return `<a href="http://epsg.io/${value}">${value}</a>`;
            }

            if (Array.isArray(value)) {
                return value.map(v => {
                    if(typeof(v) === "object") {
                        return JSON.stringify(v);
                    }
                    return v;
                }).join(', ');
            }

            if (typeof value === "object") {
                return escape(JSON.stringify(value));
            }

            return escape(value + suffix);
        };

        return Object.entries(this.summaries)
                    .filter(([, v]) => Number.isFinite(v) || !isEmpty(v))
                    .sort(([a], [b]) => a - b)
                    .map(([key, value]) => ({
                        key,
                        label: label(key),
                        value: format(key, value)
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