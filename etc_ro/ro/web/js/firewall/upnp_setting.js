/**
 * @module upnp setting
 * @class upnp setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * system upnp setting VM
     * @class UpnpSettingVM
     */
	function UpnpSettingVM() {
        var self = this;
        var info = getUpnpSetting();

        self.upnpSetting = ko.observable(info.upnpSetting);
        service.bindCommonData(self);
        service.firewallHide();
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }
        self.save = function() {
            showLoading();
            var params = {};
            params.upnpSetting = self.upnpSetting();
            params.CSRFToken = self.CSRFToken;
            service.setUpnpSetting(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });

        };
    }

    /**
     * 获取upnp 信息
     * @method getUpnpSetting
     */
    function getUpnpSetting() {
        return service.getUpnpSetting();
    }

    /**
     * 初始化UpnpSettingVM model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new UpnpSettingVM();
		ko.applyBindings(vm, container[0]);
        $('#upnpSettingForm').validate({
            submitHandler : function() {
                vm.save();
            }
        });
	}

	return {
		init : init
	};
});