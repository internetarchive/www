/* eslint-disable semi */
// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import log from '../util/log.js'


/**
 * Class for facets section interactive time-related graph.
 * Graph shows search results histogramed over time.
 * It allows user to drag left and right 'handles' overlaying the graph to constrain to a
 * smaller time period.
 */
class Timegraf {
  static setup(c, leftTS, riteTS, minDate, maxDate) {
    Timegraf.timechanged = false
    Timegraf.c = c
    Timegraf.c.realGraphWidth = Timegraf.c.GRAPH_WIDTH - Timegraf.c.GRAPH_PADDING
    Timegraf.c.maxSlide = Math.floor((maxDate.getTime() - minDate.getTime()) / 86400000)
    const csMinTS = minDate.getTime() / 1000
    const left = leftTS > 0 ? Math.floor((leftTS - csMinTS) / 86400) : 0
    const rite = riteTS > 0 ? Math.floor((riteTS - csMinTS) / 86400) : Timegraf.c.maxSlide


    const $sliderdiv = $('<div />').attr({ id: 'slider' }).css({
      width: Timegraf.c.realGraphWidth,
      position: 'absolute',
      top: (Timegraf.c.GRAPH_HEIGHT - 10),
      left: 0,
      zIndex: 1,
    })
    $('#timegraf').append($sliderdiv)
    $sliderdiv.append('<br />') // bleah!


    log(left, rite)

    $('#slider').slider({
      range: true,
      max: Timegraf.c.maxSlide,
      values: [left, rite],
      slide: (event, ui) => {
        const ts = minDate.getTime()
        const d1 = new Date(ts)
        const d2 = new Date(ts)

        d1.setDate(d1.getDate() + ui.values[0])
        d2.setDate(d2.getDate() + ui.values[1])

        $('#from ').html($.datepicker.formatDate('M d', d1)) // Jan 19
        $('#to   ').html($.datepicker.formatDate('M d', d2)) // Jan 19
        $('#fromB').html($.datepicker.formatDate('yymmdd', d1)) // yyyymmdd
        $('#toB  ').html($.datepicker.formatDate('yymmdd', d2)) // yyyymmdd
        $('#datepickL').val($.datepicker.formatDate('mm/dd/yy', d1)) // mm/dd/yyyy
        $('#datepickR').val($.datepicker.formatDate('mm/dd/yy', d2)) // mm/dd/yyyy


        clearTimeout(Timegraf.hideL)
        clearTimeout(Timegraf.hideR)

        const foff = { left: ($('#slider .ptrL').offset().left - $('#from').width()) + 10 }
        const toff = { left:  $('#slider .ptrR').offset().left }
        /* eslint-disable  brace-style */
        $('#from').offset(foff).show(0, () => { Timegraf.hideL = setTimeout(() => $('#from').hide('slow'), 2000) })
        $('#to  ').offset(toff).show(0, () => { Timegraf.hideR = setTimeout(() => $('#to  ').hide('slow'), 2000) })
        /* eslint-enable  brace-style */

        Timegraf.pinkme(ui.values[0], ui.values[1])
      },
      stop: (event, ui) => {
        Timegraf.adjust(ui.values[0], ui.values[1])
        Timegraf.timechanged = true
        const now = location.href.replace(/^http[s]*:/, '')
        const become = `//${location.host}${Timegraf.c.q}${Timegraf.args()}`

        if (now !== become) {
          log(now)
          log(become)

          // make it more obvious that search is being issued
          $('#opscreen1M').remove()
          $('body').append($('<div id="opscreen1M"/>'))
          $('#opscreen1M').show('slow', () => {
            location.href = become
          })
        }
      },
    })

    if (left > 0  ||  rite > 0)
      Timegraf.pinkme(left, rite)
  }

  static pinkme(left, rite) {
    const x = Math.round(Timegraf.c.GRAPH_PADDING / 2)
    const pinkL = (Math.round((left / Timegraf.c.maxSlide) * Timegraf.c.realGraphWidth) + 2)
    const pinkR = (Math.round((rite / Timegraf.c.maxSlide) * Timegraf.c.realGraphWidth) - 2) + x

    const rect = `rect(0px,${pinkR}px,${Timegraf.c.GRAPH_HEIGHT}px,${pinkL}px)`
    log(rect)
    $('#timegraf-clip').css('clip', rect)

    const ttl = 'click and drag this to change time period'
    const attr = { 'data-title': ttl, 'data-toggle': 'tooltip', 'data-placement': 'bottom' }
    $($('#slider a').get(0)).attr(attr).removeClass('ui-state-default').addClass('ptrL')
    $($('#slider a').get(1)).attr(attr).removeClass('ui-state-default').addClass('ptrR')

    Timegraf.adjust(left, rite)
  }

  static adjust(left, rite) {
    const onedayspan = (rite - left < 2)

    log('left:', left, 'rite:', rite)

    $('#slider .ui-widget-header').css('borderColor', '#d33682')
    if (onedayspan) {
      $('#to').hide()
      $('#slider .ui-widget-header').css('border-left-width', 0)
    } else {
      $('#slider .ui-widget-header').css('border-left-width', 2)
    }
  }

  static args() {
    if (!Timegraf.timechanged)
      return ''
    const from2 = $('#fromB').text().trim()
    const   to2 = $('#toB  ').text().trim()
    const end = (from2 === to2 ? '' : `-${to2}`)
    return `&time=${from2}${end}` // TVII
  }
}


$(() => {
  $('.js-timegraf').each((idx, e) => {
    const [c, leftTS, riteTS, minDate1, maxD1, maxD2, maxD3] = JSON.parse($(e).val())
    Timegraf.setup(c, leftTS, riteTS, new Date(minDate1, 0, 1), new Date(maxD1, maxD2, maxD3))
  })
})


export { Timegraf as default }
