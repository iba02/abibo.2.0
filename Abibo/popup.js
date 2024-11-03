document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const environment = document.getElementById('environment').value;
  const group = document.getElementById('group').value;

  const credential = { username, password, environment, group };

  chrome.storage.sync.get({ credentialsList: [] }, function(data) {
    const credentialsList = data.credentialsList;
    credentialsList.push(credential);
    chrome.storage.sync.set({ credentialsList }, () => {
      console.log('Credentials saved');
      displayCredentials();
    });
  });
});

function displayCredentials() {
  chrome.storage.sync.get({ credentialsList: [] }, function(data) {
    const credentialsList = data.credentialsList;
    const groupedCredentials = groupBy(credentialsList, 'group');
    const credentialsListDiv = document.getElementById('credentialsList');
    credentialsListDiv.innerHTML = '';

    for (const group in groupedCredentials) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'credential-group';
      groupDiv.innerHTML = `<h2>${group} <button onclick="toggleGroup('${group}')">Toggle</button></h2>`;
      const groupContent = document.createElement('div');
      groupContent.id = `group-${group}`;
      groupContent.style.display = 'none';

      groupedCredentials[group].forEach((cred, index) => {
        const credDiv = document.createElement('div');
        credDiv.className = 'credential';
        credDiv.innerHTML = `
          <div>
            <p><strong>Username:</strong> ${cred.username}</p>
            <p><strong>Environment:</strong> ${cred.environment}</p>
          </div>
          <div>
            <button onclick="editCredential(${index})">Edit</button>
            <button onclick="deleteCredential(${index})">Delete</button>
            <button onclick="openInIncognito('${cred.username}', '${cred.password}', '${cred.environment}')">Open in Incognito</button>
          </div>
        `;
        groupContent.appendChild(credDiv);
      });

      groupDiv.appendChild(groupContent);
      credentialsListDiv.appendChild(groupDiv);
    }
  });
}

function groupBy(array, key) {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
}

function toggleGroup(group) {
  const groupContent = document.getElementById(`group-${group}`);
  groupContent.style.display = groupContent.style.display === 'none' ? 'block' : 'none';
}

function editCredential(index) {
  chrome.storage.sync.get({ credentialsList: [] }, function(data) {
    const credentialsList = data.credentialsList;
    const cred = credentialsList[index];
    document.getElementById('username').value = cred.username;
    document.getElementById('password').value = cred.password;
    document.getElementById('environment').value = cred.environment;
    document.getElementById('group').value = cred.group;

    credentialsList.splice(index, 1);
    chrome.storage.sync.set({ credentialsList }, displayCredentials);
  });
}

function deleteCredential(index) {
  chrome.storage.sync.get({ credentialsList: [] }, function(data) {
    const credentialsList = data.credentialsList;
    credentialsList.splice(index, 1);
    chrome.storage.sync.set({ credentialsList }, displayCredentials);
  });
}

function openInIncognito(username, password, environment) {
  const url = environment === 'production' ? 'https://login.salesforce.com' : 'https://test.salesforce.com';
  chrome.windows.create({
    url: url,
    incognito: true
  }, function(window) {
    // You can add further logic to handle login in the new incognito window
  });
}

document.getElementById('importButton').addEventListener('click', function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const credentials = JSON.parse(e.target.result);
      chrome.storage.sync.set({ credentialsList: credentials }, displayCredentials);
    };
    reader.readAsText(file);
  };
  input.click();
});

document.getElementById('exportButton').addEventListener('click', function() {
  chrome.storage.sync.get({ credentialsList: [] }, function(data) {
    const blob = new Blob([JSON.stringify(data.credentialsList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credentials.json';
    a.click();
    URL.revokeObjectURL(url);
  });
});

document.addEventListener('DOMContentLoaded', displayCredentials);
