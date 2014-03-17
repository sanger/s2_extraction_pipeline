define([
  "text!app-components/inbox/_component.html",
  "default/default_model",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (htmlPartial, DefaultPageModel) {
  "use strict";

  var template = _.compose($, _.template(htmlPartial));

  var initializeViz, workbook, activeSheet, applyFilters;

  function createHtml(context) {
    var html = template(context);

    initializeViz = function initializeViz() {
      var defaultModel = Object.create(DefaultPageModel).init(context.app);
      var viz;
      var placeholderDiv = html.find(".tableau-viz")[0];
      
      var options = {
          width: 710,
          height: 500,
          hideTabs: true,
          hideToolbar: true,
          onFirstInteractive: function(e) {
            workbook = viz.getWorkbook();
            activeSheet = workbook.getActiveSheet();
          }
      };

      viz = new tableauSoftware.Viz(placeholderDiv, context.inboxUrl, options);

      viz.addEventListener(tableauSoftware.TableauEventName.MARKS_SELECTION, onMarksSelection);

      function onMarksSelection(marksEvent) {
        return marksEvent.getMarksAsync().then(reportSelectedMarks);
      }

      // When a Tableau mark has been clicked we run the following...
      function reportSelectedMarks(marks) {
        var ean13 = marks[0].$0.$1.$1._ean13_barcode.value;

        defaultModel
        .setLabwareFromBarcode(ean13)
        .then(function(defaultModel){
          // owner in this case is app.js
          defaultModel.owner.updateModel(defaultModel);
        })
        .then(function(){
          // TODO: Add proper event listener.
          $('#page-nav a[href="#pipeline"]').tab('show');
        });
      }
    };

    applyFilters = function applyFilters() {
      activeSheet.applyFilterAsync(
          "step",
          context.filterByRoles,
          tableauSoftware.FilterUpdateType.REPLACE);
    }

    return html;
  }

  return function(context) {
    var view = createHtml(context),
    events = {
      "shown": function(e){
        // This is a bit hacky but we check the href of the target tab. If it
        // matches this inbox then we initialise Tableau.  This stops Tableau
        // being called unnecessarily.
        if (e.target.getAttribute("href") === "#"+context.id){
          applyFilters();
        }
      }
    };

    initializeViz();

    return {
      view:   view,
      events: events
    };
  };
});
