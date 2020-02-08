/* eslint-disable semi */
// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import log from '../util/log.js'
import onclick from '../util/onclick.js'
import sortnat from '../util/sortnat.js'
import onsubmit from '../util/onsubmit.js'


class Search {
  static verify_rawform() {
    for (const val of document.rawform.output) {
      if (val.checked) {
        if (val.value === 'csv') {
          // eslint-disable-next-line  no-alert
          alert(`NOTE: You are requesting (up to) ${document.getElementById('numresults').value} results in CSV.`)
        }
      }
    }
    return true
  }


  static check_dates() {
    const sf = document.searchForm
    if ((sf.date_from_year.value !== 'YYYY' && (sf.date_from_month.value === 'MM' || sf.date_from_day.value === 'DD')) ||
        (sf.date_from_day.value !== 'DD' && (sf.date_from_month.value === 'MM' || sf.date_from_year.value === 'YYYY')) ||
        (sf.date_from_month.value !== 'MM' && (sf.date_from_year.value === 'YYYY' || sf.date_from_day.value === 'DD')) ||
        (sf.date_to_year.value !== 'YYYY' && (sf.date_to_month.value === 'MM' || sf.date_to_day.value === 'DD')) ||
        (sf.date_to_day.value !== 'DD' && (sf.date_to_month.value === 'MM' || sf.date_to_year.value === 'YYYY')) ||
        (sf.date_to_month.value !== 'MM' && (sf.date_to_year.value === 'YYYY' || sf.date_to_day.value === 'DD')) ||
        (sf.date_year.value !== 'YYYY' && (sf.date_month.value === 'MM' || sf.date_day.value === 'DD')) ||
        (sf.date_day.value !== 'DD' && (sf.date_month.value === 'MM' || sf.date_year.value === 'YYYY')) ||
        (sf.date_month.value !== 'MM' && (sf.date_year.value === 'YYYY' || sf.date_day.value === 'DD'))) {
      // eslint-disable-next-line  no-alert
      alert('When specifying a date, you must specify the year, the month, and the day')
      return false
    }
    return true
  }


  static main(url) {
    $.getJSON(url.replace(/&save=yes/, ''), (replyIn) => {
      Search.reply = replyIn
      Search.render('')
    })
  }


  // renders an HTML table
  static render(sorterIn) {
    Search.sorter = (typeof sorterIn === 'string'
      ? sorterIn
      : $(sorterIn.currentTarget).attr('href')
    )
    log(Search.sorter)

    const hdr = Search.reply.responseHeader
    const resp = Search.reply.response

    if (!Search.fl)
      Search.fl = hdr.params[(typeof hdr.params.fl === 'undefined' ? 'fields' : 'fl')].split(',')

    log(hdr)

    const tmp = hdr.params.rows
    let str = `
<h3>
${resp.numFound} results ${tmp >= resp.numFound ? '' : `first ${tmp} shown `}
for query:
<i>${hdr.params.qin}</i>
</h3>`

    str += `
<style>
div#help dl dt { font-size:12pt; font-weight:bold; }
</style>
<div style="position:relative;">
<a href="/about/javascript-required.htm" onclick="$('#help').slideToggle(); return false">
  help
</a>
<div class="well" style="position:absolute; display:none" id="help">
  <dl>
    <dt>
      Truncated column values
    </dt>
    <dd>
      To keep the columns from getting too wide, we stop displaying after 20 characters.
      You may "mouse over" the column to see the full value.
    </dd>
    <dt>
      Sorting
    </dt>
    <dd>
      You may click the links on the top of the columns to sort "up/down" the values in that column.
      NOTE that it sorts <i>*only*</i> the rows shown -- it will not rerun your search and
      sort all the results if the number of total results exceeds the number of results
      shown on this page.
    </dd>
  </dl>
</div>
</div>`


    str += `
<table class="se  table table-striped table-condensed table-hover">
<tr>`

    for (const field of Search.fl) {
      const sortkey = (field === Search.sorter ? `-${field}` : field)
      const sortflag = (`-${field}` === Search.sorter ? '-' : '')

      str += `
  <th>
    <a href="${sortkey}" class="js-search-render">
      ${field === Search.sorter ? '+' : sortflag}${field}
    </a>
  </th>`
    }
    str += `
</tr>`

    const rows = (Search.sorter ? sortnat(resp.docs, Search.sorter) : resp.docs)

    for (const row of rows) {
      // log(row)
      str += `
<tr>`
      for (const field of Search.fl) {
        str += `
  <td>`
        if (typeof row[field] !== 'undefined') {
          const val = row[field].toString()

          const valesc = val.replace(/(<)|(>)/g, (orig, $1) => ($1 ? '&lt;' : '&gt;'))
          const valshort = (valesc.length >= 20 ? `${valesc.substr(0, 20)}..` : valesc)

          const valshow = `
    <a class="hoverShower" href="more" onclick="return false">
      <span class="hoverShower">
        <div class="showOnHover">${valesc}</div>
        <span class="nobr">${valshort}</span>
      </span>
    </a>`

          if (field === 'identifier')
            str += `<a href="/details/${val}">${valshort}</a>`
          else
            str += valshow
        }
        str += `
  </td>`
      }
      str += `
</tr>`
    }

    str += `
</table>`

    $('.js-search-onload').html(str)

    onclick('.js-search-render', Search.render)

    return false
  }
}


// setup on DOM loaded
$(() => {
  // setup static vars
  Search.fl = null
  Search.reply = null
  Search.sorter = null

  onsubmit('.js-search-check_dates', Search.check_dates, 'callback')
  onsubmit('.js-search-verify_rawform', Search.verify_rawform, 'callback')

  $('.js-search-onload').each((idx, e) => {
    Search.main(JSON.parse($(e).data().url))
  })
})
