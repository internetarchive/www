// eslint-disable-next-line import/no-named-as-default
import $ from './jquery.js';
import Throttler from './throttler.js';

class ScrollProximityHandler {
  constructor(identifier, $targetElement, callback) {
    this.identifier = identifier;
    this.$targetElement = $targetElement;
    this.callback = callback;
    this.$window = $(window);
    this.throttler = new Throttler(this.scrollListener, 100, this);
  }

  startListener() {
    this.$window.on(`scroll.${this.identifier}`, this.throttledListener.bind(this));
    // make an initial call to the scroll listener in case the callback should be immediately
    this.scrollListener();
  }

  throttledListener() {
    return this.throttler.execute();
  }

  getTargetScrollOffset() {
    const topOffset = this.$targetElement.offset().top;
    const windowHeight = this.$window.height();
    return topOffset - (windowHeight / 2);
  }

  scrollListener() {
    const targetScrollOffset = this.getTargetScrollOffset();
    if (this.$window.scrollTop() + this.$window.height() >= targetScrollOffset) {
      this.$window.off(`.${this.identifier}`);
      this.callback();
    }
  }
}

export { ScrollProximityHandler as default };
