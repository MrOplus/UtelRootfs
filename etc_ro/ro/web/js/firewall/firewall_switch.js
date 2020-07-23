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
    function DdnsViewModel(){;
        var self = this;
        var info = service.getFirewallSwitch();
        self.port_settings = ko.observable(info.firewall_switch = "" ? "0" : info.firewall_switch);
        self.isHideFirewall = ko.observable(true);
        if(self.port_settings() == "0"){
            self.isHideFirewall(false);
        }
         self.save = function() {;
            showLoading('waiting');
            service.setFirewallSwitch({
                firewall_switch:self.port_settings()
            }, function(result) {
                if (result.result == "success") {
                    var info2 = service.getFirewallSwitch().firewall_switch;
                    if(info2 == "0"){
                        self.isHideFirewall(false);
                    }else{
                      self.isHideFirewall(true);
                    }
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
        service.volteSettingHide();
}
    /**
     * 初始化
     * @method init
     */
    function init() {
        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
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