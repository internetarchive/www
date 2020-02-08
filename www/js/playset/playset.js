/* eslint-disable semi */
// Class that iterates over A/V items, playing them in a playlist.
// JS file can be added to a page and will try to find a place to append a "Play All" link.
// Whatever items the user sees in their page, when they click "Play All", will get added to a new
// playlist and their browser gets redirected to the first item.
// After each item is finished playing, the browser will redirect to next item, until done.
// User is free to move around the playlist at any time.
//
// xxx better theatre shift code?
// xxx share/link as modal?
// xxx cleanup/improve descriptions for description-less items?

// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import cgiarg from '../util/cgiarg.js'
import log from '../util/log.js'
import onclick from '../util/onclick.js'
import { jwplayer } from '../jwplayer/jwplayer.js'


class Playset {
  constructor() {
    // setup static/class vars
    Playset.avplayer = '#jw6'
    Playset.resizer_listening = false
    Playset.unplayable_timer = null
    Playset.mobile = (navigator.userAgent.indexOf('iPhone') > 0 ||
                      navigator.userAgent.indexOf('iPad') > 0 ||
                      navigator.userAgent.indexOf('iPod') > 0 ||
                      navigator.userAgent.indexOf('Android') > 0)

    // setup instance vars
    this.id = false
    this.selector_play_items = false
    this.selector_playlist = false


    // only proceed for folks w/ modern browsers..
    if (!Playset.is_local_storage_available()) return


    // Check for, in this order:
    //   "SIMILAR ITEMS" (AKA "Also Found") on items /details/ page (at bottom)
    //   search results page
    //   collection item page
    // We can add a nice "Play All" link to any of them.
    //
    // NOTE: for "SIMILAR ITEMS", IFF we wanted _more_ than 10, we could add a simple
    // PHP /services/ new script with something like:
    //   $rel_ids = (new RelatedItemsFetcher())->fetch($id,$collections,75 0,'5s','production');

    this.selector_play_items = $('#also-found h5,   #search-actions, .welcome-right')
    this.selector_playlist   = $('#theatre-ia-wrap, #search-actions, .welcome-right')

    // basically, give up, but in case somehow "show_playlist()" fires, dont fatal:
    if (!this.selector_playlist.length)
      this.selector_playlist = 'body'

    if (!this.selector_play_items.length) {
      this.selector_play_items = false
    } else {
      $(this.selector_play_items).append('<span id="playplayset"/>')
      $('#playplayset').html(`<a
          class="stealth"
          href="#play-items"
          data-event-click-tracking="Playset|PlayAllLink"
        >
          <span class="iconochive-play" aria-hidden="true" />
          <span class="sr-only">play</span>
          <span class="hidden-xs-span"> Play All</span>
          <br />
        </a>`)
      onclick('#playplayset', Playset.create_playlist_goto_first_item)


      /* this makes it so people can conveniently pass around/share playlists! eg:
           https://archive.org/details/georgeblood&and[]=blues&autoplay=1
      */
      if (cgiarg('autoplay', true)  &&  !cgiarg('playset', true))
        setTimeout(Playset.create_playlist_goto_first_item, 2500)
    }

    if (cgiarg('playset', true)) {
      // proceed when item OR collection /details/ page!
      [, this.id] = location.href.match(/archive\.org\/details\/([^/&?]+)/)
      if (!this.id)
        return

      // setup mobile area
      if (!$('#playset-xs').length)
        $('#theatre-ia-wrap').after('<div id="playset-xs" class="hidden-sm hidden-md hidden-lg"><div/></div>')

      this.show_playlist()
      Playset.skip_unplayable_item()

      Playset.resizer()
    }

    log('playset ready')
  }


  static create_playlist_goto_first_item() {
    log('create_playlist_goto_first_item()')
    const playlist = []
    const also_found_clicked = $('#also-found').length
    const selector_tile_finder = (also_found_clicked ? '#also-found .item-ia' : '.item-ia:visible')

    $(selector_tile_finder).each((key, val) => {
      const $val = $(val)
      const { id } = $val.data()
      if (id.match(/^__/))
        return // skip non-items -- eg: __mobile_header__

      // find tile title (for either item tile or collection tile)
      const ttl  = Playset.truncate($val.find('.item-ttl,.collection-title a').text(), 35)
      const by   = Playset.truncate($val.find('.byv').text(), 75)
      const { year } = $val.data()
      const desc = Playset.truncate($val.next().find('.C234 > span:first').text(), 75)
      playlist.push([id, ttl, (by.length ? by : desc), year])
    })


    Playset.set_playset(playlist)

    if (Playset.mobile)
      Playset.play_mobile(playlist)
    else
      location.href = `/details/${playlist[0][0]}?autoplay=1&playset=1`
  }

  static play_mobile(playlist) {
    // For best experience on iOS, only way to step through a bunch of A/V _automatically_ and in
    // a locked home screen is a (carefully constructed) full-on single M3U playlist.
    // We use a back-end service to construct that for us, and filter out non-audio items
    const ids = []
    for (const e of playlist) // ES6!
      ids.push(e[0])

    location.href = `https://archive.org/services/playset.php?ids=${ids.join(',')}`
  }


  show_playlist() {
    const playset = Playset.get_playset()
    if (!playset)
      return // user likely passing around /details/ "play related" url - can't do that, so noop

    let found = false

    let list = ''
    for (const v of playset.list) {
      list += Playset.playlist_item(v[0], v[1], v[2], v[3])
      if (this.id === v[0])
        found = true
    }

    if (!found)
      return // browser _has_ a playlist, but current item /details/ page isnt in playlist

    const htm = `
${Playset.playlist_header(playset)}
<div class="playset-list">
${list}
</div>
`
    $('body').addClass('playset')
    $('body').addClass($('#theatre-ia-wrap').length ? '' : ' playset-hdr-only')
    $(this.selector_playlist).prepend(`<div id="playset-ia">${htm}</div>`)

    onclick('#playset-pp .js-playset-play', Playset.play)
    onclick('#playset-pp .js-playset-pause', Playset.pause)

    setTimeout(() => {
      this.autoscroll_playlist()
    }, 500)


    // per request, clicking on a bookreader should "pause"
    $(document).ready(() => {
      $('#texty iframe').on('load', () => { // Make sure iframe is loaded
        $('#texty iframe').contents().click(Playset.pause)
      })
    })
  }


  static resizer() {
    // setup a browser resize / orient change listener
    if (!Playset.resizer_listening) {
      Playset.resizer_listening = true
      $(window).on('resize  orientationchange', () => {
        clearTimeout(Playset.throttler)
        Playset.throttler = setTimeout(Playset.resizer, 250)
      })
    }

    // now see where playset "should be" -vs- where it is placed right now
    // first see if xs div is visible
    const should_be = ($('#playset-xs:visible').length ? 'playset-xs' : 'theatre-ia-wrap')
    const at_now = $('#playset-ia').parent().attr('id')
    log('browser resize: ', should_be, ' -v- ', at_now)

    if (should_be === at_now)
      return // all set!

    if (should_be === 'playset-xs')
      $('#playset-ia').appendTo('#playset-xs > div')
    else
      $('#playset-ia').prependTo(`#${should_be}`)
    log('playset moved')
  }


  static playlist_header(playset) {
    const sep = playset.src.match(/\?/) ? '&' : '?'
    const src = `${playset.src}${sep}autoplay=1`
    return `
<div class="playset-hdr">
<div>
  <a href=${src}>Playlist</a>
  ${Playset.glyph('beta')}
</div>
<div id="playset-pp">
  <a href="#" class="js-playset-pause">
    ${Playset.glyph('Pause')}
  </a>
  <a href="#" class="js-playset-play" style="display:none">
    ${Playset.glyph('play')}
  </a>
</div>
<div>
  <a href=${src}>
    ${Playset.glyph('share')}
  </a>
</div>
</div>
`
  }


  static playlist_item(id, ttl, desc, year) {
    return `
<div class="playset-item" data-id=${id}>
<a href="/details/${id}?autoplay=1&playset=1">
  <div class="topinblock playset-img">
    <img src="/services/img/${id}"/>
  </div><div class="topinblock">
    ${Playset.item_year(year)}
    <b>
      ${ttl}
    </b><br/>
    ${desc}
  </div>
</a>
</div>`
  }


  static item_year(year) {
    if (!year)
      return ''

    return `
<div style="float:right">
(${year})
</div>`
  }


  autoscroll_playlist() {
    // scroll the playlist to the entry that is the /details/item we are are at now
    const off = $(`#playset-ia div[data-id="${this.id}"`).offset()
    if (off) {
      const bump = ($('#playset-xs:visible').length ? 10 : $('#navwrap1').height())

      const top = off.top - bump - $('#playset-ia .playset-hdr').height()

      log('scrolling playset to ', top)
      $('#playset-ia .playset-list').scrollTop(top)
    }
  }


  static skip_unplayable_item() {
    // after 3 seconds, see if item even tried to load an A/V player.
    // if not, auto-advance to next item
    Playset.unplayable_timer = setTimeout(() => {
      if (typeof jwplayer === 'undefined'  ||  !$(Playset.avplayer).length)
        Playset.goto_next_item()
    }, 3000)
  }


  static goto_next_item() {
    const id = location.href.match(/\/details\/([^/&?]+)/)[1]
    const playlist = Playset.get_playlist()
    let prev = ''
    for (const v of playlist) {
      if (id === prev)
        location.href = `/details/${v[0]}?autoplay=1&playset=1`;
      [prev] = v
    }
  }


  static onComplete(jw, evt) {
    // We're in a playlist on an item /details/ page, and A/V player just finished playing a
    // track.  If we're "done" (whatever that means for an item -- sometimes "done" means before
    // all tracks have played!):
    //   then auto-advance to next /details/ page item in playlist, with full browser page
    //        refresh to it.
    //   else noop
    const idx = jw.getPlaylistIndex()
    const len = jw.getPlaylist().length
    const done = ((idx + 1 >= len)  ||  (evt  &&  evt.done))
    if (!done)
      return // keep playing until item is finished

    Playset.goto_next_item()
  }


  static get_playlist() {
    // Retrieves current playlist from browser local storage;  or null if none or parse errors
    const playset = Playset.get_playset()

    if (typeof playset.list === 'undefined')
      return playset // version 0.9

    return playset.list // version 1.0
  }


  static get_playset() {
    // Retrieves (entire) playlist (object) from browser local storage;
    // or null if no list or parse errors, etc.
    return JSON.parse(localStorage.getItem('playset'))
  }


  static set_playset(playlist) {
    // Stores playlist into browser local storage.
    // Stamps creation times in case we ever want to expire/trim them if we allow for 2+ playsets.
    const date = new Date()
    const item = {
      version:   '1.1',
      src:       (location.pathname + location.search).replace(/[&?]autoplay=1/, ''),
      created:   date.toJSON(),
      createdTS: Math.round(date.getTime() / 1000),
      list:      playlist,
    }
    localStorage.setItem('playset', JSON.stringify(item))
  }


  static pause() {
    log('playset pause')

    if (typeof jwplayer !== 'undefined'  &&  $(Playset.avplayer).length) {
      const jw = jwplayer(Playset.avplayer.substr(1))
      if (jw  &&  jw.getState()) {
        if (jw.getState().toUpperCase() === 'PLAYING')
          jw.pause()
        else
          jw.play()
        // toggle play to pause icon
        $('#playset-pp a').toggle()
        return false
      }
      return false
    }

    if (Playset.unplayable_timer) {
      clearTimeout(Playset.unplayable_timer)
      Playset.unplayable_timer = null
      $('#playset-pp a').toggle()
    }

    return false
  }


  static play() {
    log('play/resume')

    if (typeof jwplayer !== 'undefined'  &&  $(Playset.avplayer).length) {
      const jw = jwplayer(Playset.avplayer.substr(1))
      if (jw  &&  jw.getState()) {
        if (jw.getState().toUpperCase() !== 'PLAYING')
          jw.play()
        // toggle pause to play icon
        $('#playset-pp a').toggle()
        return false
      }
      return false
    }

    if (!Playset.unplayable_timer) {
      Playset.skip_unplayable_item()
      $('#playset-pp a').toggle()
    }

    return false
  }


  static glyph(name) {
    return `<span class="iconochive-${name}" aria-hidden="true"></span>
           <span class="sr-only">${name}</span>`
  }


  static truncate(str, n) {
    const ret = str.trim().replace(/\s+/g, ' ')
    if (ret.length <= n)
      return ret
    return `${ret.substr(0, n)}..`
  }

  /**
   * @returns {Boolean}
   */
  static is_local_storage_available() {
    // Catch error when user has disabled third-party cookies/storage.
    try {
      return 'localStorage' in window
    } catch (error) {
      return false
    }
  }
}


// on DOM ready, invoke constructor to setup
$(() => new Playset())


export { Playset as default }
