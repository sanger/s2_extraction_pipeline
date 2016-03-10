define([
  "text!app-components/admin/_viewLabware.html",
  ], function (viewLabware) {
  "use strict";

  var template= _.template(viewLabware);

  return function(context) {
    var html = $(template(context));

    return {
      view: html,
      events: {}
    }
  };
});
