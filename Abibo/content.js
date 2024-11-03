chrome.storage.sync.get(['username', 'password'], function(data) {
  if (data.username && data.password) {
    document.getElementById('username').value = data.username;
    document.getElementById('password').value = data.password;
    document.getElementById('Login').click();
  }
});