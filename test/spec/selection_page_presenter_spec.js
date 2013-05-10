define([
  'config'
  , 'mapper_test/resource_test_helper'
  , 'mapper/s2_root'
  , 'models/selection_page_model'
  , 'presenters/selection_page_presenter'
  , 'presenters/presenter_factory'
  , 'text!mapper_testjson/unit/root.json'
  , 'text!extraction_pipeline/dna_and_ran_manual_test_data.json'
  , 'text!pipeline_testjson/selection_page_presenter_data.json'
], function (config, TestHelper, S2Root, SelectionPageModel, SelectionPagePresenter, PresenterFactory, rootTestData, testData, selectionPageData) {
  'use strict';


  function getAResource(owner, uuid) {
    var deferredS2Resource = new $.Deferred();
    owner.getS2Root()
      .then(function (root) {
        return root.find(uuid);
      }).then(function (result) {
        deferredS2Resource.resolve(result);
      }).fail(function () {
        deferredS2Resource.reject();
      });
    return deferredS2Resource.promise();
  }

  TestHelper(function (results) {

    describe("Selection page presenter", function () {

      var s2Root, app, presenter = undefined;

      beforeEach(function(){
        app = {
          getS2Root:function () {
            var deferredS2Root = new $.Deferred();
            if (!s2Root) {
              S2Root.load({user:"username"}).done(function (result) {
                s2Root = result;
                deferredS2Root.resolve(result);
              }).fail(function () {
                  deferredS2Root.reject();
                });
            } else {
              deferredS2Root.resolve(s2Root);
            }
            return deferredS2Root.promise();
          },
          childDone:function () {
          }
        };

        var presenterName = "selection_page_presenter";
        var initData = {
          "accepts":      [ "samples.extraction.manual.dna_and_rna.input_tube_nap" ],
          "presenterName":"selection_page_presenter",
          "processTitle": "Manual DNA and RNA Extraction",
          "input":        {
            "role": "samples.extraction.manual.dna_and_rna.input_tube_nap",
            "model":"tubes"
          },
          "output":       [
            {
              "role":       "samples.extraction.manual.dna_and_rna.binding_input_tube_nap",
              "aliquotType":"NA+P"
            }
          ]
        };
        var pf = new PresenterFactory();
        presenter = pf.create(presenterName, this.mainController, initData);
      });

      describe("which is given a batch with one tube", function () {

        beforeEach(function () {
          config.loadTestData(testData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);

          var model, initialLabware;

          runs(function () {
            app.getS2Root()
              .then(function (root) {
                config.progress(4);
                return root.find('695ff060-8d8b-0130-b64f-282066132de2')
              })
              .then(function (batch) {

                initialLabware = undefined;
                model = {
                  userUUID:"123456789",
                  labware: initialLabware,
                  batch:   batch
                }

              })
              .then(results.expected)
              .fail(results.unexpected)
          });

          waitsFor(results.hasFinished);


          runs(function () {
            presenter.setupPresenter(model, function () {
              return $("#content");
            });
          });
        });

        it('is defined', function () {
          expect(presenter).toBeDefined();
        });

      });

      describe("which is given one tube", function () {

        beforeEach(function () {

          config.loadTestData(selectionPageData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);

          var model;

          runs(function () {
            results.resetFinishedFlag();
            app.getS2Root().then(function (root) {
              return root.find("tube1UUID");
            }).then(function (initialLabware) {

                model = {
                  userUUID:"123456789",
                  labware: initialLabware,
                  batch:   undefined
                }

              })
              .then(results.expected)
              .fail(results.unexpected)
          });

          waitsFor(results.hasFinished);


          runs(function () {
            results.resetFinishedFlag();
            presenter.setupPresenter(model, function () {
              return $("#content");
            });
            spyOn(presenter.view, "render");
            spyOn(presenter.view, "attachEvents");
            spyOn(presenter.view, "clear");
          });
        });

        it("is defined", function () {
          runs(function () {
            expect(presenter).toBeDefined();
          });
        });

        it("has a model that is defined", function(){
          runs(function(){
            expect(presenter.model).toBeDefined();
          });
        });

        it("has a view that has been set up correctly", function () {
          runs(function () {
            expect(presenter.view).toBeDefined();
            expect(presenter.view.owner).toEqual(presenter);
            expect(presenter.view.jquerySelector).toBeDefined();
          });
        });

        it("calls the render method in the view when renderView is called in the presenter", function () {
          runs(function () {
            var expectedData = {
              capacity:    12,
              processTitle:'Manual DNA and RNA Extraction'
            };

            presenter.renderView();

            expect(presenter.view.render).toHaveBeenCalledWith(expectedData);
            expect(presenter.view.render.callCount).toEqual(1);
          });
        });

        it("has 12 sub presenters that are labware presenters", function () {
          runs(function () {
            expect(presenter.presenters.length).toEqual(12);
            _.each(presenter.presenters, function (subPresenter) {
              expect(subPresenter).toBeDefined();
              expect(subPresenter.labwareModel).toBeDefined();
              expect(subPresenter.view).toBeDefined();
            });
          });
        });

        it("the first sub presenter has a tube presenter", function () {
          var subPresenters = presenter.presenters;
          runs(function () {
            expect(subPresenters[0].resourcePresenter).toBeDefined();
            expect(subPresenters[0].labwareModel.display_barcode).toEqual(false);
            expect(subPresenters[0].labwareModel.display_remove).toEqual(true);
          });
        });

        it("the second sub presenter has a scan barcode presenter", function () {

          runs(function () {
            var subPresenters = presenter.presenters;
            expect(subPresenters[1].barcodeInputPresenter).toBeDefined();
            expect(subPresenters[1].labwareModel.display_barcode).toEqual(true);
            expect(subPresenters[1].labwareModel.display_remove).toEqual(false);
          });
        });

        it("the remaining sub presenters don't have tube or scan barcode presenters", function () {
          runs(function () {
            var subPresenters = presenter.presenters;
            _.chain(subPresenters)
              .drop(2)
              .each(function (subPresenter) {
                expect(subPresenter.labwareModel.display_barcode).toEqual(false);
                expect(subPresenter.labwareModel.display_remove).toEqual(false);
                expect(subPresenter.resourcePresenter).not.toBeDefined();
                expect(subPresenter.barcodeInputPresenter).not.toBeDefined();
              });
          });
        });

        it("displays a barcode error on the correct presenter", function () {
          runs(function () {
            var errorMessage = "Generic error message";
            spyOn(presenter.presenters[1], "displayErrorMessage");
            presenter.displayBarcodeError(errorMessage);
            expect(presenter.presenters[1].displayErrorMessage).toHaveBeenCalledWith(errorMessage);
          })
        });

        it("calls the clear method of the view when release is called in the presenter", function () {
          runs(function () {
            presenter.release();
            expect(presenter.view.clear).toHaveBeenCalled();
          });
        });

        it('creates a batch when child done is called with action next', function () {
          runs(function () {
            spyOn(presenter.model, 'makeBatch');
            presenter.childDone(presenter.view, 'next', undefined);
            expect(presenter.model.makeBatch).toHaveBeenCalled();
          });
        });

        it('calls the model to remove a tube when child done called with action removeLabware', function () {
          runs(function () {
            spyOn(presenter.model, 'removeTubeByUuid');
            var data = {
              resource:{
                uuid:'1234567890'
              }
            };
            presenter.childDone(undefined, 'removeLabware', data);
            expect(presenter.model.removeTubeByUuid).toHaveBeenCalledWith(data.resource.uuid);
          });
        });

        describe('and has another tube added', function () {

          beforeEach(function () {
            spyOn(presenter, 'childDone').andCallThrough();
            spyOn(presenter, 'setupSubPresenters').andCallThrough();
            spyOn(presenter, 'renderView');

            runs(function(){
              results.resetFinishedFlag();
              app.getS2Root()
                .then(function (root) {
                  return root.find('tube2UUID')
                })
                .then(function (tube) {
                  presenter.model.addTube(tube);
                  presenter.setupSubPresenters();
                })
                .then(results.expected)
                .fail(results.unexpected);
            });

            waitsFor(results.hasFinished);

          });

          it('should have two tubes in the model', function () {
            expect(presenter.model.tubes.length).toEqual(2);
          });


          it('has the model call childDone on the presenter with model updated when a tube is added', function(){
            expect(presenter.childDone).toHaveBeenCalledWith(presenter.model, 'modelUpdated', { index:2, updateType:'addition'});
          });

          it('has setupSubPresenters called upon adding the tube to the model', function(){
            expect(presenter.setupSubPresenters).toHaveBeenCalled();
            expect(presenter.setupSubPresenters.callCount).toEqual(2);
          });

          it('has renderView called upon adding the tube to the model', function(){
            expect(presenter.renderView).toHaveBeenCalled();
          });

          it('now has two tube presenters', function(){
            runs(function(){
              _.chain(presenter.presenters)
                .first(2)
                .each(function(labwareTubePresenter){
                  expect(labwareTubePresenter.resourcePresenter).toBeDefined();
                  expect(labwareTubePresenter.labwareModel.display_barcode).toBeFalsy();
                  expect(labwareTubePresenter.labwareModel.display_remove).toBeTruthy();
                });
            });
          });

        });

        describe('and has the tube removed', function () {

          beforeEach(function () {
            // remove the tube
            runs(function () {
              var data = {
                resource:{
                  uuid:'tube1UUID'
                }
              };
              presenter.childDone(undefined, 'removeLabware', data);
              presenter.setupSubPresenters();
            });
          });

          it('is still defined', function () {
            expect(presenter).toBeDefined();
          });

          it('has the first presenter as a scan barcode presenter', function () {
            runs(function () {
              var subPresenters = presenter.presenters;
              expect(subPresenters[0].barcodeInputPresenter).toBeDefined();
              expect(subPresenters[0].labwareModel.display_barcode).toEqual(true);
              expect(subPresenters[0].labwareModel.display_remove).toEqual(false);
            });
          });

          it('has labware presenters for the remaining presenters', function () {
            runs(function () {
              var subPresenters = presenter.presenters;
              _.chain(subPresenters)
                .drop()
                .each(function (subPresenter) {
                  expect(subPresenter.labwareModel.display_barcode).toEqual(false);
                  expect(subPresenter.labwareModel.display_remove).toEqual(false);
                  expect(subPresenter.resourcePresenter).not.toBeDefined();
                  expect(subPresenter.barcodeInputPresenter).not.toBeDefined();
                });
            });
          });
        });
      });


      describe('which is not yet initialised', function () {

        beforeEach(function () {
          config.loadTestData(testData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);
        });


        it('throws an exception if not given either batch or labware when initialised', function () {

          runs(function () {
            var initialLabware, model;
            initialLabware = undefined;
            model = {
              userUUID:"123456789",
              labware: initialLabware,
              batch:   undefined
            };

            expect(function () {
              presenter.setupPresenter(model,function () {
                return $('#content');
              }).toThrow("This page should not be show without either batch or scanned labware");
            });
          });
        });
      });
    });
  });
});
