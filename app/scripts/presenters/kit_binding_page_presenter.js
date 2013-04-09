/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */

define(['extraction_pipeline/views/kit_binding_page_view'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/kit_binding_model'
],
function (View, BasePresenter, KitModel) {
  "use strict";

  // interface ....
  var KitPresenter = Object.create(BasePresenter);

  $.extend(KitPresenter, {
    register: function(callback) {
      callback('kit_presenter', function(owner, factory, initData) {
        return Object.create(KitPresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, presenterFactory, initData) {
      this.owner            = owner;
      this.kitModel         = Object.create(KitModel).init(this, initData);
      this.rowPresenters    = [];
      this.presenterFactory = presenterFactory;
      return this;
    },

    setupPresenter: function (input_model, jquerySelection) {
      this.tubeTypes = [];
      this.kitModel.setBatch(input_model.batch);
      this.setupPlaceholder(jquerySelection);
      this.setupView();
      this.renderView();
      this.setupSubPresenters();

      return this;
    },

    setupPlaceholder: function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    setupView:             function () {
      this.currentView = new View(this, this.jquerySelection);
      return this;
    },

    setupSubPresenters:    function () {
      if (!this.barcodePresenter) {
        this.barcodePresenter = this.presenterFactory.create('scan_barcode_presenter', this);
      }

      var that = this;
      this.kitModel.tubes.then(function(tubes) {
        that.rowPresenters = _.chain(tubes).map(function() {
          return that.presenterFactory.create('row_presenter', that);
        }).value();
      });
      this.setupSubModel();
      return this;
    },

    setupSubModel: function () {
      var modelJson = {
        "type":"Kit",
        "value":"Kit0001"
      };

      var that = this;
      var jquerySelectionForBarcode = function () {
        return that.jquerySelection().find('.barcode')
      }
      this.kitModel.tubes.then(function(tubes) {
        for (var i = 0; i < tubes.length; ++i) {
          var row = i;
          var rowModel = that.kitModel.getRowModel(row);
          that.rowPresenters[row].setupPresenter(rowModel, function () {
            return that.jquerySelection().find('.row' + row);
          });
        }
      });

      this.barcodePresenter.setupPresenter(modelJson, jquerySelectionForBarcode);
      this.barcodePresenter.focus();
      this.setValidState();
      return this;
    },

    renderView: function () {
      // render view...
      this.currentView.renderView();

      if (this.barcodePresenter) {
        this.barcodePresenter.renderView();
      }

      return this;
    },

    setValidState: function () {
      var kitType = this.jquerySelection().find('.kitSelect').val();
      var valid   = this.kitModel.validateKitTubes(kitType);
      this.currentView.setKitValidState(valid);

      return valid;
    },

    getTubeFromModel: function (requester, barcode) {
      this.kitModel.findTubeInModelFromBarcode(barcode).then(function(result) {
        if (!result) {
          requester.displayErrorMessage("Barcode not found");
        } else {
          requester.updateModel(result);
        }
      });
    },

    getSpinColumnFromModel: function (requester, barcode) {

      var result = this.kitModel.findSCInModelFromBarcode(barcode);
      if (!result) {
        requester.displayErrorMessage("Spin column is not in kit");
      } else {
        requester.updateModel(result);
        this.kitModel.makeTransfer(requester.labware1, requester.labware2, requester);
      }
    },

    release:function () {
      this.currentView.clear();
      return this;
    },

    childDone:function (child, action, data) {

      if (child === this.currentView) {
        if (action === "next") {

          if (this.setValidState()) {
            // Confirm complete...
          } else {
            this.owner.childDone(this, "error", {"message":"Error: The kit isn't validated."});
          }

        } else if (action === "savePrintBC") {
          this.kitModel.saveKitCreateBarcodes();
          // TODO : print call here !
          this.owner.childDone(this, "error", {"message":"Kit saved and Spin Column Barcodes printed"});
          this.setupSubPresenters();
          this.currentView.toggleHeaderEnabled(false);

        } else if (action === "printBC") {
          this.kitModel.kitSaved = true;
          this.kitModel.createMissingSpinColumns();
          this.owner.childDone(this, "error", {"message":"Spin Column Barcodes printed"});
          this.setupSubPresenters();
          this.currentView.toggleHeaderEnabled(false);
        }
      }

      if (action === "barcodeScanned") {
        if (child.labwareModel.expected_type === "tube") {
          this.getTubeFromModel(child, data);
        } else if (child.labwareModel.expected_type === "spin_columns") {
          this.getSpinColumnFromModel(child, data);
        }
      }
    }

  });

  return KitPresenter;
});
