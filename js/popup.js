function previewArticle(){
  window.chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.create({url: 'preview.html' + '?url=' + encodeURIComponent(tabs[0].url)});
  });
}

// For only docs.td.com and doc.fluentd.com
function validateUpdatedAt(zendesk, article_id, url, html){
  var last_modified;
  if (url.match(/docs.fluentd.com/)) {
    last_modified = Date.parse(html.match(/Last updated: (.+)/)[1]);
  } else if (url.match(/docs.treasuredata.com/)) {
    last_modified = Date.parse(html.match(/Last modified: (.+)/)[1]);
  }

  // Validate article updated_at and docs last_modified
  var request_url = 'https://' + zendesk.subdomain +'.zendesk.com/api/v2/help_center/en-us/articles/'+ article_id +'.json';
  $.ajax({
    url: request_url,
    type: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'Basic ' + window.btoa(zendesk.email + ':' + zendesk.password)
    },
    dataType: 'json'
  }).done(function(response) {
    if (Date.parse(response.article.updated_at) > last_modified) {
      document.getElementById('status').innerHTML = "Invalid: Zendesk Article (" + response.article.title + ") is newer than " + url;
      return false;
    }
  }).fail(function(response) {
    document.getElementById('status').innerHTML = response.status + ':' + response.responseText;
    return false;
  });

  return true;
}

function updateArticle(event){
  window.chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var url = tabs[0].url;
    var article_id = event.target.dataset.articleid;
    var request_url;
    $.get(url, function(data){
      var html = $($.parseHTML(data)).find('article').html();
      if (typeof html === "undefined") {
        document.getElementById('status').innerHTML = "Invalid: This page doesn't contain <article>";
        return;
      }
      chrome.storage.local.get(["subdomain", "email", "password"], function(zendesk) {
        if ($("#ignore_validation_check").prop("checked")) {
          if (validateUpdatedAt(zendesk, article_id, url, html)) return;
        }
        request_url = 'https://' + zendesk.subdomain +'.zendesk.com/api/v2/help_center/articles/' + article_id + '/translations/en-us.json';
        $.ajax({
          url: request_url,
          type: 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Basic ' + window.btoa(zendesk.email + ':' + zendesk.password)
          },
          dataType: 'json',
          data: JSON.stringify({ translation: {body: html} })
        }).done(function(response) {
          chrome.tabs.create({url: response.translation.html_url});
        }).fail(function(response) {
          document.getElementById('status').innerHTML = response.status + ':' + response.responseText;
        });
      });
    });
  });
}

function listArticles(){
  chrome.storage.local.get(["subdomain", "email", "password"], function(zendesk) {
    request_url = 'https://' + zendesk.subdomain +'.zendesk.com/api/v2/help_center/en-us/articles.json?sort_by=title';
    $.ajax({
      url: request_url,
      type: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Basic ' + window.btoa(zendesk.email + ':' + zendesk.password)
      },
      dataType: 'json'
    }).done(function(response) {
      document.getElementById('status').innerHTML = 'total articles: ' + response.articles.length;
      document.getElementById('contents_tbl').innerHTML = '';
      for ( var i=0; i<response.articles.length; i++ ) {
        var tr = document.createElement('TR');
        var td_num = document.createElement('TD');
        var td_id = document.createElement('TD');
        var td_title = document.createElement('TD');
        var td_button = document.createElement('TD');
        td_num.appendChild(document.createTextNode(i));
        td_id.appendChild(document.createTextNode(response.articles[i].id));
        td_title.appendChild(document.createTextNode(response.articles[i].title));

        var btn = document.createElement("BUTTON");
        btn.className = 'btn btn-default';
        btn.id = 'update_article_btn';
        btn.setAttribute('data-articleid', response.articles[i].id);
        btn.addEventListener('click', updateArticle);
        btn.textContent = 'Update';
        td_button.appendChild(btn);
        tr.appendChild(td_num);
        tr.appendChild(td_id);
        tr.appendChild(td_title);
        tr.appendChild(td_button);
        document.getElementById('contents_tbl').appendChild(tr);
      }
    }).fail(function(response) {
      document.getElementById('status').innerHTML = response.status + ':' + response.responseText;
    });
  });
}

function createArticle(event){
  var title = $("#article_title_form").val();
  if (title == '') {
    document.getElementById('status').innerHTML = "Invalid: Requires article title";
    return;
  }

  window.chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var url = tabs[0].url;
    var section_id = event.target.dataset.sectionid;
    var request_url;
    $.get(url, function(data){
      var html = $($.parseHTML(data)).find('article').html();
      if (typeof html === "undefined") {
        document.getElementById('status').innerHTML = "Invalid: This page doesn't contain <article>";
        return;
      }
      chrome.storage.local.get(["subdomain", "email", "password"], function(zendesk) {
        request_url = 'https://' + zendesk.subdomain +'.zendesk.com/api/v2/help_center/en-us/sections/' + section_id + '/articles.json';
        $.ajax({
          url: request_url,
          type: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Basic ' + window.btoa(zendesk.email + ':' + zendesk.password)
          },
          dataType: 'json',
          data: JSON.stringify({ article: {body: html, title: title, draft: true} })
        }).done(function(response) {
          chrome.tabs.create({url: response.article.html_url});
        }).fail(function(response) {
          document.getElementById('status').innerHTML = response.status + ':' + response.responseText;
        });
      });
    });
  });
}

function listSections(){
  chrome.storage.local.get(["subdomain", "email", "password"], function(zendesk) {
    request_url = 'https://' + zendesk.subdomain +'.zendesk.com/api/v2/help_center/en-us/sections.json';
    $.ajax({
      url: request_url,
      type: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Basic ' + window.btoa(zendesk.email + ':' + zendesk.password)
      },
      dataType: 'json'
    }).done(function(response) {
      document.getElementById('status').innerHTML = 'total sections: ' + response.sections.length;
      document.getElementById('contents_tbl').innerHTML = '';
      for ( var i=0; i<response.sections.length; i++ ) {
        var tr = document.createElement('TR');
        var td_num = document.createElement('TD');
        var td_id = document.createElement('TD');
        var td_title = document.createElement('TD');
        var td_button = document.createElement('TD');
        td_num.appendChild(document.createTextNode(i));
        td_id.appendChild(document.createTextNode(response.sections[i].id));
        td_title.appendChild(document.createTextNode(response.sections[i].name));

        var btn = document.createElement("BUTTON");
        btn.className = 'btn btn-default';
        btn.id = 'create_article_btn';
        btn.setAttribute('data-sectionid', response.sections[i].id);
        btn.addEventListener('click', createArticle);
        btn.textContent = 'New';
        td_button.appendChild(btn);
        tr.appendChild(td_num);
        tr.appendChild(td_id);
        tr.appendChild(td_title);
        tr.appendChild(td_button);
        document.getElementById('contents_tbl').appendChild(tr);
      }
    }).fail(function(response) {
      document.getElementById('status').innerHTML = response.status + ':' + response.responseText;
    });
  });
}

var zendesk_subdomain;
var zendesk_email;
var zendesk_password;

function load_profile() {
  document.getElementById('preview_btn').addEventListener('click', previewArticle);
  document.getElementById('list_articles_btn').addEventListener('click', listArticles);
  document.getElementById('list_sections_btn').addEventListener('click', listSections);

  chrome.storage.local.get(["subdomain", "email", "password"],
  function(items) {
    zendesk_subdomain = items.subdomain;
    zendesk_email = items.email;
    zendesk_password = items.password;

    document.getElementById('subdomain').innerText = zendesk_subdomain;
  });
}

document.addEventListener('DOMContentLoaded', load_profile);
