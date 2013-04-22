define([
       'extraction_pipeline/presenters/connected_presenter',
       'extraction_pipeline/views/byproduct_transfer_page_view',
       'extraction_pipeline/models/byproduct_transfer_model'
], function (ConnectedPresenter, View, Model) {
  "use strict";

  var Presenter = ConnectedPresenter.extend('byproduct_transfer_presenter', Model, View);

  $.extend(Presenter, {
    renderView:function () {
      // render view...
      var dataForView = null;

      if (this.model && this.model.config){
        dataForView = {
          batch:this.model.batch && this.model.batch.uuid,
          user:this.model.user,
          processTitle:this.model.config.processTitle
        }
      }

      this.currentView.renderView(dataForView);
      if (this.barcodePresenter) {
        this.barcodePresenter.renderView();
      }
      return this;
    }
  });

  return Presenter;
})
;
