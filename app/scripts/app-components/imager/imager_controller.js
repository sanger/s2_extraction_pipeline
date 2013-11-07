define([ "app-components/imager/imager", "models/selection_page_model"
], function(imager, Model) {
  "use strict";
  return (
    { register : function(callback) {
      return callback("imager", imagerController);
    }
    });
  function imagerController(owner, factory, config) {
    
    return (
      { notBatched: true,
        getS2Root: _.constant(owner.rootPromise),
        setupController : function(inputModel, selector) {
        this.config = config;
        this.owner = owner;
        var component = imager();
        var view = selector();
        view.html(component.view);
        view.on(component.events);
        this.component = component;
        
        
        this.focus();
        
        this.model = Object.create(Model).init(this, config);
        view.on("upload.request.imager.s2", _.bind(this.makeBatchHandler(), this));

        this.model
        .then(function (model) {
          return model.setup(inputModel);
        });
        
        return this;
      }, release : function() {},
      initialController: function(){
        //this.focus();
      },
      focus: function() {
        this.component.view.trigger("activate.s2");
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
          };
        } else {
          return function (e) {
            if (!controller.batchCreated) {
              controller.batchCreated = true;
              controller.jquerySelection().find("button.btn").attr("disabled", "disabled");
              controller.model
                .then(function (model) {
                  return model.makeBatch();
                })
                .fail(function (error) {
                  PubSub.publish("error.status.s2", controller, error);
                })
                .then(function (model) {
                  controller.owner.childDone(controller, "done", {batch: model.batch});
                });
            }
          };
        }
      }

      });
  }
});
