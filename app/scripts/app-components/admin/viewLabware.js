define([], function () {
  "use strict";
  return function(partial) {
    var html = $('');

    var viewer_url = '/s2_admin';
    $("a[href=#viewLabware]").attr('href', viewer_url);
    $(document).ready(function() {
      $("a[href=#viewLabware]").click(function() {
        window.location.href = viewer_url;
      });
    });
    return {
      view: html,
      events: {}
    };
  }
});
