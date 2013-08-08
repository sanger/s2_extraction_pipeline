define(['text!html_partials/row_partial.html'], function (rowPartialHtml) {

  'use strict';

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var RowView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  RowView.prototype.removeArrow = function() {
    this.jquerySelector.find('.arrow').empty();
  };

  RowView.prototype.renderView = function (model) {
    this.jquerySelector.empty().append(rowPartialHtml);
  };

  RowView.prototype.clear = function () {
    var children = this.jquerySelector.empty();
  };

  return RowView;

});

