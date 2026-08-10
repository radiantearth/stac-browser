import StacActionPlugin from '../StacActionPlugin';
import { STAC } from 'stac-js';
import i18n from '../../i18n';
import BIconStar from '~icons/bi/star';
import BIconStarFill from '~icons/bi/star-fill';

// Built-in action to add/remove a STAC entity to/from the favorites, shown in
// the header. To also offer it in cards/lists, enable FavoriteCard (which
// builds on this) in stacActions.config.js.
// Favorites functionality requires showFavorites to be true in the config.
export default class Favorite extends StacActionPlugin {

  get store() {
    return this.component.$store;
  }

  get isFavorite() {
    return this.store.getters['favorites/isFavorite'](this.object);
  }

  // Whether favorites are available for this entity at all.
  get enabled() {
    return this.store.state.showFavorites && this.object instanceof STAC;
  }

  get show() {
    // Header only (not compact), and only on the detail (browse) pages,
    // consistent with where the button was located before.
    return this.enabled && !this.component.compact && this.component.$route?.name === 'browse';
  }

  get icon() {
    return this.isFavorite ? BIconStarFill : BIconStar;
  }

  get text() {
    return i18n.global.t('favorites.label');
  }

  // The state (add vs. remove) is conveyed by the icon and this tooltip,
  // keeping the button label itself short.
  get title() {
    return i18n.global.t(this.isFavorite ? 'favorites.remove' : 'favorites.add');
  }

  get onClick() {
    return () => this.store.dispatch('favorites/toggle', this.object);
  }

}
