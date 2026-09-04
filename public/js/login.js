import { login } from './api.js';

const form = document.querySelector('#login-form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const message = document.querySelector('#form-message');
const submitButton = document.querySelector('#submit-button');

function setMessage(text, type = 'error') {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? 'Signing in…' : 'Sign in';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    setMessage('Enter your email address and password.');
    return;
  }

  try {
    setLoading(true);
    await login(email, password);
    window.location.assign('/dashboard.html');
  } catch (error) {
    setMessage(error.message);
  } finally {
    setLoading(false);
  }
});
