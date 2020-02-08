// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js';
import ScrollProximityHandler from '../util/scroll-proximity-handler.js';

/**
 * Handles fetching related music for the Related Music component
 */
class RelatedMusic {
  constructor($tableElement) {
    this.$relatedTable = $tableElement;
    this.itemIdentifier = this.$relatedTable.data('item_identifier');
    this.scrollProximityHandler = new ScrollProximityHandler(
      'related_music',
      this.$relatedTable,
      this.startFetch.bind(this),
    );
  }

  startListener() {
    this.scrollProximityHandler.startListener();
  }

  startFetch() {
    return new Promise((resolve) => {
      this.$relatedTable.find('tbody tr').each((idx, row) => {
        const fileName = $(row).data('filename');
        this.fetchRelatedMusic(fileName);
      });
      resolve();
    });
  }

  fetchRelatedMusic(fileName) {
    const requestUrl = `/services/related-music/?item_identifier=${this.itemIdentifier}&file_name=${fileName}`;
    $.ajax({
      url: requestUrl,
      type: 'GET',
      dataType: 'json',
      crossDomain: true,
    }).then((response) => {
      this.handleResponse(fileName, 'versions', response.result.versions);
      this.handleResponse(fileName, 'compilations', response.result.compilations);
      this.handleResponse(fileName, 'covers', response.result.covers);
    });
  }

  handleResponse(fileName, type, result) {
    const $rowElement = this.$relatedTable.find(`tr[data-filename="${fileName}"] .track-${type}`);
    const $relatedImageContainer = $rowElement.find('.related-image');
    const $badge = $rowElement.find('.badge');
    const $image = $rowElement.find('.related-album-image');
    const $imageContainer = $rowElement.find('.img-container');

    $relatedImageContainer.removeClass('loading');

    const resultCount = !result ? 0 : result.length;

    const badgeDisplay = resultCount >= 50 ? '50<sup>+</sup>' : resultCount;
    $badge.html(badgeDisplay);

    if (resultCount === 0) {
      return;
    }

    $relatedImageContainer.removeClass('empty');
    $image.attr('src', `/services/img/${result[0]}`);
    $image.load(() => {
      // this is a bit of a naive approach to determining whether or not the thumbnail is a waveform
      // and I'm not sure if we have a better way of determining this, but
      // the aspect ratio of our waveforms should always be 4, regardless of their original size
      const aspectRatio = $image.width() / $image.height();
      if (aspectRatio === 4) {
        $imageContainer.addClass('is-waveform');
      }
    });
  }
}

/**
 * Does setup once DOM and JS ready
 */
$(() => {
  const $relatedTableElement = $('.related-music-table');
  if ($relatedTableElement.length) {
    const relatedMusic = new RelatedMusic($relatedTableElement);
    setTimeout(() => {
      // defer call for 5 seconds to allow all pertinent DOM to load
      relatedMusic.startListener();
    }, 5000);
  }

  $('#related-music-more-info-btn').on('click', () => {
    $('#related-music-more-info-content').toggle();
    return false;
  });
});

export { RelatedMusic as default };
