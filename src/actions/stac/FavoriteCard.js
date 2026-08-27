import Favorite from './Favorite';

// Variant of the Favorite action shown in cards/lists (compact contexts)
// instead of the header. Enable it in stacActions.config.js.
// Favorites functionality requires showFavorites to be true in the config.
export default class FavoriteCard extends Favorite {

  // Set any of these to false in stacActions.config.js to hide the action
  // on the cards of the respective page.
  static showInBrowse = true;
  static showInSearch = true;

  get show() {
    if (!this.enabled || !this.component.compact) {
      return false;
    }
    switch (this.component.$route?.name) {
      case 'browse':
        return this.constructor.showInBrowse;
      case 'search':
        return this.constructor.showInSearch;
      default:
        return true;
    }
  }

}
