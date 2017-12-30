function save_profile() {
  var subdomain = document.getElementById('subdomain').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  chrome.storage.local.set({
    subdomain: subdomain,
    email: email,
    password: password
  },
  function() {
    document.getElementById('status').textContent = "Profile saved.";
  });
}

function load_profile() {
  document.getElementById('save').addEventListener('click', save_profile);
  chrome.storage.local.get(["subdomain", "email", "password"],
  function(items) {
    if(items.subdomain.length === 0) {
      document.getElementById('subdomain').value = '';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
    } else {
      document.getElementById('subdomain').value = items.subdomain;
      document.getElementById('email').value = items.email;
      document.getElementById('password').value = items.password;
    }
  });
}

document.addEventListener('DOMContentLoaded', load_profile);
