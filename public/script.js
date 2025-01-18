const form = document.getElementById('config-form');
const messageDiv = document.getElementById('message');
const appsListDiv = document.getElementById('apps-list');
const addBtn = document.getElementById('add-btn');
const editBtn = document.getElementById('edit-btn');

let editingApp = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const response = await fetch('/config', {
    method: editingApp ? 'PUT' : 'POST',
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
    resetForm();
  } else {
    messageDiv.textContent = `Error: ${data.errors.map(error => error.msg).join(', ')}`;
    messageDiv.style.color = 'red';
  }
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
        li.textContent = app.name;
        li.addEventListener('click', () => {
          editingApp = app;
          populateForm(app);
          addBtn.disabled = true;
          editBtn.disabled = false;
        });
        appsListUl.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Error fetching apps list:', error);
    });
}

function populateForm(app) {
  form.name.value = app.name;
  form.ip.value = app.ip;
  form.port.value = app.port;
  form.uri.value = app.uri;
  form.buildPath.value = app.buildPath;
}

function resetForm() {
  form.reset();
  editingApp = null;
  addBtn.disabled = false;
  editBtn.disabled = true;
}

renderAppsList();
