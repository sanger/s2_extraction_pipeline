define([
  'extraction_pipeline/views/row_view'
  , 'labware/presenters/tube_presenter'
  , 'extraction_pipeline/presenters/base_presenter'
], function (View, TubePresenter, BasePresenter) {
  "use strict";

  /* Sample model input:
   *
   *{
   * "rowNum" : i,
   * "labware1" : {
   *   "uuid" : this.model[i],
   *   "expected_type" : "tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware2" : {
   *   "expected_type" : "spin_column",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware3" : {
   *   "expected_type" : "waste_tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * }
   *};
   */

  //TODO: check this declaration is ok
  var RowModel = Object.create(Object.prototype);

  $.extend(RowModel, {
    init:function (owner) {
      this.owner        = owner;
      this.labwares     = {};
      this.remove_arrow = false;
      this.enabled      = true;
      return this;
    },
    setupModel:function (inputModel) {
      this.rowNum       = inputModel.rowNum;
      this.remove_arrow = inputModel.remove_arrow;
      this.enabled      = inputModel.enabled;
      this.labwares     = inputModel;
      delete this.labwares.rowNum;
      delete this.labwares.remove_arrow;
      delete this.labwares.enabled;
    },
    setResource:function (value) {
      this.resource = value
    }
  });

  var RowPresenter = Object.create(BasePresenter);

  $.extend(RowPresenter, {
    register: function(callback) {
      callback('row_presenter', function(owner, factory) {
        return Object.create(RowPresenter).init(owner, factory);
      });
    },

    init:function (owner, presenterFactory) {
      this.presenterFactory = presenterFactory;
      this.owner = owner;
      return this;
    },

    setupPresenter:function (input_model, jquerySelection) {
      var presenter = this;
      this.setupPlaceholder(jquerySelection);

      this.rowModel = Object.create(RowModel).init(this);
      this.rowModel.setupModel(input_model);

      this.currentView = new View(this, this.jquerySelection());

      // NOTE: sort() call is needed here to ensure labware1,labware2,labware3... ordering
      this.presenters = _.chain(this.rowModel.labwares).pairs().sort().map(function(nameToDetails) {
        var name = nameToDetails[0], details = nameToDetails[1];
        var subPresenter = presenter.presenterFactory.create('labware_presenter', presenter);
        subPresenter.setupPresenter(details, function() { return presenter.jquerySelection().find('.' + name); });
        return subPresenter;
      });

      this.currentView.renderView();
      this.presenters.each(function(p) { p.renderView(); });

      if (input_model.remove_arrow) {
        this.currentView.removeArrow();
      }

      return this;
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },


    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      // Each labware presenter is only enabled if it's previous is complete and it is not complete
      this.presenters.reduce(function(memo, presenter) {
        if (!memo) {
          presenter.labwareEnabled(false);
          return false
        }

        if (presenter.isSpecial()) {
          presenter.labwareEnabled(false);
          return true;
        } else if (presenter.isComplete()) {
          presenter.labwareEnabled(false);
          return true;
        } else {
          presenter.labwareEnabled(true);
          return false;
        }
      }, this.rowModel.enabled).value();
    },
    focus: function() {
      this.editablePresenters().find(function(p) { return !p.isComplete(); })
          .value()
          .barcodeFocus();
    },

    childDone:function (child, action, data) {
      var data = $.extend(data, { origin: child });

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action === 'resourceUpdated') {
        if (this.isRowComplete() && (child === this.editablePresenters().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      } else if (action === 'removeLabware') {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        child.release();
        delete child.resource;
        delete child.resourcePresenter;
        delete child.barcodeInputPresenter;
        child.setupPresenter(this.rowModel.labwares['labware' + (this.presenters.value().indexOf(child) + 1)], child.jquerySelection);
        child.renderView();
        this.owner.childDone(this, eventPrefix+'Removed', data);
      } else if (action === "barcodeScanned") {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        this.owner.childDone(this, eventPrefix+'BarcodeScanned', data);
      }
    },

    editablePresenters: function() {
      return this.presenters.compact().filter(function(p) { return !p.isSpecial(); });
    },

    isRowComplete: function() {
      return this.editablePresenters().all(function(p) { return p.isComplete(); }).value();
    },

    lockRow: function() {
      this.presenters.each(function(presenter) {
        presenter.hideEditable();
      });
    },

    unlockRow: function(){
      this.presenters.each(function(presenter) {
        presenter.showEditable();
      });
    },

    handleResources: function(callback) {
      callback.apply(null, this.editablePresenters().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowPresenter;

});
