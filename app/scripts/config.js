define([], function() {
  'use strict';

  var printerTypes = {
    1: '96 Well Plate Printer',
    2: 'Tube Printer',
    3: 'Rack Printer'
  };

  function printer(name,type){
    return {
      name: name,
      type: type,
      friendlyName: name + ' ' + printerTypes[type],
    };
  }

  return {
    // Configure the API to S2
    apiUrl: 'http://psd2g.internal.sanger.ac.uk:8000/',

    // Don't change the release branch value as it's picked up by the deployment script
    release: 'development_branch',

    ajax: function(options) {
      return $.ajax(options).then(function(result) { return {responseText:result}; });
    },

    // Configure the print service
    printServiceUrl: 'http://psd2g.internal.sanger.ac.uk:8000/printers/legacy/soap',
    printers: [
      printer('e367bc', 2),
      printer('d304bc', 1)
    ],

    messageTimeout: 5000,
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },

    UserData: {
      "0000000000001": "Hopper",
      "0000000000002": "Hockney",
      "0000000000003": "Hodgkins",
      "0000000000004": "Hofer"
    }
  };

});
