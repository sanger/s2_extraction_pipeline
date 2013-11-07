define([ "app-components/linear-process/linear-process",
    "app-components/imager/button", "app-components/imager/fileSelector",
], function(linearProcess, button, fileSelector) {
  return function(context) {
    var linear = linearProcess({ 
      components : [
        { constructor : _.partial(button, { text : "Begin Imager", action: "begin.imager.s2" })
        },
        { constructor : _.partial(button, { text : "End Imager", action: "completed.imager.s2" })
        },
        { constructor : _.partial(fileSelector, { text : "Select", action: "uploaded.file.imager.s2" })
        },
        { constructor : _.partial(button, { text : "Upload", action: "upload.request.imager.s2", notDisable: true })
        }
      ]
      });
    return linear;
  };
});