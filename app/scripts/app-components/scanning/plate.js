define([ "text!app-components/scanning/_plate.html",
    "app-components/labelling/scanning", "app-components/labware/display",
    "labware/standard_mappers", "lib/jquery_extensions"
], function(plateTemplate, labwareScanner, labwareDisplay, representer) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var LABWARE_DISPLAY = "display.labware.s2";
  var PLATE_SCANNED = "scanned.plate.s2";
  var DONE = "done.s2";
  return function(context) {
    var html = $(_.template(plateTemplate)());
    var labware = labwareDisplay({});
    html.find(".labware").append(labware.view);
    html.on(labware.events);
    var obj = labwareScanner(
      { label : "Scan plate barcode"
      });
    obj.view.append(html);
    obj.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      context.root().then(function(root) {
        root.findByLabEan13(barcode).then(function(labware) {
          obj.view.trigger(LABWARE_DISPLAY, representer(labware));
          return labware;
        }).then(function(labware) {
          obj.view.trigger(PLATE_SCANNED, labware);
          obj.view.trigger(DONE, obj.view);
        });
      });
    }));
    return obj;
  };
});