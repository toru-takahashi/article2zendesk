function load_profile() {
  chrome.storage.local.get({
    subdomain: subdomain,
    email: email,
    password: password
  },
  function(items) {
    console.log(items);
    var subdomain = items.subdomain;
    var email = items.email;
    var password = items.password;

    document.getElementById('subdomain').value = subdomain;
    document.getElementById('email').value = email;
  });
}

document.addEventListener('DOMContentLoaded', load_profile);
