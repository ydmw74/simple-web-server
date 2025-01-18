const form = document.getElementById('config-form');
const messageDiv = document.getElementById('message');
const appsListDiv = document.getElementById('apps-list');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const response = await fetch('/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(Object.fromEntries(formData))
  });
  const data = await response.json();
  if (response.ok) {
    messageDiv.textContent = data.message;
    messageDiv.style.color = 'green';
    renderAppsList();
  } else {
    messageDiv.textContent = `Error: ${data.errors.map(error => error.msg).join(', ')}`;
    messageDiv.style.color = 'red';
  }
  form.reset();
});

function renderAppsList() {
  appsListDiv.innerHTML = `
    <h2>Configured Apps</h2>
    <ul id="apps-list-ul"></ul>
  `;
  const appsListUl = document.getElementById('apps-list-ul');

  fetch('/config')
    .then(response => response.json())
    .then(data => {
      data.forEach(app => {
        const li = document.createElement('li');
        li.textContent = `IP: ${app.ip}, Port: ${app.port}, URI: ${app.uri}, Build Path: ${app.buildPath}`;
        appsListUl.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Error fetching apps list:', error);
    });
}

renderAppsList();
