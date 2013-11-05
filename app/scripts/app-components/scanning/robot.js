define([ "app-components/labelling/scanning", "lib/jquery_extensions"
], function(labwareScanner) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var ROBOT_SCANNED = "scanned.robot.s2";
  var DONE = "done.s2";
  function findRobotByBarcode(barcode) {
    return $.get('/config/robots/gel-fx/' + barcode + '.json');
  }
  return (function(context) {
    var scanner = labwareScanner(
      { label : "Scan robot barcode"
      });
    
    scanner.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      findRobotByBarcode(barcode).then(function(robot) {
        scanner.view.trigger(ROBOT_SCANNED, robot);
        scanner.view.trigger(DONE, scanner.view);
        return true;
      });
    }));
    return scanner;
  });
});