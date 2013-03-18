define(['extraction_pipeline/views/labware_view', 'config', 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/unit/root.json'
  , 'text!components/S2Mapper/test/json/unit/tube.json'
  , 'text!components/S2Mapper/test/json/unit/tube_by_barcode.json'], function (LabwareView, config, S2Root, rootTestJson, dataTubeJSON, dataTubeFbyBCJSON) {

  var LabwarePresenter = function (owner, presenterFactory) {
    this.model = undefined;
    this.uuid = undefined;
    this.owner = owner;
    this.inputModel = undefined;
    this.presenterFactory = presenterFactory;
    this.resourcePresenter = undefined;
    this.barcodeInputPresenter = undefined;
  };

  LabwarePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    /*
     * input_model = {
     *   uuid: "1234567890" // the uuid used to locate the resource
     * }
     *
     * */

    this.setupPlaceholder(jquerySelection);
    this.updateModel(input_model);
    return this;
  };

  LabwarePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  LabwarePresenter.prototype.setupView = function () {
    this.view = new LabwareView(this, this.jquerySelection);
    return this;
  };

  LabwarePresenter.prototype.updateModel = function (model) {

    this.inputModel = model;

    if (model && model.hasOwnProperty('uuid')) {
      var that = this;
      var root, rsc;


      config.setupTest(rootTestJson);
      S2Root.load().done(function (result) {
        root = result;
      })
          .then(function () {
            config.setupTest(dataTubeJSON);
            root.find(model.uuid).done(function (rsc) {
                  that.model = rsc.rawJson;
                  that.uuid = model.uuid;
                  if (model.hasOwnProperty('expected_type')) {
                    if (!rsc.rawJson.hasOwnProperty(model.expected_type)) {
                      that.model = undefined;
                    }
                  }
                }
            );
            that.setupView();
            that.renderView();
//        that.owner.childDone(that, "Found equipment", model.uuid);
          }
      );

    } else {
      var expectedType = undefined;
      if (model) {
        expectedType = model.expected_type;
      }
      this.setupView();
      this.renderView();
    }

    return this;
  };

  LabwarePresenter.prototype.setRemoveButtonVisibility = function (displayRemove) {
    if (!displayRemove) {
      this.view.hideRemoveButton();
    }
  }

  LabwarePresenter.prototype.setupSubPresenters = function (expectedType) {
    if (!this.resourcePresenter) {
      var type = expectedType;
    }
    if (this.model) {
      type = Object.keys(this.model)[0];

    }
    if (expectedType && type != expectedType) {
      this.displayErrorMessage('Equipment is not of expected type');
    } else {
      if (type) {
        this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
        this.view.setTitle(type);
      }
      if (!this.barcodeInputPresenter && this.inputModel.display_barcode) {
        this.barcodeInputPresenter = this.presenterFactory.createScanBarcodePresenter(this);
      }
      this.setupSubModel();
    }
    return this;
  };

  LabwarePresenter.prototype.retrieveBarcode = function (data) {
    var tube, root;
    var barcode = data;
    var that = this;
    config.setupTest(rootTestJson);
    S2Root.load().done(function (result) {
      root = result;
    })
        .then(function () {
          config.setupTest(dataTubeFbyBCJSON);
          root.tubes.findByEan13Barcode(barcode).done(function (result) {
                if (result) {
                  var type = result.resourceType;
                  that.model = result.rawJson;
                  that.uuid = result.uuid; //rawJson[type].uuid;
                  that.setupSubPresenters(that.inputModel.expected_type);
//              that.owner.childDone(that, "login", dataForChildDone);
                } else {
                  // todo : handle error
                  debugger;
                }
              }
          ).fail(
              function () {
                debugger;
              }
          );
        });
  };

  LabwarePresenter.prototype.setupSubModel = function () {
    //if (this.model) {
    var that = this;
//      debugger;
    var data = {};
    if (this.model) {
      data = this.model;
    }

    var resourceSelector = function () {
      return that.jquerySelection().find("div.resource")
    };

    if (this.resourcePresenter) {
      this.resourcePresenter.setupPresenter(data, resourceSelector);
    }

    if (this.barcodeInputPresenter) {
      this.barcodeInputPresenter.setupPresenter(data, function () {
        return that.jquerySelection().find("div.barcodeScanner")
      });
    }
//      console.log(">>>>> ",this.tubePresenter);

    //  }
    // equivalent to the call to tubePresenter.setupPresenter()
//      this.tubePresenter.setupView(function () {
//        console.log(that.jquerySelection());
//        return that.jquerySelection().find("div.placeholder");
//      });

  };

  LabwarePresenter.prototype.renderView = function () {
    this.release();
    this.resourcePresenter = undefined;
    this.barcodeInputPresenter = undefined;

    if (this.view) {
      this.view.renderView(this.model);
    }
    if (this.resourcePresenter) {
      this.resourcePresenter.renderView();
    }
    if (this.barcodeInputPresenter) {
      this.barcodeInputPresenter.renderView();
    }


    this.setupSubPresenters(this.inputModel.expected_type);
    this.setRemoveButtonVisibility(this.inputModel.display_remove);
  };

  LabwarePresenter.prototype.specialType = function (type) {
    var specialType = false;
    var typesList = ['waste_tube', 'qia_cube', 'centrifuge'];

    if (type) {
      if (typesList.indexOf(type) > -1) {
        specialType = true;
      }
    }

    return specialType;
  }

  LabwarePresenter.prototype.resetLabware = function () {
    this.release();
    this.model = undefined;
    this.resourcePresenter = undefined;
    this.barcodeInputPresenter = undefined;
    this.setupPresenter(this.inputModel, this.jquerySelection);
  };

  LabwarePresenter.prototype.isComplete = function() {
    var complete = true;

      // If the labware module requires input but there is no model to populate it, we can assume it's incomplete
      if (this.inputModel.display_barcode && this.inputModel.display_remove && !this.model) {
        complete = false;
      }

    return complete;
  };

  LabwarePresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  };

  /*
   TODO : update data schema
   action : "removeTube" -> data == { ?? }
   */
  LabwarePresenter.prototype.childDone = function (child, action, data) {
    if (child === this.view) {
      if (action == "labwareRemoved") {
//        var action = action;
//        var data = data;
        this.resetLabware();
        this.owner.childDone(this, "labwareRemoved", {"uuid":this.uuid});
      }
    }
    else if (action == "tube rendered") {
      this.owner.childDone(this, action, child.getAliquotType());
    }
    else if (action == 'barcodeScanned') {
      this.retrieveBarcode(data.BC);
      this.owner.childDone(this, 'barcodeScanned', {"uuid":this.uuid});
    }
  };

  LabwarePresenter.prototype.displayErrorMessage = function(message) {
    this.barcodeInputPresenter.displayErrorMessage(message);
  };

  return LabwarePresenter;

});
