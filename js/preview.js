function load_article() {
  // parsing current doc url from url parameter
  var arg = [];
  var pair=location.search.substring(1).split('&');
  for(var i=0;pair[i];i++) {
      var kv = pair[i].split('=');
      arg[kv[0]]=kv[1];
  }
  var url = decodeURIComponent(arg.url);
  var nodeNames = [];
  $.get(url, function(data){
    var html = $($.parseHTML(data)).find('article').html();
    if (typeof html === "undefined") {
      document.getElementById('preview').innerHTML = "Invalid: This page doesn't contain <article>";
      return;
    }
    document.getElementById('preview').innerHTML = html;
  });
}

document.addEventListener('DOMContentLoaded', load_article);