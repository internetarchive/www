export default {
  namespace: 'banners',
  action: 'ia-banner-close',
  selector: '.ia-banner',

  /**
   * DOM onclick event triggered to dismiss a banner.
   * @param {object} jQuery decorated event
   */
  dismiss(e) {
    e.preventDefault();
    const $banner = $(e.currentTarget).closest(this.selector);
    $banner.slideUp(200, () => $banner.remove());
    if (this.isLocalStorageAvailable()) {
      this.writeStorage($banner.attr('data-campaign'));
    }
  },

  /**
   * Reads an array of any dismissed banners.
   * @return {array}
   */
  readStorage() {
    return JSON.parse(localStorage.getItem(this.namespace)) || [];
  },

  /**
   * Writes the banner campaign ID to the array of dismissed banners.
   * @param {string}
   */
  writeStorage(campaign) {
    const dismissedBanners = this.readStorage();
    localStorage.setItem(this.namespace, JSON.stringify([...dismissedBanners, campaign]));
  },

  /**
   * Binds click to dismiss event to banners.
   */
  bindEvents() {
    $(this.selector).on(`click.${this.namespace}`, `[data-action=${this.action}]`, this.dismiss.bind(this));
  },

  /**
   * Checks each banner against the dismissed banners list and toggles
   * visibility.
   */
  checkVisibility() {
    const dismissedBanners = this.isLocalStorageAvailable() ? this.readStorage() : [];

    $(this.selector).each((i, el) => {
      $(el).toggleClass('visible', !dismissedBanners.includes(el.dataset.campaign));
    });
  },

  /**
   * Catch error when user has disabled third-party cookies/storage.
   * @returns {Boolean}
   */
  isLocalStorageAvailable() {
    try {
      return Object.keys(localStorage).length >= 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Does what it says on the tin.
   */
  init() {
    this.bindEvents();
    this.checkVisibility();
  },
};
