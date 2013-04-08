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

"use strict";

define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations'
], function (BasePageModel, Operations) {

  var KitModel = Object.create(BasePageModel);

  $.extend(KitModel, {

    init:function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = [];
      this.spinColumns = [];
      this.availableBarcodes = [];
      this.kitSaved = false;
      this.order = undefined;

      this.inputRole = initData["input"];
      this.outputRoleForTube = initData["output"]["tube"];
      this.outputRoleForSC = initData["output"]["spin_column"];
      this.validKitType = initData["kitType"];

      return this;
    },
    setBatch:function (batch) {
      var that = this;
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.setAllTubesFromCurrentBatch(); // as in: from the batch, I get the tubes involved...


      this.batch.orders.then(function (result) {
        that.order = result[0];
      });

      this.owner.childDone(this, "batchAdded");
    },
    setAllTubesFromCurrentBatch:function () {
      var that = this;
      this.batch.items.then(function (items) {
            _.each(items, function (item) {
              if (item.role === that.inputRole && item.status === "done") {
                  that.fetchResourcePromiseFromUUID(item.uuid)
                      .then(function (rsc) {
                        that.addResource(rsc);
                        that.tubes.push(rsc);
                      });
                }
            });
          }
      );
//      this.uuids = this.owner.tubeUUIDs;
    },
    findTubeInModelFromBarcode:function (barcode) {

      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].rawJson.tube.labels.barcode.value == barcode.BC) {
          return this.tubes[i];
        }
      }

      return null;
    },
    findSCInModelFromBarcode:function (barcode) {
      for (var i = 0; i < this.spinColumns.length; i++) {
        if (this.spinColumns[i].barcode == barcode) {
          return this.spinColumns[i];
        }
      }

      return null;
    },
    validateKitTubes:function (kitType) {
      return (this.validKitType == kitType);
    },
    validateTubeUuid:function (data) {
      var valid = false;

      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].uuid == data.uuid) {
          valid = true;
          break;
        }
      }

      return valid;
    },
    validateSCBarcode:function (data) {
      return true;
    },
    getRowModel:function (rowNum) {
      var rowModel = {};

      var labware3ExpectedType = (this.validKitType == 'DNA/RNA') ? 'tube' : 'waste_tube';
      var labware3DisplayBarcode = (this.validKitType == 'DNA/RNA') ? true : false;

      if (!this.kitSaved) {
        rowModel = {
          "rowNum":rowNum,
          "labware1":{
            "resource":this.tubes[rowNum],
            "expected_type":"tube",
            "display_remove":false,
            "display_barcode":false
          },
          "labware2":{
            "expected_type":"spin_columns",
            "display_remove":false,
            "display_barcode":false
          },
          "labware3":{
            "expected_type":  labware3ExpectedType,
            "display_remove": false,
            "display_barcode":false
          }
        };
      }
      else {
        rowModel = {
          "rowNum":rowNum,
          "labware1":{
            "expected_type":"tube",
            "display_remove":true,
            "display_barcode":true
          },
          "labware2":{
            "expected_type":"spin_columns",
            "display_remove":false,
            "display_barcode":true
          },
          "labware3":{
            "expected_type":  labware3ExpectedType,
            "display_remove": false,
            "display_barcode":labware3DisplayBarcode
          }
        };
      }

      return rowModel;
    },

    createMissingSpinColumns:function () {
      var that = this;
      var listOfPromises = [];
      var root = null;

      this.owner.getS2Root().
        then(function (result) {
          root = result;
        }).then(function () {
          _.each(that.tubes, function (tube) {
            var registerLabwarePromise = $.Deferred();
            listOfPromises.push(registerLabwarePromise);

            Operations.registerLabware(
              root.spin_columns,
              'DNA',
              'stock'
            ).then(function (state) {
                that.stash_by_BC[state.barcode] = state.labware;
                that.stash_by_UUID [state.labware.uuid] = state.labware;
                that.spinColumns.push(state.labware);
                registerLabwarePromise.resolve();

              }).fail(function () {
                registerLabwarePromise.reject();
                that.owner.childDone(that, "failed", {});
              });
          });
        });
      $.when.apply(listOfPromises).then(function () {
        that.owner.childDone(that, "success", {});
      }).fail(function () {
          that.owner.childDone(that, "failed", {});
        });


    },

    makeTransfer:function (source, destination, rowPresenter) {
      var that = this;
      var s2root = null;

      this.owner.getS2Root().then(function (result) {
        s2root = result;
        return source.order;
      })
        .then(function (order) {
          Operations.betweenLabware(s2root.actions.transfer_tubes_to_tubes, [
            function (operations, state) {
              operations.push({
                input:{ resource:source, role:that.inputRole, order:order },
                output:{ resource:destination, role:that.outputRoleForSC},
                fraction:1.0,
                aliquot_type:source.aliquots[0].type
              });
            }
          ]
          ).
            operation()
            .then(function () {

              rowPresenter.childDone("...");
            });

                  rowPresenter.childDone("...");
                });
    },
    saveKitCreateBarcodes:function() {

      if (this.batch && this.kitBC) {
        this.batch.update({"kit" : this.kitBC});
        this.kitSaved = true;
        this.createMissingSpinColumns();
        // TODO : print call here !
        this.owner.setupSubPresenters();
        this.owner.currentView.toggleHeaderEnabled(false);
        this.owner.childDone(this, "error", {"message":"Kit saved and Spin Column Barcodes printed"});
      } else {
        this.owner.childDone(this, "error", {message: "Kit not saved!"});
      }
    }

  });

  return KitModel;

});
