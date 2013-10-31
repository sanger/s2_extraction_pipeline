define([
  "lib/pubsub", 
  "views/row_view" , "app-components/linear-process/linear-process",
  "app-components/scanning/bed-verification" , "controllers/base_controller"
], function (PubSub, View, linearProcess, bedVerification, BaseController) {
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
      this.enabled      = true;
      return this;
    },
    setupModel:function (inputModel) {
      this.rowNum       = inputModel.rowNum;
      this.enabled      = inputModel.enabled;
      this.labwares     = inputModel;
      delete this.labwares.rowNum;
      delete this.labwares.enabled;
    },
    setResource:function (value) {
      this.resource = value
    }
  });

  var RowController = Object.create(BaseController);

  $.extend(RowController, {
    register: function(callback) {
      callback('row_bed_controller', function(owner, factory) {
        return Object.create(RowController).init(owner, factory);
      });
    },

    init:function (owner, controllerFactory) {
      this.controllerFactory = controllerFactory;
      this.owner = owner;
      return this;
    },

    setupController:function (input_model, jquerySelection) {
      var controller = this;
      this.jquerySelection = jquerySelection;

      this.rowModel = Object.create(RowModel).init(this);
      this.rowModel.setupModel(input_model);

      this.currentView = new View(this, this.jquerySelection());

      // NOTE: sort() call is needed here to ensure labware1,labware2,labware3... ordering
      this.controllers = _.chain(this.rowModel.labwares).pairs().sort().map(function(nameToDetails) {
        var name = nameToDetails[0], details = nameToDetails[1];
        var subController = controller.controllerFactory.create('labware_controller', controller);
        subController.setupController(details, function() { return controller.jquerySelection().find('.' + name); });
        return subController;
      });

      if (this.owner.config.rowBehaviour === "bedRecording")
        {
        this.currentView.renderView();
        var bedRecordingPromises = this.controllers.reduce(function(memo, p) { 
          p.renderView();
          if (_.has(p, "bedController"))
            {
              var component = p.bedController.component;
              $(document.body).on("scanned.robot.s2", _.partial(function(component) {
                component.view.trigger("activate");
              }, component));
              var promise = $.Deferred();
              component.view.on("scanned.bed-recording.s2", _.bind(promise.resolve, promise));
              memo.push(promise);
            }
          return memo;
          }, []).value();
        $.when.apply(this, bedRecordingPromises).then($.ignoresEvent(_.partial(function(controller, data, view) {
          var promisesData = Array.prototype.slice.call(arguments, 3);
          controller.isRowComplete = function() {
            return true;
          };
          controller.editableControllers = _.partial(function(robotBarcode, records) {
            // in bedRecording connected we need to have at least one input and one output per each row
            return _.chain(records).map(function(record) { 
              return {labwareModel: { resource: record}};}).reduce(function(memo, node) {
                return memo.concat([node, _.clone(node)]);
              }, []);
          }, promisesData[0], promisesData.slice(1));          
          controller.owner.owner.childDone(controller.owner.owner.view, "done", data);
          PubSub.publish("enable_buttons.step_controller.s2", controller.owner, data);
        }, controller, {buttons: [{action: "start"}]}))    );
        }
      else {
      this.currentView.renderView();
      var arrow = $(".transferArrow", controller.jquerySelection());
      
      this.linearProcessLabwares = bedVerification({
        dynamic: (function(componentsList, labwareList) {
          return function(attachComponentMethod) {
            _.each(componentsList, function(component, pos) {
              component.view = $(labwareList[pos]).append(component.view).parent();
              attachComponentMethod(component);
            });
          };
        } (this.controllers.map(function(controller) { return controller.getComponentInterface();}).value(), $("div.labware"))),
        validation: function() {
          var robot = arguments[0];
          var bedRecords = _.map(Array.prototype.slice.call(arguments, 1), function(list) {
            list=_.drop(list, 2); 
            return ({
              bed: list[0],
              plate: list[1]
            });
          });
          var defer = new $.Deferred();
          if (_.some(robot.beds, function(bedPair) {
            return (bedPair[0].barcode === bedRecords[0].bed && bedPair[1].barcode === bedRecords[1].bed); 
          })) {
            defer.resolve({
              robot: robot.barcode,
              verified: bedRecords
            });
          }
          else {
            defer.reject();
          }
          return defer;
        }
      });
      
      controller.jquerySelection().html("");
      controller.jquerySelection().append(this.linearProcessLabwares.view);
      $($("div.span3", controller.jquerySelection())[0]).after(arrow);
      controller.jquerySelection().on(_.omit(this.linearProcessLabwares.events, "scanned.robot.s2"));
      $(document.body).on(_.pick(this.linearProcessLabwares.events, "scanned.robot.s2"));
      $(document.body).on("scanned.robot.s2", _.partial(function(controller) {
        controller.jquerySelection().trigger("activate");
      }, controller));
      $(document.body).on("scanned.bed-verification.s2", $.ignoresEvent(_.partial(function(controller, data, verification) {
        controller.isRowComplete = function() {
          return true;
        };
        controller.editableControllers = _.partial(function(verification) {
          return _.chain(verification.verified).map(function(record) { return {labwareModel: { resource: record.plate}};});
        }, verification);
        controller.owner.owner.childDone(controller.owner.owner.view, "done", data);
        PubSub.publish("enable_buttons.step_controller.s2", controller.owner, data);
      }, controller, {buttons: [{action: "start"}]})));
      }
    },


    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      // Each labware controller is only enabled if it's previous is complete and it is not complete
      this.controllers.reduce(function(memo, controller) {
        if (!memo) {
          controller.labwareEnabled(false);
          return false
        }

        if (controller.isSpecial()) {
          controller.labwareEnabled(false);
          return true;
        } else if (controller.isComplete()) {
          controller.labwareEnabled(false);
          return true;
        } else {
          controller.labwareEnabled(true);
          return false;
        }
      }, this.rowModel.enabled).value();
    },
    focus: function() {
      var nextInput = this.editableControllers()
        .find(function(p) { return !p.isComplete(); })
        .value();

      if (nextInput) {
        nextInput.barcodeFocus();
      }
    },

    childDone:function (child, action, data) {
      var data = $.extend(data, { origin: child });

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action === 'resourceUpdated') {
        if (this.isRowComplete() && (child === this.editableControllers().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      } else if (action === 'removeLabware') {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        child.release();
        delete child.resource;
        delete child.resourceController;
        delete child.barcodeInputController;
        child.setupController(this.rowModel.labwares['labware' + (this.controllers.value().indexOf(child) + 1)], child.jquerySelection);
        child.renderView();
        this.owner.childDone(this, eventPrefix+'Removed', data);
      } else if (action === "barcodeScanned") {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        this.owner.childDone(this, eventPrefix+'BarcodeScanned', data);
        this.focus();
      }
    },

    editableControllers: function() {
      return this.controllers.compact().filter(function(controller) { 
        return !controller.isSpecial()  && !((!_.isUndefined(controller.labwareModel.resource)) && (controller.labwareModel.resource.tracked === false));
      });
    },

    isRowComplete: function() {
      return this.editableControllers().all(function(p) { return p.isComplete(); }).value();
    },

    lockRow: function() {
      this.controllers.each(function(controller) {
        controller.hideEditable();
      });
    },

    unlockRow: function(){
      this.controllers.each(function(controller) {
        controller.showEditable();
      });
      this.focus();
    },

    handleResources: function(callback) {
      callback.apply(null, this.editableControllers().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowController;
});
