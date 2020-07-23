/**
 * @module system_security
 * @class system_security
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

	function SysSecurityModeVM() {
        var self = this;
        var info = service.getDdosStatus();
        self.ddosProtectionFlag = ko.observable(info.ddosProtectionFlag);
        service.bindCommonData(self);
        service.firewallHide();
        var info2 = service.getFirewallSwitch().firewall_switch;
            self.isHideFirewall = ko.observable(true);
            if(info2 == "0"){
                self.isHideFirewall(false);
            }
        self.clear = function() {
            init();
        };
        self.save = function() {
            showLoading();
            var params = {};
            params.ddosProtectionFlag = self.ddosProtectionFlag();
            service.setDdosStatus(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });

        };
    }

	function init() {
	    if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new SysSecurityModeVM();
		ko.applyBindings(vm, container[0]);
        $('#sysSecurityForm').validate({
            submitHandler : function() {
                vm.save();
            }
        });
	}

	return {
		init : init
	};
});