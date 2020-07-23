/**
 * @module system_security
 * @class system_security
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    var container = $('#container')[0];
    var vm;
    /**
     * system security VM
     * @class SysSecurityModeVM
     */
	function SysSecurityModeVM() {
        var self = this;
        var info = service.getSysService();

        self.telnetFlag = ko.observable(info.telnetFlag);
        self.sshFlag = ko.observable(info.sshFlag);

        service.bindCommonData(self);
        service.systemSettingHide();
        self.clear = function() {
            init();
        };

        self.save = function() {
            showLoading();
            var params = {};
            params.telnetFlag = self.telnetFlag();
            params.sshFlag = self.sshFlag();
            service.setSysService(params, function(result) {
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
            getRightNav(SYSTEM_SETTINGS_COMMON_URL);
            getTabsNav(SYSTEM_SETTING_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		ko.cleanNode(container);
        vm = new SysSecurityModeVM();
		ko.applyBindings(vm, container);
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