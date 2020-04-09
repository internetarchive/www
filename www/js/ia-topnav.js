import './build/@internetarchive/ia-topnav.js';
import URLSearchParams from './build/@ungap/url-search-params.js';

/**
 * Top nav component
 *
 * config attribute is required. Properties are:
 * username: used for user menu URL generation. Required.
 * screenName: used to display the user's screen name. Required.
 * eventCategory: Google Analytics event category. Optional.
 * baseUrl: domain used to build nav links. Optional.
 * waybackUrl: domain used to perform Wayback search. Optional.
 */

const params = new URLSearchParams(window.location.search);
const options = {
  username: '',
  screenName: '',
  eventCategory: 'MobileTopNav',
  baseUrl: 'archive.org',
  waybackUrl: 'web.archive.org',
};

params.forEach((val, key) => {
  options[key] = val;
});

document.body.innerHTML = `<ia-topnav config='${JSON.stringify(options)}'></ia-topnav>`;
