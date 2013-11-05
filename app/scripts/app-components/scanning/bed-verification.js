define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording"
], function(linearProcess, bedRecording) {
  "use strict";
  
  var robotScannedPromise = $.Deferred();

  
  return function(context) {

    function buildBedRecording(context, list) {
      return list[list.push(bedRecording(context))-1];
    }
    var componentsList=[];
    var obj = linearProcess({
      components: [
                   { constructor: _.partial(buildBedRecording, context, componentsList)},
                   { constructor: _.partial(buildBedRecording, context, componentsList)}
                   ]
    });

    var bedVerificationPromises =
    _.map(componentsList, function(component) {
      var promise = $.Deferred();
      component.view.on("scanned.bed-recording.s2", function(robot, bedBarcode,
        plateResource) {
        promise.resolve(arguments);
      });
      return promise;
    });
    /*
     * END refactor
     */
    $.when.apply(undefined, [ robotScannedPromise
    ].concat(bedVerificationPromises)).then(context.validation).then(
      function() {
        obj.view.trigger("scanned.bed-verification.s2", arguments);
      });
    //obj.view.on(obj.events);
    
    _.extend(obj.events,
      { "scanned.robot.s2" : $.ignoresEvent(_.partial(function(promise, previous, robot) {
        if (!!previous) {
          previous.call(this, robot);
        }
        promise.resolve(robot);
      }, robotScannedPromise, obj.events["scanned.robot.s2"]))
      });
    return obj;
  };
});