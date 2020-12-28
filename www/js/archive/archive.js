/* eslint-disable semi */
// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'

import '../util/cookie.js'
import '../util/center.js' // for $.center()
import '../util/popup.js'
import '../related/related.js'
import '../setUpCopyableTexts/setUpCopyableTexts.js'
import '../disabilityEligibility/disabilityEligibility.js'
import '../timegraf/timegraf.js'
import '../related-music/related-music.js'
import paramsToJSON from '../paramsToJSON/paramsToJSON.js'

import Manage from '../manage/manage.js'
import Tiles from '../tiles/tiles.js'
import dropdowns from '../nav/dropdowns.js'
import Banners from '../nav/banners.js'
import log from '../util/log.js'
import cgiarg from '../util/cgiarg.js'
import add_commas from '../util/add_commas.js'
import ios from '../util/ios.js'
import { jwplayer } from '../jwplayer/jwplayer.js'
import loginModal from '../login/loginModal.js'
import Geo from '../geo/geo.js'
import SearchAutocomplete from '../search/autocomplete.js'

/* global  archive_analytics */


/**
 * Replaces a BookReader fragment string in a URL path with a new fragment,
 * or adds the path string to the end of the URL if it's not set
 *
 * NOTE: BookReader "fragments" are not necessarily URL hash fragments,
 * though they may be stored in the hash.
 *
 * @param {String} pathString
 * @param {String} newFragment
 * @returns {String}
 */
function replaceBookReaderFragment(pathString, newFragment) {
  // See http://openlibrary.org/dev/docs/bookurls
  const fragmentRegex = /(\/((page|mode|search)\/[^/?$]+))+\/?(?=\?|$)/g

  if (pathString.match(fragmentRegex))
    return pathString.replace(fragmentRegex, `/${newFragment}`)

  return `${pathString}/${newFragment}`.replace(/\/+/g, '/')
}

// class memnonic: Archive JS
class AJS {
  static tvAD(elm) {
    const in_show = $(elm).parents('.shows')
    let id
    let chan
    let show
    if (in_show.length) {
      // see if we've already gotten and displayed the "Air date" section...
      const opened = $(elm).parent().find('.shows')
      if (opened.length) {
        // ... yes, simply close/open it
        opened.toggle()
        return false
      }
      chan = in_show.attr('data-chan')
      show = $(elm).text()
    } else {
      chan = $(elm).text()
      id = 'menu-chan-'.concat(chan)
      const div = $(`#${id}`)
      if (div.length) {
        div.toggle()
        return false
      }
    }

    let url = `${location.href}?channel=${chan}`
    if (in_show.length)
      url += '&program='.concat(encodeURIComponent(show))
    log(url)

    $.get(url, (htm) => {
      if (in_show.length) {
        $(elm).parent()
          .append(`<div data-chan="${chan}" class="shows"><h5>Air date</h5><div>${htm}</div></div>`)
      } else {
        $(elm).parent()
          .append(`<div id="${id}" data-chan="${chan}" class="shows"><h4>Show</h4><div>${htm}</div></div>`)
      }
    })

    return false
  }

  static paramsToJSON() {
    return paramsToJSON()
  }

  static nav_tophat_setup() {
    if (!$('#nav-tophat').length)
      return

    if (AJS.isTouchDevice())
      $('body').addClass('touch')

    // eslint-disable-next-line arrow-body-style
    const withinTophat = ({ target }) => {
      return !!$(target).parents('#navwrap1').length;
    };


    $('#nav-tophat')
      .on('show.bs.collapse', () => $('#navwrap1').addClass('hatted'))
      .on('hide.bs.collapse', () => $('#navwrap1').removeClass('hatted'))


    $('.navbar a[data-top-kind]').on('click', function navhat_click(evt) {
      // are we in "mobile nav / xs width" mode?
      const xs = !$('#nav-tophat-helper:visible').length
      const hat_open = $('#nav-tophat').hasClass('in')
      const navlink = this

      // determine mediatype from either: (1) user hit text or (2) user hit icon
      const mt = ($(evt.target).attr('data-top-kind')  ||
                  $(evt.currentTarget).attr('data-top-kind'))

      const isnow = $('.navbar .dropdown-ia.hatted a').attr('data-top-kind')

      if (!(xs  &&  hat_open  &&  isnow !== mt)) {
        // show the links for mediatype clicked
        $('.toprow').hide()
        $(`.toprow.${mt}`).show()
      }

      if (!hat_open)
        $('#nav-tophat').collapse('show') // .. top hat is *not* open.  clicked, so open tophat

      if (typeof isnow !== 'undefined')
        log('isnow', isnow)

      log('shouldB', mt)

      if (isnow === mt) {
        // 2nd click on same mediatype dropdown -- close tophat!
        $('#nav-tophat').collapse('hide')
        return false
      }

      if (xs && hat_open && isnow !== mt && typeof isnow !== 'undefined') {
        // Mobile/xs nav and user has clicked on *another* nav/MT icon.
        // So we want to (animate) close the tophat, and when closed,
        // reopen (animate) to the right open tophat -- this is because
        // mobile/xs makes the tophat heights much more arbitrary
        // and it looks weird hard jumping to other open area at another height!
        $('#nav-tophat').one('hidden.bs.collapse', () => {
          setTimeout(() => $(navlink).click(), 100)
        })
        $('#nav-tophat').collapse('hide')
        return false
      }

      // Only fire media icon click event if have made it here, i.e. not just closing an open tab
      // and not mobile media type switching
      if (window.archive_analytics)
        archive_analytics.send_event('TopNav', `MediaIcon-${mt}`)


      $('.navbar .dropdown-ia').removeClass('hatted').has(`.${mt}`).addClass('hatted')
      $('#nav-tophat').on('hidden.bs.collapse', () => $('.navbar .dropdown-ia').removeClass('hatted'))

      return false
    })

    // any click makes tophat hide...
    $(document).on('click.tophat.nixer', (event) => {
      const $e = $(event.target)
      if ($e.attr('id') === 'nav-wb-url' || withinTophat(event))
        return // ... except clicking on wayback machine form input or within tophat
      if ($e.is('a'))
        return // ... except clicking on a link
      if ($e.hasClass('item-img')  ||  $e.hasClass('item-ia'))
        return

      // NOTE: if not open, we wont hide
      $('#nav-tophat.in').collapse('hide')
    })
  }


  static isTouchDevice() {
    return ('ontouchstart' in window ||
            (window.DocumentTouch && document instanceof window.DocumentTouch))
  }


  static footer() {
    if (!AJS.isTouchDevice()  &&  typeof $.fn.tooltip !== 'undefined') {
      $('.navbar [data-toggle="tooltip"], .container-ia [data-toggle="tooltip"], #cols [data-toggle="tooltip"], #tvbanner [data-toggle="tooltip"]').tooltip({
      })
      // $('body').addClass('glyphs-as-text')
    }
  }


  static wrapdark_watcher() { // no longer needed/used but has some handy techniques...
    if (!AJS.$sharedown) {
      AJS.$sharedown = $('#sharedown')
      AJS.$wrapdark  = $('#wrapdark')
    }

    // every second, sigh, check/adjust for the wrapdark height
    if (!AJS.wrapdark_watcher_ptr)
      AJS.wrapdark_watcher_ptr = setInterval(AJS.wrapdark_watcher, 1000)

    if (!AJS.$sharedown.length  ||  !AJS.$wrapdark.length) {
      clearInterval(AJS.wrapdark_watcher_ptr)
      return
    }

    const wrapdarkHT = AJS.$sharedown.offset().top + AJS.$sharedown.find('.panel-heading').innerHeight()
    if (parseInt(AJS.$wrapdark.css('height'), 10) !== wrapdarkHT) {
      AJS.$wrapdark.css({ height: wrapdarkHT }).show()
      log('       WRAPDARK-ED to ', wrapdarkHT)
    }
  }


  static mute_click() {
    const mutedNOW = !$.cookie('unmute')

    if (this.emulator) {
      this.emulator.setMute(!mutedNOW)
    } else {
      const player = jwplayer('jw6')
      if (player) {
        const volnow = player.getVolume()
        if (volnow) {
          AJS.mute_click_prior_volume = volnow
          player.setVolume(0)
        } else {
          player.setVolume(typeof AJS.mute_click_prior_volume === 'undefined' ? 100 :
            AJS.mute_click_prior_volume)
        }
      }
    }


    $('#theatre-ia .iconochive-mute, #theatre-ia .iconochive-unmute').toggle()


    if (mutedNOW) {
      // sounds is off.  make it loud
      $.cookie('unmute', 1, { path: '/details', expires: 30 })
    } else {
      // sounds is on.  mute it!
      $.cookie('unmute', null, { path: '/details' })
    }


    return false
  }


  static emulate_setup(game) {
    // eslint-disable-next-line  no-param-reassign
    game.toString = (() => game.identifier)
    AJS.emulator = new IALoader($('#canvas').get(0), game, null)


    $('#theatre-ia .iconochive-unmute, #theatre-ia .iconochive-mute').hide()
    if ($.cookie('unmute')) {
      $('#theatre-ia .iconochive-unmute').show()
      AJS.emulator.unmute()
    } else {
      $('#theatre-ia .iconochive-mute').show()
      AJS.emulator.mute()
    }

    AJS.theatre_controls_position()
    $(window).on('resize  orientationchange', () => {
      clearTimeout(AJS.theatre_controls_position_throttler)
      AJS.theatre_controls_position_throttler = setTimeout(AJS.theatre_controls_position, 250)
    })
  }


  static emulate() {
    /* global  canvas  IALoader  DOSBOX  JSMESS  Module */

    // move the virtual keyboard thing and give it a "go away!" button
    $('.ui-keyboard').prepend(`
      <button style="position:relative;top:-5px;right:-8px;" type="button" class="close"
              onclick="$('.ui-keyboard').removeClass('showing').hide()" aria-hidden="true">
        <span class="iconochive-remove-circle"></span></button>`)
      .appendTo($('#emulate .posrel')).addClass('showing')

    $('#jsmessSS').fadeOut('slow')
    $('#canvasholder').css('visibility', 'visible')
    AJS.emulator.start({ hasCustomCSS: true })

    // setup the theatre-ia fullscreen button
    const EM = (JSMESS  ||  DOSBOX  ||  false)
    if (EM  &&  (canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen ||
                  canvas.requestFullScreen)) {
      $('#gofullscreen').on('click', () => Module.requestFullScreen(1, 0))
      /**/ if ('onfullscreenchange'       in document) document.addEventListener('fullscreenchange',       EM.fullScreenChangeHandler)
      else if ('onmozfullscreenchange'    in document) document.addEventListener('mozfullscreenchange',    EM.fullScreenChangeHandler)
      else if ('onwebkitfullscreenchange' in document) document.addEventListener('webkitfullscreenchange', EM.fullScreenChangeHandler)
    }

    setTimeout(AJS.theatre_controls_position,   100)
    setTimeout(AJS.theatre_controls_position,   500)
    setTimeout(AJS.theatre_controls_position,  3000)
    setTimeout(AJS.theatre_controls_position, 10000)

    return false
  }


  static theatre_controls_position($selectorIn, pegTop, widthIn, heightIn) {
    // We have lots of callers!  video, software, texts.
    // So sort out our args and where we gonna "peg"/glue things to...
    let $selector = $selectorIn
    const video = (heightIn  &&  !$selectorIn)
    if (!video) {
      if (!$selectorIn) $selector = $('#canvas') // software emulation
      if (!$selector.length) return // protect against emulated embeds and undef...
    }

    const height = (video ? heightIn : $selector.height())
    const width  = (video ? widthIn  : $selector.width())

    if (!video  &&  typeof pegTop !== 'undefined')
      $('#theatre-controls').offset({ top: pegTop })


    // Subtract out the width of the controls to get total amount of black pixels
    // to the right of the theatre object.
    // We want to position the controls in the middle of the dark pixels / right gutter!
    const right_gutter_width =
      Math.round(($('#theatre-ia-wrap').width() - $('#theatre-controls').width() - width) / 2)

    log('width', width)
    log('right_gutter_width', right_gutter_width)


    $('#theatre-controls').css({
      height,
      visibility: 'visible',
      right: Math.max(20, right_gutter_width / 2),
    })
  }


  static booksize() {
    if (!$('#texty').length)
      return

    // Use the standard theatresize function
    AJS.theatresize()

    const pollingMillis = 200

    // Change the bg in the iframe
    const $textyiframe = $('#texty iframe')
    const changeBgColor = () => {
      const $contentDom = $($textyiframe.get(0).contentDocument)
      const $match = $contentDom.find('#BookReader')
      if ($match.length > 0) {
        $contentDom.find('body, #BookReader').css('background-color', 'transparent')
        return true
      }
      return false
    }
    if (!changeBgColor()) {
      const bgColorInterval = setInterval(() => {
        if (changeBgColor())
          clearInterval(bgColorInterval)
      }, pollingMillis)
    }

    // Setup the controls
    // NOTE The attribute data-lendable-book is added in Details.inc
    const isLendableBook = typeof $('#texty').data('lendable-book') !== 'undefined'
    if (!isLendableBook && !AJS.booksize_controls_hidden) {
      AJS.booksize_controls()
      const bookSizeInterval = setInterval(() => {
        if (!AJS.booksize_controls_hidden)
          AJS.booksize_controls()
        else
          clearInterval(bookSizeInterval)
      }, pollingMillis)
    }
  }

  // Hides the book controls, per david!
  // Also positions the "theatre controls"
  static booksize_controls() {
    const $iframe = $('iframe:first')
    if (!$iframe.length)
      return
    const $iframeDOM = $($iframe.get(0).contentDocument)
    if (!$iframeDOM.length)
      return

    if (!AJS.booksize_controls_hidden) {
      if (!$iframeDOM.find('#BRnav').length) {
        log('BOOK NOT READY YET')
        return
      }
      if ($iframeDOM.find('#BRtwopageview').length > 0) {
        // Only hide nav in 2up. Show it in 1up
        $iframeDOM.find('#BRnav').hide()
      }
      AJS.booksize_controls_hidden = true
      $('#texty iframe').css('visibility', 'visible')
      log('BOOK CONTROLS HIDDEN!')
    }

    $iframeDOM.find('body, #BookReader').css('background-color', 'transparent')

    // now position the theatre controls
    const $book = $iframeDOM.find('#BRtwopageview, #BRpageview')

    // compute where the logical top point should be for the book and for the controls
    // (which is comparable to A/V items)
    const $navbar = $('.navbar')
    // NOTE: we *do* check the nav top (almost always 0!) for rare cases we have a banner
    // *ABOVE* the navbar, eg: EOY donate banner campaign (which is above the nav)!
    const pegTop = ($navbar.offset().top + $navbar.height() +
                    parseInt($('#texty').css('padding-top'), 10))
    AJS.theatre_controls_position($book, pegTop)
    log('book top', $iframe.offset().top + $book.offset().top, ' -v- pegTop', pegTop)

    // and now dont overflow negative margin-bottom blackness into metadata section
    $('#theatre-ia').css({ overflow: 'hidden' })
  }


  static popcornsize() {
    const resizer = () => {
      const metadataHeight = 100 // metadata peekaboo min height!
      const maxH = $(window).height() - $('iframe:first').offset().top - metadataHeight
      const maxW = $('#theatre-ia .row').outerWidth()
      // make max height at most 16x9 ratio (43px is the popcorn controls height)
      const WH = { width: maxW, height: Math.min(maxH, ((maxW * 9) / 16) + 43) }
      log('popcorn resize: ', WH)
      $('iframe:first').css(WH) // resize popcorn
    }
    resizer() // page load event is now
    $(window).on('resize  orientationchange', () => {
      clearTimeout(AJS.popcorn_throttler)
      AJS.popcorn_throttler = setTimeout(resizer, 250)
    })
  }


  /**
   * A general purpose theatre sizing function.
   * It keeps the metadata below the theatre partially visible.
   * @param {function} onChange - called when size changes
   * @global AJS.theatresize_maxheight if this is set by another
   *   part of the code, it will contrain to this max height.
   */
  static theatresize(onChange) {
    if (!AJS.theatresize_maxheight)
      AJS.theatresize_maxheight = null
    const resizer = () => {
      const metadataHeight = 100 // metadata peekaboo min height!
      const maximumHeight = 1000 // don't get larger than this
      const minHeight = Math.min($(window).width(), 400)
      let targetHeight = $(window).height() - $('#navwrap1').height() - metadataHeight

      if (AJS.theatresize_maxheight)
        targetHeight = Math.min(targetHeight, AJS.theatresize_maxheight)

      targetHeight = Math.max(targetHeight, minHeight)
      const height = Math.min(targetHeight, maximumHeight)
      $('#theatre-ia-wrap').addClass('resized').css('height', height)

      if (onChange)
        onChange($('#theatre-ia-wrap').height())
    }
    resizer() // page load event is now
    $(window).on('resize  orientationchange', () => {
      clearTimeout(AJS.theatresize_throttler)
      AJS.theatresize_throttler = setTimeout(resizer, 250)
    })
  }

  /**
   * Will reduce the vertical size of the carousel once all the images have
   * downloaded and only if they are all smaller than the current size.
   * This is a progressive enhancement
   * @param string selector
   * @param bool enableThreatreChange
   */
  static carouselsize(selector, enableThreatreChange) {
    const $carousel = $(selector)
    const imagePromises = $carousel.find('img.carousel-image').map((i, img) => {
      const promise = $.Deferred()
      let result
      if (img.complete) {
        result = promise.resolve(img.naturalHeight).promise()
      } else {
        img.addEventListener('load', () => {
          promise.resolve(img.naturalHeight)
        })
        result = promise
      }
      return result
    }).get()
    $.when(...imagePromises).then((...args) => {
      const currHeight = $carousel.height()
      const maxImageHeight = Math.max(...args)
      if (currHeight > maxImageHeight) {
        $carousel.css('maxHeight', maxImageHeight)
        if (enableThreatreChange) {
          AJS.theatresize_maxheight = maxImageHeight
          $(window).trigger('resize')
        }
      }
    })
  }

  static pause(id = 'jw6') {
    const jw = jwplayer(id)
    if (jw  &&  jw.getState  &&  jw.getState().toLowerCase() === 'playing')
      jw.pause()
  }


  static add2list(lnk) {
    const href = $(lnk).attr('href')

    $.get(`${href}&headless=1&titlelist=${$(lnk).text()}`, (htm) => {
      // dynamically add modal to page (if isnt there already)
      AJS.modal_go(lnk, {
        title: 'Add To List',
        headerClass: 'modal-header-new-list',
        ignore_lnk: true,
        auto_remove: true,
        body: htm,
      })
    })

    return false
  }

  static newlist(lnk) {
    const href = $(lnk).attr('href')

    $.get(href.concat('&headless=1'), (htm) => {
      // dynamically add modal to page (if isnt there already)
      AJS.modal_go(lnk, {
        title: 'Create New List',
        headerClass: 'modal-header-new-list',
        ignore_lnk: true,
        body: htm,
      })
    })

    return false
  }

  static newlist_submit() {
    // Strings with SPACE characters will be changed to "camel case".
    // For example:
    //    "my LA roadtrip"
    // will become:
    //    "MyLaRoadtrip"
    // Letters, numbers, periods (.), dashes (-), or underscores (_) are ok, but
    // other characters will be removed.
    const title = $('#new-list-form input[name=title]').val()
    if (!title.length) {
      // eslint-disable-next-line  no-alert
      alert('Please enter a title for your List')
      return false
    }

    // turn the title into an acceptable identifier
    // (1) remove any "bad" chars
    // (2) trim any *leading* chars like:  - _ .
    const cleaned = title.replace(/[^a-zA-Z0-9_\-.]/g, '').replace(/^[_\-.]+/, '')
    log(cleaned)

    if (!cleaned.length) {
      // eslint-disable-next-line  no-alert
      alert('Please try another title that contains more alphanumeric characters')
      return false
    }

    return true
  }

  static popover_menu(selector, opts) {
    // setup options
    const options = {
      trigger: 'hover focus click', // make accessible
      container: selector,
      content: opts.content,
      html: true,
    }
    // do not overwrite values given by the 'data-' attribute
    if (opts.title)
      options.title = opts.title
    if (opts.placement)
      options.placement = opts.placement
    if (opts.trigger)
      options.trigger = opts.trigger

    // setup popover
    $(selector).popover(options)
  }


  // makes the tooltip show for picking dates
  static date_switcher(htm) {
    const selector = '#date_switcher'

    // make a tooltip trigger manually, on hover, but then *hold it showing*
    // until they leave area *including* tooltip itself
    $(selector).tooltip({
      html: true,
      trigger: 'manual', // we gonna control hover behaviour
      placement: 'bottom',
      title: htm,
    }).on('mouseenter focusin', function date_switcher_hover() {
      // check first if already showing, to avoid "flickering" with "show! .. show!"
      if (!($(selector).parent().find('.tooltip').length))
        $(this).tooltip('show')
    })


    // the date_switcher lives inside bigger "sortbar".  the date changing tooltip
    // lives inside it (and hangs off it).  So what we *really* want as the trigger
    // to hide the date change tooltip is the entire sortbar itself.  nice!
    $('.sortbar').on('mouseleave', () => {
      log('not hovering sortbar anymore')
      $(selector).tooltip('hide')
    })


    $(selector).on('shown.bs.tooltip', () => {
      // make any link hit change which one is "in"
      // (just before page starts to reload)  finesse!
      $(selector).parent().find('.date_switcher').on('click', function date_switcher_click() {
        $(this).parents('.tooltip').find('.date_switcher.in').removeClass('in')
        $(this).addClass('in')
      })
    })
  }


  // NOTE: UNUSED BUT KEPT IN CASE WE EVER GO BACK FROM NEWER/BETTER CSS-ONLY SOLUTION!
  //
  // [ Now we use CSS to (max-/)width C2 and C4 *instead* for a much better user experience
  //   AND for a more efficient / kinder to browser non-JS solution! ]
  static tiles_to_list() {
    /*
      First, allow natural HTM/CSS widths of 3 of 5 "table-cell" display type columns
        C1         C234      C5
        VIEWS  ..  DATE  ..  MT-ICON

        Compute width of "C234" - width of C3/DATE.
        Split TITLE (C2) and CREATOR (C4) max-width into
        60% / 40% split of that #pixels.
    */

    // NOTE: there can be 2+ sets of results on a page -- eg: "My Library" page!
    const selector = AJS.selector()
    const $selector = $(selector).first()
    log('lister() SELECTOR', selector)

    const C3   = $selector.find('.results .item-ia:first   .C3').outerWidth()
    const C234 = $selector.find('.results .item-ia:first .C234').outerWidth()

    // the "-20" was empirically observed / made up -- get some science, girl!
    const availWidth = (C234 - C3) - 20
    const C2 = Math.max(80, Math.round(0.6 * availWidth))
    const C4 = Math.max(80, Math.round(0.4 * availWidth))
    log('C3  ',   C3)
    log('C234', C234)
    log('C2  ',   C2)
    log('C4  ',   C4)
    log(' ==> availWidth: ', availWidth, '(', C2, '+', C4, ')')

    $selector.find('.results .item-ia .C2').css({ width: C2, 'max-width': C2 })
    $selector.find('.results .item-ia .C4').css({ width: C4, 'max-width': C4 })
  }


  // We moved to newer tactic Mar2015...
  // Pages are emitted by default with body classes "lists" and "showdetails".
  // We use JS to toggle/remove them and switch off details or switch to "tiles" mode.
  static lists_v_tiles_setup(cookie_range) {
    // does user have any cookied preferences?
    const defaults    = 'tiles' // (cookie_range === 'search' ? 'lists' : 'tiles')
    const prefer      = ($.cookie(`view-${cookie_range}`))
    const showdetails = ($.cookie(`showdetails-${cookie_range}`))

    const checked = (showdetails === 'showdetails'  ||
                      (showdetails === null  &&  defaults === 'lists'))

    if (prefer === 'lists'  ||  (!prefer  &&  defaults === 'lists')) {
      if (checked)
        return // perfect, we are already what they want
      $('body').removeClass('showdetails') // they dont want full details right now
    } else {
      // switch to "tiles" mode
      $('body').removeClass('lists'.concat(checked ? '' : ' showdetails')).addClass('tiles')
    }
  }


  static showdetails_toggle(btn, cookie_range) {
    const $body = $('body')

    const to = ($body.hasClass('showdetails') ? '' : 'showdetails')
    log('showdetails_toggle() going to: ', to)

    $.cookie(`showdetails-${cookie_range}`, to, { path: '/', expires: 30, domain: '.archive.org' })

    $body.toggleClass('showdetails')
  }


  static tiles_toggle(btn, cookie_range) {
    const $body = $('body')

    const to = ($body.hasClass('tiles') ? 'lists' : 'tiles')
    log('tiles_toggle() going to', to)

    $body.removeClass('lists tiles').addClass(to)
    AJS.tiler()

    $.cookie(`view-${cookie_range}`, to, { path: '/', expires: 30, domain: '.archive.org' })

    return false
  }


  /**
   * Returns which tab page appears to be in
   * @returns {String}
   */
  static inTab() {
    return $('.welcome .tabby.in .tabby-text')
      .first()
      .text()
      .toLowerCase()
      .trim()
  }

  // Returns one of these, like "#ikind-[IKIND]"
  //
  // COLLECTION PAGES, ACCOUNT PAGES:
  //
  //   #ikind--downloads
  //   #ikind--titleSorter
  //   #ikind--publicdate
  //   #ikind--date
  //   #ikind--reviewdate
  //   #ikind--updatedate
  //   #ikind--creatorSorter
  //
  //   #ikind-downloads
  //   #ikind-titleSorter
  //   #ikind-publicdate
  //   #ikind-date
  //   #ikind-reviewdate
  //   #ikind-updatedate
  //   #ikind-creatorSorter
  //
  // ACCOUNT PAGES (additionally):
  //
  //   #ikind-loans-waiting-list
  //   #ikind-loans-on-loan
  //   #ikind-loans-history
  //
  // OTHER:
  //
  //   #ikind-search              (search)
  //
  static selector() {
    const inTab = AJS.inTab()
    if (inTab === 'forum'  ||  inTab === 'posts'  ||  inTab === 'about')
      return false // no tab of tiles are showing

    let selector = false
    if (inTab) {
      // We want to end up with a selector like:
      //    #ikind-collections-title
      //    #ikind--publicdate
      log('inTab', inTab)
      const tmp = `#tabby-${inTab.replace(' ', '-')}`
      if (inTab === 'collection'  ||  inTab === 'collections'  ||  inTab === 'uploads' || inTab === 'reviews' || inTab === 'web archives') {
        selector = '#'.concat($(tmp.concat(' div.ikind.in:first')).attr('id'))
      } else {
        const ikind = $(tmp.concat(' .ikind.stealth.in:first')).text().toLowerCase().replace(/ /, '-')
        selector = `#ikind-${inTab}${ikind === '' ? '' : '-'}${ikind}`
      }
    } else {
      // we want to end up with a selector like:
      //    #ikind-date
      selector = '#ikind-'.concat($('.ikind.stealth.in:first').text().toLowerCase().replace(/ /, '-'))
      if (!$(selector).length) selector = '#ikind-search' // xxx  SHORE THIS UP, GIRL!
    }

    log('SELECTOR', selector)

    return selector
  }


  // adds collection parent hovering image and text to tiles
  static parent_hover($selector) {
    $selector.find('.item-ia:not(.hov):not(.collection-ia):not(.account-ia)').addClass('hov')
      .mouseover(((e) => $(e.currentTarget).find('.item-parent').addClass('hoverin')))
      .mouseout(((e)  => $(e.currentTarget).find('.item-parent').removeClass('hoverin')))
  }


  static tiler(selectorIn, noRecall) {
    const TILE_WIDTH       = 180 // NOTE: needs to stay in sync w/ archive.less
    const TILE_WIDTH_SMALL = 150 // NOTE: needs to stay in sync w/ archive.less
    const tileMarginH = 30
    const tileMarginW = 17


    // See lister() for why this is able to be commented out now!
    // $('.results .item-ia .C2, .results .item-ia .C4').css({'width':'','max-width':''});
    if (!$('body').hasClass('tiles')) {
      if ($('body').hasClass('showdetails'))
        $('.sortbar input[name=showdetails]').prop('checked', true)
      // AJS.lister()
    }

    const selector = (selectorIn  ||  AJS.selector())
    if (selector === false)
      return


    const $selector = $(selector).first()
    const selectorID = $selector.attr('id')
    const $parentRow = $selector.parents('.row')

    // CSS Grid tiler experiment.  OFF/unused.
    // This could be a way to drop much of the JS to do our 'masonic' tiling by leveraging
    // CSS Grid row 'strips' and space the tile to the closest overall height of narrow rows
    // instead of JS-based calculations for absolute 'top' positioning.
    // eslint-disable-next-line  compat/compat
    const cssGrid = (false  &&  $('body').hasClass('devbox')  &&  CSS.supports('display', 'grid'))


    if (!$('body').hasClass('tiles')) {
      $parentRow.css({ 'padding-left': '', 'padding-right': '' })
      return
    }


    if (!AJS.tilerPREV) {
      // first time tiling page!
      AJS.tilerPREV = {
        winW: 0,
        pad: 0,
        nPerRow: 1,
        gutter: tileMarginW,
        tileWidth: TILE_WIDTH,
        unsourced: {},
        firstLeft: 0,
      }

      AJS.parent_hover($selector)
    }

    if ($(window).width() !== AJS.tilerPREV.winW) {
      // First time, or page resize/orientation change.
      // We will effectively "cache" all this adjusting computations, so multiple calls to tiler()
      // can reuse if window width hasnt changed
      // (for efficiency, eg: many images still slowly loading..)
      $parentRow.css({ 'padding-left': '', 'padding-right': '' }) // reset (see below)
      AJS.tilerPREV.firstLeft = 0  // reset (see below)

      // Displays mobile facets styling at this value. Value should mirror
      // the less variable @facet-mobile-breakpoint.
      const is_mobile = $(window).width() < 568
      const $facets = $parentRow.find('.columns-facets:visible')
      let facetsWidth = $facets.outerWidth()  ||  0
      if (facetsWidth)
        facetsWidth += 1 + parseInt($facets.css('padding-right'), 10) // add columns-items gutter
      const availWidth = is_mobile ? $(window).width() : $parentRow.width() - facetsWidth
      const gutter = is_mobile ?  (availWidth - $selector.width()) / 2 : tileMarginW
      const tileWidth = $('.item-ia:first').outerWidth() >= TILE_WIDTH ?
        TILE_WIDTH :
        TILE_WIDTH_SMALL
      const nPerRow = Math.max(1, Math.floor((availWidth + gutter) / (tileWidth + gutter)))
      const extra   = is_mobile ?
        0 :
        Math.max(0, (availWidth - (nPerRow * (tileWidth + gutter))) + gutter)

      log(
        'tiling', selectorID,
        'parentRowW', $parentRow.width(),
        'facetsWidth', facetsWidth,
        'availWidth: ', availWidth,
        'number per row', nPerRow, '. ',
        'With gutter margin', gutter,
        'had ', extra, 'extra pixels',
      )
      AJS.tilerPREV.pad = Math.round(extra / 2)

      AJS.tilerPREV.winW = $(window).width()
      AJS.tilerPREV.nPerRow = nPerRow
      AJS.tilerPREV.gutter = gutter
      AJS.tilerPREV.tileWidth = tileWidth
    }

    if (!cssGrid) {
      if (AJS.tilerPREV.nPerRow > 1)
        $parentRow.css({ 'padding-left': AJS.tilerPREV.pad, 'padding-right': AJS.tilerPREV.pad })
      else
        AJS.tilerPREV.firstLeft = AJS.tilerPREV.pad
    }

    let nImgZeroHeight = 0
    const nImgZeroHeightAry = []
    let maxtop = 0
    const tops = { 0: 0 }
    const lefts = { 0: AJS.tilerPREV.firstLeft }
    if (!cssGrid) {
      for (let i = 1; i < AJS.tilerPREV.nPerRow; i++) {
        lefts[i] = lefts[i - 1] + AJS.tilerPREV.gutter + AJS.tilerPREV.tileWidth
        tops[i] = 0
      }
    }


    // Any item tiles w/ unloaded/set src tags get updated and loaded now!
    // Only have to do this pass on a swathe of new results (1st page or infin scroll set added)
    if (!AJS.tilerPREV.unsourced[selectorID]) {
      log('unsourcing', selectorID)
      // eslint-disable-next-line  prefer-arrow-callback
      $selector.find('.item-ia img[source]').each(function tiler_unsourcing(k, v) {
        $(v).attr({
          src: $(v).attr('source'),
          onError: '$(this).attr("src","/images/notfound.png")',
        }).removeAttr('source')
      })
      AJS.tilerPREV.unsourced[selectorID] = 1
    }


    if (cssGrid)
      $selector.find('.results').removeClass('grid-tiles') // we need to let tiles size naturally first
    else
      AJS.colPREV = -1 // we track where previous tile was placed

    $selector.find('.item-ia').not('.mobile-header').css('visibility', 'hidden').each((idx, val) => {
      const $val = $(val)
      const $valHT = $val.innerHeight()
      // log('$valHT', $valHT)

      const css = {}
      if (cssGrid) {
        log(`${$valHT} span: ${Math.ceil(($valHT + 25) / 35)}`)
        css['grid-row-end'] = `span ${Math.ceil(($valHT + 25) / 35)}`
      } else {
        let col = 0
        if (AJS.tilerPREV.nPerRow > 1  &&  idx >= AJS.tilerPREV.nPerRow) {
          // First, cycle from last placed tile column location to "first cycled slot".
          // (That is, move "1 to right" from last placed tile column, but it's a cycle/ring
          // for final column -- go to 1st column in that case).
          // Test place new tile *there* (in "first cycled slot") UNLESS further ahead in
          // cycle/ring of other slots, the tile will fit where its BOTTOM will be above where
          // tile TOP would be in the "first cycled slot".
          // (and pick the "first" in such a case if 2+ slots like that)
          const colTEST = ((AJS.colPREV + 1)  %  AJS.tilerPREV.nPerRow)
          col = colTEST // fallback/default
          const cmpTEST = tops[colTEST] - $valHT // [slightly more efficient way 2 compare]
          for (let i = 0; i < AJS.tilerPREV.nPerRow; i++) {
            if (i !== colTEST  &&  cmpTEST > tops[i]) {
              col = i
              break
            }
          }
        } else {
          col = (idx % AJS.tilerPREV.nPerRow)
        }
        AJS.colPREV = col
        css.visibility = 'visible'
        css.top  =  tops[col]
        css.left = lefts[col]

        // setup for next tile...
        tops[col] += ($valHT + tileMarginH)

        maxtop = Math.max(maxtop, tops[col])
      }

      $val.css(css)


      // track how many tile images are without height
      // (either not loaded or no CSS height style set if img not loading from DB)
      let tmp = $val.find('.item-img')

      if (tmp.length  &&  !($val.find('.item-img').height())) {
        nImgZeroHeight += 1
        tmp = $val.attr('data-id')
        if (tmp)
          nImgZeroHeightAry.push(tmp)
      }
    })

    if (cssGrid) {
      $selector.find('.results').addClass('grid-tiles')
      $selector.find('.item-ia').css({ visibility: 'visible' })
    } else {
      // we have to manually set the height of the "selector"
      log('maxtop', maxtop)
      $selector.find('.results').css({ height: maxtop })
    }


    if ((nImgZeroHeight)  &&  !noRecall) {
      log(
        nImgZeroHeight, ' img (still w/o height); recall tiler(', selector, ')...',
        nImgZeroHeightAry.join(','),
      )
      // recall ourselves, but not more than once every 1.5 seconds!
      clearTimeout(AJS.tiler_throttler)
      AJS.tiler_throttler = setTimeout(() => AJS.tiler(selector, 0), 1500)
    }
  }


  static ikind(lnk, id) {
    const idsel = `#${id}`
    log('ikind', id)
    $(idsel).parent().find('div.ikind.in').hide()
    $(idsel).removeClass('hidden').addClass('in').show()
    $(idsel).parents('.tabby-data').find('a.ikind').removeClass('in')

    $(lnk).addClass('in')

    AJS.tiler(idsel)

    // now select the corresponding element in the shadowing select for mobile
    const $sel = $(idsel).parents('.tabby-data').find('select.ikind-mobile')
    const $new = $sel.find('option:contains('.concat($(lnk).text(), ')'))
    const $now = $sel.find('option:selected')
    if ($new.text().trim() !== $now.text().trim()) {
      log('changing ikind mobile now to ', $new.text())
      AJS.ikind_mobile_change_ignore_next = true
      $new.attr('selected', 'selected')
      // $now.removeAttr('selected')
    }

    return false
  }

  static ikind_mobile_change(elm) {
    if (AJS.ikind_mobile_change_ignore_next) {
      AJS.ikind_mobile_change_ignore_next = false
      return
    }

    const $selopt = $(elm).find('option:selected')
    log('ikind mobile changed to: ', $selopt.text())
    let $ikinds = $(elm).parents('.tabby-data').find('a.ikind')
    if (!$ikinds.length) {
      // NO tabby!  eg: top page or search page
      $ikinds = $('body').find('a.ikind')
    }

    if (!$ikinds.length)
      return // uho!

    const $ikind = $ikinds.filter((k, v) => $(v).text() === $selopt.text())

    const href = $ikind.attr('href')
    log('goto', href)

    if (href) {
      if (href.substr(0, 1) === '#') {
        // ACCOUNT PAGE (FOR NOW)!  (STILL USES HASH FOR NOW)
        $(`a.ikind[data-id=${href.substr(1)}]`).click()
      } else {
        location.href = href
      }
    }
  }


  static popState(pageType) {
    // are we watching history.pushState() and history.popState() calls?
    AJS.pushState = (typeof history.pushState !== 'undefined')
    log('popState(', pageType, ') called, modern browser: ', (AJS.pushState ? 'y' : 'n'))

    if (pageType) // anything custom we need to do based on pageType?
      return


    const tabPick = (hash2arg) => {
      let tab = cgiarg('tab', true)
      if (tab)
        tab = `#tabby-${tab}-finder`
      else if (hash2arg)
        tab = `#tabby-${hash2arg}-finder`
      else
        tab = '.tabby-default-finder'

      if (AJS.pushState)
        log('goto tab: ', tab, ' ################################################### STATE')
      AJS.tabby_no_pushState_next_click = true
      $(tab).click()
    }

    if (AJS.pushState) {
      // runs on page load or browser "back":
      $(window).on('popstate', () => tabPick())
    }
    // else user has an older browser or Opera Mini and doesn't have pushState/popState!

    tabPick()
  }


  static tabby(lnk, id) {
    log('AJS.tabby()', id)
    const inTab = id.replace(/tabby-/, '').trim()
    if (inTab === 'uploads' || inTab === 'reviews' || inTab === 'collections' || inTab === 'loans' || inTab === 'web archives') {
      // account pages -- we need to fully reload page w/ new/wanted item tiles!
      return true
    }

    // Only collection pages have tabs / proceed
    // All three tabs have all the markup on the page already.
    // So, for modern browsers, we will simply switch the visibile
    // tab and update-in-place the url in the browser url typein
    // -- WITHOUT refreshing the page.

    $('.tabby-data.in').removeClass('in').hide()
    $(`#${id}`).removeClass('hidden').addClass('in').show()
    $('.tabby').removeClass('in')
    $(lnk).parents('.tabby').addClass('in')

    if (AJS.tabby_no_pushState_next_click) {
      delete AJS.tabby_no_pushState_next_click
    } else if (AJS.pushState  &&  typeof history.pushState !== 'undefined') {
      const href = $(lnk).attr('href')
      const locNOW = location.href
      const locNEW = location.protocol.concat('//', location.host, href)
      if (locNOW !== locNEW) {
        log('pushState: ', href, ' ################################################### STATE')
        history.pushState({}, '', locNEW)
      }
    }

    if (inTab === 'collection'  ||  inTab === 'about') {  // collection pages
      if (inTab === 'about')
        AJS.grafs()
      AJS.tiler()
    }

    if (AJS.pushState)
      return false
    return true
  }


  static colclick(e) {
    const $e = $(e)
    const id = $e.attr('data-id')

    // *NORMALLY* clicking on a collection tile goes to it.
    // BUT NOT:
    //   * in lists mode (only the identifier link does that -- not other data columns!)
    //   * if in process of removing items (eg: from favorites list)
    if (id  &&  $('body').hasClass('tiles')  &&  !$e.hasClass('manage-item'))
      location.href = `/details/${id}`
  }


  static head_img_dragdrop_setup(identifier) {
    if (AJS.head_img_dragdrop_setup_done)
      return
    log('head_img_dragdrop_setup')
    AJS.head_img_dragdrop_setup_done = true


    $('#file-dropper-wrap').bind('mouseenter', () => {
      log('enter')
      AJS.head_img_replaceable(identifier)
      $('#file-dropper').show()
    }).bind('mouseleave', () => {
      log('ouddie')
      if (!AJS.file_picked)
        $('#file-dropper').hide()
    })

    $('body').bind('dragover', (evt) => {
      // enable file dropping
      log('dragover')
      evt.stopPropagation()
      evt.preventDefault()

      AJS.head_img_replaceable(identifier)
      $('#file-dropper').addClass('drag_over').show()
      return false
    })

    $('body').bind('dragleave', (evt) => {
      log('dragleave')

      // are we still over a file-dropper div/img?
      let over = ($('#file-dropper-wrap').is(':hover') ||
                  $('#file-dropper     ').is(':hover') ||
                  $('#file-dropper-img ').is(':hover'))
      const x = evt.pageX || evt.originalEvent.pageX
      const y = evt.pageY || evt.originalEvent.pageY
      if (!over) {
        const e = $('#file-dropper-wrap')
        const { left, top } = e.offset()
        if (x >= left  &&  x <= left + e.outerWidth()  &&
            y >= top   &&  y <= top  + e.outerHeight()) {
          // still over the file drop target image area!
          over = true
        }
      }
      if (!over) {
        const e = $('#file-dropper')
        const { left, top } = e.offset()
        if (x >= left  &&  x <= left + e.outerWidth()  &&
            y >= top   &&  y <= top  + e.outerHeight()) {
          // still over the file drop target image area!
          over = true
        }
      }

      if (!over)
        $('#file-dropper').removeClass('drag_over').hide()
    })
  }

  static head_img_replaceable(identifier) {
    // helpfuls:
    //  https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    //  http://www.sitepoint.com/html5-ajax-file-upload/
    if ($('#file-dropper').html().trim() !== '')
      return

    $('#file-dropper').show().html(`
<div>
<button id="file-cancel" type="button" class="close" data-dismiss="alert" aria-hidden="true"
        title="cancel file upload" alt="cancel file upload">
  &times;
</button>
<b>
  <span style="font-size:40px; color:#aaa" class="iconochive-plus-circle" />
</b><br/>
<b>
  Drag & Drop an image file here or
</b>
<button type="button" class="btn btn-info btn-xs" onclick="$('#file-selector').click();">
  Pick image to upload
</button>
<form method="POST" action="/services/post-file.php?submit=1&identifier=${identifier}"
      enctype="multipart/form-data" id="poster">
  <div class="hidden">
    <input id="file-selector" name="file" type="file" accept="image/*"/>
  </div>
  <input type="hidden" name="identifier" value="${identifier}"/>
  <input id="file-submit" type="submit" name="submit" value="SUBMIT" class="btn btn-success"/>
  <div id="file-uploading">
    Uploading your file..
  </div>
</form>
</div>`)


    $('#file-cancel').bind('click', (evt) => {
      AJS.cancelFile()

      evt.stopPropagation()
      evt.preventDefault()
      return false
    })


    $.event.props.push('dataTransfer') // if not set, dataTransfer is not sent


    const success = () => {
      log('success!')
      // AJS.cancelFile()
    }


    // upload an image (typically a collection/list header or account/person profile)  via S3
    // returns '' on success; else string w/ error/fail reason
    const uploadFile = () => {
      let fail = false

      if (typeof XMLHttpRequest === 'undefined')
        fail = 'browser appears to not have HTML5 functionality'

      if (!fail)
        fail = AJS.badFile()


      const xhr = new XMLHttpRequest()
      if (!fail) {
        log(AJS.file2post)
        if (!xhr.upload)
          fail = 'browser submit setup failed'
      }

      if (fail)
        return fail


      // start upload
      log('post')
      // if (navigator.userAgent.indexOf('Safari') > 0) xhr.timeout = 10 * 60 * 1000; // 10 min
      xhr.open(
        'POST',
        location.protocol.concat(
          '//', location.host,
          '/services/post-file.php?submit=1&identifier=', identifier,
          '&fname=', encodeURIComponent(AJS.file2post.name),
        ),
        false,
      ) // block synchronously on the post!
      // if (!options.sendBoundary) xxx
      xhr.setRequestHeader('Content-Type', 'multipart/form-data; charset=UTF-8')
      xhr.send(AJS.file2post)

      const reply = xhr.responseText
      const mat = reply.match(/SUCCESS \(task_id=(\d+)\)/)
      if (mat  &&  mat.length) {
        const task_id = mat[1]
        log('STALKING TASK_ID: ', task_id)

        $('#file-dropper').html('waiting for updates..')
        let stalker_ptr = false
        const stalker = () => {
          log('STALKING...')
          $.ajax({
            type: 'GET',
            url: '/catalog_status.php?task_ids='.concat(task_id, '&rand=', Math.random()),
            dataType: 'xml',
            success: (xml) => {
              log(xml)
              const x = {
                green: parseInt($(xml).find('wait_admin0').text(), 10) || 0,
                blue:  parseInt($(xml).find('wait_admin1').text(), 10) || 0,
                red:   parseInt($(xml).find('wait_admin2').text(), 10) || 0,
              }
              log(x)
              const nWait = x.green + x.blue + x.red
              $('#file-dropper').html(`waiting for ${nWait} tasks to run`)
              if (!nWait) {
                log('task(s) done!')
                clearInterval(stalker_ptr)
                $('#file-dropper').html('reloading page with your image')
                window.location.reload()
              } else if (x.red) {
                $('#file-dropper').html('<div class="alert alert-danger">status task failure -- an admin will need to resolve</div>')
                clearInterval(stalker_ptr)
              }
            },
          })
        }

        // every 2 seconds, check for status
        stalker_ptr = setInterval(stalker, 2000)
      } else {
        log(reply)
      }

      log('post done')
      return ''
    }


    $('#file-selector').bind('click', () => {
      AJS.file_picked = 'selected'
    }).bind('change', (evt) => {
      log('file dropdown selected!')
      $('#file-submit, #file-cancel').show()
      log(evt)
      if (evt.target  &&  evt.target.files  &&  evt.target.files.length) {
        [AJS.file2post] = evt.target.files
        AJS.previewFile()
      }
    })


    $('#file-dropper').bind('drop', (evt) => {
      // we've been dropped a file (from a drag-and-drop)!
      evt.stopPropagation()
      evt.preventDefault()

      log(evt.dataTransfer.files)
      $('#file-dropper').removeClass('drag_over')

      $('#file-submit, #file-cancel').show()


      if (evt.dataTransfer.files.length) {
        AJS.file_picked = 'dropped';
        [AJS.file2post] = evt.dataTransfer.files
        AJS.previewFile()
      }
    })


    $('#poster').bind('focusin', (evt) => {
      log(evt.type)
      $('#file-uploading').show()
    }).bind('submit', (evt) => {
      log('submit!')
      $('#file-uploading').show()

      // First try the schmancy HTML5 submit via XMLHttpRequest and FileReader.
      // If we fail, we'll fallback to form submit normal action.
      const fail = uploadFile()
      if (fail === '') {
        // SUCCESS!  we are done!
        success()
        evt.stopPropagation()
        evt.preventDefault()
        return false
      }

      if (AJS.file_picked === 'dropped') {
        // we had client drag-n-drop the file -- we can't post it!
        // epic fail...
        AJS.cancelFile()
        // eslint-disable-next-line  no-alert
        alert(`Failure: ${fail}`)
        evt.stopPropagation()
        evt.preventDefault()
        return false
      }

      // OK fallback to normal (selected) file submit (and full page reload)!
      return true
    })


    // now center file-dropper over current image
    const w1 = $('#file-dropper-img').outerWidth()
    const h1 = $('#file-dropper-img').outerHeight()
    const w2 = $('#file-dropper').outerWidth()
    const h2 = $('#file-dropper').outerHeight()
    $('#file-dropper').css({
      left: Math.round((w1 - w2) / 2),
      top:  Math.round((h1 - h2) / 2),
    })

    if (ios) {
      $('#file-dropper > form > div.hidden').removeClass('hidden')
      $('#file-dropper > button').addClass('hidden')
    }
  }


  // client-side preview the image directly in the browser!  xxx catch exceptions, etc.
  static previewFile() {
    $('#file-dropper .uppreview').remove() // remove any prior upload/preview

    if (AJS.badFile()) {
      AJS.cancelFile()
      return false
    }

    if (typeof FileReader === 'undefined')
      return false

    const reader = new FileReader()
    reader.onload = (evt) => {
      log(evt.target)
      const im = new Image()
      im.src = evt.target.result
      $('#file-dropper').append(im)
      $(im).addClass('uppreview')
      // $('#file-dropper').css(
      //      {'background':'url(' + evt.target.result + ') no-repeat center center'})
    }

    log(AJS.file2post)
    reader.readAsDataURL(AJS.file2post)
    return true
  }


  static cancelFile() {
    $('#file-dropper .uppreview').remove() // remove any prior upload/preview
    $('#file-dropper, file-submit, #file-cancel, #file-uploading').hide()
    if (AJS.file_picked)
      delete AJS.file_picked
    if (AJS.file2post)
      delete AJS.file2post
  }


  static badFile() {
    let fail = false

    if (!fail  &&  !AJS.file2post)
      fail = 'file is missing'

    // php upload_max_filesize is 8M
    if (!fail  &&  AJS.file2post.size > 8000000)
      fail = 'file is over 8MB in size'

    if (!fail) {
      const type = AJS.file2post.type.toLowerCase()
      if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/gif')
        fail = 'file not required format of JPEG or PNG or GIF'
    }

    if (fail)
      // eslint-disable-next-line  no-alert
      alert(fail)

    return fail
  }


  // for microfilm books with many months of newspapers in PDF
  //   eg: /details/la_caleagle_reel1
  //
  // paginfo is a logical hashmap JSON object of:
  //   YYYYMMDD => [comma separated list of pages]
  // eg:
  //   20080129 =>  "1,2,3,11,17"
  static drawPDF(identifier, pageinfo) {
    const urlstart = '/download/'.concat(
      identifier, '/',
      identifier, '_pdf.zip/',
      identifier, '_pdf/', identifier, '_',
    )
    let multi_year = false
    let last_year  = false

    // eslint-disable-next-line  guard-for-in
    for (const key in pageinfo) {
      const year = key.substr(0, 4)
      if (last_year === false) last_year = year
      if (last_year !== year) {
        multi_year = true
        break
      }
    }

    const sep = ''
    let str = sep
    let lastyearmonth = 666
    // eslint-disable-next-line  guard-for-in
    for (const key in pageinfo) {
      // log(key); log(pageinfo[key]);
      const pages     = pageinfo[key].split(',')
      const year      = key.substr(0, 4)
      const month     = parseInt(key.substr(4, 2), 10)
      const day       = parseInt(key.substr(6, 2), 10)
      const yearmonth = year.concat('-', month)
      let skip_day = false

      let monthName = ''
      if (yearmonth !== lastyearmonth) {
        /**/ if (month ===  1)        monthName = 'January'
        else if (month ===  2)        monthName = 'February'
        else if (month ===  3)        monthName = 'March'
        else if (month ===  4)        monthName = 'April'
        else if (month ===  5)        monthName = 'May'
        else if (month ===  6)        monthName = 'June'
        else if (month ===  7)        monthName = 'July'
        else if (month ===  8)        monthName = 'August'
        else if (month ===  9)        monthName = 'September'
        else if (month === 10)        monthName = 'October'
        else if (month === 11)        monthName = 'November'
        else if (month === 12)        monthName = 'December'
        else if (month === undefined) monthName = 'Single Page PDFs'
        else /*             */        monthName = 'Unknown_'.concat(month)

        if (multi_year) monthName = year.concat(' ', monthName)

        // make header/a that shows/hides a hidden div after it with the month's data
        str += (str ? '</div><!--mo--><br/>' : '')
        str += `
<a href="#${monthName},${year}" onclick="$('#m${yearmonth}').toggle(); return false">
<span class="iconochive-folder" /> ${monthName}
</a>
<div class="mo" id="m${yearmonth}">`
      }

      // make header/a that shows/hides a hidden div after it with the page data
      if ((day === undefined) || (day === '')) skip_day = true
      if (skip_day) {
        str += '<div class="day">'
      } else {
        str += `
<div class="day">
<a href="#${yearmonth}-${day}"
    onclick="$('#m${yearmonth}d${day}').toggle();return false;">
  <span class="iconochive-folder" /> ${day}
</a>
<div class="pages" id="m${yearmonth}d${day}">`
      }

      // drop in the individual page links
      let offset = 1
      let page
      let pnum
      for (let j = 0; j < pages.length; j++) {
        page = pages[j]
        if (!page)
          // eslint-disable-next-line  no-continue
          continue
        if (offset > 0) offset = 1 - page
        pnum = parseInt(page, 10) + offset

        // left 0-pad to 4 digits as needed
        page = '0000'.concat(page)
        page = page.substr(page.length - 4, 4)

        const url = urlstart.concat(page, '.pdf')
        str += `<a href="${url}">[${pnum}]</a> `
      }

      if (skip_day)
        str += '</div>'
      else
        str += '</div><!--pages--></div><!--day-->'

      lastyearmonth = yearmonth
    }

    str += '</div><!--mo-->'

    // replace the "pdfs" empty div with our hefty HTML
    $('#pdfs .replaced').html(str)
  }


  // for collection pages, [About] tab
  static grafs() {
    const $graph_views_api = $('#grafs_views_api')
    const $grafs1 = $('#grafs1')
    const $grafs2 = $('#grafs2')
    if (!$grafs1.length)
      return
    if (typeof $grafs1.attr('data-id') === 'undefined')
      return

    const identifier = $grafs1.attr('data-id')
    $grafs1.attr('data-id', null)

    log('loading grafs')
    $graph_views_api.html('<i><small>loading graph <img src="/images/loading.gif"/></small></i>').show()
    $grafs1.html('<i><small>loading graph <img src="/images/loading.gif"/></small></i>').show()
    $grafs2.html('<i><small>loading graph <img src="/images/loading.gif"/></small></i>').show()
    const tok = '<h2>'
    $.get('/details/'.concat(identifier, '&grafs=1&v=3'), (htm) => {
      const a = htm.split(tok)
      if (a.length >= 3) {
        $('#activity-reviewsN').html(a[1]).parents('.activity-box').show()
        $('#activity-forumN  ').html(a[2]).parents('.activity-box').show()
      }
      if (a.length === 6) {
        $graph_views_api.html(tok + a[3])
        $grafs1.html(tok + a[4])
        $grafs2.html(tok + a[5])
      } else {
        $graph_views_api.html('(graph data not available)')
        $grafs1.html('(graph data not available)')
        $grafs2.html('(graph data not available)')
      }
    })

    Geo.setUpTopRegionsTable()
  }


  static quick_down(id, target) {
    const idsel = `#${id}`

    if (!$('.format-group.in').length) {
      // no set of files for a single format showing... yet!
      const format = $(target).text()
      const $formatGroup = $(idsel).parents('.format-group')

      $('.download-button').html(format.concat(' FILES'))
      $formatGroup.addClass('in')
      // hide the other summary formats (one-liner) clickables
      $('.format-group:not(.in)').slideUp()
      $(idsel).slideDown()
    } else {
      // re-open all the summary formats (one-liner) clickables
      $('.format-group').slideDown(400)
      // close the open set of single files
      setTimeout(() => { // ftw, thx for nothing jquery
        $('.format-group.in').removeClass('in')
        $('.download-button').html('DOWNLOAD OPTIONS')
      }, 400)
      $(idsel).slideUp()
    }

    return false
  }


  // parse a CGI arg
  static arg(theArgName, try_full) {
    const sArgs = (try_full  &&  location.search === '' ?
      location.href.slice(1).split('&') :
      location.search.slice(1).split('&'))
    for (let i = 0; i < sArgs.length; i++) {
      if (sArgs[i].slice(0, sArgs[i].indexOf('=')) === theArgName) {
        const r = sArgs[i].slice(sArgs[i].indexOf('=') + 1)
        return (r.length > 0 ? unescape(r) : '')
      }
    }
    return ''
  }

  static scrolled() {
    const newtop = $(window).scrollTop()
    // log('scrolled to ', newtop)

    const selector = '.more_search:visible'
    const $e = $(selector)
    if (!$e.length)
      return

    // make the edge detect for "hit bottom" 40 pixels from the bottom
    const check = (($e.offset().top + $e.outerHeight()) - $(window).height()) - 40
    // log('-v- check', check)
    if (newtop > check) {
      log('hit rock bottom > ', check)
      if (!AJS.more_searching)
        $(selector.concat(' > a')).get(0).click() // avoid jQuery - issue w/ webcomponents polyfill
    }
  }


  static more_search(lnk, urlIn, page_now) {
    const selector = AJS.selector()
    if (selector === false)
      return false

    const ikind = selector.replace(/#ikind-/, '')

    const $more_search = $(selector.concat(' .more_search'))

    // we stash a reference of what page the client has requested, so we can increment it on
    // each "more_search hit
    const pageKey = selector
    if (typeof AJS.page_map === 'undefined')
      AJS.page_map = {}
    if (typeof AJS.page_map[pageKey] === 'undefined')
      AJS.page_map[pageKey] = (page_now || 1)

    if (AJS.page_map[pageKey] < 0) {
      // $more_search.find('.more-search-all').show()
      return false // all results showing -- no more for the ikind avail so noop/ignore
    }

    AJS.page_map[pageKey] += 1
    const page = AJS.page_map[pageKey]

    $more_search.find('.more-search-fetching').show()

    AJS.more_searching = true

    let url = urlIn + page
    const urlreplace = location.protocol.concat('//', location.host, url)
    url += '&scroll=1'

    log('url: ', url)              // url to AJAX get next page
    log('urlreplace', urlreplace)  // url to change browser location (visually) to


    log('more_search(selector=', selector, 'sort=', ikind, 'page=', page, 'url=', url, ')')
    // log(AJS.page_map)


    $.get(url, (htm) => {
      if (htm.length < 100  &&  $(htm).find('div.no-results')) {
        // no more results avail/found.  we have reached infinity!
        $more_search.find('.more-search-fetching, a.btn').hide()
        // $more_search.find('.more-search-all').show()
        AJS.page_map[pageKey] = -1 // flag to ignore future more_search attempts
        AJS.more_searching = false
        return
      }

      if (AJS.pushState  &&  typeof history.replaceState !== 'undefined')
        history.replaceState({}, '', urlreplace)


      const selectorID = $(selector).attr('id')
      if (AJS.tilerPREV  &&  AJS.tilerPREV.unsourced  &&  AJS.tilerPREV.unsourced[selectorID])
        delete AJS.tilerPREV.unsourced[selectorID]


      const $selector = $(selector.concat(' .results'))
      $selector.append(AJS.addNotes(AJS.addingNotesKind, htm))

      // re-tile and re-flow!  (the force should flow through you)
      AJS.tiler(selector)
      $more_search.find('.more-search-fetching').hide()
      AJS.more_searching = false

      AJS.parent_hover($selector)


      // OK, this is quite a bit more subtle...  the HTM has been dropped in,
      // *and* we've done a basic re-tiling.  however, it's very likely many
      // of the images are still loading.  so listen for image "is loaded" events
      // if they trickle in, and at most re-tile every 1 second (even if they
      // likely trickling in at a faster rate than that) until they all loaded
      $(selector.concat(' img')).on('load', () => {
        clearTimeout(AJS.more_search_throttler)
        AJS.more_search_throttler = setTimeout(AJS.tiler, 1000)
      })


      if (typeof archive_analytics !== 'undefined')
        archive_analytics.send_scroll_fetch_event(page)
    })

    return false
  }


  // when embed codes are being shown, adjust their heights so they show all the content/codes!
  static embed_codes_adjust() {
    log('showing embeds!')

    // these are found (only) on /details/ pages
    for (const embid of ['embedcodehere', 'embedcodehereWP']) {
      const $embid = $(`#${embid}`)
      $embid.removeAttr('rows').css('height', '')

      const embtxt = $embid.text()

      // this is *puke* city -- since textareas are a PITA, make a shadow div w/ the
      // text we want in it, trying to be same width, same font-size, etc.
      // and *then* insert into DOM invisibily so we can calculate its overall height
      // .. and then peg the textarea height to that height
      $('body').prepend($('<div/>').attr({
        id: `${embid}Shadow`,
        class: 'textarea-invert-readonly roundbox5',
      }).css({
        position: 'absolute',
        visibility: 'hidden',
        top: 60,
        left: 10,
        padding: '5px 15px 5px 15px',
        width: $embid.width(),
        'font-size': $embid.css('font-size'),
      })
        .text(embtxt))

      const bestHT = $(`#${embid}Shadow`).outerHeight() + 15
      log(embid, 'bestie height', bestHT, 'for current width', $embid.width())
      $(`#${embid}Shadow`).remove()

      $embid.height(bestHT)
    }
  }

  /**
   * Dynamically adds modal to page (if isnt there already)
   * @param {String} selector - Id of the modal
   * @param {Object} conf - configuration options:
   *    @param {String || DOM Element} prepended_el - element that modal will be prepended to
   *    @param {String} headerClass - additional class(es) added to header div
   *    @param {String} title - innerHTML of modal h2 heading
   *    @param {String} body - innerHTML of modal body
   */
  static modal_add(selector, conf) {
    if ($(selector).length)
      $(selector).remove();

    const selectorID = selector.replace(/#/, '')
    const { prepended_el = document.body } = conf;

    $(prepended_el).prepend(`
<div id="${selectorID}" class="modal fade" role="dialog" aria-hidden="true">
<div class="modal-dialog modal-lg">
  <div class="modal-content">
    <div class="modal-header ${conf.headerClass !== undefined ? conf.headerClass : 'modal-header-std'}">
      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">
        <span class="iconochive-remove-circle"></span>
      </button>
      <h2 class="modal-title">
        ${typeof conf.title === 'undefined' ? 'Confirmed' : conf.title}
      </h2>
    </div>
    <div id="${selectorID}-body">
      ${typeof conf.body === 'undefined' ? '' : conf.body}
    </div>
  </div>
</div>
</div>`)
    return $(selector);

    // $('body').addClass('blurry') // exxxperiment!
  }

  /**
   * Parse API data and check if the item is successfully marked to favorite or not
   *
   * @param {String} bookmarkRes response data from /bookmarks.php?add_bookmark=1&...
   * @return {Boolean}
   */
  static isFavoriteSuccessful(bookmarkRes) {
    return (bookmarkRes.indexOf('<meta name="ia-favorite-success" content="1">') !== -1)
  }

  /**
   * Toggle favorite button on details page
   * @param {HTMLElement} element - Toggle button on /details/ page
   * @return {Boolean}
   */
  static toggle_list_status(element) {
    if ($(element).hasClass('favorited'))
      Manage.remove_favorite_item(element, true)  // Un-Favorite list or item
    else
      AJS.modal_go(element, { favorite: 1 })  // Favorite list or item

    return false
  }

  /**
   * Gives us ability to have JS intercept an href click and instead do a bootstrap modal.
   * We don't take user to the href target
   *
   * Used to open different modals Like Favorite list or item, share modal etc.
   * @param {HTMLElement} element - HTML element which have been clicked on
   * @param {Array} config - config is a hashmap with optional keys like:- auto_close,
   * auto_remove, * body, center, favorite, * ignore_lnk, titlen, headerClass, shown,
   * follow_link_on_dismiss
   * @return {Boolean}
   */
  static modal_go(element, config) {
    const conf = config
    const $element = $(element)

    if (conf.favorite) {
      $element.addClass('favorited')

      // Configure Favorite modal
      conf.center = true
      conf.auto_close = true
      conf.title = 'Favorited'
      conf.body = '<center><span style="font-size:100px;" class="iconochive-favorite"></span></center>'
      conf.login = true // must be logged in!
    }

    const selector = $element.attr('data-target')
    const href = $element.attr('href')

    if (!conf.ignore_lnk)
      AJS.modal_add(selector, conf)

    if (conf.shown) {
      $(selector).on('shown.bs.modal', () => {
        conf.shown()
      })
    }

    if (conf.follow_link_on_dismiss) {
      $(selector).on('hidden.bs.modal', () => {
        log('modal hidden, going to ', href, '..')
        $('body').removeClass('blurry')
        location.href = href
      })
    }

    if (conf.login && $.cookie('logged-in-user') === null) {
      if (location.protocol !== 'https:') {
        // make absolutely sure we never login with http!
        location.href = 'https://archive.org/account/login'
        return false
      }

      const url = '/account/login'
      $.get(url, (htmIn) => {
        // this allows us to effectively rip off the header/nav and footer
        // if we are accessing a full page (eg: account login page)
        const htm = ($(htmIn).find('.container-ia > div').length ?
          $(htmIn).find('.container-ia > div').get(0) :
          htmIn
        )

        // Add class to identify as login variant
        $(selector).addClass('login-modal')

        $(selector.concat('-body')).html(htm)
        $(selector).modal('show')

        const $form = $(selector.concat('-body form:has(input[type=submit])'))
        if (!$form.length)
          return

        $element.removeClass('favorited')

        const $icon = $('.password_icon')[0]

        if (navigator.cookieEnabled === true) {
          $('.cookie-warning').addClass('hidden')
          $('.login-form :input').prop('disabled', false)

          $icon.src = '/images/eye-crossed.svg'
          $icon.alt = 'Show text'

          $('.password_icon').on('click', () => {
            const $input_password = $('.input-password')[0]
            if ($input_password.type === 'password') {
              $input_password.type = 'text'
              $icon.src = '/images/eye.svg'
              $icon.alt = 'Hide text'
            } else {
              $input_password.type = 'password'
              $icon.src = '/images/eye-crossed.svg'
              $icon.alt = 'Show text'
            }
          })

          $('.input-email, .input-password').on('focus', () => {
            $('.password-error').html('')
            $('.reset-password').show()
          })
        } else {
          // If no cookies, show warning, disable login form
          $('.cookie-warning').removeClass('hidden')
          $('.login-form :input').prop('disabled', true)
        }

        loginModal({
          $form,
          url,
          selector,
          AJS,
          element,
          conf,
        })
      })

      return false
    }

    if (conf.auto_remove) {
      conf.auto_close = true
      $(selector).on('hidden.bs.modal', () => {
        $(selector).remove()
        $('body').removeClass('blurry')
      })
    }

    if (!conf.ignore_lnk) {
      const url = element.href
      $.get(url, (res) => {
        if (conf.favorite) {
          if (typeof archive_analytics !== 'undefined') {
            archive_analytics.send_ping({
              kind: 'event',
              ec: 'page_action',
              ea: 'favorite',
              el: location.pathname,
              cache_bust: Math.random(),
            })
          }

          if (AJS.isFavoriteSuccessful(res)) {
            $element.attr({
              href: '#',
              'data-original-title': 'Unfavorite',
            })

            setTimeout((() => {
              if (conf.postLogin)
                location.reload(true)
              else
                $(selector).modal('hide')
            }), AJS.modalInterval)
          } else {
            $element.removeClass('favorited')
            const $favModal = $(selector)
            const failMessage = `
              <center>
                <p class="favorite-failure-message">
                  There was an error adding the favorite. If the problem persists, please contact support.
                </p>
              </center>
            `
            $favModal.find('.modal-title').html('Failed')
            $favModal.find(`${selector}-body`).html(failMessage)
          }
        }

        $(selector).modal('show')
        if (conf.auto_close)
          setTimeout((() => $(selector).modal('hide')), AJS.modalInterval)
      })
      $(selector).on('hidden.bs.modal', () => {
        $(selector).remove()
      })
    } else {
      $(selector).modal('show')
    }

    if (conf.center)
      $(selector.concat(' .modal-dialog')).center() // vertically center

    if (conf.auto_close && conf.ignore_lnk)
      setTimeout(() => $(selector).modal('hide'), AJS.modalInterval)

    return false
  }


  // handy little method to ensure only 1 checkbox is checked
  static check1(obj, selector) {
    if (!obj.checked)
      return

    // toggle others to unchecked
    const $selector = (selector ? $(selector) : $(obj).parents('form'))

    // uncheck all; the re-check the checked one
    $selector.find('input[type=checkbox]').attr('checked', false)

    // eslint-disable-next-line  no-param-reassign
    obj.checked = true
  }


  static suffixFmt(val, axis) {
    if (axis.min >= 0.0  &&  axis.max <= 5)
      // give a little bit more granularity of 1 decimal point...
      return Math.round(val * 10, 1) / 10

    if (val >= 1000000) return (val / 1000000).toFixed(0).concat(' M')
    if (val >=    1000) return (val /    1000).toFixed(0).concat(' K')
    return val.toFixed(0)
  }


  static suffixFmtPercent(val, axis) {
    return AJS.suffixFmt(val, axis).concat('%')
  }


  static descript() {
    const d = $('#descript').get(0)
    if (d  &&  d.offsetHeight < d.scrollHeight) {
      // we overflowed the short descript at the top of the collection page.
      // so show the little MORE button..
      $('#descript-more').show()
      // $('#descript').css({'border-bottom':'1px solid #ccc'})
    }
  }

  /**
   * Return singular or plural string given integer
   *
   * @param {integer} nInt integer
   * @param {string} strOne singular string
   * @param {string} strMany plural string
   */
  static pluralize(nInt, strOne, strMany) {
    if (nInt === 1) {
      // Singular
      return strOne
    }
    // Plural
    return strMany
  }

  /**
   * Return table tooltip of stack chart values
   *
   * @param {array} time split string of date
   * @param {array} values int stack chart values
   * @param {array} labels string stack chart labels
   */
  static viewMessage(time, values, labels) {
    const rows = values.length
    let msg = '<table><tr>'
    msg += `<th class="tt-date" rowspan="${rows}">${time[2]} ${time[3]}</th>`
    msg += `<td class="tt-number">${add_commas(values[0])}</td>`
    msg += `<td>${AJS.pluralize(values[0], 'View', 'Views')} ${labels[0]}</td></tr>`
    // For every stack after the 0th above
    for (let i = 1; i < rows; i++) {
      msg += `<tr><td class="tt-number">${add_commas(values[i])}</td>`
      msg += `<td>${AJS.pluralize(values[i], 'View', 'Views')} ${labels[i]}</td></tr>`
    }
    msg += '<table>'
    return msg
  }

  /**
   * Return function to be evaluated as graph item tooltip
   *
   * @param {string} method type of formatting string
   * @see www/common/Graph.inc Graph::easyBarsXTime()
   */
  static statsTooltip(method, dateOffset = 0) {
    let message
    switch (method) {
    case 'main': {
      message = ({ y, t }) => `${add_commas(y)} total items in <strong>${t[2]} ${t[3]}</strong>`
      break
    }
    case 'item': {
      message = ({ t, item }) => `<strong>${t[2]} ${t[3]}</strong>: ${add_commas(item.datapoint[1])} ${AJS.pluralize(item.datapoint[1], 'Item', 'Items')}`
      break
    }
    case 'download': {
      message = ({ t, item }) => `<strong>${t[2]} ${t[3]}</strong>: ${add_commas(item.datapoint[1])} ${AJS.pluralize(item.datapoint[1], 'Download', 'Downloads')}`
      break
    }
    case 'view': {
      message = ({ t, values, labels }) => AJS.viewMessage(t, values, labels)
      break
    }
    default: {
      break
    }
    }
    const fn = (x, y, item, values, labels) => {
      const t = new Date(x - dateOffset).toUTCString().split(' ')
      const params = {
        x, y, item, t, values, labels,
      }
      return `<span style="white-space: nowrap;">${message(params)}</span>`
    }
    return fn
  }

  // this allows easy setup for resize/orientation triggers for all graphs
  // on a page that use this!
  static plotter(callback) {
    if (typeof AJS.plotters === 'undefined')
      AJS.plotters = []

    if (callback) {
      // stash a copy of the callback for resize/orientationchange triggers
      AJS.plotters.push(callback)

      // now do the actual plotting (eg: page load)
      callback()
    } else {
      // step through each graph and rerun them
      log('plotter() resize/orient change', AJS.plotters.length, 'graphs to resize')
      for (let i = 0; i < AJS.plotters.length; i++)
        AJS.plotters[i]()
    }
  }


  // Graphing for archive.org/services/views.php and TV
  static plot(id, cfgIn, fmt_fn, pts, many) {
    const cfg = cfgIn
    if (!cfg.xaxis)
      cfg.xaxis = { mode: 'time', color: (cfg.dark ? '#ccc' : '#545454') }
    if (!cfg.yaxis)
      cfg.yaxis = { color: (cfg.dark ? '#ccc' : '#545454') }

    let barWidth
    if (many && cfg.barWidth)
      barWidth = cfg.barWidth * 1 // *1 to pass lint; keeps like below; avoid obj destructuring
    else if (cfg.barWidth)
      barWidth = cfg.barWidth * 86400 * 1000
    else
      barWidth = (cfg.dayBarsNoPoints ? 1 : 7) * 86400 * 1000 // 1day|1week

    if (!cfg.color)
      cfg.color = '#385C74'

    if (cfg.stack) {
      cfg.series = {
        stack: true,
        bars: {
          show: true,
          barWidth,
          fill: true,
        },
        legend: {
          show: true,
        },
      }
    } else {
      cfg.series = {
        bars: {
          show: true,
          barWidth,
          fill: 0.6,
          color: cfg.color,
        },
        color: cfg.color,
        points: { show: !cfg.dayBarsNoPoints },
      }
    }

    if (typeof cfg.grid === 'undefined') {
      cfg.grid = {
        borderColor: (cfg.dark ? '#333' : '#aaa'),
        hoverable: true,
      }
    }
    // log(cfg.series.bars)


    if (cfg.dark)
      cfg.grid.backgroundColor = '#002b36'

    if (!cfg.tip)
      cfg.tip = {}
    if (!cfg.tip.id)
      cfg.tip.id = id

    if (typeof window.GraphPriorIndex === 'undefined')
      window.GraphPriorIndex = {}

    // fully elaborated graph data
    let graph_data = []
    if (cfg.series.stack) {
      // [{},{}, ...]
      // each with data:[], label:""
      graph_data = pts
    } else {
      // eslint-disable-next-line  no-nested-ternary
      graph_data = (many ? pts : (typeof pts.data === 'undefined' ? [{ data: pts }] : [pts]))

      if (cfg.dayBarsNoPoints  &&  !cfg.noLabel)
        graph_data[0].label = id
    }

    const selid = `#${id}`
    const plotFunction = $.plot($(selid), graph_data, cfg)

    if (!fmt_fn)
      return

    $(selid).bind('plothover', (event, pos, item) => {
      if (!item) {
        window.GraphPriorDatapoint = [0, 0, 0]
        $('#gtip').remove()
        return
      }

      if (window.GraphPriorDatapoint !== item.datapoint) {
        window.GraphPriorDatapoint = item.datapoint
        $('#gtip').remove()

        const values = []
        const labels = []
        // If stack graph, prepare data and labels for tooltip
        if (cfg.stack) {
          const data = plotFunction.getData()
          // For each series of data (stack in stacked graph)
          for (let i = 0; i < data.length; i++) {
            const series = data[i]
            labels[i] = series.label
            for (let j = 0; j < series.data.length; j++) {
              // If same x value as mouseover value
              if (series.data[j][0] === item.datapoint[0]) {
                // store y value
                // eslint-disable-next-line prefer-destructuring
                values[i] = series.data[j][1]
                break
              }
            }
          }
        }

        const str = fmt_fn(item.datapoint[0], item.datapoint[1], item, values, labels)
        const $graf = $(selid)
        const off = $graf.offset()

        // figure out which way from the "dot"/bar in the graph the
        // tooltip should go -- left or right!
        let { pegTo } = cfg.tip
        if (!pegTo)
          pegTo = ((pos.pageX - off.left) > ($graf.width() / 2) ? 'right' : 'left')

        const pegToVal = (pegTo === 'right' ?
          ($graf.width() - (pos.pageX - off.left - 20)) :
          (pos.pageX - off.left) + 20)
        log(pegTo, pegToVal)

        $(`#${cfg.tip.id}`).append(`<div id="gtip" class="roundbox5 grafs-tooltip" style="top:${pos.pageY - off.top}px; ${pegTo}:${pegToVal}px">${str}</div>`).fadeIn(200)
      }
    })
  }


  // Use a color sampling 3rd party piece of code, to find the 1st/primary image in the "welcome"
  // area, and find the "dominant color".  (internally, uses canvas to color sample).
  // Adjust text/foreground color as well as any "selected tab" background color.
  // NOT USED ANYMORE -- GONE SERVERSIDE!
  static welcome_recolor(e) {
    if (typeof ColorThief === 'undefined'  ||  !e.length)
      return

    if (AJS.welcome_recolored)
      return
    AJS.welcome_recolored = true

    const img = $(e)[0]
    log('welcome_recolor', img.src)

    /* global ColorThief */
    const ct = new ColorThief()
    const palette = ct.getPalette(img, 5)
    log(palette)
    if (!palette)
      return
    const dominantColorRGB = palette[0] // 3 element array!

    if (!dominantColorRGB)
      return
    log(dominantColorRGB)

    // if dominant color is uh, kinda in the lighter range -- txt should be black
    const avgVal =
      Math.round($(dominantColorRGB).map((k, v) => v).toArray().reduce((a, b) => a + b) /
        dominantColorRGB.length)
    const color = (avgVal >= 128 ? 'black' : 'white')
    log('avgVal', avgVal)

    $('.welcome').css({
      color,
      'background-color': `rgb(${dominantColorRGB.join(',')})`,
    })
    $('.welcome .stealth:not(.tabby .stealth)').css({ color })
  }


  /**
   * Use the following function to make an image, div, etc focusable, and 'click'-able.
   * Function adds a tabindex for 'focus' and listens for a keydown/keypress of enter or space,
   * then triggers a click.
   *
   * var element: String used for jquery capture of non-acessible & mouse-only element.
   *    ex: "#AmazonPayButton img"
   * Triggers 'click' on element.
   */
  static makeMouseElementAccessible(element) {
    $(element).attr('tabindex', '0').on('keypress keydown', function makeMouseElementAccessibleGo(e) {
      if (e.type !== 'click') {
        const code = (e.keyCode || e.which)
        const k_space = 32 // space bar pressed
        const k_enter = 13 // enter key pressed
        if ([k_space, k_enter].indexOf(code) !== -1)
          $(this).click()
      }
    })
  }


  // use something like ',' for the optional 3rd arg if you want to allow
  // for appending 2+ values into a field, etc...
  static autocomplete(selector, options, multiValSplitChar) {
    $(selector).autocomplete({
      appendTo: '#autocompletee',
      minLength: 0,
      source: (request, response) => {
        // delegate back to autocomplete, but extract the last term
        response($.ui.autocomplete.filter(options, request.term.split(/,\s*/).pop()))
      },
      focus: () => false, // prevent value inserted on focus
      select: function autocomplete_select(event, ui) {
        if (multiValSplitChar) {
          const terms = this.value.split(/,\s*/)
          // remove the current input
          terms.pop()
          // add the selected item
          terms.push(ui.item.value)
          // add placeholder to get the comma-and-space at the end
          terms.push('')
          this.value = terms.join(', ')
        } else {
          this.value = ui.item.value
        }
        return false
      },
    })
  }


  static addNotes(kind, htm) {
    // flag lists have multiple users so the "rights" there
    // is a bit to thorny right now so for simplicity and
    // the main feature to go live, skipping them...
    if (kind !== 'favorite'  &&  kind !== 'list')
      return htm

    if (!htm  &&  $('body').hasClass('editable'))
      AJS.addingNotesKind = kind
    if (!AJS.addingNotesKind)
      return htm

    AJS.addNoteHTM = $(`
<div class="note">
  <span class="edit">
    <a href="#" onclick="return AJS.editNote(this)">Add a Note</a>
  </span>
</div>`)

    log('addNotes')

    // Next, we are going to do a global DOM search and insert (where needed)
    // for basically the first page load.  But we're also called in "infinite scroll"
    // page 2+ mode, and in that case, we want to modify (JUST) the HTM when that's
    // for page 2+ and about to be inserted into the DOM, *instead* of another global
    // DOM search.
    if (htm) {
      // (Basically we are now doing page 2+ in infinite scroll)
      // OK this is sorta wild/maybe not obvi...a
      // (Kinda like a jQuery replace_regexp()...)
      // Take the *string* of HTM we are passed, convert it to a "findable" jQuery object
      // then insertd "addNoteHTM" where needed.
      // Finally, convert back to string and return this modified version to caller.
      const $htm = $(`<div>${htm}</div>`)
      $htm.find('.details-ia .C234:not(:has(".note"))').append(AJS.addNoteHTM)
      return $htm.html()
    }

    // this is initial page load
    // NOTE: return value irrelevant here
    return $('.details-ia .C234:not(:has(".note"))').append(AJS.addNoteHTM)
  }


  static editNote(e) {
    const $e = $(e)
    const identifier = $e.parents('.details-ia').prev().attr('data-id')
    if (!identifier)
      return false

    const $note = $e.parents('.note')

    let val = ''
    if ($e.text() === 'edit') {
      val = $note.find('span:first').text()
      val = val.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
    $note.hide()
    $note.parent().append($(`
<form class="form form-horizontal note" role="form" onsubmit="AJS.editedNote(this);return false">
  <div class="form-group">
    <div class="col-xs-2 col-md-1 col-lg-1">
      <b>Note:</b>
    </div>
    <div class="col-xs-10 col-md-6 col-lg-7">
      <textarea class="form-control" name="comments">${val}</textarea>
      <div class="clearfix visible-xs-block"></div>
    </div>
    <div class="clearfix visible-xs-block"></div>
    <div class="col-xs-12 col-md-5 col-lg-4 btns">
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-success btn-xs">Save</button>
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-info btn-cancel btn-xs">Cancel</button>
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-danger btn-xs ${val ? '' : 'hidden'}">Remove</button>
    </div>
  </div>
</form>`))

    return false
  }

  static editedNote(e) {
    let $e = $(e)

    const identifier = $e.parents('.details-ia').prev().attr('data-id')
    if (!identifier)
      return

    // if user hit [return] and submitted form, etc.
    // treat it like they hit the [Save] button
    if ($e.is('form'))
      $e = $e.find('button:contains("Save")')

    const action = $e.text()
    const $parent = $e.parents('.note')
    const $origNote = $parent.prev()

    if (action === 'Save'  ||  action === 'Remove') {
      const val  = (action === 'Save' ? $parent.find('textarea').val() : '')
      const  url = '/bookmarks.php?identifier='.concat(
        identifier, '&kind=', AJS.addingNotesKind,
        '&add_comment=', encodeURIComponent(val),
      )
      log('get ', url)
      $.get(url, () => {
        const htm = (val ?
          `Note: "<span>${val.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>"
          <span class="edit">(<a href="#" onclick="return AJS.editNote(this)">edit</a>)</span>` :
          AJS.addNoteHTM.html())
        // show the "Note: ..." section again (with now appropriately updated innards)
        $origNote.html(htm).show()
        $parent.remove() // lose the form
      })
      return
    }
    // else Cancel does nothing but below...

    $origNote.show() // show the "Note: ..." section again
    $parent.remove() // lose the form
  }


  static thumbzilla(id) {
    /* global  TV2  TV3 */
    // cover entire screen with new div...
    const TV = $('body').hasClass('tv')
    if (TV)
      TV2.unplay('thumbzilla')

    let htm = ''

    // we might be calling this after AJAX success below, finding the item thumbnails
    const render = () => {
      $('#opscreen1M').remove()
      $('body').prepend($('<div />').attr({ id: 'opscreen1M' }))

      const $imgs = $('<div/>').attr({ id: 'thumbzilla' }).html(`<div>${htm}</div>`)
      $imgs.appendTo('#opscreen1M')
      $('#opscreen1M').css('visibility', 'hidden').show()
      const winH = $(window).height() + (ios ? 60 : 0) // plus iOS bleah
      for (let w = 720; w >= 10; w -= 10) {
        const h = Math.round(w * (110 / 160.0))
        log('TRYING', w, 'x', h)
        $('#thumbzilla img').css({ width: w, height: h })
        if ($('#thumbzilla img:last').offset().top + h <= winH)
          break
      }

      $('#thumbzilla div').center()
      $('#opscreen1M').hide().css('visibility', 'visible').fadeIn('slow')
        .one('click.opscreen1M.nixer', () => $('#opscreen1M').fadeOut('slow'))
    }


    // get list of thumbs
    if (TV  &&  TV3) {
      $(TV3.thumbzillas).each((key, val) => {
        const start = parseInt(val, 10)
        if (TV) {
          const startend = `/start/${start}/end/${start + TV3.CLIP_SEC_MAX2}`
          htm += `<a onclick="$('#opscreen1M').fadeOut('slow'); TV2.seekURL('${startend}')" href="${startend}">`
        } else {
          const locNEW = `/details/${id}&start=${start}`
          htm += `<a onclick="$('#opscreen1M').fadeOut('slow'); return Play.seek(this)" href="${locNEW}">`
        }
        htm += `<img src="/download/${id}/${id}.thumbs/${id}_${val}.jpg"/></a>`
      })
      render();
    } else {
      $.getJSON(`/metadata/${id}/files`, (resp) => {
        for (const file of resp.result) {
          if (file.name.match(/\.thumbs\/(.*\.jpg)$/)) {
            htm += `
              <a href="/download/${id}/${file.name}"><img src="/download/${id}/${file.name}"></a>
            `
          }
        }
        if (htm)
          render()
      })
    }

    return false
  }

  /* Wayback Machine form type-ahead setup: it presents a list of sites
      matching the text as user types. */
  static nav_tophat_wb_setup() {
    // Configuration
    const WAYBACK = 'https://web.archive.org'
    const HOSTS_ENDPOINT =   `${WAYBACK}/__wb/search/host?q=`
    const ANCHORS_ENDPOINT = `${WAYBACK}/__wb/search/anchor?q=`
    const REDIRECT_URL =     `${WAYBACK}/web/*/`
    const REDIRECT_SEARCH =  `${WAYBACK}/web/*/`

    // Workaround: The typeahead fires its change event twice sometimes!
    // Can't figure out why. Maybe connected to using Return to submit
    // typeahead choice. Anyway, use this flag to block >1 sending.
    let waybackSearchFormSubmitted = false

    function search_or_calendar(query) {
      if (query.indexOf('http://') === 0 ||
          query.indexOf('https://') === 0 ||
          query.match(/[\w.]{2,256}\.[a-z]{2,4}/gi))
        document.location.href = REDIRECT_URL + query
      else
        document.location.href = REDIRECT_SEARCH + encodeURIComponent(query)
    }

    const $input = $('#nav-wb-url')
    const $form = $input.parent('form')
    $form.submit((e) => {
      if (typeof archive_analytics !== 'undefined' && !waybackSearchFormSubmitted) {
        archive_analytics.send_event('TopNav', 'WaybackSearchForm-Submit')
        waybackSearchFormSubmitted = true
      }
      const query = $input.val()
      search_or_calendar(query)
      e.preventDefault()
      e.stopPropagation()
      return false
    })
    $input.on('focus input paste', () => {
      if (typeof $input.typeahead === 'undefined') {
        $.ajax({
          url: '/includes/build/npm/bootstrap-3-typeahead/bootstrap3-typeahead.min.js',
          dataType: 'script',
          cache: true,
        }).done(() => {
          $input.typeahead({
            source: (query, process) => {
              $input.focus() // bugfix https://github.com/bassjobsen/Bootstrap-3-Typeahead/issues/150#issuecomment-197949899
              return $.get(HOSTS_ENDPOINT + encodeURIComponent(query), (data) => {
                if (typeof data.hosts !== 'undefined' && data.hosts.length > 0)
                  return process(data.hosts)
                if (typeof data.isUrl !== 'undefined' &&  data.isUrl === true &&
                          typeof data.excluded === 'undefined') {
                  return process([{
                    display_name: query,
                  }])
                }

                return $.get(ANCHORS_ENDPOINT + encodeURIComponent(query), (data2) => {
                  if (typeof data2 !== 'undefined' && data2.length > 0)
                    return process(data2.slice(0, 5))
                  return undefined
                })
              })
            },
            matcher: () => true,
            displayText: (item) => item.display_name,
            autoSelect: false,
            delay: 400,
            fitToElement: false, /* not good with long URLs */
            minLength: 3,
            items: 8,
          }).change(() => {
            const current = $input.typeahead('getActive')
            if (current && current.display_name === $input.val())
              $form.submit()
          })
        })
      }
    })
  }


  /**
   * Sets up listeners on search forms to handle opening/closing the search options.
   *
   * @see SearchOptions.inc
   */
  static setUpSearchForms() {
    const body = $(document.body)
    const searchForms = $('.js-search-form')

    /**
     * Sets up an individual form, isolating its event listeners from the other ones.
     *
     * @param {HTMLFormElement} formNode
     */
    function setUpSearchForm(formNode) {
      const form = $(formNode)
      const searchBar = form.find('.js-search-bar')
      const searchOptions = form.find('.js-search-options')
      const keepOpenWhenChanged = searchOptions.data('keepOpenWhenChanged')
      let formChanged = false

      /**
       * Catches web searches and redirects them to Wayback Machine. The search form must have a
       * "data-wayback-machine-search-url" attribute set in order for this method to work (and the
       * method assumes the query can be tacked onto the end of this URL). For all other kinds of
       * searches, does nothing.
       *
       * @param {Event} event
       */
      function redirectWaybackSearches(event) {
        const { waybackMachineSearchUrl } = this.dataset
        const elements = $(this.elements)
        const checkedInput = elements.filter('[name="sin"]:checked')
        const searchInput = elements.filter('[name="search"]')
        const sinValue = checkedInput.length ? checkedInput[0].value : ''
        const searchValue = searchInput.length ? searchInput[0].value : ''

        if (waybackMachineSearchUrl && sinValue === 'WEB') {
          event.preventDefault()

          window.location = [
            // Remove trailing slash just in case.
            waybackMachineSearchUrl.replace(/\/$/, ''),
            searchValue,
          ].join('/')
        }
      }

      function openOptions() {
        searchOptions
          .addClass('is-open')
          .attr('aria-expanded', true)
      }

      function closeOptions() {
        searchOptions
          .removeClass('is-open')
          .attr('aria-expanded', false)
      }

      /**
       * Closes options if the newly focused element is outside of the form (and not autocomplete
       * results) and the form is configured to close when it is no longer active.
       *
       * @param {HTMLElement} targetElement element being clicked or receiving focus
       */
      function handleFocusChange(targetElement) {
        if (
          !targetElement ||
          form[0].contains(targetElement) ||
          (keepOpenWhenChanged && formChanged) ||
          $(targetElement).parents('.ui-autocomplete').length
        )
          return

        closeOptions()
      }

      if (form.length) {
        form.on('submit', redirectWaybackSearches)

        if (!searchOptions.hasClass('is-open')) {
          body.on('click', (event) => {
            handleFocusChange(event.target)
          })

          form
            .on('change', () => {
              formChanged = true
            })
            .on('focusout', (event) => {
              handleFocusChange(event.relatedTarget)
            })

          searchBar.on('focusin', () => {
            openOptions()
          })
        }
      }
    }

    searchForms.each((index, node) => setUpSearchForm(node))
  }

  /**
   * Sets up two-way communication between the main page and a BookReader
   * embedded in an <iframe>
   *
   * Due to the <iframe> the page and the BookReader must communicate using
   * the BookReader's URL plugin, which sends and listens for "message"
   * events via window.postMessage().
   */
  static setUpBookReaderIframe() {
    const messageType = 'bookReaderFragmentChange'
    // eslint-disable-next-line compat/compat
    const iframe = document.querySelector('#texty iframe')

    // No BookReader embed, abort
    if (!iframe) return

    // URL syncing not enabled, abort
    if (!iframe.hasAttribute('data-book-reader-sync-urls')) return

    /**
     * Updates the current page URL without reloading or adding to the
     * browser history using the History API
     *
     * On browsers that don't support window.history (mainly Opera Mini),
     * this is a no-op.
     *
     * @param {String} fragment the new fragment
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/History_API
     */
    function updateUrl(fragment) {
      // History API not supported, abort
      if (!('history' in window)) return

      const path = replaceBookReaderFragment(
        window.location.pathname,
        fragment,
      )

      // Reconstruct URL with new path
      const url = path + window.location.search + window.location.hash

      window.history.replaceState({ fragment }, window.title, url)
    }

    window.addEventListener('message', (event) => {
      // Not a recognized message type, abort
      if (!event.data || event.data.type !== messageType) return

      updateUrl(event.data.fragment)
    })
  }

  /**
   * Expandable/collapsible accordion component, implemented with <details>
   * elements
   *
   * The JavaScript guarantees only one <details> is open at a time and
   * scrolls the open <details>'s content into view.
   *
   * @see accordion.less
   */
  static setUpAccordions() {
    /**
     * Closes all <details> elements in detailsEls, except selectedDetails
     *
     * @param {HTMLDetailsElement[]} detailsEls
     * @param {HTMLDetailsElement}   selectedDetails
     */
    function closeAllExcept(detailsEls, selectedDetails) {
      Array.from(detailsEls)
        .forEach((details) => {
          if (details !== selectedDetails) {
            // eslint-disable-next-line no-param-reassign
            details.open = false
          }
        })
    }

    /**
     * Sets up a single accordion component
     *
     * @param {HTMLElement} accordion
     */
    function setUpAccordion(accordion) {
      /**
       * Responds to the "toggle" event on a <details>
       *
       * @param {Event} event
       */
      function handleToggle(event) {
        if (!event.target.open) return

        closeAllExcept(
          accordion.querySelectorAll('details'),
          event.target,
        )

        // See https://www.abeautifulsite.net/smoothly-scroll-to-an-element-without-a-jquery-plugin-2
        $('html, body').animate({
          scrollTop: $(event.target).offset().top,
        }, 400)
      }

      Array.from(accordion.querySelectorAll('details'))
        .forEach((details) => {
          details.addEventListener('toggle', handleToggle)
        })

      accordion.setAttribute('data-accordion-ready', '')
    }

    Array.from(document.querySelectorAll('[data-accordion]'))
      .forEach(setUpAccordion)
  }

  /**
   * Handles click on search 'Advanced Search' link.
   *
   * If 'Search TV news captions' is checked, we ignore the link click
   * and create and open TV advanced search popup right on the page.
   *
   * @return {boolean}  true for browser to go to normal advanced search page; else false
   */
  static advanced_search(link) {
    if (!AJS.is_advanced_TV_search(link))
      return true

    // this means we want TV advanced search form behaviour instead!
    if (!AJS.adv) {
      AJS.adv = {
        mapping: false,
      }
    }

    // only reload the resources below at most 1x/day
    const ymd = new Date().toISOString().substr(0, 10) // eg: 2017-06-28
    $.ajaxSetup({
      cache: true,
    })

    // NOTE: using new JS Promise / jQuery Promise-ish Deferred..
    // NOTE: if we are invoking this more than once, we reuse prior results
    // NOTE: ymd forces reload at least once a day
    // NOTE: if any resources happen to _already_ be loaded in <head>, use them
    const i = `https://${location.host}/includes/`
    $.when(
      (typeof TVSearch !== 'undefined' || $.getScript(i.concat('build/js/tvsearch.min.js?', ymd))),
      (AJS.adv.mapping || $.getJSON('/details/tv?mappings&output=json&'.concat(ymd), (mapping) => {
        AJS.adv.mapping = mapping
      })),
    ).then(() => {
      if (AJS.adv.mapping.length !== 2) {
        // eslint-disable-next-line  no-alert
        alert('failed to get network and program mappings!')
        return
      }

      /* global  TVSearch */
      TVSearch.proPick(AJS.adv.mapping, link)
    })


    return false
  }


  /**
   * Returns whether or not 'Advanced Search' should be handled via JS
   * (which as of now is just TV FTS to make a popup show up).
   * Logically private.
   *
   * @param  {DOM element}  elm 'Advanced Search' link element that was just clicked
   * @return {Boolean}      should handle with JS and not directly go to /advanced_search.php?
   */
  static is_advanced_TV_search(elm) {
    if (location.hostname === 'web.archive.org')
      return false

    // for now at least, tracey felt should avoid handling link on IA top/home page even when
    // TV FTS is picked.  for consistency, this is _definitely_ worth revisiting.
    if ($(document.body).hasClass('top'))
      return false

    const $form = $(elm).parents('form')
    if ($form.find('.js-search-options input[value=TV]').is(':checked'))
      return $form

    return false
  }
} // end class AJS


$(() => {
  // Use this global hack, by adding class 'accessible-link' to any mouse-only element div/img
  AJS.makeMouseElementAccessible('.accessible-link')

  if (typeof archive_analytics !== 'undefined')
    archive_analytics.set_up_event_tracking()

  AJS.nav_tophat_setup()
  AJS.nav_tophat_wb_setup()

  // UI component initialization
  AJS.setUpSearchForms()
  AJS.setUpBookReaderIframe()
  AJS.setUpAccordions()

  /* global  archive_setup */
  if (typeof archive_setup !== 'undefined') {
    // when DOM loaded/stable, do some setup
    $(() => {
      for (const fn of archive_setup)
        fn()
    })
  }

  AJS.footer()

  AJS.modalInterval = 2000

  dropdowns.attachCloseToBody()
  dropdowns.bindTo($('[data-handler=dropdown]'))

  Banners.init()
  SearchAutocomplete.setup()
})


AJS.tilebars = Tiles.tilebars // transitional for pre-CSP code
AJS.addCommas = add_commas    // transitional for pre-CSP code
window.AJS = AJS  // promote to global (for inline JS in emitted markup from PHP mostly)

export { AJS as default }
