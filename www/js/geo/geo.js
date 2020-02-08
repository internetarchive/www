/* eslint-disable semi */
/* eslint-disable max-classes-per-file */
// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import add_commas from '../util/add_commas.js'
import Message from '../util/message.js'

class Geo {
  /**
   * Renders a table showing view stats per geographic region for an item or collection.
   *
   * @see stats-table.less
   *
   * @param {Object} props
   * @param {String} props.caption
   * @param {GeoCount[]} props.counts
   * @return {String}
   */
  static RegionsTable({ caption = 'Regions', captionClass = '', counts = [] }) {
    return `
      <table class="stats-table">
        <caption class="${captionClass}">${caption}</caption>

        <thead>
          <tr>
            <th scope="col">Region</th>
            <th scope="col">Country</th>
            <th class="stats-table__numeric-column" scope="col">Views</th>
          </tr>
        </thead>

        <tbody>
          ${counts.map((count) => `
            <tr key="${count.state.code}_${count.country.code}_${count.count}">
              <td>${count.state.formattedName}</td>
              <td>${count.country.formattedName}</td>
              <td class="stats-table__numeric-column">${count.formattedCount}</td>
            </tr>`).join('')}
        </tbody>
      </table>`
  }


  /**
   * Finds an element with class "js-top-regions-table" and renders a table showing the top 10
   * regions in terms of views for an item/collection.
   *
   * Data Attributes:
   *  - data-caption (string)
   *  - data-caption-class (string)
   *  - data-days (number)
   *  - data-identifier (string)
   *  - data-limit (number)
   */
  static setUpTopRegionsTable() {
    const root = $('.js-top-regions-table')
    const message = root.find('.js-top-regions-message')
    const originalMessageText = message.text()

    if (!root || !message)
      return

    message.html(Message.LoadingMessage({ message: 'loading data' }))

    const apiOptions = {
      uaKinds: ['non_robot', 'unrecognized'],
    }

    if (root.data('days'))
      apiOptions.days = parseInt(root.data('days'), 10)

    if (root.data('limit'))
      apiOptions.limit = parseInt(root.data('limit'), 10)

    Geo.StatsApiClient.getGeoCounts(root.data('identifier'), apiOptions).then(
      (counts) => {
        root.html(Geo.RegionsTable({
          caption: root.data('caption'),
          captionClass: root.data('captionClass'),
          counts,
        }))
      },
      () => {
        // If API call fails, fall back to original text.
        message.text(originalMessageText)
      },
    )
  }
}


(function defineStatsApi() {
  /**
   * @param {String} source
   * @return {String}
   */
  function capitalizeFirstLetter(source) {
    return source.charAt(0).toUpperCase() + source.slice(1)
  }

  /**
   * A geographic region (either a country or a state/province within a country) for the
   * purposes of site usage statistics.
   */
  class StatsRegion {
    /**
     * @param {Object} props
     * @param {String} props.code
     * @param {String} props.name
     */
    constructor({ code, name }) {
      this.code = code
      this.name = name
    }

    /**
     * @return {String}
     */
    get formattedName() {
      return capitalizeFirstLetter(this.name)
    }
  }

  /**
   * A count of site usage from a particular state/province.
   */
  class GeoCount {
    /**
     * @param {Object} props
     * @param {String} props.count
     * @param {String} props.country
     * @param {String} props.state
     */
    constructor({ count, country, state }) {
      this.count = parseInt(count, 10)
      this.country = country
      this.state = state
    }

    /**
     * @return {String}
     */
    get formattedCount() {
      return add_commas(this.count)
    }
  }

  /**
   * @param {Object} data
   * @return {GeoCount}
   */
  function createGeoCountFromApiData(data) {
    return new GeoCount({
      count: data.sum_count_value,

      country: new StatsRegion({
        code: data.geo_country,
        name: data.country,
      }),

      state: new StatsRegion({
        code: data.geo_state,
        name: data.state,
      }),
    })
  }

  /**
   * Parse API data and produce a list of GeoCount objects, with counts made by combining sums
   * from various kinds of user agents.
   *
   * @param {Object}   data must have key counts_geo
   * @param {Object}   options
   * @param {String[]} options.uaKinds list of user-agent kinds to include
   * @return {GeoCount[]}
   */
  function createCombinedGeoCountsFromApiData(data, {
    uaKinds = ['robot', 'non_robot', 'unrecognized'],
  } = {}) {
    if (!data.counts_geo)
      throw new RangeError("API response doesn't contain property 'counts_geo'.")

    /**
     * @param {String} uaKind
     * @return {Boolean}
     */
    function uaKindIsAllowed(uaKind) {
      return uaKinds.indexOf(uaKind) !== -1
    }

    const countsMap = {}

    for (let i = 0; i < data.counts_geo.length; i++) {
      const countData = data.counts_geo[i]

      // Whitelist user agents and skip unknown countries.
      if (uaKindIsAllowed(countData.ua_kind) && countData.country !== 'unknown') {
        const mapKey = `${countData.geo_country}_${countData.geo_state}`

        // Add to an existing count or create a new one.
        if (countsMap[mapKey])
          countsMap[mapKey].count += countData.sum_count_value
        else
          countsMap[mapKey] = createGeoCountFromApiData(countData)
      }
    }

    return Object.keys(countsMap).map((key) => countsMap[key])
  }

  const apiBaseUrl = 'https://be-api.us.archive.org/views/v1'

  /**
   * Interface for fetching site usage stats from the stats API.
   */
  Geo.StatsApiClient = class StatsApiClient {
    /**
     * @param {String} identifier
     * @param {Object} options
     * @param {Number} options.days
     * @param {Number} options.limit
     * @return {jQuery.Promise<GeoData[]>}
     */
    static getGeoCounts(identifier, {
      days = 30,
      limit = 100,
      uaKinds = ['robot', 'non_robot', 'unrecognized'],
    } = {}) {
      const url = `${apiBaseUrl}/detail/collection/${identifier}/${days}`

      return $.get(url)
        .then((data) => {
          try {
            return createCombinedGeoCountsFromApiData(data, { uaKinds })
              .sort((count1, count2) => (count1.count < count2.count ? 1 : -1))
              .slice(0, limit)
          } catch (error) {
            return $.Deferred().reject(error)
          }
        })
    }
  }
}())

export { Geo as default }
