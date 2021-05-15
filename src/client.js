import Migrate from '@radiantearth/stac-migrate';
import axios from 'axios';
import Utils from './utils'

// STAC Client, does not support item search
export default class STAC {

    constructor(url) {
        this.url = url;
        this.data = null;
    }

    isItem() {
        return this.data.type === 'Feature';
    }

    isCatalog() {
        return this.data.type === 'Catalog';
    }

    isCollection() {
        return this.data.type === 'Collection';
    }

    async get() {
    }

    async _loadLink(link) {
        

    }

    async getNextChildren() {

    }

    async getPreviousChildren() {

    }

    async getFirstChildren() {

    }

    async getLastChildren() {

    }

    async getItems() {
        if (!this.isCatalog())
    }

}