(function () {
  var api;

  htmx.defineExtension("sse", {
    init: function (apiRef) {
      api = apiRef;

      if (htmx.createEventSource == undefined) {
        htmx.createEventSource = createEventSource;
      }
    },

    getSelectors: function () {
      return [
        "[sse-connect]",
        "[data-sse-connect]",
        "[sse-swap]",
        "[data-sse-swap]",
      ];
    },

    onEvent: function (name, evt) {
      var parent = evt.target || evt.detail.elt;
      switch (name) {
        case "htmx:beforeCleanupElement":
          var internalData = api.getInternalData(parent);
          var source = internalData.sseEventSource;
          if (source) {
            api.triggerEvent(parent, "htmx:sseClose", {
              source,
              type: "nodeReplaced",
            });
            internalData.sseEventSource.close();
          }

          return;

        case "htmx:afterProcessNode":
          ensureEventSourceOnElement(parent);
      }
    },
  });

  function createEventSource(url) {
    return new EventSource(url, { withCredentials: true });
  }

  function registerSSE(elt) {
    if (api.getAttributeValue(elt, "sse-swap")) {
      var sourceElement = api.getClosestMatch(elt, hasEventSource);
      if (sourceElement == null) {
        return null;
      }

      var internalData = api.getInternalData(sourceElement);
      var source = internalData.sseEventSource;

      var sseSwapAttr = api.getAttributeValue(elt, "sse-swap");
      var sseEventNames = sseSwapAttr.split(",");

      for (var i = 0; i < sseEventNames.length; i++) {
        const sseEventName = sseEventNames[i].trim();
        const listener = function (event) {
          if (maybeCloseSSESource(sourceElement)) {
            return;
          }

          if (!api.bodyContains(elt)) {
            source.removeEventListener(sseEventName, listener);
            return;
          }

          if (!api.triggerEvent(elt, "htmx:sseBeforeMessage", event)) {
            return;
          }
          swap(elt, event.data);
          api.triggerEvent(elt, "htmx:sseMessage", event);
        };

        api.getInternalData(elt).sseEventListener = listener;
        source.addEventListener(sseEventName, listener);
      }
    }

    if (api.getAttributeValue(elt, "hx-trigger")) {
      var sourceElement = api.getClosestMatch(elt, hasEventSource);
      if (sourceElement == null) {
        return null;
      }

      var internalData = api.getInternalData(sourceElement);
      var source = internalData.sseEventSource;

      var triggerSpecs = api.getTriggerSpecs(elt);
      triggerSpecs.forEach(function (ts) {
        if (ts.trigger.slice(0, 4) !== "sse:") {
          return;
        }

        var listener = function (event) {
          if (maybeCloseSSESource(sourceElement)) {
            return;
          }
          if (!api.bodyContains(elt)) {
            source.removeEventListener(ts.trigger.slice(4), listener);
          }
          htmx.trigger(elt, ts.trigger, event);
          htmx.trigger(elt, "htmx:sseMessage", event);
        };

        api.getInternalData(elt).sseEventListener = listener;
        source.addEventListener(ts.trigger.slice(4), listener);
      });
    }
  }

  function ensureEventSourceOnElement(elt, retryCount) {
    if (elt == null) {
      return null;
    }

    if (api.getAttributeValue(elt, "sse-connect")) {
      var sseURL = api.getAttributeValue(elt, "sse-connect");
      if (sseURL == null) {
        return;
      }

      ensureEventSource(elt, sseURL, retryCount);
    }

    registerSSE(elt);
  }

  function ensureEventSource(elt, url, retryCount) {
    var source = htmx.createEventSource(url);

    source.onerror = function (err) {
      api.triggerErrorEvent(elt, "htmx:sseError", { error: err, source });

      if (maybeCloseSSESource(elt)) {
        return;
      }

      if (source.readyState === EventSource.CLOSED) {
        retryCount = retryCount || 0;
        retryCount = Math.max(Math.min(retryCount * 2, 128), 1);
        var timeout = retryCount * 500;
        window.setTimeout(function () {
          ensureEventSourceOnElement(elt, retryCount);
        }, timeout);
      }
    };

    source.onopen = function (evt) {
      api.triggerEvent(elt, "htmx:sseOpen", { source });

      if (retryCount && retryCount > 0) {
        const childrenToFix = elt.querySelectorAll(
          "[sse-swap], [data-sse-swap], [hx-trigger], [data-hx-trigger]",
        );
        for (let i = 0; i < childrenToFix.length; i++) {
          registerSSE(childrenToFix[i]);
        }
        retryCount = 0;
      }
    };

    api.getInternalData(elt).sseEventSource = source;

    var closeAttribute = api.getAttributeValue(elt, "sse-close");
    if (closeAttribute) {
      source.addEventListener(closeAttribute, function () {
        api.triggerEvent(elt, "htmx:sseClose", {
          source,
          type: "message",
        });
        source.close();
      });
    }
  }

  function maybeCloseSSESource(elt) {
    if (!api.bodyContains(elt)) {
      var source = api.getInternalData(elt).sseEventSource;
      if (source != undefined) {
        api.triggerEvent(elt, "htmx:sseClose", {
          source,
          type: "nodeMissing",
        });
        source.close();
        return true;
      }
    }
    return false;
  }

  function swap(elt, content) {
    api.withExtensions(elt, function (extension) {
      content = extension.transformResponse(content, null, elt);
    });

    var swapSpec = api.getSwapSpecification(elt);
    var target = api.getTarget(elt);
    api.swap(target, content, swapSpec);
  }

  function hasEventSource(node) {
    return api.getInternalData(node).sseEventSource != null;
  }
})();
