// deno-lint-ignore-file
/**
 * Natural sorts a javascript array, assuming each element is a hashmap, where we sort based
 * on the key/field name that is passed in
 *
 * @param {object} ary - array to sort
 * @param {string} sorter - keyname of each array element hashmap to sort by
 */
function sortnat(ary, sorter) {
  function natcmp(ain, bin) {
    // natural comparison
    // minified FROM http://sourcefrog.net/projects/natsort/natcompare.js
    /* eslint-disable */
    function isWhitespaceChar(B){var A;A=B.charCodeAt(0);if(A<=32){return true;}else{return false;}}function isDigitChar(B){var A;A=B.charCodeAt(0);if(A>=48&&A<=57){return true;}else{return false;}}function compareRight(E,B){var G=0;var F=0;var D=0;var C;var A;for(;;F++,D++){C=E.charAt(F);A=B.charAt(D);if(!isDigitChar(C)&&!isDigitChar(A)){return G;}else{if(!isDigitChar(C)){return -1;}else{if(!isDigitChar(A)){return +1;}else{if(C<A){if(G==0){G=-1;}}else{if(C>A){if(G==0){G=+1;}}else{if(C==0&&A==0){return G;}}}}}}}}function natcompare(I,H){var C=0,A=0;var D=0,B=0;var F,E;var G;while(true){D=B=0;F=I.charAt(C);E=H.charAt(A);while(isWhitespaceChar(F)||F=="0"){if(F=="0"){D++;}else{D=0;}F=I.charAt(++C);}while(isWhitespaceChar(E)||E=="0"){if(E=="0"){B++;}else{B=0;}E=H.charAt(++A);}if(isDigitChar(F)&&isDigitChar(E)){if((G=compareRight(I.substring(C),H.substring(A)))!=0){return G;}}if(F==0&&E==0){return D-B;}if(F<E){return -1;}else{if(F>E){return +1;}}++C;++A;}};
    /* eslint-enable */


    const sortkey = sorter.replace(/^[+-]/, '')
    const swap = (sorter !== sortkey)
    const a = (typeof ain[sortkey] === 'undefined' ? '' : ain[sortkey].toString())
    const b = (typeof bin[sortkey] === 'undefined' ? '' : bin[sortkey].toString())

    return (swap ? -1 : 1) * natcompare(a, b)
  }

  return ary.sort(natcmp)
}

export default sortnat

