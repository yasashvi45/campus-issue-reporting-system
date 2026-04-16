// Main App Logic
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  
  if (user) {
    // Update UI with user info
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-name-dropdown').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email-dropdown').forEach(el => el.textContent = user.email);
    document.querySelectorAll('.avatar-img').forEach(el => {
      if (user.photo) el.src = user.photo;
    });
  }

  // Handle Logout (if there's a specific button with this ID)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }
});

function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
