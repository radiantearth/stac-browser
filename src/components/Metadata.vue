<template>
    <section class="metadata">
        <h2>Metadata</h2>
        <b-card-group columns>
            <b-card v-for="group in formattedData" :key="group.extension" class="metadata-card">
                <template #header>
                    <div v-if="group.extension" v-html="group.label" />
                    <template v-else>General</template>
                </template>
                <b-row v-for="(prop, key) in group.properties" v-show="!ignoreFields.includes(key)" :key="key">
                    <b-col md="5" class="label" :title="key" v-html="prop.label" />
                    <b-col md="7" class="value" v-html="prop.formatted" />
                </b-row>
            </b-card>
        </b-card-group>
    </section>
</template>

<script>
import StacFields from '@radiantearth/stac-fields';

export default {
    name: "Metadata",
    props: {
        data: {
            type: Object,
            required: true
        },
        ignoreFields: {
            type: Array,
            default: () => ([])
        },
        columns: {
            type: Number,
            default: 3
        }
    },
    computed: {
        formattedData() {
            if (this.data.isItem()) {
                return StacFields.formatItemProperties(this.data);
            }
            else if (this.data.isCollection()) {
                return StacFields.formatSummaries(this.data);
            }
            else {
                return [];
            }
        }
    }
};

</script>

<style lang="scss">
.metadata {
    .label {
        font-weight: bold;
        vertical-align: top;
    }
    ul, ol {
        padding-left: 2em;
    }
    dl {
        margin: 0;
        margin-left: 1em;
    }
    ul > li > dl, ol > li > dl {
        margin-left: 0;
    }
    dt {
        display: inline;
    }
    dt:after {
        content: ': ';
    }
    dd {
        display: inline;
    }
    dd:after {
        content: "\A";
        white-space: pre;
        line-height: 1px;
    }
    dd:last-of-type:after {
        content: "";
        white-space: normal;
    }
    .provider .description {
        font-size: 0.9em;
        line-height: 1.5em;
        margin-bottom: 0.5em;
    }
}
</style>
