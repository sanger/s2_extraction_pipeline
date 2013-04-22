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
      this.selector    = selector;
      this.model.batch = model.batch;

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
      return this;
    },
    setupSubModel: function() {
      this.setValidState();
      return this;
    },

    focus: function() {
      this.barcodePresenter.focus();
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
        batch: this.model.batch && this.model.batch.uuid,
        user:  this.model.user
      });
      return this;
    },

    initialPresenter: function() {
      // Does nothing, for the moment!
    },
    childDone: function(child, action, data) {
      if (action === 'barcodeScanned') {
        this.model.kit.barcode = data.BC;
        this.model.fire();
      } else if (action === 'saved') {
        this.view.message('info', 'Kit details saved');
        this.owner.childDone(this, 'done', data);
      }
    }
  });

  return Presenter;
});
