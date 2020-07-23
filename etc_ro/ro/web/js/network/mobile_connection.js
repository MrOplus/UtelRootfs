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
        var info = service.getMobileData();
        self.mobile_connection_data_roaming = ko.observable(info.tz_roam_enable == "" ? "0" : info.tz_roam_enable);

         self.save = function() {
            var params = {
                tz_roam_enable: self.mobile_connection_data_roaming()
            }
            showLoading('waiting');
            service.mobileDataSet(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                    }else{
                    errorOverlay();
                }
            });
        }
        self.submitApply = function(){

             self.save();
        }
        service.bindCommonData(self);
        service.connectedHide();
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
            getRightNav(CONNECTION_SETTINGS_COMMON_URL);
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