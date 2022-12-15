import { Model } from '@vuex-orm/core';
import Migrate from '@radiantearth/stac-migrate';
import { default as STAC2 } from '../stac';

export class STAC extends Model {
  static entity = 'stac';
  static primaryKey = 'url';
  static idCounter = 0;

  static types() {
    return {
      Feature: Item,
      Collection: Catalog,
      Catalog: Catalog
    };
  }

  static beforeCreate(value) {
    return STAC.migrate(value);
  }

  static fields() {
    return {
      id: this.number(() => ++this.idCounter),
      url: this.string(''),
      path: this.string(''),
      data: this.attr(null).nullable(),
      loading: this.boolean(false),
      incomplete: this.boolean(false),
      error: this.attr(null).nullable(),
      parent_url: this.string(null).nullable(),
      parent: this.belongsTo(Catalog, 'parent_url')
    };
  }

  static mutators() {
    return {
      data(value) {
        return STAC.migrate(value);
      },
      url(value) {
        // Todo: normalize and remove slash at the end of the path?
        return value;
      },
      parent_url(value, parent) {
        let stac = new STAC2(parent.data);
        let link = stac.getLinkWithRel("parent");
        if (!value && link) {
          return link.href;
        }
        else {
          return value;
        }
      }
    }
  }

  static migrate(data) {
      // Uncomment the last line of this comment if the old `checksum:` fields should be converted.
      // This is usually not needed so it's not enabled by default to shrink the bundle size.
      // Migrate.enableMultihash(require('multihashes'));
      if (data.type === 'FeatureCollection') {
        data.features = data.features.map(item => Migrate.item(item, false));
      }
      else {
        data = Migrate.stac(data, false);
      }
      return data;
  }

}

export class Catalog extends STAC {
  static entity = 'catalogs';
  static baseEntity = 'stac';

  static fields() {
    return {
      ...super.fields(),
      items: this.hasMany(Item, 'parent_url'),
      catalogs: this.hasMany(Catalog, 'parent_url')
    };
  } 
}

export class Item extends STAC {
  static entity = 'items';
  static baseEntity = 'stac' ;

  static fields() {
    return {
      ...super.fields(),
      collection: this.belongsTo(Catalog, 'collection')
    };
  } 
}