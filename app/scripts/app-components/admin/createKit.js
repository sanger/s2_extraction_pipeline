define([
  "text!app-components/admin/_createKit.html"
], function (partialKit) {
  "use strict";

  var template= _.template(partialKit);

  function getAliquotType(str) {
    if (str.match(/DNA/) && str.match(/RNA/)) {
      return "DNA & RNA";
    }
    if (str.match(/DNA/)) {
      return "DNA";
    }
    if (str.match(/RNA/)) {
      return "RNA";
    }
  }


  return function(context) {
    var html = $(template(context));

    $("button", html).on("click", function() {
      var barcode = $(".new-barcode input", html).val(),
          process = $(".process select", html).val(),
          aliquot = getAliquotType(process),
          expires = $(".expires input", html).val(),
          amount = $(".amount input", html).val();
      app.createKit(barcode, process, aliquot, expires, amount);
    });
    return {
      view: html,
      events: {}
    }
  };
});
