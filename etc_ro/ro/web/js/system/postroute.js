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
        var info = getPostRoute();
        self.postRouteFlag = ko.observable(info.postRouteFlag);
        service.bindCommonData(self);
        service.systemSettingHide();
        self.clear = function() {
            init();
        };
        self.save = function() {
            showLoading();
            var params = {};
            params.postRouteFlag = self.postRouteFlag();
            service.setPostRoute(params, function(result) {
                if (result.result == "success") {
                    showConfirm("reboot_tips", function () {
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

        };
    }

    /**
     * 获取PostRoute 信息
     * @method getPostRoute
     */
    function getPostRoute() {
        return service.getPostRoute();
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