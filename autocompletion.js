(function($, window, document, undefined) {
  "use strict";
  var plugin_name = "autocompletion", defaults = {
    caching: true,
    container: '<div class="autocompletion"></div>',
    item: '<p class="autocompletion-item"></p>',
    source: []
  };
  function Plugin(element, options) {
    this.options = $.extend({}, defaults, options);
    this.customize = this.options.customize || this.customize;
    this.fill = this.options.fill || this.fill;
    this.$container = $(this.options.container);
    this.$element = $(element);
    this._attr_value = "data-item-value";
    this._cache = {};
    this._class_current = "current";
    this._defaults = defaults;
    this._name = plugin_name;
    this.init();
  }
  Plugin.prototype = {
    init: function() {
      this.bind();
    },
    bind: function() {
      var that = this, item_selector = "[" + this._attr_value + "]";
      this.$element.on("blur", $.proxy(this.blur, this)).on("keyup", $.proxy(this.keyup, this));
      this.$container.on("mouseenter", function() {
        that.mousein = true;
      }).on("mouseleave", function() {
        that.mousein = false;
      }).on("mouseenter", item_selector, function(e) {
        that.$container.find("." + that._class_current).removeClass(that._class_current);
        $(e.currentTarget).addClass(that._class_current);
      }).on("click", item_selector, $.proxy(this.click, this));
    },
    blur: function() {
      // Hide only when cursor outside of the container.
      // This is to ensure that the browser did not hide container before the clue clicked.
      if (!this.mousein) {
        this.hide();
      }
    },
    keyup: function() {
      this.q = this.$element.val();
      this.q_lower = this.q.toLowerCase();
      if (!this.q) {
        return this.hide();
      }
      if (this.options.caching && this._cache[this.q_lower]) {
        // pass to render method directly
        this.render(this._cache[this.q_lower]);
      } else if ($.isFunction(this.options.source)) {
        // if it's a function, then run it and pass context
        this.options.source(this.q, $.proxy(this.suggest, this));
      } else {
        this.suggest(this.options.source);
      }
    },
    click: function(e) {
      e.stopPropagation();
      e.preventDefault();
      this.select();
    },
    suggest: function(items) {
      var that = this,
      filtered_items = $.grep(items, function(item) {
        return item.toLowerCase().indexOf(that.q_lower) !== -1;
      });
      // cache if needed
      if (this.options.caching) {
        this._cache[this.q_lower] = filtered_items;
      }
      this.render(filtered_items);
    },
    render: function(items) {
      if (!items.length) {
        return this.hide();
      }
      var that = this,
      items_dom = $.map(items, function(item) {
        return $(that.options.item).attr(that._attr_value, item).html(that.highlight(item))[0];
      }), position = this.$element.position();
      // render container body
      this.customize(this.$container.css({
        left: position.left + "px",
        top: position.top + this.$element.outerHeight() + "px"
      }).html(items_dom)[0]);
      this.$container.insertAfter(this.$element);
      this.show();
    },
    highlight: function(item) {
      var q = this.q.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
      return item.replace(new RegExp("(" + q + ")", "ig"), function($1, match) {
        return "<strong>" + match + "</strong>";
      });
    },
    customize: function(clues) {
      return;
    },
    select: function() {
      var $el = this.$container.find("." + this._class_current),
      value = $.proxy(this.fill, $el[0], $el.attr(this._attr_value), $.proxy(this.hide, this))();
      if (value) {
        this.hide();
        this.$element.val().change();
      }
    },
    fill: function(value) {
      return value;
    },
    show: function() {
      if (!this.visible) {
        this.visible = true;
        this.$container.show();
      }
    },
    hide: function() {
      if (this.visible) {
        this.visible = false;
        this.$container.hide();
      }
    }
  };
  $.fn[plugin_name] = function(options) {
    return this.each(function() {
      if (!$.data(this, "plugin_" + plugin_name)) {
        $.data(this, "plugin_" + plugin_name, new Plugin(this, options));
      }
    });
  };
})(jQuery, window, document);
