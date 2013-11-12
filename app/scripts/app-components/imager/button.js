define(["text!app-components/imager/_button.html"], function(buttonTemplate) {
  return function(context) {
    var html = $(_.template(buttonTemplate, context));
    
    html.html(context.text);
    
    html.on("click", function() {
      html.trigger("done.s2");
      if (context.action) {
        html.trigger(context.action);
      }
      if (!context.notDisable) {
        html.attr("disabled", true);
      }
    });
    
    html.attr("disabled", true);
    
    //html.on("activate.s2", function() {
    //  html.attr("disabled", true);
    //});
    
    return ({
      view: html,
      events: {
        "activate.s2": $.haltsEvent(function() {}),
        //"activate.s2": $.haltsEvent($.ignoresEvent(_.partial(_.bind(html.attr, html), "disabled", false))),
        "deactivate.s2": $.ignoresEvent(_.partial(_.bind(html.attr, html), "disabled", true))
      }
    });
  };
});