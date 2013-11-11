define([ "config", "app-components/imager/imager", /*"models/connected"*/ "models/selection_page_model" , "lib/pubsub", 'mapper/operations'//"models/selection_page_model"
], function(appConfig, imager, Model, PubSub, Operations) {
  "use strict";
  return (
    { register : function(callback) {
      return callback("imager", imagerController);
    }
    });
  function imagerController(owner, factory, config) {
    var uuid = config.initialLabware.uuid;

    return { 
      notBatched: true,
      getS2Root: _.constant(owner.rootPromise),
      setupController : function(inputModel, selector) {
        this.config = config;
        this.owner = owner;
        var component = imager({labware: config.initialLabware});
        var view = selector();
        view.html(component.view);
        view.on(component.events);
        this.component = component;
        
        
        this.focus();
        
        this.model = Object.create(Model).init(this, config);
        view.on("begin.imager.s2", _.partial(function(model) {
          model.started = true;          
          PubSub.publish("message.status.s2", this, {message: 'Transfer started'});
          config.initialLabware.order().then(function(orderObj) {
            return {
              input: {
                order: orderObj,
                resource: config.initialLabware,
                role: config.input.role
              },
              output: {
                order: orderObj,
                resource: config.initialLabware,
                role: config.output[0].role                 
              }
            };
         }).then(function(data) {
           Operations.stateManagement().start({ updates: [data]});
         });          
        }, this.model));
        view.on("completed.imager.s2", _.partial(function(model) {
          PubSub.publish("message.status.s2", this, {message: 'Transfer completed'});
          config.initialLabware.order().then(function(orderObj) {
            return {
              input: {
                order: orderObj,
                resource: config.initialLabware,
                role: config.input.role
              },
              output: {
                order: orderObj,
                resource: config.initialLabware,
                role: config.output[0].role                 
              }
            };
         }).then(function(data) {
           Operations.stateManagement().complete({ updates: [data]});
         });          
        }, this.model));        

        this.model
        .then(function (model) {
          return model.setup(inputModel);
        });
        
        var dataParams = {
          out_of_bounds: {
            image: ""
          }
        };
        view.on("uploaded.request.imager.s2", _.partial(function(file, event, data) {
          file.image = window.btoa(data.content);
          file.dataType = "BASE64";
        }, dataParams.out_of_bounds));
        view.on("upload.request.imager.s2", _.partial(function(dataParams, model, uuid) {
          // This must be moved to S2 Mapper
          var url = appConfig.apiUrl + "lims-laboratory";
          var promiseQuery = $.ajax(url+"/"+uuid, {
            method: "PUT",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(dataParams)
          });
        }, dataParams, this.model, uuid));        
        return this;
      }, release : function() {},
      initialController: function(){
      },
      focus: function() {
        this.component.view.trigger("activate.s2");
      }
    };
  }
});
