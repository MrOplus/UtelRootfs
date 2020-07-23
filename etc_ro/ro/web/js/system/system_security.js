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
        var info = getSysSecurity();
        self.remoteFlag = ko.observable(info.remoteFlag);
        self.pingFlag = ko.observable(info.pingFlag);
        service.bindCommonData(self);
        self.clear = function() {
            init();
        };
        self.save = function() {
            showLoading();
            var params = {};
            params.remoteFlag = self.remoteFlag();
            params.pingFlag = self.pingFlag();
            service.setSysSecurity(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });

        };
    }

    /**
     * 获取system security 信息
     * @method getSysSecurity
     */
    function getSysSecurity() {
        return service.getAllOnceDatas();
    }

    /**
     * 初始化system security mode view model
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