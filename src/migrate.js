/* Methods that transform STAC object JSON from older versions to
allow for a more consistent usage in other parts of the codebase */
import { STAC_VERSION } from './config';

export const transformCatalog = (entity) => {
    if(!entity) { return entity; }

    const stacVersion = entity.stac_version || STAC_VERISON;
    // Account for the item-assets extension renaming the property used
    // in collections from 'assets' to 'item-assets' for STAC 1.0
    if(entity.assets) {
        if(stacVersion < "1.0") {
            entity.item_assets = entity.assets;
            delete entity.assets;
        }
    }
    return entity;
};

export const transformItem = (entity) => {
    return entity;
};