import { log } from './util/log.js'
import cgiarg from './util/cgiarg.js'
import { friendly_truncate } from './util/strings.js'


const FOURK = false // xxx - still needs more work!
const HIRANK = 100
const DEBUG = false
const THUMB_NAME = '__ia_thumb.jpg'

let nnn = 0
const PLAYABLES = Object.fromEntries([
  'thumbnail2', // keeps all 'rank' values !0, also used for 2nd thumbnail..
  'thumbnail',  // holder for 1st thumbnail

  // our current IA video derivatives:
  'h.264',
  'webm',
  'h.264 720p',
  'h.264 486p',

  // our prior IA video derivatives:
  '512kb mpeg4',
  'ogg video',

  // formats users might upload that we can play:
  (FOURK ? 'h.264 4k' : 'h.264 hd'),
  'h.264 hd',
  'h.264 mpeg4',
  'mpeg4',
  'ogg theora',
  'flash video',

  // not messing with flakey VLC plugin (for now ;-)
  // 'mpeg2',
  // 'mpeg1',
  // 'cinepack', // avi


  // FOR AUDIO!
  'vbr mp3',
  'ogg vorbis',
  'mpeg-4 audio',
  '128kbps mp3',
  '64kbps mp3',
  'mp3 sample',
  /* eslint-disable-next-line no-plusplus */
].map((k) => [k, nnn++]))

const AUDIO = [
  'vbr mp3',
  'ogg vorbis',
  'mpeg-4 audio',
  '128kbps mp3',
  '64kbps mp3',
  'mp3 sample',
]

const IGNORES = [
  '64kbps m3u',
  '64kbps mp3 zip',
  'checksums',
  'flac fingerprint',
  'item tile',
  'vbr m3u',
  'vbr zip',
]


class Player {
  constructor(mdapi, onlyThisGroup = false) {
    this.identifier = mdapi.metadata.identifier
    this.groups = []
    this.widths = {}
    this.heights = {}
    this.durations = {}
    this.srts = {}
    this.vtts = {}
    this.haxLP = false

    // aid to group derivatives-of-derivatives into proper group (and not splinter into 2 groups)
    const file2key = {}
    const mapper = {}
    const groupsA = {}
    const groupsV = {}
    const autoplay = {}
    const audio = {}
    const pngs = {}
    const t2 = PLAYABLES.thumbnail2
    let artists = {}

    mdapi.files.forEach((fi_orig) => {
      const [fi] = this.filter(fi_orig)
      if (!fi)
        return // filtered out

      if ('original' in fi) {
        // derivative!
        const origfi = typeof fi.original === 'string' ? fi.original : fi.original[0] // array/rare!
        if (fi.name !== origfi) // ensure no loops later
          file2key[fi.name] = origfi
      }

      if (fi.name.endsWith('.png')  &&  !fi.name.endsWith('_spectrogram.png'))
        pngs[fi.name] = 1
    })
    log(file2key)


    mdapi.files.forEach((fi_orig) => {
      const [fi, formatLC, suffixLC] = this.filter(fi_orig)
      if (!fi)
        return // filtered out

      const filename = fi.name

      let rank = PLAYABLES[formatLC]

      const deriv = ('original' in fi)

      let key = filename
      if (deriv) {
        // derivative!
        key = typeof fi.original === 'string' ? fi.original : fi.original[0]

        // handle derivative-of-derivative case -- chase up to top original file
        for (let i = 10; i  &&  (key in file2key); i--)
          key = file2key[key]

        if ((suffixLC === 'mp4' || suffixLC === 'ogv')  &&
            (key in mdapi.files)  && // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            (mdapi.files[key].format === 'ISO Image')  &&
            /* eslint-disable */ // xxxx
            preg_match('/^(.*?)(\d+)\.[^\.]+$/', $filename, $m2)  && // xxx
            preg_match('/^(.*)\.[^\.]+$/', $key, $mat)  &&
            $m2[1] == $mat[1]) {
          // Yikes, OK for deriving DVD disc images, we can make
          //   file.cdr => file.mp4, file1.mp4, file2.mp4
          // when there are *3* titles/tracks in the DVD.
          // BUT each show the same "original file".
          // So, since we think we've detected this case w/ the 'if' above,
          // we'll fudge the "original file"(name) a bit by adding back
          // in any numerical track info, so that we can make the A/V player
          // show/play all "tracks/titles"!
          // if (DEBUG) msg("{$fi['ORIGINAL']} vs $filename ({$mat[1]} vs {$m2[1]})");
          $origSuffix = strrchr($fi['ORIGINAL'], '.');
          key = "{$m2[1]}{$m2[2]}$origSuffix"
        }
        /* eslint-enable */ // xxxx


        if (typeof key !== 'string')
          key = (key.length ? key.shift() : '')
      } else /* original file */ if ('artist' in fi) {
        artists[key] = fi.artist
      } else /* original file */ if ('creatorxxx' in fi) {
        artists[key] = fi.creatorxxx
      }

      if (onlyThisGroup  &&  key !== onlyThisGroup)
        return


      // log({ filename, formatLC, suffixLC, rank, key })


      if (!(key in mapper))
        mapper[key] = {}

      if ('title' in fi) {
        if (deriv) {
          // derivative -- use any title it has as backup/2nd choice
          // for example an unlogged in user viewing a Grateful Dead
          // soundboard stream-only item -- they never see the original
          // in the file loop iteration we are in!
          if (!('title' in mapper[key]))
            mapper[key].title = fi.title
        } else {
          // original -- use file's explicit <title> if it exists;
          // else (later, base (no subdirs) filename, w/o final suffix)
          mapper[key].title = fi.title
        }
      }

      if ('height' in fi)
        this.heights[filename] = fi.height
      if ('width' in fi)
        this.widths[filename] = fi.width

      if ('autoplay' in fi) {
        // NOTE: this is _usually_ used to say "stop at this point in playlist", eg:
        /* eslint-disable-next-line max-len */
        //   /details/78_a-special-collection-of-the-world-famous-music-of-trinidad---calypsos_wilmoth-houdi_gbia0002481
        autoplay[filename] = fi.autoplay
      }


      /* xxxx
      if (isset($fi['LENGTH'])) {
        // convert to number of seconds
        $sec = $fi['LENGTH'];
        if (preg_match('/^(\d+):(\d+)$/', $sec, $mat))
          $sec = (60 * $mat[1]) + ($mat[2]);
        elseif (preg_match('/^(\d+):(\d+):(\d+)$/', $sec, $mat))
          $sec = (3600 * $mat[1]) + (60 * $mat[2]) + ($mat[3]);

        this.durations[filename] = $sec;

        // shn file durations seem wacky, eg:
        //   /details/bdolzani2011-06-28
        // so we'll 'prefer' derivs' LENGTH when we can...
        if ($deriv)
          $lengths[$key] = 1; // set to indicate derivative set the LENGTH

        if ($deriv  ||  !isset($mapper[$key]['LENGTH'])  ||
            !isset($lengths[$key])) {
          $mapper[$key]['LENGTH'] = round($sec);
        }
      } */


      if (!rank) {
        // not a playable file, skip it -- now that we've looked for
        // its TITLE and/or saved it ;-)
        return
      }


      if (deriv) {
        if (formatLC === 'h.264 720p') {
          mapper[key].HD = filename
          return
        }
      } else {
        // tracey = lame. Court submits exhibit #2 on behalf of The People vs..
        // We **LOVE** this item/movie!
        //    http://archive.org/details/Sita_Sings_the_Blues
        // but it has a large number of h.264 video <format> files in it
        // and we needed someway to filter out monstrously large 'HD' ones...
        const name = fi.title
        if (formatLC === 'h.264 hd'  ||
            // eg: archive.org/details/bancroftlibraryucberkeley
            (formatLC === 'h.264 mpeg4'  &&  (name.indexOf('[HD]') > 0  ||
                                              name.indexOf(' HD ') > 0  ||
                                              name.endsWith(' HD')))) {
          mapper[key].HD = filename
          return
        }

        if (FOURK  &&  formatLC === 'h.264 4k') {
          mapper[key]['4K'] = filename
          return
        }

        if (rank > 1)
          rank += HIRANK // deprioritize non-derivatives!
      }


      if (rank > 1) {
        // ie: not thumbnail
        if (AUDIO.indexOf(formatLC) >= 0) {
          groupsA[key] = 1
          audio[filename] = 1
        } else {
          groupsV[key] = 1
        }
      }


      if (!(key in mapper))
        mapper[key] = {}

      if (!(rank in mapper[key])) {
        mapper[key][rank] = filename
        /**/ if (rank < HIRANK  &&  (rank + HIRANK) in mapper[key])
          delete mapper[key][rank + HIRANK] // chexxx
        else if (rank > HIRANK  &&  (rank - HIRANK) in mapper[key])
          delete mapper[key][rank - HIRANK] // chexxx
      } else if (formatLC === 'thumbnail'  &&  t2 in mapper[key]) {
        mapper[key][t2] = filename
      }
    })

    // ksort(mapper) //xxx - check IFF MDAPI guarantees order sorted by filename..
    //    (Object.keys (and similar Object iterators) gives int vals, sorted first, else
    //    string chars in order addded...)
    log(mapper)


    if (this.haxLP) {
      // yank "entire album" tracks from being shown in A/V player
      delete mapper[`${this.identifier}.flac`]
      delete mapper[`${this.identifier}.ogg`]
      delete mapper[`${this.identifier}.mp3`]
      delete mapper[`${this.identifier}.m4a`]
    }


    const nAudio = Object.keys(groupsA).length
    const nVideo = Object.keys(groupsV).length
    if (nVideo > 0  &&  (nVideo >= nAudio || mdapi.metadata.mediatype === 'movies'))
      this.showing = 'movies'
    else
      this.showing = (nAudio ? 'audio' : false)

    // we only care if 2+ (different!) <artist> values are set
    //   eg:  /details/wcd_various-artistsbravo-hits-24_2-4-family_flac_lossless_29950093
    const vals = Object.values(artists)
    if (vals.length <= 1  ||  [...new Set(vals)].length <= 1)
      artists = {} // all tracks are same artist (or all nothing set for them)

    const groupsAV = (this.showing === 'movies' ? groupsV : groupsA)
    const countAV  = (this.showing === 'movies' ? nVideo  : nAudio)


    for (const [orig, rank2file] of Object.entries(mapper)) {
      if (!(orig in groupsAV)) {
        /* eslint-disable-next-line no-continue */
        continue
      }

      const kv = {
        SRC: [],
      }

      // ksort(rank2file) // xxx ?

      // NOTE: rank2file is a sparse, numerical keyed hashmap, _not_ an array
      if (0 in rank2file) {
        /* eslint-disable-next-line prefer-destructuring */
        kv.POSTER = rank2file[0]
      } else if (1 in rank2file) {
        /* eslint-disable-next-line prefer-destructuring */
        kv.POSTER = rank2file[1]
      } else {
        // ugh, this is terrible -- try to find files named 'FILE.png' that correspond
        // to mp3/ogg files that aren't otherwise found above.  This is so we can group the
        // waveforms PNGs (and, BTW _not_ spectrogram PNG) into the A/V file group.
        for (const [keykey, valval] of Object.entries(rank2file)) {
          if (parseInt(keykey, 10)) {
            const png = valval.replace(/(\.m4a|\.ogg|_sample\.mp3|\.mp3)$/i, '.png')
            if (png !== valval  &&  png in pngs)
              kv.POSTER = png
          }
        }
      }

      if (orig in autoplay)
        kv.AUTOPLAY = false // filter_var(autoplay.orig, FILTER_VALIDATE_BOOLEAN) // xxx


      for (const [rank, src] of Object.entries(rank2file)) {
        if (parseInt(rank, 10)  &&  rank > 1) {
          // not a POSTER or TITLE!
          if ((this.showing === 'movies'  &&   audio[src])  ||
              (this.showing !== 'movies'  &&  !audio[src])) {
            /* eslint-disable-next-line no-continue */
            continue
          }

          kv.SRC.push(src)
        }
      }

      if (!kv.SRC.length) {
        /* eslint-disable-next-line no-continue */
        continue // no derivatives in video (or audio) group of files, likely!
      }


      kv.TITLE = ('TITLE' in rank2file
        ? rank2file.TITLE
        : orig.split('/')
          .pop(/* <= basename() equiv */)
          .replace(/\.[^.]+$/, ''/* axe suffix */)
          .replace(/_512kb$/, '')
          .replace(/_/g, ' ')
      )

      kv.ORIG = orig

      if (orig in artists)
        kv.ARTIST = artists[orig]

      if ('LENGTH' in rank2file) {
        kv.LENGTH = rank2file.LENGTH
      } else {
        // this *could* get a bit expensive esp. for items w/ tons of videos!!
        // xxxx should cache this & entire HTML from /details/ page for X mins...
        kv.LENGTH = this.runtime(mdapi, countAV, orig)
      }
      if ('HD' in rank2file)
        kv.HD = rank2file.HD
      if (FOURK  &&  '4K' in rank2file)
        kv['4K'] = rank2file['4K']

      this.groups.push(kv)
    }

    this.captions()

    if (DEBUG)
      log(this)


    if (this.showing === 'audio') {
      // make sure if user can see *BOTH* (full song) MP3 and 'MP3 Sample' files,
      // we put full song first! (NOTE: which *sometimes* CAN be original for some wcd...) // chexxx
      for (const group of this.groups) {
        let sample_idx = false
        let mp3 = false
        for (const [idx, src] of Object.entries(group.SRC)) {
          if (src.endsWith('_sample.mp3'))
            sample_idx = idx
          else if (src.endsWith('.mp3'))
            mp3 = true
        }
        if (mp3  &&  sample_idx !== false)
          group.SRC.splice(sample_idx, 1) // logically delete array element at sample_idx
      }
    }
  } // constructor() end


  /**
   * Aids filtering out MDAPI files.
   * Includes some adjustments we need to ensure in 2+ passes.
   *
   * @param {object} fi -- @warn elements can (rarely) be changed/fixed by this method
   */
  filter(fi) {
    const filename = fi.name
    const suffixLC = filename.substr(1 + filename.lastIndexOf('.')).toLowerCase()
    const formatLC = fi.format.toLowerCase()

    if (IGNORES.includes(formatLC)  ||  filename === THUMB_NAME)
      return [] // ignore these files altogether

    // do I like this next special case?  no i don't, but reality...
    if (suffixLC === 'mp3'  &&  (
      fi.original === `${this.identifier}_segments.json`  ||
      fi.original === `${this.identifier}_segments.xml`
    )) {
      // pretend this mp3 is an original and not "derived from" a JSON/XML file...
      this.haxLP = true
      /* eslint-disable-next-line no-param-reassign */
      delete fi.original
      /* eslint-disable-next-line no-param-reassign */
      fi.source = 'original'
    }

    if (typeof fi.original === 'string'  &&  fi.original.endsWith('.torrent')) {
      // pretend this files is an original and not "derived from" a torrent
      // eg: /details/DavidBrombergQuintet_2018-10-20_WestcottTheater
      /* eslint-disable-next-line no-param-reassign */
      delete fi.original
      /* eslint-disable-next-line no-param-reassign */
      fi.source = 'original'
    }


    if (suffixLC === 'vtt') {
      this.vtts[filename] = 1 // save for later
      return [] // (and otherwise ignore)
    }

    if (suffixLC === 'srt') {
      this.srts[filename] = 1 // save for later
      return [] // (and otherwise ignore)
    }


    const rank = PLAYABLES[formatLC]
    if (suffixLC === 'mp3'  &&  !rank) {
      // OK some items get super specific on the bitrates, like "32Kbps MP3" eg:
      //    /details/Dragnet_OTR
      // so for them, let's pretend they are like less-preferred MP3 <format>
      // so they'll actually show up in the A/V player, etc....
      return [fi, '64kbps mp3', suffixLC] // xxx need to return and assign fi
    }

    return [fi, formatLC, suffixLC] // xxx need to return and assign fi
  }


  /**
   * Returns and sets various elements for a JS-based A/V playlist to be added into item.
   *
   * @param {object} config - @see play8.js for expected keys/vals
   * @param {boolean} ios - does client seem like they are iOS or not?
   * @param {string} poster - if empty array, tries to update to array w/ poster image if possible
   * @returns {object[]}
   */
  jwplaylist(config, ios = false, poster = []) {
    const ret = []

    const prefix = `https://archive.org/download/${this.identifier}/` // xxx https://archive.org
    // const ffox = (navigator.userAgent.indexOf('Firefox/') > 0) // xxx

    let ranks = [
      'audio/mpeg',
      'mp3',
      'audio/ogg',
      'ogg',
      'video/h264',
      'mp4',
      'video/ogg',
      'ogg',
      '', // unknown/deprioritized -- eg: '.webm' files
    ]

    // safari not happy w/ ogg audio source listed before mp3 audio...
    // so we'll sort the 'sources' by explicit preference.
    // *BUT* we want chrome to prefer ogg first not mp3 (for VERY long audio)
    // because it can jump ahead into unbuffered audio!
    if (navigator.userAgent.indexOf('Chrome/') > 0) {
      // chrome
      if (cgiarg('jest')) { // xxx
        // For integration testing - when in chrome headless mode, it wont play .mp4
        // So, ensure ogg/ogv A/V files are listed first in sources.
        ranks = [
          'audio/ogg',
          'ogg',
          'audio/mpeg',
          'mp3',
          'video/ogg',
          'ogg',
          'video/h264',
          'mp4',
          '',
        ]
      } else {
        ranks = [
          'audio/ogg',
          'ogg',
          'audio/mpeg',
          'mp3',
          'video/h264',
          'mp4',
          'video/ogg',
          'ogg',
          '',
        ]
      }
    } else if (navigator.userAgent.indexOf(' Iceweasel/') > 0) {
      // debian firefox ( archive.org/post/411428 ) - try ogg first, always
      ranks = [
        'audio/ogg',
        'ogg',
        'audio/mpeg',
        'mp3',
        'video/ogg',
        'ogg',
        'video/h264',
        'mp4',
        '',
      ]
    }
    ranks.push('video/x-flv')
    let i = 0
    /* eslint-disable-next-line no-plusplus */
    ranks = Object.fromEntries(ranks.map((k) => [k, i++])) // array_flip()

    for (const group of Object.values(this.groups)) {
      // try to make the new player show as much as it can
      const map = {
        sources: [],
        title: friendly_truncate(group.TITLE, 100, true),
      }

      if ('ORIG' in group) {
        map.orig = group.ORIG
        if ('ARTIST' in group)
          map.artist = group.ARTIST
      }

      if ('AUTOPLAY' in group)
        map.autoplay = group.AUTOPLAY


      const tmp = cgiarg('poster') // xxx
      if (tmp) {
        // no, i have no freaking idea why the http:// *passed in* is being turned to http:/
        // sometimes, eg:
        // https://archive.org/embed/drake_saga1_shots/MVI_3985.AVI&poster=https://archive.org/images/map.png
        map.image = this.url(tmp.replace(/^(https?):\/([^/])/, '$1://$2'))
      } else if ((this.showing === 'movies'  &&  'POSTER' in group)  ||
                 (this.showing === 'audio'  &&  'POSTER' in group)) {
        map.image = this.url(prefix + group.POSTER)
        if (!poster.length)
          poster.push(this.url(prefix + group.POSTER))
      }

      if ('LENGTH' in group)
        map.duration = group.LENGTH

      if ('HD' in group)
        group.SRC.push(group.HD) // chexxx


      const used = {}

      for (const src of group.SRC) {
        // NOTE: watch out for SRC like:
        //   WRC_20010911_110000_Today/WRC_20010911_110000_Today.mp4?t=5415/5440
        //   Got me Wrong?.mp3
        // and still have it properly detect the suffix and 'type'
        const suffixLC = (
          (src.match(/(\.(mp3|ogg|m4a|ogv|mp4|mpeg4|m4v|mov|flv|swf))$/i)  || []).pop()  ||
          (src.match(/(\.(mp3|ogg|m4a|ogv|mp4|mpeg4|m4v|mov|flv|swf))\?/i) || []).pop()  ||
          (src.match(/(\.(mp3|ogg|m4a|ogv|mp4|mpeg4|m4v|mov|flv|swf))&/i)  || []).pop()  ||
          ''
        ).toLowerCase()

        // shouldn't *have* to do this, but ifone 1st gen seems to get tripped
        // up otherwise...
        if (ios  &&  (suffixLC === 'ogg' || suffixLC === 'ogv')) {
          /* eslint-disable-next-line no-continue */
          continue
        }

        let type = ''
        let defaultWH = [640, 480]
        // avoid jwplayer v8+ bug w/ wack filename chars like '?' - be explicit about 'type' arg
        switch (suffixLC) {
        case 'mp3':    type = 'mp3';                         break
        case 'ogg':    type = 'ogg';                         break
        case 'm4a':    type = 'aac';                         break
        case 'ogv':    type = 'ogg'; defaultWH = [400, 300]; break
        case 'mp4':    type = 'mp4';                         break
        case 'mpeg4':  type = 'mp4';                         break
        case 'm4v':    type = 'mp4';                         break
        case 'mov':    type = 'mp4';                         break
        case 'flv':    type = 'video/x-flv';                 break
        case 'swf':    type = 'video/x-flv';                 break
        default:       type = ''
        }

        const width  = (src in this.widths  ? this.widths[src]  : defaultWH[0])
        const height = (src in this.heights ? this.heights[src] : defaultWH[1])

        const level = {
          file: this.url(prefix + src),
          width,
          height,
        }
        if (type !== '')
          level.type = type

        if (this.showing === 'movies')
          level.label = `${height}p${height >= 720 ? ' HD' : ''}` // (explicitly needed for jwplayer v6.8+)


        // When two files are *both* the same *type* and *height*,
        // we only wanna pick the *first* (best) .mp4 for example, when there are
        // 2+.  eg: /details/dmbb00309   which has .mp4 (deriv) and .mpeg4 (orig)
        if (type  &&  parseInt(height, 10) === parseInt(used[type], 10)) {
          /* eslint-disable-next-line no-continue */
          continue
        }
        used[type] = height

        map.sources.push(level)
        if (this.showing === 'movies'  &&  'image' in map) {
          // setup a map of thumbnails for hovering over scrubber showing preview image
          map.tracks = [{
            kind: 'thumbnails',
            file: `${map.image.replace('/download/', '/stream/').replace('%2F', '/')}?vtt=vtt.vtt`,
          }]
        }

        if (src in this.durations) // chexxx
          map.duration = Math.max(map.duration, this.durations[src])
      }

      /* xxx usort($map['sources'], function ($a, $b) use ($ranks) {
        return ($ranks[$a['type']] > $ranks[$b['type']])
      }) */

      log(config.tv) // for lint, given ^ and v

      /* xxx if (isset(this.captions[$idx])) {
        foreach (this.captions[$idx] as $lang => $srtfile) {
          if (config.tv  &&  preg_match('/^\d{10}\.srt$/', basename($srtfile)))
            continue; // omit any (rare) TVNRT SRT tracks that are just minute-by-minute related

          $map['tracks'][] = ['file' => $srtfile, 'label' => $lang, 'kind' => 'subtitles'];
        }
      } */

      ret.push(map)
    }

    // log(ret)
    return ret
  } // end jwplaylist()


  runtime(mdapi, countAV, orig) {
    this.xxx = `implement runtime() ${countAV ? typeof mdapi : typeof orig}`
    return -1
  }

  captions() {
    this.xxx = 'implement captions()'
  }

  url(str) { this.xxx = 'sort me out '; return str }
}


export default Player
