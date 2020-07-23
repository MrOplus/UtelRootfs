/**
 * 状态栏提示语实现
 * @module StatusTooltip
 * @class StatusTooltip
 */
define([ 'jquery' ], function($) {
			/**
			 * 初始化状态栏tooltip
			 * 
			 * @method init
			 */
			function init() {

				$(".statusItem", "#statusBar").each(function(i, n){
					var $this = $(this);
					$this.attr("tipTitle", $this.attr("title")).removeAttr("title");
				}).hover(
						function() {
							var $this = $(this);
							var title = $this.attr("tipTitle");
							var tip = $("<div>").addClass("tooltip in").appendTo(document.body).hide()
									.append($this.attr("i18n") ? $.i18n.prop(title) : title);
							if ($this.attr("i18n")) {
								tip.attr("data-trans", title).attr("id", "tooltip_" + $this.attr("id"));
							}
							var pos = getPosition($this, tip, {
								position : [ 'bottom', 'center' ],
								offset : [ 0, 0 ]
							});
							tip.css({
								position : 'absolute',
								top : pos.top,
								left : pos.left
							}).show();
						}, function() {
							$(".tooltip").hide().remove();
						});
			}
			
			/**
			 * 获取元素位置
			 * @method getPosition
			 * @param trigger 原元素
			 * @param tip 生成的tooltip
			 * @param {JSON} conf 位置配置
			 */
			function getPosition(trigger, tip, conf) {
				var top = trigger.offset().top, 
					left = trigger.offset().left, 
					pos = conf.position[0];

				top -= tip.outerHeight() - conf.offset[0];
				left += trigger.outerWidth() + conf.offset[1];

				if (/iPad/i.test(navigator.userAgent)) {
					top -= $(window).scrollTop();
				}

				var height = tip.outerHeight() + trigger.outerHeight();
				if (pos == 'center') {
					top += height / 2;
				}
				if (pos == 'bottom') {
					top += height;
				}

				pos = conf.position[1];
				var width = tip.outerWidth() + trigger.outerWidth();
				if (pos == 'center') {
					left -= width / 2;
				}
				if (pos == 'left') {
					left -= width;
				}

				return {
					top : top,
					left : left
				};
			}
			
			return {
				init : init
			};
		});
