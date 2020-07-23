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
        var info = service.getHttpsPort();
        self.port_settings = ko.observable(info.wan_ssl_enable = "" ? "0" : info.wan_ssl_enable);
        self.port = ko.observable(info.wan_ssl_port);
        self.isShowStaticIpDiv =ko.observable(self.port_settings() == "1");
         self.save = function() {
            var params = {
                wan_ssl_port: self.port()
            }
            showLoading('waiting');
            service.httpsPortSettings(params, function(result) {
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
        self.save2 = function() {
            var params = {
                wan_ssl_enable: self.port_settings()
            }
            showLoading('waiting');
            service.httpsSwitchPortSettings(params, function(result) {
                if (result.result == "success") {
                    var info = service.getHttpsPort();
                    self.port_settings(info.wan_ssl_enable = "" ? "0" : info.wan_ssl_enable);
                    self.isShowStaticIpDiv(info.wan_ssl_enable == "1");
                    successOverlay();     
                } else {
                    errorOverlay();
                }
            });
        }
        self.submitApply = function(){
             self.save();
        }
        self.submitApply2 = function(){

             self.save2();
        }
        service.bindCommonData(self);
        service.advanceHide();
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
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
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