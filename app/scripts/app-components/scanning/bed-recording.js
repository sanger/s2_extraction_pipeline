define([ "text!app-components/scanning/_bed-recording.html",
         "app-components/linear-process/linear-process",
         "app-components/scanning/bed",
         "app-components/scanning/plate",
    "lib/jquery_extensions"
], function(bedRecordingTemplate, linearProcess, bed, plate) {
  "use strict";
  /* Listens */
  var PLATE_SCANNED = "scanned.plate.s2";
  var BED_SCANNED = "scanned.bed.s2";
  var BED_RECORDING_RESET = "reset.bed-recording.s2";
  /* Triggers */
  var BED_RECORDING_DONE = "done.bed-recording.s2";
  var DONE = "done.s2";
  
  return function(context) {
    var html = $(_.template(bedRecordingTemplate)());
    var component = linearProcess(
      { components : [
        { constructor : _.partial(bed, context),
        },
        { constructor : _.partial(plate, context)
        }
      ]
      });
    html.append(component.view);
    var promisesBedRecordingDone = _.chain([ BED_SCANNED, PLATE_SCANNED
    ]).map(_.partial(function(view, eventName) {
      var deferred = $.Deferred();
      view.on(eventName, $.ignoresEvent(function() {
        return deferred.resolve.apply(this, arguments);
      }));
      return deferred;
    }, html)).value();
    $.when.apply(this, promisesBedRecordingDone).then(
      function(plateResource, bedBarcode) {
        html.trigger(BED_RECORDING_DONE, [ html, plateResource, bedBarcode
        ]);
        html.trigger(DONE, html);
      });
    return (
      { view : html, events : _.extend(
        { BED_RECORDING_RESET : function() {}
        }, component.events)
      });
  };
});