/**
 * DDNS设置模块
 * @module DDNS
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
    /**
     * DDNS设置view model
     * @class ddnsViewModel
     */
    function DdnsViewModel(){
        var self = this;
        var info = service.getAllOnceDatas();
        self.port_settings = ko.observable(info.need_init_modem = "" ? "no" : info.need_init_modem);
        
         self.click = function() {
            showLoading('waiting');
            service.automaticDialing({
                need_init_modem:self.port_settings()
            }, function(result) {
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
        service.bindCommonData(self);
        service.systemSettingHide();
}
    /**
     * 初始化
     * @method init
     */
    function init() {
        if(this.init){
            getRightNav(SYSTEM_SETTINGS_COMMON_URL);
            getTabsNav(SYSTEM_SETTING_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new DdnsViewModel();
        ko.applyBindings(vm, container[0]);
    
        // $("#automaticDialingButton").validate({
        //     submitHandler: function(){
        //         vm.apply();
        //     }
        // });
    }
    
    return {
        init: init
    };
});
