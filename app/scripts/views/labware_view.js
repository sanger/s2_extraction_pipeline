define(['text!html_partials/_labware.html'], function (labwarePartialHtml) {

  'use strict';

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var LabwareView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };


  function onRemoved_clicked(owner, view) {
    /*
     * response to the click on the login button...
     * tells the owner that we want to try a login
     */
    return function () {
      if (owner) {
        var userbarcode = $(".user_barcode input").val();
        var tube_barcode = $(".labware_barcode input").val();

        owner.childDone(view , "login",{ userBC:userbarcode, labwareBC:tube_barcode });
      }
    }
  }

  LabwareView.prototype.renderView = function (model) {
    this.model = model;

    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().append(labwarePartialHtml);

    var removeButton = parent.find('.removeButton');
    var view = this;

    removeButton.on("click", function (e) {
      view.owner.childDone(view, "labwareRemoved");
    });
  };

  LabwareView.prototype.hideRemoveButton = function () {
    this.jquerySelector().find('.removeButton').hide();
  };

  LabwareView.prototype.hideBarcodeEntry = function () {
    this.jquerySelector().find('.barcodeInput').css('display', 'none');
  };

  LabwareView.prototype.showRemoveButton = function () {
    this.jquerySelector().find('.removeButton').show();
  };

  LabwareView.prototype.showBarcodeEntry = function () {
    this.jquerySelector().find('.barcodeInput').css('display', 'inline');
  };

  LabwareView.prototype.labwareEnabled = function(isEnabled) {
    var actions = ['removeAttr','attr'];
    if (this.owner.labwareModel.resource) {
      actions = ['attr','removeAttr'];
    } else if (!isEnabled) {
      actions = ['attr','attr'];
    }

    var selector = this.jquerySelector();
    _.chain(['input','.removeButton']).zip(actions).each(function(pair) { selector.find(pair[0])[pair[1]]('disabled','disabled'); });
    return this;
  }

  LabwareView.prototype.setTitle = function (titleString) {
    if (titleString !== undefined) {
      this.jquerySelector().find('.title').empty().append(titleString).show();
    } else {
      this.jquerySelector().find('.title').empty().hide();
    }
  };

  LabwareView.prototype.clear = function () {
    /* clear the view from the current page
     */
    this.jquerySelector().empty();
  };

  return LabwareView;

});
