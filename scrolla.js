(function($) {

  $.fn.extend({
    slimScroll: function(options) {

      var defaults = {

        // width in pixels of the visible scroll area
        width : &#39;auto&#39;,

        // height in pixels of the visible scroll area
        height : &#39;300px&#39;,

        // width in pixels of the scrollbar and rail
        size : &#39;7px&#39;,

        // scrollbar color, accepts any hex/color value
        color: &#39;#000&#39;,

        // scrollbar position - left/right
        position : &#39;right&#39;,

        // distance in pixels between the side edge and the scrollbar
        distance : &#39;1px&#39;,

        // default scroll position on load - top / bottom / $(&#39;selector&#39;)
        start : &#39;top&#39;,

        // sets scrollbar opacity
        opacity : .4,

        // enables always-on mode for the scrollbar
        alwaysVisible : false,

        // check if we should hide the scrollbar when user is hovering over
        disableFadeOut : false,

        // sets visibility of the rail
        railVisible : false,

        // sets rail color
        railColor : &#39;#333&#39;,

        // sets rail opacity
        railOpacity : .2,

        // whether  we should use jQuery UI Draggable to enable bar dragging
        railDraggable : true,

        // defautlt CSS class of the slimscroll rail
        railClass : &#39;slimScrollRail&#39;,

        // defautlt CSS class of the slimscroll bar
        barClass : &#39;slimScrollBar&#39;,

        // defautlt CSS class of the slimscroll wrapper
        wrapperClass : &#39;slimScrollDiv&#39;,

        // check if mousewheel should scroll the window if we reach top/bottom
        allowPageScroll : false,

        // scroll amount applied to each mouse wheel step
        wheelStep : 20,

        // scroll amount applied when user is using gestures
        touchScrollStep : 200,

        // sets border radius
        borderRadius: &#39;7px&#39;,

        // sets border radius of the rail
        railBorderRadius : &#39;7px&#39;
      };

      var o = $.extend(defaults, options);

      // do it for every element that matches selector
      this.each(function(){

      var isOverPanel, isOverBar, isDragg, queueHide, touchDif,
        barHeight, percentScroll, lastScroll,
        divS = &#39;<div/>&#39;,
        minBarHeight = 30,
        releaseScroll = false;

        // used in event handlers and for better minification
        var me = $(this);

        // ensure we are not binding it again
        if (me.parent().hasClass(o.wrapperClass))
        {
            // start from last bar position
            var offset = me.scrollTop();

            // find bar and rail
            bar = me.siblings(&#39;.&#39; + o.barClass);
            rail = me.siblings(&#39;.&#39; + o.railClass);

            getBarHeight();

            // check if we should scroll existing instance
            if ($.isPlainObject(options))
            {
              // Pass height: auto to an existing slimscroll object to force a resize after contents have changed
              if ( &#39;height&#39; in options &amp;&amp; options.height == &#39;auto&#39; ) {
                me.parent().css(&#39;height&#39;, &#39;auto&#39;);
                me.css(&#39;height&#39;, &#39;auto&#39;);
                var height = me.parent().parent().height();
                me.parent().css(&#39;height&#39;, height);
                me.css(&#39;height&#39;, height);
              } else if (&#39;height&#39; in options) {
                var h = options.height;
                me.parent().css(&#39;height&#39;, h);
                me.css(&#39;height&#39;, h);
              }

              if (&#39;scrollTo&#39; in options)
              {
                // jump to a static point
                offset = parseInt(o.scrollTo);
              }
              else if (&#39;scrollBy&#39; in options)
              {
                // jump by value pixels
                offset += parseInt(o.scrollBy);
              }
              else if (&#39;destroy&#39; in options)
              {
                // remove slimscroll elements
                bar.remove();
                rail.remove();
                me.unwrap();
                return;
              }

              // scroll content by the given offset
              scrollContent(offset, false, true);
            }

            return;
        }
        else if ($.isPlainObject(options))
        {
            if (&#39;destroy&#39; in options)
            {
            	return;
            }
        }

        // optionally set height to the parent&#39;s height
        o.height = (o.height == &#39;auto&#39;) ? me.parent().height() : o.height;

        // wrap content
        var wrapper = $(divS)
          .addClass(o.wrapperClass)
          .css({
            position: &#39;relative&#39;,
            overflow: &#39;hidden&#39;,
            width: o.width,
            height: o.height
          });

        // update style for the div
        me.css({
          overflow: &#39;hidden&#39;,
          width: o.width,
          height: o.height
        });

        // create scrollbar rail
        var rail = $(divS)
          .addClass(o.railClass)
          .css({
            width: o.size,
            height: &#39;100%&#39;,
            position: &#39;absolute&#39;,
            top: 0,
            display: (o.alwaysVisible &amp;&amp; o.railVisible) ? &#39;block&#39; : &#39;none&#39;,
            &#39;border-radius&#39;: o.railBorderRadius,
            background: o.railColor,
            opacity: o.railOpacity,
            zIndex: 90
          });

        // create scrollbar
        var bar = $(divS)
          .addClass(o.barClass)
          .css({
            background: o.color,
            width: o.size,
            position: &#39;absolute&#39;,
            top: 0,
            opacity: o.opacity,
            display: o.alwaysVisible ? &#39;block&#39; : &#39;none&#39;,
            &#39;border-radius&#39; : o.borderRadius,
            BorderRadius: o.borderRadius,
            MozBorderRadius: o.borderRadius,
            WebkitBorderRadius: o.borderRadius,
            zIndex: 99
          });

        // set position
        var posCss = (o.position == &#39;right&#39;) ? { right: o.distance } : { left: o.distance };
        rail.css(posCss);
        bar.css(posCss);

        // wrap it
        me.wrap(wrapper);

        // append to parent div
        me.parent().append(bar);
        me.parent().append(rail);

        // make it draggable and no longer dependent on the jqueryUI
        if (o.railDraggable){
          bar.bind(&quot;mousedown&quot;, function(e) {

            var $doc = $(document);
            isDragg = true;
            t = parseFloat(bar.css(&#39;top&#39;));
            pageY = e.pageY;

            $doc.bind(&quot;mousemove.slimscroll&quot;, function(e){
              currTop = t + e.pageY - pageY;
              bar.css(&#39;top&#39;, currTop);
              scrollContent(0, bar.position().top, false);// scroll content
            });

            $doc.bind(&quot;mouseup.slimscroll&quot;, function(e) {
              isDragg = false;hideBar();
              $doc.unbind(&#39;.slimscroll&#39;);
            });
            return false;
          }).bind(&quot;selectstart.slimscroll&quot;, function(e){
            e.stopPropagation();
            e.preventDefault();
            return false;
          });
        }

        // on rail over
        rail.hover(function(){
          showBar();
        }, function(){
          hideBar();
        });

        // on bar over
        bar.hover(function(){
          isOverBar = true;
        }, function(){
          isOverBar = false;
        });

        // show on parent mouseover
        me.hover(function(){
          isOverPanel = true;
          showBar();
          hideBar();
        }, function(){
          isOverPanel = false;
          hideBar();
        });

        // support for mobile
        me.bind(&#39;touchstart&#39;, function(e,b){
          if (e.originalEvent.touches.length)
          {
            // record where touch started
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        me.bind(&#39;touchmove&#39;, function(e){
          // prevent scrolling the page if necessary
          if(!releaseScroll)
          {
  		      e.originalEvent.preventDefault();
		      }
          if (e.originalEvent.touches.length)
          {
            // see how far user swiped
            var diff = (touchDif - e.originalEvent.touches[0].pageY) / o.touchScrollStep;
            // scroll content
            scrollContent(diff, true);
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        // set up initial height
        getBarHeight();

        // check start position
        if (o.start === &#39;bottom&#39;)
        {
          // scroll content to bottom
          bar.css({ top: me.outerHeight() - bar.outerHeight() });
          scrollContent(0, true);
        }
        else if (o.start !== &#39;top&#39;)
        {
          // assume jQuery selector
          scrollContent($(o.start).position().top, null, true);

          // make sure bar stays hidden
          if (!o.alwaysVisible) { bar.hide(); }
        }

        // attach scroll events
        attachWheel(this);

        function _onWheel(e)
        {
          // use mouse wheel only when mouse is over
          if (!isOverPanel) { return; }

          var e = e || window.event;

          var delta = 0;
          if (e.wheelDelta) { delta = -e.wheelDelta/120; }
          if (e.detail) { delta = e.detail / 3; }

          var target = e.target || e.srcTarget || e.srcElement;
          if ($(target).closest(&#39;.&#39; + o.wrapperClass).is(me.parent())) {
            // scroll content
            scrollContent(delta, true);
          }

          // stop window scroll
          if (e.preventDefault &amp;&amp; !releaseScroll) { e.preventDefault(); }
          if (!releaseScroll) { e.returnValue = false; }
        }

        function scrollContent(y, isWheel, isJump)
        {
          releaseScroll = false;
          var delta = y;
          var maxTop = me.outerHeight() - bar.outerHeight();

          if (isWheel)
          {
            // move bar with mouse wheel
            delta = parseInt(bar.css(&#39;top&#39;)) + y * parseInt(o.wheelStep) / 100 * bar.outerHeight();

            // move bar, make sure it doesn&#39;t go out
            delta = Math.min(Math.max(delta, 0), maxTop);

            // if scrolling down, make sure a fractional change to the
            // scroll position isn&#39;t rounded away when the scrollbar&#39;s CSS is set
            // this flooring of delta would happened automatically when
            // bar.css is set below, but we floor here for clarity
            delta = (y &gt; 0) ? Math.ceil(delta) : Math.floor(delta);

            // scroll the scrollbar
            bar.css({ top: delta + &#39;px&#39; });
          }

          // calculate actual scroll amount
          percentScroll = parseInt(bar.css(&#39;top&#39;)) / (me.outerHeight() - bar.outerHeight());
          delta = percentScroll * (me[0].scrollHeight - me.outerHeight());

          if (isJump)
          {
            delta = y;
            var offsetTop = delta / me[0].scrollHeight * me.outerHeight();
            offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
            bar.css({ top: offsetTop + &#39;px&#39; });
          }

          // scroll content
          me.scrollTop(delta);

          // fire scrolling event
          me.trigger(&#39;slimscrolling&#39;, ~~delta);


          // ensure bar is visible
          showBar();

          // trigger hide when scroll is stopped
          hideBar();
        }

        function attachWheel(target)
        {
          if (window.addEventListener)
          {
            target.addEventListener(&#39;DOMMouseScroll&#39;, _onWheel, false );
            target.addEventListener(&#39;mousewheel&#39;, _onWheel, false );
          }
          else
          {
            document.attachEvent(&quot;onmousewheel&quot;, _onWheel)
          }
        }

        function getBarHeight()
        {
          // calculate scrollbar height and make sure it is not too small
          barHeight = Math.max((me.outerHeight() / me[0].scrollHeight) * me.outerHeight(), minBarHeight);
          bar.css({ height: barHeight + &#39;px&#39; });

          // hide scrollbar if content is not long enough
          var display = barHeight == me.outerHeight() ? &#39;none&#39; : &#39;block&#39;;
          bar.css({ display: display });
        }

        function showBar()
        {
          // recalculate bar height
          getBarHeight();
          clearTimeout(queueHide);

          // when bar reached top or bottom
          if (percentScroll == ~~percentScroll)
          {
            //release wheel
            releaseScroll = o.allowPageScroll;

            // publish approporiate event
            if (lastScroll != percentScroll)
            {
                var msg = (~~percentScroll == 0) ? &#39;top&#39; : &#39;bottom&#39;;
                me.trigger(&#39;slimscroll&#39;, msg);
            }
          }
          else
          {
            releaseScroll = false;
          }
          lastScroll = percentScroll;

          // show only when required
          if(barHeight &gt;= me.outerHeight()) {
            //allow window scroll
            releaseScroll = true;
            return;
          }
          bar.stop(true,true).fadeIn(&#39;fast&#39;);
          if (o.railVisible) { rail.stop(true,true).fadeIn(&#39;fast&#39;); }
        }

        function hideBar()
        {
          // only hide when options allow it
          if (!o.alwaysVisible)
          {
            queueHide = setTimeout(function(){
              if (!(o.disableFadeOut &amp;&amp; isOverPanel) &amp;&amp; !isOverBar &amp;&amp; !isDragg)
              {
                bar.fadeOut(&#39;slow&#39;);
                rail.fadeOut(&#39;slow&#39;);
              }
            }, 1000);
          }
        }

      });

      // maintain chainability
      return this;
    }
  });

  $.fn.extend({
    slimscroll: $.fn.slimScroll
  });

})(jQuery);


 $(function(){
      $(&#39;#videoscroll&#39;).slimscroll({
        size: &#39;15px&#39;
      });
    });
