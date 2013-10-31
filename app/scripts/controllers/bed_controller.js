define(['app-components/scanning/bed-recording',
       'lib/pubsub', 
       'lib/Util'
], function (bedRecording, PubSub, Util) {
  "use strict";
  var ROBOT_SCANNED = "scanned.robot.s2";
  var BedController = function (owner, controllerFactory) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;
    return this;
  };

  function findRootPromise(controller) {
    var iterations = 0;
    while (iterations <20) {
      if (controller.rootPromise) {
        return controller.rootPromise;
      }
      controller = controller.owner;
      iterations++;
    }
    throw new Error("Infinite loop while finding root promise");
  }
  
  BedController.prototype.init = function (handlerThen) {
    this.component = bedRecording({
      validator: _.partial(function(rootPromise, barcode) {
        return rootPromise.then(function(root) {
          return root.findByLabEan13(barcode);
        });
      }, findRootPromise(this))
    });
    handlerThen();
    this.renderView();
    return this;
  };

  BedController.prototype.renderView = function () {
    this.component.view.on(_.omit(this.component.events, ROBOT_SCANNED));
    $(document.body).on(_.pick(this.component.events, ROBOT_SCANNED));
    this.component.view.on("scanned.bed-recording.s2", $.ignoresEvent(_.bind(function(view, bedBarcode, plateLabware) {
      /*var msg = {
      modelName: this.owner.labwareModel.expected_type.pluralize(),
      BC:        Util.pad(plateLabware.labels.barcode.value)
      };
      this.owner.updateModel(plateLabware);

      this.owner.owner.childDone(this.owner, 'barcodeScanned', msg);      
      
      PubSub.publish("s2.labware.barcode_scanned", this.owner, msg);*/      
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

