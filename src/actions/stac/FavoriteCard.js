import Favorite from './Favorite';

// Variant of the Favorite action shown in cards/lists (compact contexts)
// instead of the header. Enable it in stacActions.config.js.
// Favorites functionality requires showFavorites to be true in the config.
export default class FavoriteCard extends Favorite {

  get show() {
    return this.enabled && this.component.compact;
  }

}
