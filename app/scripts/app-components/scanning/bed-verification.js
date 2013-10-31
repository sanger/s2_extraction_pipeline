define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording"
], function(linearProcess, bedRecording) {
  "use strict";
  return function(context) {
    /*
     * TODO: This must be refactored with time. These source lines cannot be
     * unordered and have lot of pre-assumptions about the tasks at lower
     * levels that may change in future. BEGIN refactor
     */
    var componentsList = [];
    context.dynamic = _.wrap(context.dynamic, function(func) {
      var attachFunction = _.wrap(arguments[1], function(previousAttach) {
        componentsList.push(arguments[1]);
        return previousAttach.call(this, arguments[1]);
      });
      return func.call(this, attachFunction);
    });
    var obj = linearProcess(context);
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