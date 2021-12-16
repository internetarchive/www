// Video/Audio/TV related playback javascript - wrapping and extensions to jwplayer
// For /details/[IDENTIFIER]  and  /embed/[IDENTIFIER]  and  TV pages and more

import $ from 'https://esm.archive.org/jquery@^3.6.0'

/* eslint-disable-next-line import/no-named-as-default */
import cgiarg from '../util/cgiarg.js'
import { log } from '../util/log.js'
import onclick from '../util/onclick.js'
import { jwplayer, jwbase } from '../jwplayer/jwplayer.js'
import Playset from '../playset/playset.js'

const Related = undefined // import Related from '../related/related.js' // xxx
const AJS = undefined // import AJS from '../archive/archive.js' // xxx


/* TBD?
- psuedostreaming
- chapter marks!
- more responsive
*/

/* DONE:
- 'related items' shows at end of last vid in playlist
- airplay / chrome casting
- video /embed/ sharing button click
- /embed/ logo in control bar
- playback speed in control bar settings
- tooltip images
- webvtt
- SPACE, left, right, up, down chars
- caption styling (FCC compliance)
- flash is only used to play A/V if html5 doesnt work (used to be flash could to UI/UX too)
*/


// any methods or vars here are like private-to-outside globals and same for all "Play objects"
const stash = {}

// global config, for all Play objects

// playing video size for normal /details/ pages
const VIDEO_HEIGHT = 480
const VIDEO_WIDTH  = 640 // (for 4:3 aspect -- scales for other aspects)

const CONTROLS_HEIGHT = 30
const AUDIO_WIDTH = 350
let   AUDIO_HEIGHT = CONTROLS_HEIGHT // NOTE: may change
const AUDIO_HEIGHT_WITH_WAVEFORM = 140
const AUDIO_HEIGHT_MAX = 240

const CONTROLS_MAX_WIDTH = 800

const PLAYLIST_ENTRY_HEIGHT = 20
const HEIGHT_ALIST = 370 // NOTE: max height; if few list entries, will be less
const HEIGHT_VLIST = 100 // NOTE: max height; if few list entries, will be less

const METADATA_HEIGHT = 100 // metadata peekaboo min height! (for "responsive")

const IE = (
  navigator.userAgent.indexOf(' Trident/') >= 0 ||
  navigator.userAgent.indexOf('MSIE ') >= 0 ||
  navigator.userAgent.indexOf('Windows NT ') >= 0
)


class Play {
  // [playlist] should by an array, something like (ideally) one of:
  //    [ {"file":"chapter1.mp4"}, {"file":"chapter2.mp4"}, .. ]
  //    [ {"sources":[{"file":"video.mp4"},{"file":"video.ogv"},{..}]}, .. ]
  constructor(jid, playlist, {
    // config variables that are *per object/instance* (and user options can override):
    start               = 0,
    embed               = false,
    hide_list           = false,
    autoplay            = false,
    audio               = false,
    width               = 0,
    height              = 0,
    responsive          = false, // archive.org video "/v2" type responsiveness
    aspectratio         = false, /* REALLY responsive -- will make 100% width to containing
                                  * div size.  DONT pass in "width" or "height" args */
    noshare             = false,
    nolinks             = false,
    logo                = false, // true to force it to show
    so                  = false,
    tv                  = false,
    tvStart             = 0,
    tvEnd               = 0,
    tvContributor       = false,
    tvSource            = false,
    play_just1          = false, // dont auto-play next A/V entry, eg: /details/oldtimeradio items
    list_height         = 0,
    identifier          = false, // or archive identifier when playback of specific item
    onSetupComplete     = false, // or callback after Play8 setup has finished
    onTime              = false, // or callback on each jwplayer ".on('time')" callback
    onComplete          = false, // or callback on each jwplayer ".on('complete')" callback
    onDisplayClick      = false, // or callback on each jwplayer ".on('displayClick')" callback
    onReady             = false, // or callback on each jwplayer ".on('ready')" callback
    onPlaylistItem      = false, // or callback on each jwplayer ".on('playlistItem')" callback
    collection          = false, // or archive identifier for most specific collection item is in
    waveformer          = false, // or CSS selector string of where to manipulate audio waveform
    speed               = 1.0,   // slow/speedup A/V playback speed? (1.0 is normal speed)
    details             = location.href,
  } = {}) {
    // more (per instance) variables (cant be overridden/changed/seen by caller):
    const tvTitle = (tv  &&  playlist.length === 1 ? playlist[0].title : '')
    const list_2cols = (responsive  &&  audio)
    const jidsel = `#${jid}`
    const jidlist = `#${jid}__list`
    let readyIA = false
    let DAR = 4 / 3
    let first_seeked_playlist = false
    let first_onmeta = false
    let jwwidth = 0
    let waveformed = false
    const pause_first_seek = (embed  &&  !tv  &&  !audio  &&  !autoplay  &&  start)
    let update_url_onload = true
    let onCompleteStop = false // playlists by default keep going to song B when song A is done
    let jwaudioWD = 0
    let jwaudioPercentDone = 0
    let skipNextOnPlaylistItem = false
    // const version = parseFloat(jwplayer.version) // eg: 8.2 or 8.8


    /**
     * This is the actual logical constructor.
     * Setup like this so we can leverage full closure of vars above us.
     */
    this.construct = () => {
      /* eslint-disable  no-param-reassign */
      // ^^^ this class was designed _deliberately_ using scoping techniques _outside_ of the
      //     methods to allow them to be set/manipulated _per instance_ but auto binding closure
      //     around each instance/object -- so from here for awhile, disabling that eslint rule...

      if (nolinks) {
        identifier = false
        collection = false
        noshare = true
      }

      speed = parseFloat(speed)

      if (!$(jidsel).length) {
        log('play8.js requires #', jid, ' element on page -- not found')
        return false
      }


      this.responsiveResize(true)


      if (identifier !== false)
        details = `https://archive.org/details/${identifier}`
      if (tv  &&  tvEnd)
        details += `/start/${tvStart}/end/${tvEnd}`

      if (typeof playlist === 'undefined') {
        playlist = [{
          sources: [{ file: '/download/family-rolled/family-rolled.mp4' },
                    { file: '/download/family-rolled/family-rolled.ogv' }],
          image:    '/download/family-rolled/format=Thumbnail&ignore=x.jpg',
        }]
        start = true
        hide_list = true
      }


      if (!hide_list) {
        if (!list_height) // if user hasn't specified...
          list_height = (audio ? HEIGHT_ALIST : HEIGHT_VLIST)
        // now drop down list_height if there aren't many playlist elements...
        list_height = Math.min(list_height, playlist.length * PLAYLIST_ENTRY_HEIGHT)
      }


      if (!responsive  &&  !(width > 0  &&  height > 0)) {
        if (embed) {
          const winw = $(window).width()
          const winh = $(window).height()
          width =  (audio ? Math.min(winw, CONTROLS_MAX_WIDTH) : winw)
          height = (audio ? (AUDIO_HEIGHT + list_height) : winh - list_height)
        } else if (!aspectratio) {
          width  = (audio ?  AUDIO_WIDTH                 : VIDEO_WIDTH)
          height = (audio ? (AUDIO_HEIGHT + list_height) : VIDEO_HEIGHT)
        }
      }
      jwwidth = width
      /* eslint-enable  no-param-reassign */
      // ^^^ this class was designed _deliberately_ using scoping techniques _outside_ of the
      //     methods to allow them to be set/manipulated _per instance_ but auto binding closure
      //     around each instance/object -- so from here for awhile, disabling that eslint rule...


      $.each(playlist, (idx, val) => {
        // log(val.sources)

        if (typeof val.autoplay !== 'undefined') {
          // for playlist: A B C D; if C has autoplay=false
          // it means play A and (auto)play B -- but stop when B is done
          if (!onCompleteStop)
            onCompleteStop = []
          onCompleteStop[idx - 1] = !val.autoplay
        }

        if (typeof val.sources === 'undefined'  &&  typeof val.file !== 'undefined') {
          /* eslint-disable-next-line  no-param-reassign */
          val.sources = [{ file: val.file, height: 480 }]
        }
        if (typeof val.sources === 'undefined') {
          /* eslint-disable-next-line  no-alert */
          alert(`${idx}: sources undefined!`) // xxx
        } else {
          // setup for metadata when preload happens for 1st track, dont count as item play
          for (const e of val.sources) {
            if (typeof e.file !== 'undefined') {
              if (!idx  &&  e.file.indexOf('/download') >= 0)
                e.file = e.file.replace(/\/download\//, '/serve/')

              e.file = Play.filename_char_encoder(e.file)
            }
          }
        }

        // log(val.sources)
      })


      if (!hide_list) {
        const sty = (list_2cols ? '' : `style="height:${list_height}px"`)
        const ialist = `<div id="${jid}__list" ${sty}> </div>`
        $(ialist).insertAfter(jidsel)
      }


      if (tvTitle) {
        // remove the end time (for brevity) for the "click to play" center button
        /* eslint-disable-next-line  no-param-reassign */
        playlist[0].title = playlist[0].title.replace(/( \d+:\d+[amp]+)-\d+:\d+[amp]+ /, '$1 ')
      }


      const jwcfg = {
        // *could* consider this if we think jwplayer playlists are reasonble in v6.8 now....
        // "listbar":{layout:'basic',position:'bottom',size:list_height},
        playlist:   JSON.parse(JSON.stringify(playlist)), // deep copy; jw _changes_ our list!
        abouttext:  'this item, formats, and more at Internet Archive',
        aboutlink:  details,
        startparam: 'start',
        logo:       {},
        cast:       {},
        // NOTE: we use '/serve/' for 1st playlist item to allow metadata preload without a
        // download count++, and switch it back, after preload, to '/download'.
        preload:    'metadata',
        playbackRateControls: true,
        playbackRates: [0.5, 1, 2, 3],
        autostart:  (autoplay),
        fallback:   so,
        width:      (isNaN(jwwidth) ? '100%' : jwwidth),
        height:     (audio ? CONTROLS_HEIGHT : height),
        // + list_height // *could* consider this if we think jw playlists are reasonble in v6.8 now
        base: jwbase,
      }
      // alert(width+' x '+height+'/'+list_height)


      // jwplayer now will auto-mute any autoplay attempt (w/o user click/interaction)
      // so there's no real point in trying to mute _and_ autoplay the A/V (to avoid
      // broswer blocking autoplay - we _have_ to start playback muted until click/interaction).
      //   -tracey may2019
      // if (version >= 8.8) jwcfg.mute = (autoplay || start)  &&  !pause_first_seek


      if (responsive  &&  !embed) {
        jwcfg.displaytitle = false // dont show title of 1st track next to big PLAY button
      } else if (aspectratio) {
        jwcfg.width = '100%'
        jwcfg.aspectratio = aspectratio
        delete jwcfg.height
      }


      if (identifier !== false) {
        const startend = (tv && tvEnd ? `?start=${tvStart}&end=${tvEnd}` : '')
        const embedcode = `<iframe src="https://archive.org/embed/MEDIAID"
                              width="${audio ? 500 : VIDEO_WIDTH}"
                              height="${audio ? AUDIO_HEIGHT : VIDEO_HEIGHT}"
                              frameborder="0"
                              webkitallowfullscreen="true"
                              mozallowfullscreen="true"
                              allowfullscreen></iframe>`
          .replace(/embed\/MEDIAID/, `embed/${identifier}${startend}`)
          .replace(/\s+/g, ' ')

        const embedcodeWP = `[archiveorg ${identifier}${startend} width=640 height=${audio ? AUDIO_HEIGHT : VIDEO_HEIGHT} frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`

        jwcfg.mediaid = identifier

        // IFF these exist, fill them in!
        $('#embedcodehere').text(embedcode)
        $('#embedcodehereWP').text(embedcodeWP)
      }


      if ((embed  &&  !audio  && !nolinks)  ||  logo) {
        jwcfg.logo = {
          file:     '//archive.org/jw/glogo-ghost.png',
          link:     details,
          position: 'top-right',
          margin:   2,
          hide:     false,
        }
      }


      if (play_just1 || onCompleteStop) {
        const onCompleteOrig = onComplete
        /* eslint-disable-next-line  no-param-reassign */
        onComplete = (jw) => {
          const evt = { done: play_just1  ||  onCompleteStop[jw.getPlaylistIndex()] }
          if (evt.done)
            jw.stop() // dont wanna auto-advance to next track in playlist

          if (onCompleteOrig)
            onCompleteOrig(jw, evt)
        }
      }


      log(jwcfg)
      jwplayer(jid).setup(jwcfg)
      jwplayer(jid).on('ready', () => {
        log('IA ', jid, ' is ready')

        const player = jwplayer(jid)

        log('NOTE: JW version: ', jwplayer.version)
        if (onTime)
          log('NOTE: onTime() is in use!')


        if (onTime)         player.on('time', ()         => onTime(player))
        if (onComplete)     player.on('complete', ()     => onComplete(player))
        if (onDisplayClick) player.on('displayClick', () => onDisplayClick(player))

        readyIA = true

        // NOTE: we now do this here because jwplayer can shrink down the passed in playlist on us!
        this.addClickablePlaylist()

        if (audio  &&  responsive  &&  !embed)
          this.responsiveResize()


        if (responsive  &&  !audio)
          $(jidsel).css('margin', 'auto') // center video player

        this.add_buttons(player)

        if (responsive  &&  !embed  &&  !audio  &&  typeof AJS !== 'undefined')
          AJS.theatre_controls_position(false, 0, width, height)


        if (responsive  &&  AUDIO_HEIGHT > CONTROLS_HEIGHT)
          $(jidsel).css('height', AUDIO_HEIGHT) // make space over controlbar for waveform


        if (audio  &&  !waveformer) {
          // If caller passed in audio, w/ imagery per track, but elected to _not_ show waveformer,
          // we dont want to 'leak' bg image in control bar since overall player height
          // is just controlbar height in this case
          $(jidsel).find('.jw-preview').css('display', 'none')
        }


        if (!embed  &&  responsive)
          this.details_setup()
        else if (embed  &&  location.host.match(/archive\.org$/)  &&  location.pathname.match(/^\/embed\//))
          this.embed_setup()

        player.on('meta', (obj) => {
          // only call all this once, because sometime between Feb and May 2014,
          // firefox+flash start sending onMeta() *very* frequently, not just once,
          // and we need to only "first seek" once, especially!
          if (!first_onmeta) {
            first_onmeta = true

            log('onMeta() fired')
            $('body').addClass('responsive-playing')

            if (!audio  &&  embed  &&  obj.width  &&  obj.height)
              this.adjustVideoWidth(this, obj) // xxx this

            this.unpreload()

            // xxx suck, ubuntu new firefox re-seeks to start w/o double doing this, etc....
            if (start) {
              log('SEEK TO: ', start)
              this.pause()
              jwplayer(jid).seek(start)
            }
          }
        })

        player.on('playlistItem', (obj) => {
          const idx = obj.index
          log('onPlaylistItem: ', idx)

          {
            const $rows = $(jidlist).find('.jwrow, .jwrowV2')
            if ($rows.length) {
              $rows.removeClass('playing')
              $($rows.get(idx)).addClass('playing')
            }
            if (idx  &&  audio  &&  player.getEnvironment().Browser.chrome  &&  player.getState() !== 'playing') {
              // ummm.... jwplayer v8.8 _in chrome_ isnt autoplaying audio next track!  xxx revisit
              log('playN audio v8.8 play hack..')
              player.play()
            }
          }


          this.seeker_playlist()

          this.url_updater(player, idx)

          if (speed !== 1.0)
            setTimeout(() => { this.speed(speed) }, 1000)

          this.waveformer_setup(player)
        })


        if (onPlaylistItem) {
          player.on('playlistItem', (e) => {
            log('onPlaylistItem', { skipNextOnPlaylistItem, e })
            if (skipNextOnPlaylistItem)
              skipNextOnPlaylistItem = false
            else
              onPlaylistItem(player, e)
          })
        }


        player.on('playlistComplete', () => {
          if (!audio  &&  collection  &&  !tv)
            this.related_items_click()
        })

        player.on('error', (obj) => {
          log('err')
          log(obj)
          $(jidsel).css({ 'background-color': 'black' })
          // throw "onError event"
        })

        Play.ready_player_one()

        if (onReady)
          onReady(player)
      }) // end on('ready')

      return this
    } // END OF LOGICAL CONSTRUCTOR


    this.url_updater = (player, idx) => {
      if (tv  ||  embed  ||  !identifier  ||  typeof history.replaceState === 'undefined')
        return

      const config = player.getConfig()
      if (!config  ||  !config.playlist  ||  config.playlist.length <= 1  ||
          !config.playlist[idx]  ||  !config.playlist[idx].orig)
        return


      if (update_url_onload) {
        const url = `/details/${identifier}/${encodeURIComponent(config.playlist[idx].orig).replace(/%2F/g, '/').replace(/%20/g, '+')}`
        const playset = (typeof AJS !== 'undefined'  &&  cgiarg('playset', true) ?
          '?playset=1&autoplay=1' : '')
        log('updating url to', url + playset)
        history.replaceState({}, null, url + playset)
      } else {
        log('looks like /details/ page loaded cold-state -- leave url AS IS')
        player.once('play', () => {
          log('time to start updating urls')
          update_url_onload = true
          this.url_updater(player, idx)
        })
      }
    }


    this.waveformer_setup = (player) => {
      if (!waveformer  ||  waveformed)
        return

      const flashy = player.getConfig().provider === 'flash' // xxxxxxxxxxxxxx
      let $wrapme = $(jidsel)
      if (flashy)
        $wrapme = $wrapme.parent()
      $wrapme.wrap(`<div id="${waveformer}" style="position:relative"></div>`)

      jwaudioWD = $(`#${waveformer}`).width()
      $(`#${waveformer}`).prepend('<div id="waveformer" style="background-color:rgb(19,160,216); position:absolute; width:0; top:0; bottom:0;"></div>')

      player.on('time', (evt) => {
        if (!evt.duration)
          return
        jwaudioPercentDone = evt.position / evt.duration
        $('#waveformer').css({ width: Math.round(jwaudioWD * jwaudioPercentDone) })
      })

      waveformed = true

      setTimeout(() => {
        if (!flashy)
          $(jidsel).css('background-color', 'transparent')
        $(`#${waveformer}`).css('background-color', '#ddd')
      }, 1000)
    }


    /**
     * Registers a callback with the A/V player
     * @param {String}   event - event name, one of:
     *   'load', 'play', 'pause', 'playlistItem', 'time', 'resize', 'complete', 'error'
     * @param {Function} fn - callback to invoke
     * @return {Object} this player object - allows for nicely fluent/chaining
     */
    this.on = (event, fn) => {
      const player = jwplayer  &&  jwplayer(jid)
      if (player)
        player.on(event, fn)

      return this
    }


    // xxx v6.8 for /details/anamorphic has wrong width in flash mode! so squishface unlike v6.1
    this.adjustVideoWidth = (_player, onMetaSizing) => {
      if (onMetaSizing.height  &&  onMetaSizing.width  &&  onMetaSizing.height > 0  &&
          onMetaSizing.width > 0  &&  (parseInt(onMetaSizing.height, 10) > 0)) {
        DAR = parseInt(onMetaSizing.width, 10) / parseInt(onMetaSizing.height, 10)
        log('DAR: ', DAR, onMetaSizing.width, 'x', onMetaSizing.height)
      }

      if (embed)
        this.embedResize()
    }


    this.embedResize = () => {
      if (!jwplayer  ||  !jwplayer(jid))
        return

      if (audio) {
        jwplayer(jid).resize(
          Math.min(CONTROLS_MAX_WIDTH, $(window).width()),
          AUDIO_HEIGHT,
        )
        return
      }

      // window max avail width and height for us
      const WW = $(window).width()
      const WH = $(window).height() - list_height

      jwplayer(jid).resize(WW, WH)
    }


    this.playN = (idx, load_paused) => {
      const player = jwplayer(jid)
      log('playN', {
        readyIA, idx, load_paused, state: player.getState(),
      })

      if (load_paused) {
        // caller wants us to setup player (and url if relevant) to wanted track but _not_ play
        player.once('play', () => player.pause())
      }
      skipNextOnPlaylistItem = true
      player.playlistItem(idx)

      return false
    }


    // xxx suck, ubuntu new firefox re-seeks to start w/o double doing this, etc....
    this.seeker_playlist = () => {
      if (first_seeked_playlist)
        return

      first_seeked_playlist = true

      if (pause_first_seek) {
        // oh cry/facepalm...
        //    /embed/ia20thanniversaryevent?start=2150
        // is now NOT wanted to autoplay ( unless _also_ has ""&autoplay=1" )
        jwplayer(jid).once('seek', () => {
          this.pause()
          log('... paused first seek!')
        })
      }

      if (!start)
        return

      this.pause()
      jwplayer(jid).seek(start)
    }


    this.embed_setup = () => {
      $(window).on('resize  orientationchange', () => {
        // Bind window resize to resize the player
        clearTimeout(Play.throttler2)
        Play.throttler2 = setTimeout(() => {
          // resize/orient flip -- resize and reflow elements
          new Play(jid).embedResize()
        }, 250)
      })
    }


    /**
     * Switch first track's /serve/ url to /download/ so any play event will get download counted
     */
    this.unpreload = () => {
      const jw = jwplayer(jid)
      const plist = jw.getPlaylist()
      const startPlaylistIdx = jw.getPlaylistIndex() // esp. for cold state url w/ track 2+ file

      if (plist.length) {
        if (typeof plist[0].file !== 'undefined')
          plist[0].file = plist[0].file.replace(/\/serve\//, '/download/')
        if (typeof plist[0].sources !== 'undefined') {
          for (const src of plist[0].sources)
            src.file = src.file.replace(/\/serve\//, '/download/')
        }
      }

      // we were at track 2+ -- setup to return there once 'new' playlist is loaded
      if (startPlaylistIdx) {
        jw.on('playlist', () => {
          jw.playlistItem(startPlaylistIdx)
        })
      } else if (!start  &&  !autoplay) {
        update_url_onload = false
      }

      jw.load(plist)
    }


    this.details_setup = () => {
      log('details_setup')
      let startPlaylistIdx = 0

      const re = `^/details/${identifier}/([^&?]+)`
      const mat = location.pathname.match(re)
      if (mat) {
        const file = decodeURIComponent(mat[1].replace(/\+/g, '%20'))
        log('looking for: ', file)
        // log(playlist)
        /* eslint-disable-next-line  guard-for-in */
        for (const ii in playlist) {
          const idx = Number(ii) // convert from string!
          if (playlist[idx].orig === file) {
            log('player should seek to track #', idx)
            startPlaylistIdx = idx
            break
          }
        }
      }

      if (!startPlaylistIdx  &&  !start  &&  !autoplay)
        update_url_onload = false

      if (!autoplay  &&  (startPlaylistIdx  ||  start)) {
        log('seek #', startPlaylistIdx, ' to ', start)
        const jw = jwplayer(jid)
        jw.playlistItem(startPlaylistIdx)
      }
      if (onSetupComplete) onSetupComplete(startPlaylistIdx)
    }


    this.pause = () => {
      const jw = jwplayer(jid)
      if (readyIA  &&  jw  &&  jw.getState  &&  jw.getState() === 'playing')
        jw.pause()
    }

    this.remove = () => {
      this.pause()
      const jw = jwplayer(jid)
      if (readyIA  &&  jw  &&  jw.getConfig())
        jw.remove()
      delete stash[jid]
    }

    this.speed = (valIn) => { // xxx audio items still need some cosmetic work
      if (typeof valIn === 'undefined'  ||  typeof valIn === 'object') {
        let close = false
        if (audio) {
          // allows playback rates theatre icon click to show picker menu
          $('.jw-controls').css('overflow', 'initial')

          close = ($(jidsel).height() === AUDIO_HEIGHT_MAX)
          $(jidsel).css('height', (close ? AUDIO_HEIGHT_WITH_WAVEFORM : AUDIO_HEIGHT_MAX))
        }

        close = close || $(`${jidsel} .jw-controls`).hasClass('jw-settings-open')

        // facepalm, pls unsuck API..
        if (close) {
          $(`${jidsel} .jw-controls`).removeClass('jw-settings-open')
          if (audio)
            $('.jw-controls').css('overflow', '')
        } else {
          $(`${jidsel} .jw-controls`).toggleClass('jw-settings-open')
        }

        $(`${jidsel} .jw-settings-topbar .jw-icon`).attr('aria-checked', 'false')
        $(`${jidsel} .jw-settings-playbackRates`).attr('aria-checked', 'true')

        const $xxx = $('.jw-settings-content-item:contains("0.5x")').parent()
        $(`${jidsel} .jw-settings-submenu`).attr('aria-expanded', 'false').removeClass('jw-settings-submenu-active')
        $xxx.attr('aria-expanded', 'true').addClass('jw-settings-submenu-active')
        return false
      }

      let val = valIn
      if (typeof val === 'undefined'  ||  isNaN(val))
        val = 1.0

      const vid = $(`#${jid} video`).get(0)
      vid.playbackRate = val
      log(`speed to ${val}`)
      return false
    }

    this.add_buttons = (player) => {
      const prv = '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-next" style="transform: rotate(180deg)" viewBox="0 0 240 240"><path d="M165,60v53.3L59.2,42.8C56.9,41.3,55,42.3,55,45v150c0,2.7,1.9,3.8,4.2,2.2L165,126.6v53.3h20v-120L165,60L165,60z"></path></svg>'

      const nxt = '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-next" viewBox="0 0 240 240"><path d="M165,60v53.3L59.2,42.8C56.9,41.3,55,42.3,55,45v150c0,2.7,1.9,3.8,4.2,2.2L165,126.6v53.3h20v-120L165,60L165,60z"></path></svg>'

      const shr = '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-next" viewBox="0 25 75 50"><path d="M67.5,18c-5.1,0-9.3,4.2-9.3,9.3c0,0.5,0.1,1.1,0.2,1.6l-23,12.9c-1.7-1.8-4.1-3-6.8-3,c-5.1,0-9.3,4.1-9.3,9.3c0,5.1,4.1,9.3,9.3,9.3c2.7,0,5.2-1.2,6.9-3.1l22.8,13.4c0,0.4-0.1,0.7-0.1,1.1c0,5.1,4.1,9.3,9.3,9.3,c5.1,0,9.3-4.1,9.3-9.3c0-5.1-4.1-9.3-9.3-9.3c-2.8,0-5.4,1.3-7.1,3.3L37.7,49.4c0.1-0.4,0.1-0.9,0.1-1.3c0-0.5,0-1-0.1-1.5,l23.1-13c1.7,1.8,4.1,3,6.8,3c5.1,0,9.3-4.1,9.3-9.3C76.8,22.2,72.6,18,67.5,18L67.5,18z"></path></svg>'

      const airplay = '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-airplay-on" viewBox="0 0 240 240"><path d="M229.9,40v130c0.2,2.6-1.8,4.8-4.4,5c-0.2,0-0.4,0-0.6,0h-44l-17-20h46V55H30v100h47l-17,20h-45c-2.6,0.2-4.8-1.8-5-4.4c0-0.2,0-0.4,0-0.6V40c-0.2-2.6,1.8-4.8,4.4-5c0.2,0,0.4,0,0.6,0h209.8c2.6-0.2,4.8,1.8,5,4.4C229.9,39.7,229.9,39.9,229.9,40z M104.9,122l15-18l15,18l11,13h44V75H50v60h44L104.9,122z M179.9,205l-60-70l-60,70H179.9z"/></svg>'

      if (embed  &&  !nolinks) {
        const ttl = (
          tvTitle ?
            `${tvTitle.replace(/ : /g, '\n')}\n\nClick above for more information and clips\nat the Internet Archive` :
            'More Formats from Internet Archive')

        player.addButton('/images/glogo-jw.png', ttl, () => {
          window.top.location.href = details
        }, 'btn-ia')
      }

      if (embed  &&  !audio  &&  !noshare  &&  !tv) {
        if (identifier !== false) {
          player.addButton(
            '/jw/embed.png',
            'Embedding Examples and Help',
            () => {
              window.top.location.href = `/help/video.php?identifier=${identifier}`
            },
            'btn-mbd',
          )
        }

        if (typeof AJS !== 'undefined') {
          player.addButton(shr, 'share', () => {
            // user clicked on sharing toolbar icon -- we dont get the button/link so find it
            const lnk = $('.jw-icon[button=btn-shr]').get(0)
            // now show the sharing modal!
            AJS.modal_go(lnk, { ignore_lnk: 1, shown: AJS.embed_codes_adjust })
          }, 'btn-shr')
          // now that the button is added, add needed-by-sharing-modal attributes to it
          $('.jw-icon[button=btn-shr]').attr('href', 'ignored').attr('data-target', '#cher-modal')
        }
      }

      if (tv  &&  embed  &&  tvSource !== false) {
        player.addButton(
          `/images/tv/${identifier.split('_')[0]}.png`,
          `Look for this show on ${tvContributor} website`,
          () => {
            window.top.location.href = tvSource
          },
          'btn-tv',
        )
      }

      if (!audio  &&  collection  &&  !tv) {
        player.addButton(
          '/jw/8/related.png',
          'Related Videos',
          () => {
            this.related_items_click()
          },
          'btn-rel',
        )
      }

      if (this.castable()) {
        if (window.chrome)
          Play.cast_sender_setup()

        player.addButton(
          airplay,
          'Cast media with AirPlay / Chromecast',
          () => {
            this.cast()
          },
          'btn-cast',
        )
      }

      // NOTE: added last, so it's closest to the scrubber and play/pause normal controls, etc.
      if (!tv  &&  playlist.length > 1) {
        /* eslint-disable padded-blocks, block-spacing */
        player.addButton(nxt, 'next',     () => { player.playlistNext()}, 'btn-nxt')
        player.addButton(prv, 'previous', () => { player.playlistPrev()}, 'btn-prv')
        /* eslint-enable padded-blocks, block-spacing */
      }
    }


    this.castable = () => (window.WebKitPlaybackTargetAvailabilityEvent  ||  window.chrome)


    this.cast = () => {
      if (window.WebKitPlaybackTargetAvailabilityEvent) {
        $(`#${jid} video`).get(0).webkitShowPlaybackTargetPicker()
        return
      }

      if (!window.chrome)
        return

      const onMediaDiscovered = (how, media) => {
        media.play( // xxx pause / stop /seek all similar -- hook into jw controls!
          null,
          (e) => { log('media play success', how, media, e) },
          (e) => { log('media play fail', e) },
        )
      }

      this.cast_retries = 0
      const cast_setup = () => {
        log('cast_setup #', this.cast_retries)

        this.cast_retries += 1
        if (this.cast_retries > 3)
          return false

        if (!window.chrome.cast)
          return setTimeout(cast_setup, this.cast_retries * 1000)

        /* Adapted from:
            https://developers.google.com/cast/v2/chrome_sender
        */
        const { cast } = window.chrome
        const sessionRequest =
          new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
        const apiConfig = new cast.ApiConfig(
          sessionRequest,
          (e) => { if (e.media.length) onMediaDiscovered('onRequestSessionSuccess', e.media[0]) },
          (e) => { log('receiver listener fail', e) },
        )
        cast.initialize(
          apiConfig,
          () => {
            log('cast init success')
            // launch cast destination picker
            cast.requestSession(
              (session) => {
                log('request session success', session)
                // NOTE: avoid CORS issues and use A/V file from same host
                const src = $(`${jidsel} video`).attr('src')
                const mediaURL = `${location.protocol}//${location.host}${src}`
                const mediaInfo = new cast.media.MediaInfo(mediaURL)
                const request = new cast.media.LoadRequest(mediaInfo)
                session.loadMedia(
                  request,
                  onMediaDiscovered.bind(this, 'loadMedia'),
                  (e) => { log('onMediaError', e) },
                )
              },
              (e) => {
                log('request session fail', e)
                setTimeout(cast_setup, 500)
              },
            )
          },
          () => log('cast init failure'),
        )
        return true
      }

      cast_setup()
    }


    this.related_items_click = () => {
      const controlbar_click_closes = () => {
        $(`${jidsel} .jw-controlbar`).one('click', (evt) => {
          $('#related-items-bg').hide()
          evt.preventDefault()
        })
      }

      if (typeof Related !== 'undefined'  &&  !$('#related-items').length) {
        $(`${jidsel}`).prepend(`
<div id="related-items-bg" onclick="$('#related-items-bg').hide()" style="display:none">
  <div id="related-items">
  </div>
</div>
`)

        Related.getRelatedItems(identifier, true).then((data) => {
          let htm = ''
          for (const val of data) {
            htm += `
<div>
  <a href="/details/${val.identifier}">
    <div class="related-ttl">
      ${val.title !== null ? val.title : ''}
      ${val.creator !== null ? `<br/>&nbsp;&nbsp;<small>by:</small>&nbsp;${val.creator}` : ''}
      ${val.downloads !== null ? `<div>${val.downloads} views</div>` : ''}
    </div>
    <img src="/services/img/${val.identifier}"/>
  </a>
</div>
`
          }

          $('#related-items').html(htm)

          $('#related-items-bg').show()
          controlbar_click_closes()
        })
      } else {
        const showing_now = $('#related-items-bg:visible').length
        if (showing_now) {
          $('#related-items-bg').hide()
        } else {
          $('#related-items-bg').show()
          setTimeout(controlbar_click_closes, 500) // xxx sigh jw gets in the way w/o delay..
        }
      }
    }


    this.addClickablePlaylist = () => {
      if (hide_list)
        return // nothing to do!

      const jwlist = jwplayer(jid).getPlaylist()
      let same_len = true
      if (jwlist.length !== playlist.length) {
        log('NOTE: jw playlist filtered down -- ', playlist.length, '==>', jwlist.length, ' items')
        same_len = false
      }

      let ialist = ''
      let ialistC1 = ''
      let ialistC2 = ''
      $.each(jwlist, (idx, val) => {
        // Append artist if it's present.
        const ttl = (typeof val.title === 'undefined' ?
          '' : val.title).concat(typeof val.artist === 'undefined' ? '' : ` - ${val.artist}`)

        // In v6.8 flash mode (only), duration no longer is passed back via "getPlaylist()" 8-(
        // so try the original list sent to jwplayer config if we can...
        let duration = (typeof val.duration !== 'undefined' ? val.duration : false)
        if (duration === false) {
          duration = (same_len  &&  typeof playlist[idx] !== 'undefined'  &&
                      typeof playlist[idx].duration !== 'undefined' ? playlist[idx].duration : 0)
        }
        if (duration <= 0)
          duration = false

        if (list_2cols) {
          const str = `
<a href="#" onclick="return Play('${jid}').playN(${idx})">
  <div class="jwrowV2">
    <b>${idx + 1}</b>
    <span class="ttl">
      ${ttl}
    </span>
    -
    <span class="tm">
      ${duration ? Play.sec2hms(duration) : ''}
    </span>
  </div>
</a>`
          if (idx < (playlist.length / 2))
            ialistC1 += str
          else
            ialistC2 += str
        } else {
          ialist += `
<a href="#" onclick="return Play('${jid}').playN(${idx})">
  <div class="jwrow">
    <div class="tm">
      ${duration ? Play.sec2hms(duration) : ''}
    </div>
    <div class="n">
      ${idx + 1}
    </div>
    <div class="ttl">
      ${ttl}
    </div>
  </div>
</a>`
        }
      })

      if (list_2cols) {
        ialist = `<div class="row">
                    <div class="col-sm-6">
                      ${ialistC1}
                    </div>
                    <div class="col-sm-6">
                      ${ialistC2}
                    </div>
                  </div>`
      }


      const css = {}
      if (responsive) {
        css.width = width
        css.margin = 'auto'
        if (!audio)
          $(jidsel).css('margin', 'auto')
      }

      $(jidlist).addClass(list_2cols ? 'jwlistV2' : 'jwlist').css(css).html(ialist)

      log(playlist)
      // log(JSON.stringify(playlist,undefined,2))
    }


    this.debug = () => {
      /* eslint-disable-next-line  no-debugger */ // deno-lint-ignore  no-debugger
      debugger
    }


    this.responsiveResize = (first) => {
      if (!responsive)
        return

      const playoff = $(jidsel).offset()
      let maxH = $(window).height() - playoff.top - METADATA_HEIGHT
      if (audio) {
        if (playlist  &&  playlist.length > 0  &&  playlist[0].image  &&  waveformer)
          AUDIO_HEIGHT = AUDIO_HEIGHT_WITH_WAVEFORM // (typically png is 800x200 now)
        // OK, so we will be using "maxH" for the **playlist**.
        // Reduce by player/waveform height now...
        // but make sure at least ~8 rows (or 4 if oldtimeradio item ;-) always show
        //   (eg: insanely short browser??)
        maxH -= AUDIO_HEIGHT
        maxH = Math.max(AUDIO_HEIGHT_MAX, maxH)
        if (!embed) {
          log('responsiveResize() maxH:', maxH)
          /* eslint-disable-next-line  no-param-reassign */
          list_height = maxH
          log($(jidlist).length)
          $(jidlist).css({
            'max-height': maxH,
            'overflow-x': 'hidden',
            'overflow-y': 'auto',
          })

          if (waveformer) {
            jwaudioWD = $(`#${waveformer}`).width()
            $('#waveformer').css({ width: Math.round(jwaudioWD * jwaudioPercentDone) })
          }
        }
        /* eslint-disable-next-line  no-param-reassign */
        width = '100%'
        $('#theatre-controls .fave-share').removeClass('fave-share')
        $('#theatre-controls').offset({ top: playoff.top }).css({
          visibility: 'visible',
          'background-color': 'black',
        })
      } else {
        let aspect = DAR
        if (playlist  &&  playlist.length > 0  &&  playlist[0].sources  &&
            playlist[0].sources.length > 0  &&
            playlist[0].sources[0].width  &&  playlist[0].sources[0].height) {
          aspect = playlist[0].sources[0].width / playlist[0].sources[0].height
          log('aspect ratio appears to be: ', aspect)
        }

        const maxW = $('.container-ia:last').width()
        log('video max rect avail: ', maxW, 'x', maxH)

        let vidW
        let vidH
        for (vidH of [960, 840, 720, 600, 480, 360, 240, 180]) {
          vidW = Math.round(vidH * aspect)
          log('video size try fit: ', vidW, 'x', vidH)
          if ((vidW <= maxW  &&  vidH <= maxH)  ||  vidW <= 320)
            break
        }
        /* eslint-disable  no-param-reassign */
        width  = vidW // '100%'
        height = vidH
        /* eslint-enable  no-param-reassign */

        if (typeof AJS !== 'undefined')
          AJS.theatre_controls_position(false, 0, width, height)
      }


      if (first) {
        // we havent setup the player yet, but want to setup a watcher
        // for browser resize or mobile orientation changing
        $(window).on('resize  orientationchange', () => {
          clearTimeout(Play.throttler)
          Play.throttler = setTimeout(() => {
            // resize/orient flip -- resize and reflow elements
            new Play(jid).responsiveResize()
          }, 250)
        })
      } else if (!audio) {
        jwplayer(jid).resize(width, height)
      }
    }


    this.cache = () => {
      /* eslint-disable-next-line  no-alert */
      if (!jid) return alert('please pass in a unique identifier for this object')
      if (typeof stash[jid] !== 'undefined') {
        if (typeof playlist === 'undefined')
          return stash[jid] // return prior created object
        delete stash[jid] // new jwplayer + playlist for prior jid
      }
      return false
    }


    const cached = this.cache()
    // eslint-disable-next-line no-constructor-return
    if (cached) return cached

    stash[jid] = this // stash a pointer so that a repeat call to Play(jid) returns prior object

    /* eslint-disable-next-line  prefer-rest-params */
    log('PLAY CONFIG:', arguments[2])

    this.construct()
  }

  // From here on down, these methods are "class"/static and not "instance" methods


  // returns number of seconds (may be float) as string "hh:mm:ss"
  // note will omit "hh:" if 0 (unless pass in truthy alwaysHH)
  // Stateless function, global to all Play objects
  static sec2hms(secIn, alwaysHH) {
    let   sec = Math.round(secIn)
    const hr  = Math.floor(sec / 3600)
    const min = Math.floor((sec - (hr * 3600)) / 60)
    sec -= ((hr * 3600) + (min * 60))

    // left 0-pad to 2 digits as needed
    let hms = ''
    let tmp = ''
    if (alwaysHH  ||  hr > 0) {
      tmp = `00${hr}` // ` <= vscode quirk
      hms += tmp.substr(tmp.length - 2, 2)
      hms += ':'
    }
    tmp = `00${min}`
    hms += tmp.substr(tmp.length - 2, 2)
    hms += ':'

    tmp = `00${sec}`
    hms += tmp.substr(tmp.length - 2, 2)

    return hms
  }


  // [nicked from jwplayer JS v6 code]
  // Converts a time-representing string to a number.
  // @param {String}   The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
  // @return {Number}  The number of seconds.
  static seconds(strIn) {
    const str = strIn.replace(',', '.')
    const arr = str.split(':')
    let sec = 0
    if (str.substr(-1) === 's') {
      sec = Number(str.substr(0, str.length - 1))
    } else if (str.substr(-1) === 'm') {
      sec = Number(str.substr(0, str.length - 1)) * 60
    } else if (str.substr(-1) === 'h') {
      sec = Number(str.substr(0, str.length - 1)) * 3600
    } else if (arr.length > 1) {
      sec = Number(arr[arr.length - 1])
      sec += Number(arr[arr.length - 2]) * 60
      if (arr.length === 3)
        sec += Number(arr[arr.length - 3]) * 3600
    } else {
      sec = Number(str)
    }
    return sec
  }


  static seek(link) {
    const mat = ((`${link.href}/`).match(/[/#]start\/([\d.]+)\//)  ||
                  link.href.match(/[?&]start=([\d.]+)/))
    if (!mat)
      return true

    const startsec = mat[1]
    jwplayer().seek(startsec)

    // if we have a relatively modern browser, simply update the browser url
    if (typeof history.pushState === 'undefined')
      location.href = link.href // older browwser -- full page refresh
    else
      history.pushState({}, null, link.href) // newer!

    return false
  }


  static cast_sender_setup() {
    if (!window.chrome  ||  window.chrome.cast)
      return; // not chrome or already loaded -- noop!

    /* NOTE: the minified code below is pasted (Mar 2018) from:
        https://www.gstatic.com/cv/js/sender/v1/cast_sender.js
      */
    /* eslint-disable-next-line */ // deno-lint-ignore no-var, no-inner-declarations
    (function() {var e=function(a){return!!document.currentScript&&(-1!=document.currentScript.src.indexOf("?"+a)||-1!=document.currentScript.src.indexOf("&"+a))},f=e("loadGamesSDK")?"/cast_game_sender.js":"/cast_sender.js",g=e("loadCastFramework")||e("loadCastApplicationFramework"),h=function(){return"function"==typeof window.__onGCastApiAvailable?window.__onGCastApiAvailable:null},k=["pkedcjkdefgpdelpbcmbmeomcjbeemfm","enhhojjnijigcajfphajepfemndkmdlo"],m=function(a){a.length?l(a.shift(),function(){m(a)}):n()},p=function(a){return"chrome-extension://"+a+f},l=function(a,c,b){var d=document.createElement("script");d.onerror=c;b&&(d.onload=b);d.src=a;(document.head||document.documentElement).appendChild(d)},q=function(a){return 0<=window.navigator.userAgent.indexOf(a)},n=function(){var a=h();a&&a(!1,"No cast extension found")},r=function(){if(g){var a=2,c=h(),b=function(){a--;0==a&&c&&c(!0)};window.__onGCastApiAvailable=b;l("//www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js",n,b)}};if(q("CriOS")){var t=window.__gCrWeb&&window.__gCrWeb.message&&window.__gCrWeb.message.invokeOnHost;t&&(r(),t({command:"cast.sender.init"}))}else if(q("Android")&&q("Chrome/")&&window.navigator.presentation){r();var u=window.navigator.userAgent.match(/Chrome\/([0-9]+)/);m(["//www.gstatic.com/eureka/clank/"+(u?parseInt(u[1],10):0)+f,"//www.gstatic.com/eureka/clank"+f])}else window.chrome&&window.navigator.presentation&&!q("Edge")?(r(),m(k.map(p))):n();})();
  }


  /**
   * Encodes chars jwplayer has problems with.
   *
   * If any of our filenames have 'naked' chars: # ? %
   * In them, we need to urlencode them first in order for jwplayer to properly play them
   * (But NOTE we punt on % because that's pretty well impossible to sort out .. )
   *
   * Example in/out:
   *   foo?bar.mp3?start=5?hi
   *   foo%3Fbar.mp3?start=5?hi
   *
   * @param {string} filename
   * @return {string}
   */
  static filename_char_encoder(filename) {
    // Allow for what look like A/V files with CGI args to keep `?` chars - but o/w encode them.
    // eg: https://archive.org/details/lp_blue-moves_elton-john
    const parts = filename.split(/\.(mp3|ogg|ogv|mp4|mpeg4|m4v|mov|flv|swf)\?/i)

    const encoded = parts.shift().replace(/#/g, '%23').replace(/\?/g, '%3F')

    // if there were 2+ parts in the split above, join them back now (unencoded)..
    const ret = encoded + (parts.length ? `.${parts.shift()}?` : '')

    return ret + parts.join('')
  }


  /**
   * Allows a caller to get alerted when a jwplayer is ready.
   * This is presently just for MSIE and (buggy) web components polyfill - so it can know when
   * it should get XHR loaded and setup (_after_ jwplayer is already setup).
   *
   * @param {function} callback function that should be invoked when a player is setup and ready
   */
  static when_ready_player(callback) {
    if (Play.when_ready_player_callback_immediately) {
      callback()
      delete Play.when_ready_player_callback
    } else {
      Play.when_ready_player_callback = callback
    }
  }


  /**
   * internal method - @see when_ready_player()
   */
  static ready_player_one() { // nix
    if (Play.when_ready_player_callback)
      Play.when_ready_player_callback()
    else
      Play.when_ready_player_callback_immediately = true
  }

  /* static except(e){
    // report back home an exception was thrown!
    const img = new Image(1,1)
    img.src =
      "http://analytics.archive.org/e.gif" +
      "?a="+ encodeURIComponent(navigator.userAgent) +
      '&e='+ encodeURIComponent(e.toString()) +
      (e.stack  &&  typeof(e.stack)=='string' ?
        '&s='+ encodeURIComponent(e.stack) : '')
  }
  */

  /**
   * Runs setup (for pages with embedded data divs in them)
   */
  static setup() {
    $('.js-play8-config').each((_idx, e) => {
      const id = 'jw6'
      const $e = $(e)
      const config = JSON.parse($e.val())
      const $tag = $('.js-play8')
      $tag.attr({ id })

      if ($(`#${id}`).hasClass('js-playset'))
        config.onComplete = Playset.onComplete

      window.Play(id, JSON.parse($('.js-play8-playlist').val()), config)

      onclick('.js-play8-speed', window.Play(id).speed)
      onclick('.js-play8-gofullscreen', jwplayer(id).setFullscreen)
    })
  }
} // end class Play

/*
// trap for ESCAPE key pressed to close a popup
$(document).keydown(function(e) {
  if (e.keyCode==27)
    $('#jpop').remove()
})
*/


// allow "Play(.., ..)" globally:
window.Play = (id, playlist, options) => new Play(id, playlist, options) // promote to global

// only these (static) methods are available globally, eg: Play.seek(..)
for (const meth of ['sec2hms', 'seconds', 'seek', 'filename_char_encoder', 'when_ready_player'])
  window.Play[meth] = Play[meth]


if (IE)
  Play.setup() // must run _now_ before any web_components pollyfill loads and mangles jwplayer JS
else
  $(Play.setup) // run on DOM ready (as typical)

export default Play
