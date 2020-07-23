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
        var info = service.getMonitor();
        self.port_settings = ko.observable(info.siproxd_enable = "" ? "0" : info.siproxd_enable);
        self.port = ko.observable(info.sip_listen_port);
        self.staticIpHandle = function(enable){
            enable == '1' ? $("#staticIpDiv").show() : $("#staticIpDiv").hide();
            return true;
        }
        self.isShowStaticIpDiv =ko.observable(self.port_settings() == "1");
         self.save = function() {
            showLoading('waiting');
            service.monitorSettings({
                enable:self.port_settings(),
                sip_listen_port:self.port()
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
        self.submitApply = function(){

             self.save();
        }
        service.bindCommonData(self);
        service.volteSettingHide();
       var params = {};
            params.goformId = "SET_VOLTE_STATUS";
            service.setVolteStatus(params, function(data){
        }); 
        /**
         * 提交
         * @method apply
         */
        self.apply = function() {
            showLoading();
            var params = {};
            params.goformId = "DDNS";
            params.DDNS_Enable = self.currentMode();
            

            service.setDDNSForward(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                    data = service.getDdnsParams();
                } else {
                    errorOverlay();
                }
            });         
        };   
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
    
        $("#ddnsForm").validate({
            submitHandler: function(){
                vm.apply();
            },
            rules: {
                ddns_passwd_input:"password_check",
                DDNS_Hash_Value:"ddns_hashvalue_check",
                ddns_passwd_inputshow:"password_check"
            },errorPlacement:function (error, element) {
                var id = element.attr("id");
                if (id == "ddns_passwd_input" ) {
                    error.insertAfter("#lblShowPassword");
                } else if (id == "ddns_passwd_inputshow" ){
                    error.insertAfter("#lblShowPassword");
                }else {
                    error.insertAfter(element);
                }
            }
        });
    }
    
    return {
        init: init
    };
});