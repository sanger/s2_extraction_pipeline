define([], function () {
  "use strict";
  return function(partial) {
    var html = $('');
    var viewer_url = '/s2_admin';
    $(document).on('click', "a[href=#viewLabware]", function() {
      window.location.href = viewer_url;
    });
    $("a[href=#viewLabware]").attr('href', viewer_url);
    return {
      view: html,
      events: {}
    };
  }
});
