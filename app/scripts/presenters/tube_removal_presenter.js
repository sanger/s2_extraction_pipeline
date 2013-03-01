define(['extraction_pipeline/views/tube_removal_view'], function (TubeRemovalView) {

  var TubeRemovalPresenter = function (owner, presenterFactory) {
    this.model = null;
    this.owner = owner;
    this.presenterFactory = presenterFactory;
  };

  TubeRemovalPresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();

    this.updateModel(input_model);
    return this;
  };

  TubeRemovalPresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  TubeRemovalPresenter.prototype.setupView = function () {
    this.view = new TubeRemovalView(this, this.jquerySelection);
    return this;
  };

  TubeRemovalPresenter.prototype.updateModel = function (model) {
    this.model = model;
    this.setupSubPresenters();
    return this;
  };

  TubeRemovalPresenter.prototype.setupSubPresenters = function () {
    if (!this.tubePresenter) {
      this.tubePresenter = this.presenterFactory.createTubePresenter(this.model);
    }
    this.setupSubModel();
    return this;
  };

  TubeRemovalPresenter.prototype.setupSubModel = function () {
    if (this.model) {
      this.tubePresenter.setupModel(this.model);
    }
      var that = this;
      // equivalent to the call to tubePresenter.setupPresenter()
      this.tubePresenter.setupView(function () {
        console.log(that.jquerySelection());
        return that.jquerySelection().find("div.placeholder");
      });

  };

  TubeRemovalPresenter.prototype.renderView = function () {
    if (this.view) {
      this.view.render(this.model && this.model.rawJson);
    }
    if (this.tubePresenter) {
      this.tubePresenter.renderView(this.model && this.model.rawJson);
    }

  };

  TubeRemovalPresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  };

  TubeRemovalPresenter.prototype.childDone = function (presenter, action, data) {
    this.owner.childDone(presenter, action, data);
  };

  return TubeRemovalPresenter;

});
