define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/csv_parser'
], function (BasePageModel, Operations, CSVParser) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init:function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.user = undefined;
      this.batch = undefined;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
      return this;
    },
    createOutputs:function () {
      var model = this;
      var root;
      return model.owner.getS2Root()
          .then(function (result) {
            root = result;
            return Operations.registerLabware(
                root[model.config.output[0].model],
                model.config.output[0].aliquotType,
                model.config.output[0].purpose,
                {
                  number_of_rows:8,
                  number_of_columns:12,
                  tubes:model.preparedTransferData
                });
          }).then(function (state) {
            model.cache.push(state.labware);
            model.owner.childDone(model, 'outputsReady', {});
            return state.labware;
          })
          .fail(function () {
            model.owner.childDone(model, "error", {message:"impossible to create the rack."});
          });
    },
//    printBarcodes:function(item) {
//      var that = this;
//      var printer = PrintService.printers[0];
//
//      // Extract the print label details from each item in the collection
//      var printItems = _.map(collection, function(item) {
//        return item.returnPrintDetails();
//      });
//
//      return printer.print(printItems)
//          .done(function() {
//            that.owner.childDone(that, 'barcodePrintSuccess', {});
//          })
//          .fail(function() {
//            that.owner.childDone(that, 'barcodePrintFailure', {});
//          });
//    },
    fire:function () {
      var model = this;
      model.createOutputs()
//          .then(function () {
//            return model.makeTranfer();
//          })
          .then(function () {
            model.owner.childDone(model, "transferDone", {});
          })
          .fail(function () {
            model.owner.childDone(model, "error", {message:"An error occured during the transfer process!<BR/> Contact the administrator of the system."});
          });
    },


    analyseFileContent:function (data) {
      var locationsSortedByBarcode = CSVParser.convertCSVDataToJSON(data.csvAsTxt);
      var model = this;
      var results = checkFileValidity(model, locationsSortedByBarcode);
      var root;

      if (results.action) {
        model.owner.childDone(model, results.action, results.data);
      }
      if (results.status === "valid") {
        prepareTransferDataPromise(model, locationsSortedByBarcode)
            .then(function () {
              return model.owner.getS2Root();
            })
            .then(function (result) {
              root = result;
              return model.inputs;
            })
            .then(function(inputs){
              // TODO: This creation is fake! We artificially build a tube_rack like this
              // because it's not a base resource for now...
              var tube_rack = root.tube_racks.new();
              tube_rack.tubes = {};
              _.each(model.preparedTransferData,function(uuid,location){
                if (uuid){
                  tube_rack.tubes[location] = _.find(inputs,function(input){return input.uuid === uuid});
                }
              });
              model.owner.childDone(model, "fileValid", tube_rack)
            })
            .fail(function () {
              model.owner.childDone(model, "error", {message:"Impossible to find the required resources. Contact the system administrator."})
            });
      }
    },
    setBatch:function (batch) {
      this.cache.push(batch);
      this.batch = batch;
      var model = this;
      setupInputs(model)
          .then(function () {
            model.owner.childDone(model, "batchAdded");
          })
          .fail(function () {
            model.owner.childDone(model, "error", {message:"couldn't load the batch resources!"});
          });
    },
    setUser:function (userUUID) {
      this.user = userUUID;
      this.owner.childDone(this, "userAdded");
    }
  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items.then(function (items) {
      return $.when.apply(null,
          _.chain(items)
              .filter(function (item) {
                return item.role === that.config.input.role && item.status === 'done';
              })
              .map(function (item) {
                return that.cache.fetchResourcePromiseFromUUID(item.uuid)
                    .then(function (resource) {
                      inputs.push(resource);
                    });
              })
              .value());
    })
        .then(function () {
          return that.inputs.resolve(inputs);
        }).fail(that.inputs.reject);
  }

  function checkFileValidity(model, locationsSortedByBarcode) {

    var status = "valid";
    var action = undefined;
    var message = undefined;

    var expectedNbOfTubes;
    var arrayOfExpectedBarcodes;

    model.inputs
        .then(function (inputs) {
          expectedNbOfTubes = inputs.length;
          arrayOfExpectedBarcodes = _.map(inputs, function (resource, key) {
            return resource.labels.barcode.value
          });
        });

    var arrayOfBarcodesInRack = _.keys(locationsSortedByBarcode);
    var nbOfTubesInRack = arrayOfBarcodesInRack.length;

    if (nbOfTubesInRack !== expectedNbOfTubes) {
      status = "error";
      action = "error";
      message = "The number of tube is not correct. The current batch" +
          " contains " + expectedNbOfTubes + " tubes, while the " +
          "current transfer file contains " + nbOfTubesInRack + " tubes!";
    }

    var missingBarcodes = _.difference(arrayOfExpectedBarcodes, arrayOfBarcodesInRack);
    if (missingBarcodes.length !== 0) {
      status = "error";
      action = "error";
      message = "The number of tube is correct BUT not all the barcodes are matching. " +
          "The tubes with the following barcodes are missing:<ul>" +
          _.reduce(missingBarcodes, function (memo, barcode) {
            return memo + "<li>" + barcode + "</li>"
          }, "") +
          "</ul>";
    }

    return {action:action, status:status, data:{message:message}};
  }

  function prepareTransferDataPromise(model, locationsSortedByBarcode) {
    model.preparedTransferData = {};

    _.times(8, function (letterIndex) {
      _.times(12, function (number) {
        var letter = String.fromCharCode(65 + letterIndex);
        var numberAsText = (number + 1);
        model.preparedTransferData[letter + numberAsText] = null;
      })
    });

    var resources = [];
    var promises = _.map(locationsSortedByBarcode, function (location, barcode) {
      return model.cache.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            resources.push(rsc);
          });
    });

    return $.when.apply(null, promises)
        .then(function () {
          _.each(resources, function (rsc) {
            var location = locationsSortedByBarcode[rsc.labels.barcode.value];
            model.preparedTransferData[location] = rsc.uuid;
          });
        });
  }

  return Model;
});
