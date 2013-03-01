define(['models/selection_page_model', 'spec/selection_page_helper', 'extraction_pipeline/dummyresource'], function(SelectionPageModel, SelectionPageHelper, DummyResource) {

  'use strict';
  
  var firstBatchUuid = '11111111-222222-00000000-111111111111';
  var secondBatchUuid = '11111111-222222-00000000-111111111112';
  var nextObjectUuid = '';
  var nextBatchUuid = '';
  var haveMutated = false;
  var owner = null;

  DummyResource.prototype.mutateJson = function(json) {
    console.log("patching tube");
    
    json.tube.uuid = nextObjectUuid;
    json.tube.batch = {
      rawJson:{
        uuid: nextBatchUuid
      }
    };

    haveMutated = true;

    return json;

  }

  var createSpyOwner = function() {
    owner = {
      childDone: function(child, action, data) {}
    };
    spyOn(owner, 'childDone');    
  }

  describe("SelectionPageModel", function() {

    var helper = new SelectionPageHelper();

    describe("model with 0 tubes", function() {
      var model;

      beforeEach(function() { 
	createSpyOwner();
        model = new SelectionPageModel(owner, 123456789);
      });

      it("has capacity of 12 tubes", function() {
        expect(model.getCapacity()).toEqual(12);
      });

      it("has no batch identifier", function() {
        expect(model.batch).toBeUndefined();
      });

      it("has batch identifier set after a tube has been added", function() {
	var expectedBatchUuid = firstBatchUuid;
	nextBatchUuid = firstBatchUuid;
        runs(function() { 
          console.log("calling add tube");
          model.addTube(helper.createUuid(0));	
          });

        waitsFor(function() {
          return model.getNumberOfTubes() === 1
          }, "message", 100);

        runs(function() {
          console.log("expecting model batch");
	  expect(model.batch).toEqual(firstBatchUuid);
          });
      });

      it("adding tube with no batch is handled gracefully", function() {
	model.addTube(helper.createTubeWithNullBatch(0));
	expect(model.batch).toBeUndefined();
	});

    });

    describe("model with 1 tube", function() {
      var model;

      beforeEach(function() { 
	createSpyOwner();
        model = new SelectionPageModel(owner, 123456789);
        model.tubes.push(helper.createTubeWithOriginalBatch(0));
      });

      it("contains one tube", function() { 
        expect(model.getNumberOfTubes()).toEqual(1);
      });

      it("adding new tube in same batch works fine", function () {

	runs(function() {
	  haveMutated = false;
	  nextBatchUuid = firstBatchUuid;
          var uuid = helper.createUuid(1);
	  // Set up override uuid
	  nextObjectUuid = uuid;
          model.addTube(uuid);
	});
	waitsFor(function() {
	  return haveMutated;
	},
		 "2 tubes to be created",
		 50);	
	runs( function() {
          expect(model.getNumberOfTubes()).toEqual(2);
          expect(model.tubes[0].rawJson.tube.uuid).not.toEqual(model.tubes[1].rawJson.tube.uuid);
	  });
      });

      it("tube in different batch not added to model", function() {	
	/*
        var tube = helper.createTubeWithDifferentBatch(1);
	var uuid = helper.createUuid(1);
        expect(function() { model.addTube(uuid); }).toThrow();
	*/

	// Step 1 : get a uuid corresponding to a different tube
	// Step 2 : make the mutator set a different batch uuid
	// Step 3 : wait for the mutator to run
	// Step 4 : no new tube is added to the model
      });

      it("removing last tube causes batch to be undefined", function() {
        var uuid = helper.getUuidFromTube(model.tubes[0]);
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(0);
        expect(model.batch).toBeUndefined();
      });
    });

    describe("model with 12 tubes", function() {
      var model;

      beforeEach(function() { 
	createSpyOwner();
        model = new SelectionPageModel(owner, 123456789);
        for(var i = 0; i < 12; i++) {
          var newTube = helper.createTubeWithOriginalBatch(i);
          
          model.tubes.push(newTube);
        }
      });

      it("contains 12 tubes", function() { 
        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("remove tubes removes tube order and leaves batch defined", function() {
        var uuid = helper.getUuidFromTube(model.tubes[5]);
        var originalBatch = model.batch;
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(11);
        for(var i = 0; i < 11; i++) {
          var tube = model.tubes[i];
          expect(tube).toBeDefined();
          expect(helper.getUuidFromTube(tube)).not.toEqual(uuid);	
        }

        expect(model.batch).toEqual(originalBatch);

      });

      it("attempting to remove an tube with no matching uuid leaves model unchanged", function() {
        var uuid = helper.createUuid(20);
        model.removeTubeByUuid(uuid);

        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("adding new tube in different batch throws exception", function() {
        var tube = helper.createTubeWithDifferentBatch(12);
        expect(function() { model.addTube(order); }).toThrow();
      });

      it("adding new tube in same batch throws exception", function() {
        var tube = helper.createTubeWithOriginalBatch(12);
        expect(function() { model.addTube(tube); }).toThrow();
      });

      it("can return uuid from tube index", function() {
        for(var i = 0; i < model.getNumberOfTubes(); i++) {
          var expectedUuid = helper.createUuid(i);
          expect(model.getTubeUuidFromTubeIndex(i)).toBe(expectedUuid);
        }
      });
    })});

});
