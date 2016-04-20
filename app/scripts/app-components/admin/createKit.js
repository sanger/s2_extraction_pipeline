define([
  "text!app-components/admin/_createKit.html",
  "lib/pubsub"
], function (partialKit, PubSub) {
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
      if (!barcode.match(/^\d+$/)) {
        PubSub.publish("error.status.s2", this, {message: "Incorrect barcode (must be a number without any other extra character, but was <"+barcode+">" });
        return;
      }
      app.createKit(barcode, process, aliquot, expires, amount);
      PubSub.publish("message.status.s2", this, {message: 'Creating kit with barcode <'+barcode+'> for '+aliquot});
    });
    return {
      view: html,
      events: {}
    }
  };
});
