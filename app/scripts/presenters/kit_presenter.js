define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/kit_view',
  'extraction_pipeline/models/kit_model'
], function(Base, View, Model) {
  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register: function(callback) {
      callback('kit_presenter', function() {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function(owner, factory, config) {
      this.owner            = owner;
      this.config           = config;
      this.presenterFactory = factory;
      this.model            = Object.create(Model).init(this, config);
      return this;
    },

    setupPresenter: function(model, selector) {
      this.selector = selector;

      this.setupView();
      this.renderView();
      this.setupSubPresenters();
      return this;
    },
    setupSubPresenters: function(reset) {
      var presenter = this;

      if (!presenter.barcodePresenter) {
        presenter.barcodePresenter = presenter.presenterFactory.create('scan_barcode_presenter', this);
      }
      presenter.barcodePresenter.setupPresenter({
        type:  'Kit',
        value: 'Kit0001'
      }, function() {
        return presenter.selector().find('.barcode');
      });
      presenter.barcodePresenter.focus();
      return this;
    },
    setupSubModel: function() {
      this.setValidState();
      return this;
    },

    setupView: function() {
      this.view = new View(this, this.selector);
      return this;
    },
    release: function() {
      this.view.clear();
      return this;
    },
    renderView: function() {
      this.view.renderView({
        batch:        this.model.batch && this.model.batch.uuid,
        user:         this.model.user
      });
      return this;
    },

    childDone: function(child, action, data) {
    },
  });

  return Presenter;
});