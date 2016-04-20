define([
  "text!app-components/admin/_resetRack.html",
  "lib/pubsub"
], function (resetRack, PubSub) {
  "use strict";

  var template= _.template(resetRack);

  return function(context) {
    var html = $(template(context));
    $("button", html).on("click", function() {
      if (!$(".barcodes", html).val().match(/^(\d*\n)*\d+$/)) {
        PubSub.publish("error.status.s2", this, {message: 'Incorrect input (needs to be a list of numbers delimited by newlines)'});
        return;
      }

      var barcodes = $(".barcodes", html).val().split(/\n/);
      _.each(barcodes, function(barcode)  {
        app.resetRackRoles(barcode);
      });
      PubSub.publish("message.status.s2", this, {message: 'Input correct. Processing list of barcodes (please wait...)'});
    });
    return {
      view: html,
      events: {}
    }
  };
});
