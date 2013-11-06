define([
  "controllers/base_controller",
  'models/selection_page_model',
  "app-components/dropzone/dropzone",
  "lib/pubsub"
], function (Base, Model, dropZone, PubSub) {
  "use strict";

  var Controller = Object.create(Base);

  _.extend(Controller, {
    register: function (callback) {
      callback("imager_controller", function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.class = "ImagerController";
      this.owner = owner;
      this.notBatched=true;
      this.config = config;
      this.controllerFactory = factory;
      this.model = Object.create(Model).init(this, config);
    },

    setupController: function (inputModel, selector) {
      this.model
      .then(function (model) {
        return model.setup(inputModel);
      });

      var container = selector();
      $(container.find(".endButton")[1]).attr("type", "file");

      this.selector = selector;
    },

    focus: function () {},

    release: function () {
      this.view.clear();
      return this;
    },

    initialController: function () {
      this.owner.childDone(this, "disableBtn", {});
      this.owner.childDone(this, "enableBtn", {buttons: [{action: "start"}]});
    },
    previousDone: function() {
      this.owner.childDone(this, "disableBtn", {});
    },

    childDone: function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else {
        // debugger
      }
    },

    print: function(){
      var thisController = this;
      var printer        = $(".printer-select").val();

      this.model.fire(printer).fail(function(error){
        PubSub.publish("error.status.s2", thisController, { message: error });
      }).then(function(){
        thisController.view.disableDropZone();

        thisController.owner.childDone(this, "disableBtn", {
          buttons: [{action: "print"}]
        });

        thisController.owner.childDone(this, "enableBtn", {
          buttons: [{action: "next"}]
        });

        PubSub.publish("message.status.s2", thisController, { message: "Rack registered." });
      });
    },

    next: function(){
      this.owner.childDone(this, "done", {batch: this.model.batch, user: this.model.user});
    },

    viewDone: function (child, action) {
      if (action === "transferAuthorised") {
        this.model.fire();
      }
    },
    
    start: function(e) {
    },

    end:   eventHandler,
    select: function() {
    },
    makeBatchHandler: function() {
      var controller = this;
      if (controller.notBatched) {
        return function (e) {
          controller.model
            .then(function (model) {
              return model.changeRoleWithoutChangingBatch();
            })
            .fail(function (error) {
              PubSub.publish("error.status.s2", controller, error);
            })
            .then(function (model) {
              controller.owner.childDone(controller, "done", {batch:null,labware:null});
            });
        }
      } else {
        return function (e) {
          if (!controller.batchCreated) {
            controller.batchCreated = true;
            controller.jquerySelection().find("button.btn").attr("disabled", "disabled");
            controller.model
              .then(function (model) {
                return model.makeBatch()
              })
              .fail(function (error) {
                PubSub.publish("error.status.s2", controller, error);
              })
              .then(function (model) {
                controller.owner.childDone(controller, "done", {batch: model.batch});
              });
          }
        }
      }
    }

  });
  
  function eventHandler(child, action, data) {
    var that = this;
    return this.makeBatchHandler().apply(this,arguments);
  }

  return Controller;
});
