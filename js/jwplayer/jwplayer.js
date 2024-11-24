/**
 * ES Module wrapper for jwplayer
 */

// can toggle pairs of lines (if dev tree has debug version):

import '../../jw/8/jwplayer.js'

const jwbase = '/jw/8'

// import '../../jw/8/src/bin-debug/jwplayer.js'

// const jwbase = '/jw/8/src/bin-debug'


const { jwplayer } = window

export { jwplayer, jwbase }
export default jwplayer
