define(['app-components/scanning/bed-recording',
       'lib/pubsub', 
       'lib/Util'
], function (bedRecording, PubSub, Util) {
  "use strict";

  var BedController = function (owner, controllerFactory) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;
    return this;
  };

  BedController.prototype.init = function (inputModel, handlerThen) {
    this.model = inputModel;
    this.component = bedRecording(_.extend({
      root: function() {
        var defer = $.Deferred();
        defer.resolve(inputModel.root);
        return defer.promise();
      }
    }, _.chain(inputModel).clone().omit("root").value()));
    handlerThen();
    return this;
  };

  BedController.prototype.renderView = function () {
    this.component.view.on(this.component.events);

    this.component.view.on("done.bed-recording.s2", $.ignoresEvent(_.bind(function(view, bedBarcode, plateLabware) {
      var msg = {
      modelName: this.owner.labwareModel.expected_type.pluralize(),
      BC:        Util.pad(plateLabware.labels.barcode.value)
    };
      this.owner.updateModel(plateLabware);

      this.owner.owner.childDone(this.owner, 'barcodeScanned', msg);      
      
      PubSub.publish("s2.labware.barcode_scanned", this.owner, msg);      
    }, this)));

    
    return this.component.view;
  };
  
  BedController.prototype.getComponentInterface = function() {
    return this.component;
  };

  return {
    register:function (callback) {
      callback('bed_controller', function (owner, factory) {
        return new BedController(owner, factory);
      });
    }
  };
});

