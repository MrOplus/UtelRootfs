/**
 * DDNS设置模块
 * @module DDNS
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
	function DdnsViewModel(){
        service.bindCommonData(self);
        service.volteSettingHide();
        $(".form-control").val(service.voiceCallType().tz_voice_type);
            self.save = function() {
            var params = {};
            params.goformId = "TZ_VOICE_TYPE";
            params.tz_voice_type = $(".form-control").val();
            showLoading('waiting');
            service.setVoiceCallType(params, function(result) {
                if (result.result == "success") {
                    showConfirm("reboot_tips", function(){
                        showLoading("restarting");
                        service.restart({}, function (data) {
                            if (data && data.result == "success") {
                                successOverlay();
                            } else {
                                errorOverlay();
                            }
                        }, $.noop);
                    });
                } else {
                    errorOverlay();
                }
            });
        }
        self.submitApply = function(){

             self.save();
        }

}
    /**
     * 初始化
     * @method init
     */
	function init() {
		if(this.init){
            getRightNav(VOLTE_SETTINGS_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DdnsViewModel();
		ko.applyBindings(vm, container[0]);
	
    }
    
    return {
        init: init
    };
});