define([
       'extraction_pipeline/presenters/base_presenter'
], function(BasePresenter) {
  return {
    extend: function(presenterName, presenterModel, presenterView) {
      var presenter = Object.create(BasePresenter);
      $.extend(presenter, {
        register:function (callback) {
          callback(presenterName, function (owner, factory, initData) {
            return Object.create(presenter).init(owner, factory, initData);
          });
        },

        init:function (owner, presenterFactory, initData) {
          this.config           = initData;
          this.owner            = owner;
          this.model            = Object.create(presenterModel).init(this, initData);
          this.rowPresenters    = [];
          this.presenterFactory = presenterFactory;
          return this;
        },

        setupPresenter:function (input_model, jquerySelection) {
          this.jquerySelection = jquerySelection;
          this.model.setBatch(input_model.batch);
          this.model.setUser(input_model.userUUID);
          this.setupView();
          this.renderView();
          this.setupSubPresenters();
          return this;
        },
        setupSubPresenters: function(reset) {
          this.model.setupInputPresenters(reset);
          this.setupSubModel();
          return this;
        },
        setupSubModel:function () {
          return this;
        },

        setupView:function () {
          this.currentView = new presenterView(this, this.jquerySelection);
          return this;
        },
        release:function () {
          this.currentView.clear();
          return this;
        },
        renderView:function () {
          var dataForView = null;

          if (this.model && this.model.config) {
            dataForView = {
              batch:this.model.batch && this.model.batch.uuid,
              user:this.model.user,
              processTitle:this.model.config.processTitle
            }
          }

          this.currentView.renderView(dataForView);
          return this;
        },

        checkPageComplete:function () {
          return _.all(this.rowPresenters, function (presenter) {
            return presenter.isRowComplete();
          });
        },

        childDone:function (child, action, data) {
          if (child === this.currentView) {
            this.currentViewDone(child, action, data);
          } else if (child === this.model) {
            this.modelDone(child, action, data);
          } else {
            this.unknownDone(child, action, data);
          }
        },

        unknownDone:function (child, action, data) {
          if (action === "barcodeScanned") {
            var originator = data.origin;

            // HACK: Identify the input as the first labware presenter in the row
            if (originator.labwareModel.input && (originator.labwareModel.expected_type === this.config.input.model.singularize())) {
              this.model.getInputByBarcode(originator, data);
              this.inputDone(child, action, data);
            } else if (!originator.labwareModel.input) {
              this.model.getOutputByBarcode(originator, data);
              this.outputDone(child, action, data);
            }
          } else if (action === 'completed') {
            this.rowDone(child, action, data);
          }
        },
        inputDone: function(child, action, data) {
        },
        outputDone: function(child, action, data) {
        },
        rowDone: function(child, action, data) {
          if (action === 'completed') {
            var model = this.model;
            model.operate('row', [child]);
          }
        },

        modelDone: function(child, action, data) {
          if (action === "labelPrinted") {
            this.owner.childDone(this, "error", {"message":"Barcodes printed"});
            this.setupSubPresenters(true);

            this.currentView.toggleHeaderEnabled(false);
          } else if (action === "completeOperation") {
            this.owner.childDone(this, "error", {"message":"Transfer completed"});

            var that = this;
            this.model.behaviours.done.transfer(function() {
              that.owner.childDone(that, "done", { batch:that.model.batch });
            });
          }
        },

        checkPageComplete: function() {
          return true;
        },
        readyToCreateOutputs: function() {
          return true;
        },
        currentViewDone: function(child, action, data) {
          if (action === 'savePrintBC') {
            if (this.readyToCreateOutputs()) {
              this.model.createOutputs();
              this.currentView.setPrintButtonEnabled(false);
            }
          } else if (this.checkPageComplete()) {
            var that = this;
            that.model.operate(action, that.rowPresenters);
            that.model.behaviours.done[action](function() {
              that.owner.childDone(that, "done", { batch:that.model.batch });
            });
          }
        }
      });
      return presenter;
    }
  };
});
