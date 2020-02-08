/**
 * Wire up forms for disability verification via third-part providers
 */

/* eslint-disable  semi */
/* eslint-disable  no-alert */
/* eslint-disable  no-console */

// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import log from '../util/log.js'

/**
 * Get form field value or empty string
 */
function getFieldValue(context, selector) {
  const field = context.querySelector(selector)
  return field ? field.value : ''
}

/**
 * Setup disability eligibility forms
 */
function setUpDisabilityEligibility() {
  log('setUpDisabilityEligibility()')
  Array.from(document.querySelectorAll('.js-disability-eligibility')).forEach((form) => {
    const type = form.dataset.disabilityEligibilityType
    form.addEventListener('submit', (event) => {
      const password = getFieldValue(form, '.disability-eligibility-password')
      const token = getFieldValue(form, '.disability-eligibility-token')
      const dataToSend = {
        type,
        password,
        token,
      }

      // Allow for login to be sent too for debugging (though endpoint will only use
      // if user allowed)
      const loginRegexp = /\?.*login=([^&]+)/
      const matches = location.href.match(loginRegexp)
      if (matches) [, dataToSend.login] = matches

      // Add loading indicator after button
      const loadingIndicator = document.createElement('img')
      loadingIndicator.src = '/images/loading.gif'
      const buttonParent = form.querySelector('input[type="submit"]').parentNode
      buttonParent.appendChild(loadingIndicator)

      $.ajax({
        type: 'POST',
        url: '/services/disability_eligibility.php',
        dataType: 'json',
        data: dataToSend,
        success: (data) => {
          if (data.status === 'success') {
            alert('Success! Your eligibility has been verified.')
            return
          }
          if (data.message === 'not logged in') {
            alert('Please login first.')
            return
          }
          alert('Sorry. We could not verify your eligibility at this time.')
          console.log(`Verification error: ${data.status_code}, ${data.message}`)
        },
        error: (xhr, textStatus, errorThrown) => {
          alert('Sorry. We could not verify your eligibility at this time.')
          console.log(`Verification error: ${textStatus}, ${errorThrown}`)
        },
        complete: () => {
          loadingIndicator.remove()
        },
      })
      event.preventDefault()
    })
  })
}

// on DOM ready, setup
$(() => setUpDisabilityEligibility())


export { setUpDisabilityEligibility as default }
