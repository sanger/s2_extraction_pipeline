define([], function () {
  'use strict';
  return {
    rackingCsvToArray:function (data) {
      var csvArray = $.csv.toArrays(data);
      var matches = undefined;

      var reForPosition = new RegExp( "\\s*(\\w)(\\d\\d)\\s*" , "i");

      return _.map(csvArray, function (row) {
        matches = reForPosition.exec(row[0]);
        if (matches) {
          var locationLetter = matches[1];
          var locationNumber = parseInt(matches[2]);
          return [(locationLetter + locationNumber).trim(), row[1].trim()];
        }
      });
    },

    volumeCsvToArray:function (data) {
     var csvArray = $.csv.toArrays(data);
      var matches = undefined;
      var rack_barcode ;
      var reBarcode = new RegExp("\\s*(\\w)(\\d\\d)\\s*", "i")

      rack_barcode = csvArray[1][0].replace(/ /g,'');
      var array = _.chain(csvArray)
        .drop()
        .map(function (row) {
          matches = reBarcode.exec(row[1]);
          if (matches) {
            var locationLetter = matches[1];
            var locationNumber = parseInt(matches[2]);
            return [(locationLetter + locationNumber).trim(),
                    parseFloat(row[2].trim())];
          }
        })
        .value();
      return {rack_barcode:rack_barcode,array:array};
    },

    manifestCsvToArray:function(dataAsText) {
      var csvArray = $.csv.toArrays(dataAsText.replace(/(\r\n)|(\n)|(\r)/g,'\n').replace(/[\r\n]+$/g,''));
      return _.map(csvArray, function(row){
        return _.map(row, function(element){
          return element.trim();
        });
      });
    },

    locationArrayToLocalisedBarcodes:function (array) {
      return _.reduce(array, function (memo, row) {
        var location = row[0];
        var barcode = row[1];
        if (barcode.toUpperCase() !== "NO READ"){
          memo[barcode] = location;
        }
        return memo;
      },{});
    },
    convertCSVDataToJSON:function (data) {
      return this.locationArrayToLocalisedBarcodes(this.rackingCsvToArray(data));
    }

  };
});
