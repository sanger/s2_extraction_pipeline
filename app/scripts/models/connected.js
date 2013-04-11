define([
  'mapper/operations',
], function(Operations) {
  'use strict';

  return {
    initialiseConnections: function(config) {
      this.output  = config;          // Configuration of our connections
      this.inputs  = $.Deferred();    // Inputs are always a deferred lookup
      this.outputs = [];              // Outputs are always an array
      this.batch   = undefined;       // There is no batch, yet
    },

    setBatch: function(batch) {
      this.addResource(batch);
      this.batch = batch;
      setupInputs(this);
      this.owner.childDone(this, "batchAdded");
    },

    setupInputPresenters: function() {
      var that = this;
      this.inputs.then(function(inputs) {
        that.owner.rowPresenters = _.chain(inputs).reduce(function(memo, input) {
          var rowPresenter = that.owner.presenterFactory.create('row_presenter', that.owner);
          rowPresenter.setupPresenter(that.getRowModel(memo.length, input), selectorFunction(that.owner, memo.length));
          memo.push(rowPresenter);
          return memo;
        }, []).value();
      });

      function selectorFunction(presenter, row) {
        return function() {
          return presenter.jquerySelection().find('.row' + row);
        };
      }
    },

    getInputByBarcode: function(requester, barcode) {
      this.inputs.then(_.partial(findByBarcode, barcode)).then(_.partial(handleRetrieveResult, requester));
    },
    getOutputByBarcode: function(requester, barcode) {
      handleRetrieveResult(requester, findByBarcode(barcode, this.outputs));
    },

    createOutputs: function() {
      var that = this;
      var root;

      this.owner.getS2Root().then(function(result) {
        root = result;
      }).then(function() {
        that.inputs.then(function(inputs) {
          var promises = _.chain(inputs).map(function(input) {
            return Operations.registerLabware(
              root[that.output.model],
              that.output.aliquotType,
              that.output.purpose
            ).then(function(state) {
              that.stash(state.labware, state.barcode);
              that.outputs.push(state.labware);
              return state.labware;
            }).fail(function() {
              that.owner.childDone(that, "failed", {});
            });
          }).value();

          $.when.apply(null, promises).then(function() {
            that.printBarcodes(that.outputs);
            that.owner.childDone(that, 'labelPrinted', {});
          }).fail(function() {
            that.owner.childDone(that, 'failed', {});
          });
        });
      });
    }
  };

  // Convenience method for dealing with finding by barcodes
  function findByBarcode(barcode, array) {
    return _.chain(array).find(function (resource) {
      return resource.labels.barcode.value === barcode.BC;
    }).value();
  }

  // Configures the inputs
  function setupInputs(that) {
    that.batch.items.then(function(items) {
      var inputs = [];
      $.when.apply(null, _.chain(items).filter(function(item) {
        return item.role === that.config.input.role && item.status === 'done';
      }).map(function(item) {
        return that.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
          that.addResource(resource);
          inputs.push(resource);
        });
      }).value()).then(function() {
        that.inputs.resolve(inputs);
      });
    });
  }

  // TODO: 'requester' should really have 'found' and 'notFound' callbacks
  function handleRetrieveResult(requester, result) {
    if (!result) {
      requester.displayErrorMessage("Barcode not found");
    } else {
      requester.updateModel(result);
    }
  }
});
