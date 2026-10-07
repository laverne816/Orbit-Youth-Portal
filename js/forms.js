/**
 * ORBIT — Forms Module
 * Handles client-side validation for the contact and inquiry forms.
 * Inline accessible error states, no backend dependency, friendly confirmation banner.
 */

export function initContactForm() {
  const form = document.getElementById('orbit-contact-form') || document.getElementById('ubunye-contact-form');
  const successBanner = document.getElementById('contact-form-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let hasErrors = false;

    // Name validation
    const nameInput = document.getElementById('contact-name');
    const nameError = document.getElementById('name-error');
    if (nameInput && nameError) {
      if (!nameInput.value.trim()) {
        showError(nameInput, nameError, 'Please enter your full name.');
        hasErrors = true;
      } else {
        clearError(nameInput, nameError);
      }
    }

    // Email validation
    const emailInput = document.getElementById('contact-email');
    const emailError = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput && emailError) {
      if (!emailInput.value.trim()) {
        showError(emailInput, emailError, 'Email address is required.');
        hasErrors = true;
      } else if (!emailRegex.test(emailInput.value.trim())) {
        showError(emailInput, emailError, 'Please enter a valid email address.');
        hasErrors = true;
      } else {
        clearError(emailInput, emailError);
      }
    }

    // Subject validation
    const subjectInput = document.getElementById('contact-subject');
    const subjectError = document.getElementById('subject-error');
    if (subjectInput && subjectError) {
      if (!subjectInput.value.trim()) {
        showError(subjectInput, subjectError, 'Please enter a subject.');
        hasErrors = true;
      } else {
        clearError(subjectInput, subjectError);
      }
    }

    // Message validation
    const messageInput = document.getElementById('contact-message');
    const messageError = document.getElementById('message-error');
    if (messageInput && messageError) {
      if (!messageInput.value.trim() || messageInput.value.trim().length < 15) {
        showError(messageInput, messageError, 'Please write a message with at least 15 characters.');
        hasErrors = true;
      } else {
        clearError(messageInput, messageError);
      }
    }

    if (hasErrors) {
      // Focus first erroneous input
      const firstError = form.querySelector('.form-control[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return;
    }

    // Success State
    form.reset();
    form.style.display = 'none';
    if (successBanner) {
      successBanner.classList.add('visible');
      successBanner.focus();
    }
  });

  function showError(input, errorEl, message) {
    input.setAttribute('aria-invalid', 'true');
    input.style.borderColor = 'var(--accent-crimson)';
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearError(input, errorEl) {
    input.removeAttribute('aria-invalid');
    input.style.borderColor = '';
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}
