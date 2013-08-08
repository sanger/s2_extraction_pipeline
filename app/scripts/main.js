require.config({
  shim:{
  },

  baseUrl: 'scripts',

  paths:{
    hm:                   'vendor/hm',
    esprima:              'vendor/esprima',
    jquery:               'vendor/jquery.min',
    text:                 '../components/requirejs-text/text',
    spinjs:               '../components/spin.js/spin',
    labware:              'labware',
    mapper:               '../components/S2Mapper/app/scripts/mapper',
    mapper_services:      '../components/S2Mapper/app/scripts/services',
    mapper_test:          '../components/S2Mapper/test',
    mapper_testjson:      '../components/S2Mapper/test/json',
    config:               'config',
    reception_templates:  'lib/reception_templates',
    images:               '../images'
  }
});

require(['app',
  'controllers/controller_factory'
], function (App, ControllerFactory) {

    var theApp = new App(new ControllerFactory());

});

