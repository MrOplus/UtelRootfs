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
        var info = service.getSnmpData();
        self.port_settings = ko.observable(info.tz_snmp_enable = "" ? "no" : info.tz_snmp_enable);
        self.snmp_port = ko.observable(info.snmp_port);
        self.snmp_rocommunity = ko.observable(info.snmp_rocommunity);
        self.snmp_rwcommunity = ko.observable(info.snmp_rwcommunity);
        self.staticIpHandle = function(enable){
            enable == 'yes' ? $("#staticIpDiv").show() : $("#staticIpDiv").hide();
            return true;
        }
        self.isShowStaticIpDiv =ko.observable(self.port_settings() == "yes");
         self.save = function() {
            showLoading('waiting');
            service.snmpSettings({
                tz_snmp_enable:self.port_settings(),
                snmp_port:self.snmp_port(),
                snmp_rocommunity:self.snmp_rocommunity(),
                snmp_rwcommunity:self.snmp_rwcommunity()
            }, function(result) {
                if (result.result == "success") {
                        successOverlay();
                          
                } else {
                    errorOverlay();
                }
            });
        }
        self.submitApply = function(){

             self.save();
        }
        service.bindCommonData(self);
        service.advanceHide();
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