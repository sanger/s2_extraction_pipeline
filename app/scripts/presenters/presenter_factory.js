define(['extraction_pipeline/presenters/scan_barcode_presenter',
	'extraction_pipeline/presenters/selection_page_presenter',
	'extraction_pipeline/presenters/tube_removal_presenter',
	'extraction_pipeline/presenters/empty_presenter',
	'extraction_pipeline/default/default_presenter',
  'extraction_pipeline/presenters/kit_presenter',
  'extraction_pipeline/presenters/row_presenter',
  'labware/presenters/tube_presenter',
  'labware/presenters/spin_column_presenter'],
       function(ScanBarcodePresenter,
		SelectionPagePresenter,
		TubeRemovalPresenter,
    EmptyPresenter,
    DefaultPresenter,
    KitPresenter,
    RowPresenter,
    TubePresenter,
    SpinColumnPresenter) {
  'use strict';

  var PresenterFactory = function () {
    /* Construct an instance of PresenterFactory
     *
     * This is an implementation of the AbstractFactory pattern. The 
     * intention of using the pattern is to allow presenters that create
     * partial presenters to have a mock implementation in the testing. Otherwise
     * views are likely to be created in the testing, which will likely mess about
     * with the Jasmine testing library. 
     */
    return this;
  }

  PresenterFactory.prototype.createScanBarcodePresenter =
    function (owner, type) {
      return new ScanBarcodePresenter(owner, this);
    };

  PresenterFactory.prototype.createTubeRemovalPresenter = 
    function (owner) {
      return new TubeRemovalPresenter(owner, this);
    };

  PresenterFactory.prototype.createTubePresenter = 
    function (owner) {
      return new TubePresenter(owner, this);
    };
    
  PresenterFactory.prototype.createDefaultPresenter =
    function (owner) {
      return new DefaultPresenter(owner, this);
    };

  PresenterFactory.prototype.createEmptyPresenter =
    function (owner) {
      return new EmptyPresenter(owner, this);
    };

  PresenterFactory.prototype.createKitPresenter =
    function (owner) {
      return new KitPresenter(owner, this);
    };

 PresenterFactory.prototype.createRowPresenter =
   function (owner) {
     return new RowPresenter(owner, this);
   };

 PresenterFactory.prototype.createSpinColumnPresenter =
   function (owner) {
     return new SpinColumnPresenter(owner, this);
   };

  return PresenterFactory;
});
