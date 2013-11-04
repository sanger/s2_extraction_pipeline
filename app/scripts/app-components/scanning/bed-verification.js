define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording"
], function(linearProcess, bedRecording) {
  "use strict";
  return function(context) {

    function buildBedRecording(context, list) {
      return list[list.push(bedRecording(context))];
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
    var robotScannedPromise = $.Deferred();
    $.when.apply(this, [ robotScannedPromise
    ].concat(bedVerificationPromises)).then(context.validation).then(
      function() {
        obj.view.trigger("scanned.bed-verification.s2", arguments);
      });
    obj.view.on(obj.events);
    _.extend(obj.events,
      { "scanned.robot.s2" : $.ignoresEvent(_.partial(function(promise, robot) {
        promise.resolve(robot);
      }, robotScannedPromise))
      });
    return obj;
  };
});