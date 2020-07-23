/**
 * @module dmz setting
 * @class dmz setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * system gre setting VM
     * @class GreSettingVM
     */
	function GreSettingVM() {
        var self = this;
        var info = getGreSetting();
		
        self.greEnable = ko.observable(info.greEnable);
		self.tunnelName = ko.observable(info.tunnelName);
		self.defaultGateway = ko.observable(info.defaultGateway);
        self.ipAddress = ko.observable(info.ipAddress);
		self.localIp = ko.observable(info.localIp);
        self.remoteIp = ko.observable(info.remoteIp);
        service.bindCommonData(self);
        self.clear = function() {
            init();
        };
    /**
     * 应用按钮事件
     * @method save
     */
        self.save = function() {
            showLoading();
            var params = {};
			self.defaultGateway($("#gatewayCheckbox:checked").length > 0? '1' : '0');
            params.greEnable = self.greEnable();
			params.tunnelName = self.tunnelName();
			params.defaultGateway = self.defaultGateway();
            params.ipAddress = self.ipAddress();
			params.localIp = self.localIp();
			params.remoteIp = self.remoteIp();
            params.CSRFToken = self.CSRFToken;
			
            service.setGreSetting(params, function(result) {
                if (result.result == "success") {
                    self.clear();
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };
    }

    /**
     * 获取dmz 信息
     * @method getGreSetting
     */
    function getGreSetting() {
        return service.getGreSetting();
    }

    /**
     * 初始化DmzSettingVM model
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
		var vm = new GreSettingVM();
		ko.applyBindings(vm, container[0]);
        $('#greSettingForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtIpAddress: 'ipv4',
				txtLocalIp: 'ipv4',
				txtRemoteIp: 'ipv4'
            }
        });
	}

	return {
		init : init
	};
});