/**
 * @module system_security
 * @class system_security
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * system security VM
     * @class SysSecurityModeVM
     */
	function SysSecurityModeVM() {
        var self = this;
        var wifiCalibrationFlag = service.getWifiCalibration().wifiCalibrationFlag;
        self.wifiCalibrationFlag = ko.observable(wifiCalibrationFlag == "1" ? "1" : "0" );
        service.bindCommonData(self);
        self.save = function() {
            showLoading();
            var params = {};
            params.wifiCalibrationFlag = self.wifiCalibrationFlag();
            service.setWifiCalibration(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });

        };
    }

    /**
     * 初始化system security mode view model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(SYSTEM_SETTINGS_COMMON_URL);
            getTabsNav(NETWORK_TOOLS_COMMON_URL);
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