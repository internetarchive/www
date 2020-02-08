/* eslint-disable semi */
class Message {
  /**
   * Renders a message to display while a resource is loading.
   *
   * @see loading-message.less
   *
   * @param {Object} props
   * @param {String} props.message
   * @return {String}
   */
  static LoadingMessage({ message = 'Loading' }) {
    return `<small class="loading-message">${message}</small>`
  }


  /**
   * Renders an error message.
   *
   * @param {Object} props
   * @param {String} props.errorMessage
   * @return {JSX.ElementClass}
   */
  static ErrorMessage({ errorMessage }) {
    return `<small>${errorMessage}</small>`
  }
}


export { Message as default }
