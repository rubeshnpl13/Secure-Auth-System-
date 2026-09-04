import { getCurrentUser, logout } from './api.js';

const emailElement = document.querySelector('#user-email');
const idElement = document.querySelector('#user-id');
const createdAtElement = document.querySelector('#user-created-at');
const logoutButton = document.querySelector('#logout-button');

async function loadDashboard() {
  try {
    const { user } = await getCurrentUser();

    emailElement.textContent = user.email;
    idElement.textContent = user.id;
    createdAtElement.textContent = new Date(user.createdAt).toLocaleString();
  } catch {
    window.location.replace('/');
  }
}

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = 'Signing out…';

  try {
    await logout();
  } finally {
    window.location.replace('/');
  }
});

loadDashboard();
