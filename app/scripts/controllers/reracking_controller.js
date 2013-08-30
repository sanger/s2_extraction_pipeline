define([
  "config",
  "controllers/base_controller",
  "text!html_partials/_reracking.html",
  "models/reracking_model",
  "lib/pubsub",
  "lib/util"
], function (config, BaseController, componentPartialHtml, Model, PubSub, Util) {
  "use strict";

  function barcodeErrorCallback(errorText) {
    return function (event, template, controller) {
      controller.message("error", errorText);

      template
      .find("input")
      .val(""); // clear the input
    };
  }

  function labwareCallback(event, template, controller) {
    template.find(".alert-error").addClass("hide");
    controller.labwareScannedHandler(Util.pad(event.currentTarget.value));
    controller.html.find("#barcodeReader").find("input").val(""); // clear the input
  }

  function validation(element, callback, errorCallback) {
    return function (event) {
      if (event.which !== 13) return;
      if (event.currentTarget.value.length === 13) {
        callback(event, element, thisController);
      } else {
        errorCallback(event, element, thisController);
      }
    };
  }

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback("reracking_controller", function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner   = owner;
      this.factory = factory;
      this.config  = config;
      this.model   = Object.create(Model).init(this, config);

      // clean this up!
      this.printerList = _.filter(config.printerList, function(p){
        return p.type === 1;
      });

      this.view = this.createHtml();

      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function () {
      var thisController = this;
      this.html = $(_.template(componentPartialHtml)(this));

      var scanBarcodeController = this.factory.create("scan_barcode_controller", this).init({type: "labware"});
      this.html.find("#barcodeReader").append(
        this.bindReturnKey(scanBarcodeController.renderView(),
                           labwareCallback,
                           barcodeErrorCallback("Barcode must be a 13 digit number."),
                           validation)
      );
      this.html.find("#barcodeReader").show();
      this.enableDropzone();
      this.html.find("#output").hide();
      this.html.find("#start-rerack-btn").hide();
      this.html.find("#print-rerack-btn").hide();

      this.html.find("#accordion h3:nth(1)").hide();
      this.html.find("#accordion h3:nth(2)").hide();
      this.html.find("#accordion").accordion({
        collapsible: true,
        heightStyle: "content"
      });

      this.html.find("#print-rerack-btn").click(thisController.onPrintBarcode);
      this.html.find("#rerack-btn").click(thisController.onReracking);

      this.html.find("#start-rerack-btn").click(thisController.onStartReracking);
      return this.html;

    },

    subscribeToPubSubEvents: function () {
      var thisController = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisController.reset();
      }
    },

    reset: function () {
      this.model.then(function (model) {
        model.reset();
      });
      this.html.find("#accordion").accordion("option","active", 0);
      this.html.find("#rack-list").empty();
      this.html.find("#start-rerack-btn").hide();
      this.rackControllers = [];
      delete this.outputRackController;
      this.html.find(".output-labware").hide();
      this.html.find("#output").hide();
      this.html.find("#print-rerack-btn").hide();


      this.html.find("#accordion").find("h3:nth(1)").hide();
      this.html.find("#accordion").find("h3:nth(2)").hide();

      this.message();
    },

    labwareScannedHandler: function (barcode) {
      var thisController = this;
      thisController.rackControllers = [];

      thisController.model
      .fail(function () {
        thisController.message("error", "Impossible to load the model!");
      })
      .then(function (model) {
        thisController.view.trigger("s2.busybox.start_process");

        return model.addRack(barcode);
      })
      .fail(function (error) {
        thisController.view.trigger("s2.busybox.end_process");

        thisController.message("error", error.message);
      })
      .then(function (model) {
        // creates the rack list from the loaded racks
        thisController.rackControllers = [];
        var rackList = _.map(model.inputRacks, function (rack, index) {
          var rackController = thisController.factory.create("labware_controller", thisController);
          function selection(s) {
            return function () {
              return thisController.html.find("#rack-list").find(s);
            };
          }
          thisController.rackControllers.push(rackController);
          thisController.html.find("#rack-list").find();

          rackController.setupController({
            "expected_type":   "tube_rack",
            "display_labware": true,
            "display_remove":  false,
            "display_barcode": false
          }, selection("li:nth(" + index + ")"));

          var listItem = "<li>" + rack.labels.barcode.value + "</li>";
          return {"item": listItem, controller: rackController, rackData: rack};
        });
        var listItems = _.pluck(rackList, "item");
        thisController.html.find("#rack-list").empty().append(listItems);
        _.each(rackList, function (rackItem) {
          rackItem.controller.renderView();
          rackItem.controller.updateModel(rackItem.rackData);
        });
        if (model.isReady) {
          // ready to merge
          thisController.html.find("#start-rerack-btn").show();
        }
        thisController.view.trigger("s2.busybox.end_process");
      });
    },

    enableDropzone: function () {
      var thisController = this;
      // add listeners to the hiddenFileInput
      thisController.html.find(".dropzone").bind("click", handleClickOnDropZone); // forward the click to the hiddenFileInput
      thisController.html.find(".dropzone").bind("drop", handleDropFileOnDropZone);
      thisController.html.find(".dropzone").bind("dragover", handleDragFileOverDropZone);
      thisController.html.find(".hiddenFileInput").bind("change", handleInputFileChanged);
      //
      function handleInputFile(fileHandle) {
        // what to do when a file has been selected
        var reader = new FileReader();

        // This does nothing except maybe add a function that does nothing.
        // Gut says this is not needed...
        reader.onload = (function (fileEvent) {
          return function (e) {
          };
        })(fileHandle);

        reader.onloadend = function (event) {
          if (event.target.readyState === FileReader.DONE) {
            thisController.responderCallback(event.target.result);
          }
        };

        reader.readAsText(fileHandle, "UTF-8");
      }

      function handleInputFileChanged(event) {
        // what to do when the file selected by the hidden input changed
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.target.files[0]);
      }

      function handleClickOnDropZone(event) {
        // what to do when one clicks on the drop zone
        event.stopPropagation();
        event.preventDefault();
        if (thisController.html.find(".hiddenFileInput")) {
          thisController.html.find(".hiddenFileInput").click();
        }
      }

      function handleDropFileOnDropZone(event) {
        // what to do when one drops a file
        event.stopPropagation();
        event.preventDefault();
        handleInputFile(event.originalEvent.dataTransfer.files[0]);
      }

      function handleDragFileOverDropZone(event) {
        // what to do when one hovers over the dropzone
        event.stopPropagation();
        event.preventDefault();
        if (event.target === thisController.html.find(".dropzone")[0]) {
          thisController.html.find(".dropzone").addClass("hover");
        } else {
          thisController.html.find(".dropzone").removeClass("hover");
        }
      }
    },

    disableDropZone:function(){
      this.html.find(".dropzoneBox").hide();
      this.html.find(".dropzone").unbind("click");
      $(document).unbind("drop");
      $(document).unbind("dragover");
    },

    responderCallback: function (fileContent) {
      var deferred = $.Deferred();
      var thisController = this;
      thisController.model
      .then(function (model) {
        thisController.message();
        thisController.view.trigger("s2.busybox.start_process");
        return model.setFileContent(fileContent);
      })
      .fail(function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.message("error", error.message);
        deferred.reject();
      })
      .then(function (model) {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.html.find(".output-labware").show();
        thisController.outputRackController = thisController.factory.create("labware_controller", thisController);
        thisController.outputRackController.setupController({
          "expected_type":   "tube_rack",
          "display_labware": true,
          "display_remove":  false,
          "display_barcode": false
        }, function () {
          return thisController.html.find(".output-labware");
        });
        thisController.html.find(".output-labware").empty();
        thisController.outputRackController.renderView();
        thisController.outputRackController.updateModel(model.outputRack);
        thisController.disableDropZone();
        deferred.resolve(thisController);
      });
      return deferred.promise();
    },

    onPrintBarcode: function () {
      var thisController = this;
      this.model
      .then(function (model) {
        thisController.view.trigger("s2.busybox.start_process");
        return model.printRackBarcode(thisController.view.find("#printer-select").val());
      })
      .fail(function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        return thisController.message("error", "Couldn't print the barcodes!");
      })
      .then(function () {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.html.find("#output").show();
        thisController.html.find("#start-rerack-btn").hide();
        thisController.html.find("#accordion").find("h3:nth(2)").show();
        thisController.html.find("#accordion").accordion("option", "active", 2);
        return thisController.message("success", "The barcodes have been sent to printer.");
      });
    },

    onStartReracking: function () {
      this.html.find("#output").show();
      this.html.find("#start-rerack-btn").hide();
      this.html.find("#accordion").find("h3:nth(1)").show();
      this.html.find("#accordion").accordion("option", "active", 1);
      this.html.find("#print-rerack-btn").show();
    },

    onReracking: function () {
      var thisController = this;
      this.model
      .then(function (model) {
        thisController.view.trigger("s2.busybox.start_process");
        return model.rerack();
      })
      .fail(function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        return thisController
        .message("error",
                 "Couldn't rerack! Please contact the administrator. "
                 + error.message);
      })
      .then(function () {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.html.find("#rerack-btn").hide();
        return thisController.message("success", "Reracking completed.");
      });
    },

    message: function (type, message) {
      if (!type) {
        this.view
        .find(".validationText")
        .hide();
      } else {
        this.view
        .find(".validationText")
        .show()
        .removeClass("alert-error alert-info alert-success")
        .addClass("alert-" + type)
        .html(message);
      }
    },

    childDone: function () {
      throw "RerackingController#childDone is deprecated";
    },

    release: function() {}
  });

  return Controller;
});

