define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/rack_scan_view',
  'extraction_pipeline/models/rack_scan_model'
], function (Base, View, Model) {
  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register:function (callback) {
      callback('rack_scan_presenter', function () {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },
    init:function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    },
    setupPresenter:function (input_model, selector) {
      this.selector = selector;
      this.model.setBatch(input_model.batch);
      this.model.setUser(input_model.userUUID);

      this.setupView();
      this.renderView();
      this.setupSubPresenters();
      this.owner.childDone(this, "disableBtn", {});

      return this;
    },
    setupSubPresenters:function (reset) {
      return this;
    },
    setupSubModel:function () {
      return this;
    },
    focus:function () {
    },
    setupView:function () {
      this.view = new View(this, this.selector);
      return this;
    },
    release:function () {
      this.view.clear();
      return this;
    },
    renderView:function () {
      this.view.renderView({
        batch:this.model.batch && this.model.batch.uuid,
        user:this.model.user
      });
      return this;
    },
    initialPresenter:function () {
      // Does nothing, for the moment!
    },
    childDone:function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else if (child === this.model) {
        this.modelDone(child, action, data);
      }
    },
    start:function(child,action, data){
      this.model.fire();
    },
    next:function(child,action, data){
      this.owner.childDone(this, "done", {batch:this.model.batch, user:this.model.user});
    },
    viewDone:function (child, action, data) {
      if (action === 'fileRead') {
        this.model.analyseFileContent(data);
      } else if (action === 'transferAuthorised') {
        this.model.fire();
      }
    },

    modelDone:function (child, action, data) {
      if (action === 'fileValid') {
        this.view.validateFile();
        this.owner.childDone(this, "enableBtn", {actions:[{action:"start"}]});
      } else if (action === 'error') {
        //this.view.in(data);
        this.view.error(data);
      } else if (action === 'transferDone') {
        this.view.disableDropZone()
        this.owner.childDone(this, "disableBtn", {actions:[{action:"start"}]});
        this.owner.childDone(this, "enableBtn", {actions:[{action:"next"}]});
      }
    }




  });

  return Presenter;
});
