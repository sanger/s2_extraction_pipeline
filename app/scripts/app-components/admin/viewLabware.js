define([], function () {
  "use strict";
  return function(partial) {
    var html = $('');

    $(document).ready(function() {
      $("a[href=#viewLabware]").click(function() {
        window.location.href = '/s2_admin';
      });
    });
    return {
      view: html,
      events: {}
    };
  }
});
