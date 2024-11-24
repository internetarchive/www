/**
 * Gets MDAPI for given @id and invokes @callback when MDAPI results return
 *
 * @param {string} id  item identifier
 * @param {string} part  optional - eg: 'metadata' or 'files'
 */
async function get(id, part = '') {
  const local = typeof window !== 'undefined' && globalThis.navigator.onLine === false
  const url = (local
    ? `http://localhost:5555/json/${id}.json`
    : `https://archive.org/metadata/${id}${part ? `/${part}` : ''}`
  )

  // xxx cant include credentials/cookies due to CORS blocking av.dev.archive.org ...
  const response = await fetch(url) // , (local ? {} : { credentials: 'include' }))
  return response.json()
}

export default get
