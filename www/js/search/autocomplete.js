// Requires that jquery and jquery-ui be loaded in the global context

// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js';
import log from '../util/log.js';

/**
 * Prepares search form input fields for autocomplete
 *
 * Looks for fields with class `.js-search-bar` and turns them into autcomplete
 * fields, using the Search Completion API.
 *
 * Enabled input fields can have a `data-autocomplete-format` attribute added with these values:
 * - "off": Suppresses attaching of autocompletion to the field
 * - "right": Right-justifies autocompletion suggestions
 * - "inline": Causes autocompletion suggestions to be added to a DOM element using the selector
 *             found in the `data-autocomplete-append-to` attribute (required).
 */
export default class SearchAutocomplete {
  static setup() {
    $('.js-search-bar').each(function jsSearchBar() {
      const $searchBar = $(this);
      const autocompleteFormat = $searchBar.data('autocompleteFormat');
      if (autocompleteFormat === 'off') return;

      const config = {
        minLength: 3,
        source: function source(request, response) {
          $.ajax({
            url: 'https://be-api.us.archive.org/searches/complete',
            data: { q: request.term, limit: 15 },
            dataType: 'json',
            success: response,
            error: function errorHandler(jqXHR, textStatus, errorThrown) {
              log(`${textStatus}: ${errorThrown}`);
              response([]);
            },
          });
        },
        open: function openHandler() {
          // Fit to screen width if off-screen
          const $widget = $(this).autocomplete('widget');
          const offset = $widget.offset();
          if (offset.left < 0) {
            $widget.width($widget.width() - offset.left);
            $widget.offset({ top: offset.top, left: 0 });
          }
        },
        classes: {
          'ui-autocomplete': 'truncate',
        },
      };
      if (autocompleteFormat === 'inline') {
        config.appendTo = $searchBar.data('autocompleteAppendTo');
        config.position = {
          // Prevent auto-positioning
          using: $.noop,
        };
      } else {
        config.classes['ui-autocomplete'] += ' z-above-top-nav';
        if (autocompleteFormat === 'right') {
          config.position = { my: 'right top', at: 'right bottom' };
        }
      }
      $searchBar.autocomplete(config);
    });
  }
}
