define(['config'
, 'extraction_pipeline/lib/barcode_checker'
], function (config, BarcodeChecker) {
  'use strict';

  var BasePresenter = Object.create(null);

  $.extend(BasePresenter, {
    // This should be registered with model not presenter
    getS2Root: function() { return this.owner.getS2Root(); },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    bindReturnKey: function (element, successCallback, errorCallback, validationCallback) {
      var thisPresenter = this;

      // by default, we check that the input is 13 digits long.
      var validation = validationCallback || function (element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) return;
          if (BarcodeChecker.isBarcodeValid(event.currentTarget.value)) {
            callback(event, element, thisPresenter);
          } else {
            errorCallback(event, element, thisPresenter);
          }
        }
      };

      return element.on("keypress", "input", validation(element, successCallback, errorCallback) );
    },

    printerList:function() {

      var printerNames = [];
      _.each(config.printers, function(printer) {
        printer.friendlyName = printer.name + ' ' + config.printerTypes[printer.type];
      });

      return config.printers;
    }
  });

  return BasePresenter;
});
