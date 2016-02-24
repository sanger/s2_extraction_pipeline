define([
  "text!app-components/admin/_resetRack.html"
], function (resetRack) {
  "use strict";

  var template= _.template(resetRack);

  return function(context) {
    var html = $(template(context));
    $("button", html).on("click", function() {
      var barcodes = $(".barcodes", html).val().split(/\n/);
      _.each(barcodes, function(barcode)  {
        app.resetRackRoles(barcode);
      });
    });
    return {
      view: html,
      events: {}
    }
  };
});
