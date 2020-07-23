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
        self.protection_password = ko.observable("");
        self.protection_password_2 = ko.observable("");
        var reg = /^[0-9a-zA-Z!#\(\)\+\-\.\/%=\?@\^_\{|\}~]{4,8}$/;
         self.save = function() {

            if(reg.test(self.protection_password()) ==false){
                if(self.protection_password().length < 1){
                    showAlert("password_note_valid_2");
                    return false;
                }
                if(self.protection_password().length > 32 || self.protection_password().length < 8 ){
                    showAlert("password_note_valid_length");
                    return false;
                }
                showAlert("password_note_input_2");
                return false;
            };
            if(self.protection_password() != self.protection_password_2()){
                showAlert("equalToPassword");
                return false;
            }
            showLoading('waiting');
            service.protectionPassword({
                protection_password:self.protection_password()
            }, function(result) {
                if (result.result == "success") {
                      showConfirm("restart_confirm", function () {
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