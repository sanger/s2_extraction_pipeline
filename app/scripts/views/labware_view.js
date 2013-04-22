define(['text!extraction_pipeline/html_partials/labware_partial.html'], function (labwarePartialHtml) {

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
    if (model !== null) {
      this.model = model;
    }

    var parent = this.jquerySelector();

    // We have to append to the document or events won't register
    parent.empty().append(labwarePartialHtml);

    var removeButton = parent.find('.removeButton');
    var that = this;

    removeButton.on("click", function (e) {
      that.owner.childDone(that, "labwareRemoved");
    });
  };

  LabwareView.prototype.hideRemoveButton = function () {
    this.jquerySelector().find('.removeButton').css('display', 'none');
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

  LabwareView.prototype.displaySuccessMessage = function(message) {

    var selection = this.jquerySelector().find('.alert-success');
    var text = 'Success!';

    if (message) {
      text += message;
    }

    var tmp = $('<h4/>', {
      class: 'alert-heading',
      text: text
    });

    tmp.appendTo(selection.empty());
    selection.css('display', 'block');
  };

  LabwareView.prototype.setTitle = function (titleString) {

    var title = '';

    switch (titleString) {
      case 'tube':
        title = 'Tube';
        break;
      case 'spin_column':
        title = 'Spin Column';
        break;
      case 'waste_tube':
        title = 'Waste Tube';
        break;
    };

    this.jquerySelector().find('.title').empty().append(title);
  };

  LabwareView.prototype.clear = function () {
    /* clear the view from the current page
     */
    this.jquerySelector().empty();
  };

  return LabwareView;

});
