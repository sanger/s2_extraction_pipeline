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


define(['config'
  , 'mapper/s2_root'
  , 'extraction_pipeline/default/default_view'
  , 'text!components/S2Mapper/test/json/unit/root.json'
  , 'text!components/S2Mapper/test/json/unit/tube_by_barcode.json'],
    function (config, S2Root, view, rootTestJson, dataJSON) {
  /*
   The default page presenter. Deals with login.
   */

  // interface ....
  var defPtr = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    this.presenterFactory = presenterFactory;
    this.userBCSubPresenter = undefined;
    this.labwareBCSubPresenter = undefined;
    return this;
  };

  /*
   input_model =
   {
   userBC : "1234567890"
   labware : "1234567890"
   }
   */
  defPtr.prototype.setupPresenter = function (input_model, jquerySelection) {
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();
    if (input_model && input_model.constructor == Object) {
      this.updateModel(input_model);
    } else {
      throw {message:"DataSchemaError"}
    }
    return this;
  };

  defPtr.prototype.updateModel = function (input_model) {
    this.model = input_model;
    if (this.model) {
      // TODO: fix me -> eventually use a proper resource to check the user...
    }
    this.setupSubPresenters();

    return this;
  };

  defPtr.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  defPtr.prototype.setupSubPresenters = function () {
    // check with this.model for the needed subpresenters...
    this.userBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
    this.labwareBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
    this.setupSubModel();
    return this;
  };

  defPtr.prototype.setupSubModel = function () {
    var that = this;
    var jQuerySelectionForUser = function () {
      return that.jquerySelection().find(".user_barcode");
    };

    var jQuerySelectionForLabware = function () {
      return that.jquerySelection().find(".labware_barcode");
    };

    if (this.userBCSubPresenter) {
      this.userBCSubPresenter.setupPresenter({type:"user", value:"2345678901234"}, jQuerySelectionForUser);
    }
    if (this.labwareBCSubPresenter) {
      this.labwareBCSubPresenter.setupPresenter({type:"tube", value:"2345678901234"}, jQuerySelectionForLabware);
    }
    return this;
  };


  defPtr.prototype.setupView = function () {
    this.currentView = new view(this, this.jquerySelection);
    return this;
  };


  defPtr.prototype.renderView = function () {
    // render view...
    var data = undefined;

    this.currentView.renderView(data);
    if (this.userBCSubPresenter) {
      this.userBCSubPresenter.renderView();
    }
    return this;
  };

  defPtr.prototype.release = function () {
    this.currentView.release();
    return this;
  };


  defPtr.prototype.childDone = function (child, action, data) {
    // called when a child  wants to say something...

    if (child === this.userBCSubPresenter) {
      if (action === "barcodeScanned") {
        return this.handleBarcodeScanned(data);
      }
    } else if (child === this.currentView) {
      if (action === "login") {
        var dataForLogin = {
          userBC:data.userBC,
          labwareBC:data.labwareBC
        }
        return this.login(dataForLogin);
      }
    }

    console.error("unhandled childDone event:");
    console.error("child: ", child);
    console.error("action: " + action);
    console.error("data: " + JSON.stringify(data));
    //return this.owner.childDone(child, action, data);
    return this;
  };


  defPtr.prototype.login = function (dataForLogin) {
    // method called when try to login

    var tube, root;
    var that = this;

    if (!dataForLogin.userBC) {
      console.warn("something wrong happened with the user");
      return this;
    }
    if (!dataForLogin.labwareBC) {
      console.warn("something wrong happened with the tube");
      return this;
    }

    // TODO: for now, the tube is always the same... no use of the mapper
//    tubeBC = 'tube0001';
    config.setupTest(rootTestJson);
    S2Root.load()
        .done(function (result) {
          root = result;
        }).then(
        function () {
          config.setupTest(dataJSON);
          root.tubes.findByEan13Barcode(dataForLogin.labwareBC).done(
              function (result) {
                if (result) {
                 // debugger;
                  var dataForChildDone = {
                    // note that we're talking about UUID now ! but we're using the BC as uuid for now... ugly, I know
                    userUUID:dataForLogin.userBC,
                    labwareUUID:result.uuid,
                    batchUUID:undefined
                  };
                  console.warn("CALL TO S2MAPPER: TRY TO LOGIN ?");

                  that.owner.childDone(that, "login", dataForChildDone);
                } else {
                  // todo : handle error
                  debugger;
                }
              }
          ).fail(
              function () {
                debugger;
              }
          );
        });

    return this;
  };

  return defPtr;
});
