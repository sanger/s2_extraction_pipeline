require.config({
  shim:{
  },

  baseUrl: '.',

  paths:{
    hm:                   'vendor/hm',
    esprima:              'vendor/esprima',
    jquery:               'vendor/jquery.min',
    mapper:               '/components/S2Mapper/app/scripts/mapper',
    mapper_services:      '/components/S2Mapper/app/scripts/services',
    mapper_test:          'components/S2Mapper/test',
    labware:              '/components/labware/app/scripts',
    config:               'scripts/devel_config',
    testjson:             '/components/S2Mapper/test/json',
    text:                 '/components/requirejs-text/text',
    extraction_pipeline:  'scripts'
  }
});

require(['extraction_pipeline/app',
  'extraction_pipeline/presenters/presenter_factory'
], function (App, PresenterFactory) {
    // HACK!  Fixes issue where two model dialogs cause Chrome to crash:
    //    https://github.com/twitter/bootstrap/issues/4781#issuecomment-10911587
    var oldFocus = jQuery().modal.Constructor.prototype.enforceFocus;
    jQuery().modal.Constructor.prototype.enforceFocus = function(){};

    var theApp = new App(new PresenterFactory());

    theApp.setupPresenter();

});

