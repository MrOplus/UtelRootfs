/**
 * operation mode popup模块
 * @module opmode
 * @class opmode
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {

    /**
	 * opModeViewModel
	 * @class opModeViewModel
	 */     
    function opModeViewModel() {
		var self = this;
		var mode = "";
		self.selectedMode = ko.observable("0");	
	    /**
	     * 初始化界面模式显示
	     */		
		service.getOpMode({}, function(data){
			if(data.blc_wan_mode == "PPPOE"){
                mode = "PPPOE";
            }else if(data.blc_wan_mode == "AUTO_PPP" || data.blc_wan_mode == "AUTO_PPPOE"){
                mode = "AUTO";
            }else{
                mode = data.blc_wan_mode;
            }
			self.selectedMode(mode);
		});
	    /**
	     * 切换模式设置
	     * @method changeOpMode
	     */		
		self.changeOpMode = function(){
			var userSelectedMode = $('input:radio[name="opMode"]:checked').val();
            var txt = "";
			if(userSelectedMode == mode) {
				hidePopupSettingWindow();
				return;
			}
            if(userSelectedMode == "LTE_BRIDGE"){
                txt = "opmode_msg3";
            }else{
                txt = "opmode_msg2";
            }
			showConfirm(txt, function(){
                showLoading();
				service.SetOperationMode({
					opMode: userSelectedMode
				},function(data){
					if (data && data.result == "success") {
						var currentOpMode = "";
						switch(userSelectedMode){
							case "AUTO":
								currentOpMode = "opmode_auto"
								break;
							case "PPPOE":
								currentOpMode = "opmode_cable";
								break;
							case "PPP":
								currentOpMode = "opmode_gateway";
								break;
							default:
								break;
						}
						$("#opmode").attr("data-trans", currentOpMode).text($.i18n.prop(currentOpMode));
						successOverlay();						
					} else {
						errorOverlay();
					}
				});
			});
			
		}
		
	}

	/**
	 * 初始化 ViewModel，并进行绑定
	 * @method init
	 */
	function init() {
		var vm = new opModeViewModel();
		ko.applyBindings(vm, $('#popupSettingWindow')[0]);
		
		$("#opmode_form").validate({
			submitHandler: function(){
				vm.changeOpMode();
			}
		});
	}

	return {
		init:init
	};
});
