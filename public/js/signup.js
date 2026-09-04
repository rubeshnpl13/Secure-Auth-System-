import { signup } from './api.js';

const form = document.querySelector('#signup-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const confirmPasswordInput = document.querySelector('#confirm-password');
const message = document.querySelector('#form-message');
const submitButton = document.querySelector('#submit-button');

function setMessage(text, type = 'error') {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Creating account…' : 'Create account';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!email || !password || !confirmPassword) {
    setMessage('Complete all fields.');
    return;
  }

  if (password !== confirmPassword) {
    setMessage('Passwords do not match.');
    return;
  }

  if (password.length < 12) {
    setMessage('Password must be at least 12 characters.');
    return;
  }

  try {
    setLoading(true);
    const result = await signup(email, password);

    setMessage(result.message, 'success');
    form.reset();

    window.setTimeout(() => {
      window.location.assign('/');
    }, 1_500);
  } catch (error) {
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
});
