define([
  'extraction_pipeline/workflow_engine'
 , 'mapper/s2_ajax'
],
    function (workflowEngine, S2Ajax) {
      var app = function (thePresenterFactory) {
        this.presenterFactory = thePresenterFactory;
        this.workflow = new workflowEngine(this);

        this.currentPagePresenter = undefined;
        this.model = undefined;
        return this;
      };

      app.prototype.setupPresenter = function (inputModel) {
        /*
        inputModel =
        {
          userUUID    : "", // current user UUID
          labwareUUID : "", // the seminal labware UUID
          batchUUID   : "" // the current batch
        };
        */
        this.setupPlaceholder();
        this.setupView();
        this.renderView(); // render empty view...
        if (!inputModel) {
          inputModel = {
            userUUID:undefined,
            labwareUUID:undefined,
            batchUUID:undefined
          };
        }
        this.updateModel(inputModel);

        return this;
      };

      app.prototype.updateModel = function (inputModel) {
        /*
         inputModel =
         {
         userUUID    : "", // current user UUID
         labwareUUID : "", // the seminal labware UUID
         batchUUID   : "" // the current batch
         };
         */
        this.model = inputModel;
        this.updateSubPresenters();
        return this;
      };

      app.prototype.setupPlaceholder = function () {
        this.jquerySelection = function () {
          return $('#content');
        };
        return this;
      };

      app.prototype.updateSubPresenters = function () {

        if (this.currentPagePresenter) {
          this.currentPagePresenter.release();
          this.currentPagePresenter = undefined;
        }

        var inputModelForWorkflowEngine = {
          userUUID:this.model.userUUID,
          labwareUUID:this.model.labwareUUID,
          batchUUID:this.model.batchUUID
        };

        if (this.model.hasOwnProperty("HACK")) {
          inputModelForWorkflowEngine.HACK = "hack";
        }

        this.currentPagePresenter = this.workflow.getNextPresenter(this.presenterFactory, inputModelForWorkflowEngine);
//    //this.currentPagePresenter = this.workflow.get_default_presenter(this.presenterFactory);
//
//    // marshalling the data for the default presenter... here... nothing to do!
        var inputModelForPresenter = {
          userUUID:this.model.userUUID,
          labwareUUID:this.model.labwareUUID,
          batchUUID:this.model.batchUUID
        };
        if (this.model.hasOwnProperty("HACK")) {
          inputModelForPresenter.HACK = "hack";
        }

        this.currentPagePresenter.setupPresenter(inputModelForPresenter, this.jquerySelection);
        return this;
      };

      app.prototype.setupView = function () {
        // no view for this presenter...
        return this;
      };

      app.prototype.renderView = function () {
        // nothing to render
        return this;
      };

      app.prototype.release = function () {
        return this;
      };

      app.prototype.childDone = function (child, action, data) {
        /*
         data =
         {
         userUUID    : "", // current user UUID
         labwareUUID : "", // the seminal labware UUID
         batchUUID   : "" // the current batch
         };
         */
        console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);
        try {
          var inputDataForModel;
          if (action == "done") {

            inputDataForModel = {
              userUUID:this.model.userUUID,
              labwareUUID:this.model.labwareUUID,
              batchUUID:data.batchUUID
            };
            if (data.hasOwnProperty("HACK")) {
              inputDataForModel.HACK = "hack";
            }
            this.updateModel(inputDataForModel);

          } else if (action == "login") {

            inputDataForModel = {
              userUUID:data.userUUID || this.model.userUID,
              labwareUUID:data.labwareUUID,
              batchUUID:data.batchUUID
            };
            this.updateModel(inputDataForModel);
          }

          return this;
        } catch (err) {
          if (err.message == "DataSchemaError"){
            // do something ?
            throw {
              type:"DataSchemaError",
              message:"DataSchemaError"
            }
          } else {
            throw err;
          }
        }

      };

      app.prototype.HACK_add_global_tube_uuids = function (tubeUUIDs) {
        this.tubeUUIDs = tubeUUIDs;
      }


      return app;
    });
