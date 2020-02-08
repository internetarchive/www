/* eslint-disable semi */
// $form, url, selector, AJS, element, conf, $element

export default ({
  $form,
  url,
  selector,
  AJS,
  element,
  conf,
}) => {
  const callbacks = {
    success(result) {
      if ($.cookie('logged-in-user') !== null) {
        // SUCCESS!
        // We are going to hide the login modal now, and need
        // to proceed only *after* the modal animation is done
        // and modal is gone.  So setup listener now, *then* hide.
        // Once login modal is gone, remove the modal, and
        // invoke the originally intended modal in fresh environment!
        $(selector).on('hidden.bs.modal', () => {
          $(selector).remove()
          AJS.modal_go(element, { ...conf, postLogin: true }) // invoke original modal!
        })
        $(document.body).removeClass('blurry')
        $(selector).modal('hide')
      } else if (result.status !== 'ok') {
        // This should never be called because we're returning HTTP status
        // 401 when unauthorized for any reason
        if (result.status === 'bad_login')
          $('.reset-password').hide()

        $('.password-error').html(result.message)
      }
    },
    error(jqXHR) {
      // Handle error, get message, if any
      const result = jqXHR.responseJSON
      $('.reset-password').hide()
      if (!result)
        $('.password-error').text("Whoops! Something didn't work quite right. Please try again in a bit.")
      else
        $('.password-error').html(result.message)
    },
  }

  $form.on('submit', () => {
    const keyvals = {}
    const { success, error } = callbacks

    $form.find('input').each((k, v) => {
      if ($(v).attr('name').length)
        keyvals[$(v).attr('name')] = $(v).val()
    })

    keyvals.submit_by_js = 'true'
    $form.find('.alert').remove()

    $.ajax(url, {
      type: 'POST',
      data: keyvals,
      success,
      error,
    })

    return false
  })
}
