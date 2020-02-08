/* eslint-disable semi */
// (adapted) from http://www.queness.com/code-snippet/6853/center-an-element-on-the-screen-using-jquery
// then you can use it like:
//      $("#gridmini").center()

// eslint-disable-next-line import/no-named-as-default
import $ from './jquery.js'
import log from './log.js'
import ios from './ios.js'


// eslint-disable-next-line  no-param-reassign
$.fn.center = function jquery_extension_center() {
  const myheight = $(this).innerHeight()

  log('myheight', myheight)
  log('mywidth', this.width())
  log(
    'w.height', $(window).height(),
    'w.width', $(window).width(),
    'w.scrollTop', $(window).scrollTop(),
    'w.scrollLeft', $(window).scrollLeft(),
  )


  let top
  let left
  if (ios) {
    const vpW = window.innerWidth
    const vpH = window.innerHeight

    log('vpH', vpH)
    log('vpW', vpW)

    top  = ((vpH -     myheight) / 2)  +  $(window).scrollTop()
    left = ((vpW - this.width()) / 2)  +  $(window).scrollLeft()
  } else {
    top  = ($(window).height() - myheight) / 2
    left = ($(window).width()  - this.width()) / 2
  }

  // for small viewports like iphone, when centering popups, ensure minimally +20px
  top  = Math.max(20, top)
  left = Math.max(20, left)

  this.css({
    position: (ios ? 'absolute' : 'fixed'),
    display:  'block',
    top,
    left,
  })

  return this
}
