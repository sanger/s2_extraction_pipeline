define([
  'config'
  , 'models/selection_page_model'
  , 'presenters/selection_page_presenter'
  , 'presenters/presenter_factory'
  , 'text!testjson/unit/root.json'
  , 'text!extraction_pipeline/dna_and_ran_manual_test_data.json'
], function (config, SelectionPageModel, SelectionPagePresenter, PresenterFactory, rootTestData, testData) {
  'use strict';

  describe("Selection page presenter", function () {


    describe(" which has spy subpresenters", function () {

      beforeEach(function () {

        config.loadTestData(testData);
        config.cummulativeLoadingTestDataInFirstStage(rootTestData);
        config.logLevel = 0;

        // create a mock of the app
        var app = {};
        app.childDone = function (presenter, action, data) {
        };

        // create a mock of the view
        var view = {};
        view.clear = function () {
        };
        view.render = function (data) {
        };
        view.getRowByIndex = function (index) {
          return "row_" + index;
        };

        //spy on the mock view functions
        spyOn(view, 'clear');
        spyOn(view, 'render');

        var presenter = PresenterFactory.create(presenterName, this.mainController, initData);

        var configLoaded = false;

        // Iterate through the data to a point where two tubes are created
        runs(function(){
          for (var i=1; i<10; i++){
            config.progress(String(i));
          }
          var hasConfigLoaded = true;
        });
        waitsFor(function(){
          return configLoaded;
        });


        presenter.setupPresenter(model, function () {
          return $("#content");
        });
        presenter.model = model;
        presenter.setupSubPresenters();
        // setup presenter sets the view, we now want to override it to be
        // a the test spy view
        presenter.view = view;
      });

      it("kjh",function(){
        runs(function(){
          expect(1).toEqual(7);
        });
      });

      /*

       var model = undefined;
       var presenter = undefined;
       var view = undefined;
       var app = undefined;
       var partialFactory = undefined;
       var mockPresenters = undefined;
       var mockViews = undefined;

       function configureSpyView() {
       view = {};
       view.clear = function () {
       };
       view.render = function (data) {
       };
       view.getRowByIndex = function (index) {
       return "row_" + index;
       };

       spyOn(view, 'clear');
       spyOn(view, 'render');
       }

       function configureSpyAppController() {
       app = {};
       app.childDone = function (presenter, action, data) {
       };

       spyOn(app, 'childDone');
       }

       function createMockPresenter(name) {
       var mockPresenter = { name:name};
       mockPresenter.setupPresenter = function (input_model, jquerySelection) {
       };
       mockPresenter.setupPlaceholder = function (jquerySelection) {
       };
       mockPresenter.updateModel = function (input_model) {
       };
       mockPresenter.setupSubModel = function (model, jquerySelection) {
       };
       mockPresenter.setupView = function () {
       };
       mockPresenter.renderView = function () {
       };
       mockPresenter.release = function () {
       };
       mockPresenter.childDone = function (presenter, action, data) {
       };

       spyOn(mockPresenter, 'setupPresenter');
       spyOn(mockPresenter, 'setupPlaceholder');
       spyOn(mockPresenter, 'setupSubModel');
       spyOn(mockPresenter, 'setupView');
       spyOn(mockPresenter, 'renderView');
       spyOn(mockPresenter, 'release');
       spyOn(mockPresenter, 'childDone');

       mockPresenters.push(mockPresenter);
       return mockPresenter;
       }

       var createMockView = function(name) {
       var mockView = Object.create(null);
       mockView.name = name;

       mockView.render = function(model){
       };
       mockView.attachEvents = function(){
       };

       spyOn(mockView, 'render');
       spyOn(mockView, 'attachEvents')
       return mockView;
       };

       function configureMockPartialFactory() {
       partialFactory = {};
       partialFactory.createPresenter = function (name, owner) {
       return createMockPresenter(name);
       };
       partialFactory.createScanBarcodePresenter = function (owner, type) {
       var presenter = this.createPresenter("scanBarcode", owner);
       presenter.setupPresenter(type);
       return presenter;
       };
       partialFactory.createTubeRemovalPresenter = function (owner) {
       return this.createPresenter("tubeRemoval", owner);
       }
       }

       function expectPartial(partial, typeName, args) {
       expect(partial).toBeDefined();
       expect(partial.name).toEqual(typeName);
       if (args) {
       expect(partial.setupPresenter).toHaveBeenCalledWith(args);
       }
       expect(partial.renderView).toHaveBeenCalled();
       }


       */






//      it("updating presenter with empty model creates a ScanBarcodePresenter", function () {
//        runs(function () {
//          // one scan barcode and one tube removal
//          expect(mockPresenters.length).toBe(2);
//          presenter.renderView();
//        });
//        waitsFor(function () {
//              return mockPresenters.length >= 2;
//            },
//            "child presenters were never created",
//            100);
//        runs(function () {
//          expect(view.render).toHaveBeenCalled();
//          expect(mockPresenters.length).toBeGreaterThan(1);
//          expectPartial(mockPresenters[0], "tubeRemoval", null);
//          expectPartial(mockPresenters[1], "scanBarcode", "tube");
//        });
//      });
//
//      it("presenter release calls clear", function () {
//        presenter.release();
//        expect(view.clear).toHaveBeenCalled();
//        expect(view.render).not.toHaveBeenCalled();
//      });
//
//      it("childDone on next command delegates to app controller", function () {
//        presenter.childDone(presenter, "next", undefined);
//        expect(app.childDone).toHaveBeenCalledWith(presenter, "done", undefined);
//      });
//
//      it("removeTube message with uuid not matching any tube does nothing", function () {
//        runs(function () {
//          presenter.renderView();
//        });
//        waitsFor(function () {
//              return mockPresenters.length >= 2;
//            },
//            "2 child presenters to be created",
//            100);
//        runs(function () {
//          var tubeCount = model.getNumberOfTubes();
//          presenter.childDone(presenter, "removeTube", { tube:{ uuid:"1" } });
//          expect(model.getNumberOfTubes()).toBe(tubeCount);
//        });
//      });
//
//      it("removeTube message with uuid matching tube removes tube by uuid", function () {
//        var tubeCount;
//        runs(function () {
//          presenter.renderView();
//        });
//        waitsFor(function () {
//              return model.getNumberOfTubes() === 1
//            },
//            "tube to be added",
//            1000);
//        runs(function () {
//          tubeCount = model.getNumberOfTubes();
//          expect(tubeCount).toBe(1);
//          presenter.childDone(this, "removeTube", { tube:{ uuid:"11111111-2222-3333-4444-0000000000000" } });
//        });
//        waitsFor(function () {
//              return (model.getNumberOfTubes() === 0);
//            },
//            "tube count to be decremented " + model.getNumberOfTubes(),
//            100);
//        runs(function () {
//          expect(model.getNumberOfTubes()).toBe(0);
//        });
//
//      });
    });
  });
});
