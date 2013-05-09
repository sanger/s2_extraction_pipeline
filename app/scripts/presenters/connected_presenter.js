define([
      'extraction_pipeline/presenters/base_presenter',
       'extraction_pipeline/models/connected',
       'extraction_pipeline/views/connected_view'
], function(BasePresenter, Model, View) {
  'use strict';

  var Presenter = Object.create(BasePresenter);

  $.extend(Presenter, {
    register:function (callback) {
      callback('connected_presenter', function (owner, factory, initData) {
        return Object.create(Presenter).init(owner, factory, initData);
      });
    },

    init:function (owner, presenterFactory, initData) {
      this.config           = initData;
      this.owner            = owner;
      this.model            = Object.create(Model).init(this, initData);
      this.rowPresenters    = [];
      this.presenterFactory = presenterFactory;
      return this;
    },

    setupPresenter:function (input_model, jquerySelection) {
      this.jquerySelection = jquerySelection;
      this.model.setBatch(input_model.batch);
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

    focus: function() {
    },
    setupView:function () {
      this.currentView = new View(this, this.jquerySelection);
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
      if (action === 'inputBarcodeScanned') {
        var originator = data.origin, presenter = this;
        presenter.model.inputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          presenter.model.inputs.pull(resource);
        });
      } else if (action === 'outputBarcodeScanned') {
        var originator = data.origin, presenter = this;
        presenter.model.outputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          presenter.model.outputs.pull(resource);
        });
      } else if (action === 'inputRemoved') {
        this.model.inputs.push(data.resource);
      } else if (action === 'outputRemoved') {
        this.model.outputs.push(data.resource);
      } else if (action === 'completed') {
        this.rowDone(child, action, data);
      }
    },
    rowDone: function(child, action, data) {
      if (action === 'completed') {
        var model = this.model;
        model.operate('row', [child]);
      }
    },

    modelDone: function(child, action, data) {

      if (action === 'outputsReady') {

        this.model.ready = true;
        this.setupSubPresenters(true);
        this.currentView.toggleHeaderEnabled(false);
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "barcodePrintSuccess") {

        this.owner.childDone(this, "error", {"message":"Barcode labels printed"});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"start"}]});
        }

      } else if (action === "barcodePrintFailure") {

        this.owner.childDone(this, "error", {"message":"Barcode labels could not be printed"});
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "startOperation") {

        this.model.started = true;
        this.owner.childDone(this, "error", {"message":"Transfer started"});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});

      } else if (action === "completeOperation") {

        this.owner.childDone(this, "error", {"message":"Transfer completed"});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"next"}]});
        }

        var that = this;
        this.model.behaviours.done.transfer(function() {
          that.owner.childDone(that, "done", { batch:that.model.batch });
        });

      } else if (action === "successfulOperation") {

        _.each(data, function(presenter){
          presenter.lockRow();
        });

      }
    },

    readyToCreateOutputs: function() {
      return !this.model.started;
    },
    currentViewDone: function(child, action, data) {
    },

    initialPresenter: function() {
      this.model.previous = true;
      this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

    },
    previousDone: function(child, action, data) {
      this.model.previous = true;
    },

    print: function(child, action, data) {
      if (this.readyToCreateOutputs()) {
        this.model.createOutputs(data);
        this.currentView.setPrintButtonEnabled(false);
      }
    },
    next:  function(child, action, data){
      var presenter = this;

      this.model.behaviours.home[action](
        function(){ presenter.owner.childDone(presenter, 'done') },
        function(){ eventHandler.call(presenter, child, action, data); }
      )
    },
    start: eventHandler,
    end:   eventHandler
  });
  return Presenter;

  function eventHandler(child, action, data) {
    if (this.checkPageComplete()) {
      var that = this;
      that.model.operate(action, that.rowPresenters);
      that.model.behaviours.done[action](function() {
        that.owner.childDone(that, "done", {
          batch: that.model.batch,
          user: that.model.user
        });
      });
    }
  }
});
