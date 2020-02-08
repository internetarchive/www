/* eslint-disable semi */
const paramsToJSON = () => {
  const params = window.location.search.substring(1)
  const json = {}

  if (params.length > 0) {
    params.split('&').forEach((param) => {
      const [key, value] = param.split('=')
      json[key] = decodeURIComponent(value)
    })
  }

  return json
}

export default paramsToJSON
