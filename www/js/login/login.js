/* eslint-disable semi, func-names, no-param-reassign */
/**
 * Wire up login form
 */
document.addEventListener('DOMContentLoaded', () => {
  function LoginSignup() {
    return {
      addEvent: (el, type, handler) => {
        if (el.attachEvent) el.attachEvent(`on, ${type}, ${handler}`)
        else el.addEventListener(type, handler)
      },

      /**
       * Setup login form submit handler
       */
      setupLoginFormsSubmitEvent: function setupLoginFormsSubmitEvent() {
        const loginForm = document.getElementsByClassName('login-form')[0]
        if (!loginForm)
          return

        this.addEvent(loginForm, 'submit', () => {
          event.preventDefault()

          const usernameElement = loginForm.getElementsByClassName('input-email')[0]
          const usernameErrorElement = loginForm.getElementsByClassName('username-error')[0]
          // Not called if HTML5 validation
          if (usernameElement.value === '') {
            usernameErrorElement.innerHTML = 'Please enter email address'
            usernameElement.classList.add('error-field')
            return
          }

          const passwordElement = loginForm.getElementsByClassName('input-password')[0]
          const passwordErrorElement = loginForm.getElementsByClassName('password-error')[0]
          const resetPasswordElement = loginForm.getElementsByClassName('reset-password')[0]
          // Not called if HTML5 validation
          if (passwordElement.value === '') {
            passwordErrorElement.innerHTML = 'Please enter password'
            passwordElement.classList.add('error-field')
            resetPasswordElement.classList.add('hidden')
            return
          }

          const baseUrl = window.location.origin
          const refererElement = loginForm.querySelector('.login-referer')
          const { remember } = loginForm.querySelector('input[type="checkbox"]')
          const loginSubmit = loginForm.querySelector('.input-submit')

          const formData = new FormData()
          formData.append('username', usernameElement.value)
          formData.append('password', passwordElement.value)
          formData.append('remember', { remember }.value)
          formData.append('referer', refererElement.value)
          formData.append('login', true)
          formData.append('submit_by_js', true)

          const xhr = new XMLHttpRequest()
          xhr.open('POST', loginForm.action, true)
          loginSubmit.setAttribute('disabled', 'disabled')

          xhr.onreadystatechange = () => {
            //  Handle Http status 200 and 401 Unauthorized
            if (xhr.readyState !== 4)
              return

            const response = JSON.parse(xhr.responseText)
            if (response.status === 'ok') {
              window.location.href = `${response.referer}`
            } else {
              loginSubmit.removeAttribute('disabled')
              // See status constants in www/common/Account.inc
              const errorFlag = response.status
              if (errorFlag === 'bad_login') {
                passwordErrorElement.innerHTML = response.message
                resetPasswordElement.classList.add('hidden')
              } else if (errorFlag === 'account_locked') {
                passwordErrorElement.innerHTML = response.message
                resetPasswordElement.classList.add('hidden')
              } else if (errorFlag === 'account_not_verified') {
                window.location.href =
                `${baseUrl}/account/login?status=unverified&t=${response.resend_token}`
              }
            }
          }
          xhr.send(formData)
        })
      },

      /**
       * Setup validation of login form
       */
      setupLoginFormsValidation: function setupLoginFormsValidation() {
        const that = this

        const loginForm = document.getElementsByClassName('login-form')[0]
        if (!loginForm)
          return

        const usernameInput = loginForm.getElementsByClassName('input-email')[0]
        const passwordInput = loginForm.getElementsByClassName('input-password')[0]
        const passwordErrorElement = loginForm.getElementsByClassName('password-error')[0]
        if (usernameInput) {
          this.addEvent(usernameInput, 'focus', function () {
            that.hideErrorMessage(this, passwordErrorElement)
          })
        }
        if (passwordInput) {
          this.addEvent(passwordInput, 'focus', function () {
            that.hideErrorMessage(this, passwordErrorElement)
          })
        }
      },

      /**
       * Show password toggle icon, and handler
       */
      setupPasswordTypeToggle: function setupPasswordTypeToggle() {
        const baseUrl = window.location.origin
        const passwordToggle = document.getElementsByClassName('password_icon')[0]
        if (!passwordToggle)
          return

        passwordToggle.src = `${window.location.origin}/images/eye-crossed.svg`
        passwordToggle.alt = 'View text'

        this.addEvent(passwordToggle, 'click', function () {
          const element = document.getElementsByClassName('input-password')[0]
          if (element.type === 'password') {
            element.type = 'text'
            this.src = `${baseUrl}/images/eye.svg`
            this.alt = 'View text'
          } else {
            element.type = 'password'
            this.src = `${baseUrl}/images/eye-crossed.svg`
            this.alt = 'Hide text'
          }
        })
      },

      /**
       * show error message
       */
      showErrorMessage: function showErrorMessage(
          response,
          errorFieldSpan,
          inputName,
          inputField,
          loader,
      ) {
        if (!response)
          return

        errorFieldSpan.innerHTML = response.message
        inputField.classList.add('error-field')
        loader.style.backgroundImage = ''

        const loaderSignup = document.getElementsByClassName('loader-img-signup')[0]
        if (!loaderSignup)
          return

        loaderSignup.style.backgroundImage = ''

        const baseUrl = window.location.origin
        const proposedScreenname = document.getElementsByClassName('proposed-screenname')[0]
        if (!proposedScreenname)
          return

        this.addEvent(proposedScreenname, 'click', function () {
          const newScreenname = this.getAttribute('screenname')

          if (inputField.name === 'screenname') {
            inputField.value = newScreenname
            inputField.classList.remove('error-field')
            errorFieldSpan.innerHTML = ''
            loader.style.backgroundImage = `url(${baseUrl}/images/check_green.svg)`
          }
        })
      },

      /**
       * Hide error message
       */
      hideErrorMessage: function hideErrorMessage(element, errorElement, loader = null) {
        if (!element)
          return

        if (loader)
          loader.style.backgroundImage = ''

        if (errorElement)
          errorElement.textContent = ''

        element.classList.remove('error-field')

        // Always unhide "Forgot password?"
        const resetPasswordElement = document.getElementsByClassName('reset-password')[0]
        if (resetPasswordElement)
          resetPasswordElement.classList.remove('hidden')
      },

      /**
       * Show/hide cookie warning
       */
      showCookieWarning: function showCookieWarning() {
        const cookieWarning = document.getElementsByClassName('cookie-warning')[0]
        const submitButton = document.getElementsByClassName('btn-submit')[0]
        const inputEmail = document.getElementsByClassName('input-email')[0]
        const inputPassword = document.getElementsByClassName('input-password')[0]
        const inputCheckbox = document.getElementsByClassName('input-checkbox')[0]
        const passwordToggle = document.getElementsByClassName('password_icon')[0]

        if (!cookieWarning || !submitButton)
          return

        if (navigator.cookieEnabled) {
          cookieWarning.classList.add('hidden')
          submitButton.disabled = false
          inputEmail.disabled = false
          inputPassword.disabled = false
          inputCheckbox.disabled = false
          passwordToggle.hidden = false
        } else {
          cookieWarning.classList.remove('hidden')
          submitButton.disabled = true
          inputEmail.disabled = true
          inputPassword.disabled = true
          inputCheckbox.disabled = true
          passwordToggle.hidden = true
        }
      },
    }
  }

  const ls = new LoginSignup()
  ls.setupLoginFormsSubmitEvent()
  ls.setupLoginFormsValidation()
  ls.setupPasswordTypeToggle()
  ls.showCookieWarning()
})
