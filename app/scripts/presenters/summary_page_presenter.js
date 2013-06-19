define(['extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/summary_page_model'
  , 'text!extraction_pipeline/html_partials/summary_page_partial.html'
  , 'extraction_pipeline/lib/pubsub'
], function (BasePresenter, Model, summaryPagePartialHtml, PubSub) {

  var SummaryPagePresenter = Object.create(BasePresenter);

  $.extend(SummaryPagePresenter, {
    register: function (callback) {
      callback('summary_page_presenter', function (owner, factory, initData) {
        return Object.create(SummaryPagePresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    },

    setupPresenter: function (setupData, jquerySelection) {
      var thisPresenter = this;
      thisPresenter.jquerySelection = jquerySelection;

      thisPresenter.model
        .then(function (model) {
          return model.setupModel(setupData);
        })
        .then(function () {
          thisPresenter.renderView();
        });
      return this;
    },

    renderView: function () {
      var thisPresenter = this;
      var template = _.template(summaryPagePartialHtml);

      var templateData = {};
      templateData.config = thisPresenter.config;
      var model;
      thisPresenter.model
        .then(function (result) {
          model = result;
          return model.labwares;
        })
        .fail(function (error) {
          thisPresenter.message('error', 'Labware not found for this batch');
        })
        .then(function (labwares) {
          templateData.items = transformOrdersAndLabwareToHtmlTemplateData(model.ordersByUUID, labwares, model.batch.uuid);
          thisPresenter.jquerySelection().html(template(templateData));
        });

      return this;
    },
    message:    function (type, message) {
      if (!type) {
        this.jquerySelection()
          .find('.validationText')
          .hide();
      } else {
        this.jquerySelection()
          .find('.validationText')
          .show()
          .removeClass('alert-error alert-info alert-success')
          .addClass('alert-' + type)
          .html(message);
      }
    }
  });

  function transformOrdersAndLabwareToHtmlTemplateData(orders, labwares, modelBatchUUID) {
    var templateData = [];
    _.each(orders, function (order) {
      _.each(order.items, function (itemsByRole) {
        _.each(itemsByRole, function (item) {
          var batch_uuid = item.batch ? item.batch.uuid : "Not found";
          templateData.push({
            order_uuid:     order.uuid,
            role:           item.role,
            status:         item.status,
            type:           getLabwareTypeFromUUID(item.uuid, labwares),
            barcode:        getLabwareBarcodeFromUUID(item.uuid, labwares),
            sanger_barcode: getSangerBarcodeFromUUID(item.uuid, labwares),
            batch_uuid:     batch_uuid,
            display_format: (modelBatchUUID === batch_uuid) ? "enabledRow": "disabledRow"
          });
        });
      });
    });
    return templateData;
  }

  function getLabwareBarcodeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return (labware.labels.barcode && labware.labels.barcode.value) || "Not found";
    } else {
      return  "Labware not found";
    }
  }

  function getSangerBarcodeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return  (labware.labels.sangerBarcode && labware.labels.sangerBarcode.value) || "Not Found";
    } else {
      return "Labware not found";
    }
  }

  function getLabwareTypeFromUUID(labwareUUID, labwares) {
    var labware = getLabwareFromUUID(labwareUUID, labwares);
    if (labware) {
      return labware.resourceType || "Type not found";
    } else {
      return "Labware not found";
    }
  }

  function getLabwareFromUUID(labwareUUID, labwares) {
    return _.find(labwares, function (labware) {
      return labware.uuid === labwareUUID;
    });
  }

  return SummaryPagePresenter;
});
