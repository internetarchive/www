// Loads an external JS file and append it to the head, from:
// http://zcourts.com/2011/10/06/dynamically-requireinclude-a-javascript-file-into-a-page-and-be-notified-when-its-loaded
function require(file, callback, attrs = {}) {
  const head = document.getElementsByTagName('head')[0];
  const script = document.createElement('script');
  script.src = file;
  script.type = 'text/javascript';
  Object.keys(attrs).forEach((attr) => script.setAttribute(attr, attrs[attr]));
  // real browsers:
  script.onload = callback;
  // MSIE:
  script.onreadystatechange = function scriptLoadComplete() {
    if (script.readyState === 'complete')
      callback();
  };
  head.appendChild(script);
}

export default require;
