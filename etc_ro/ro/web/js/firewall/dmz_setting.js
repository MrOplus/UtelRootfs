/**
 * @module dmz setting
 * @class dmz setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * system dmz setting VM
     * @class DmzSettingVM
     */
	function DmzSettingVM() {
        var self = this;
        var info = getDmzSetting();
        self.isDataCard = config.PRODUCT_TYPE == 'DATACARD';
        self.dmzSetting = ko.observable(info.dmzSetting);
        self.ipAddress = ko.observable(info.ipAddress);
		service.bindCommonData(self);
        service.firewallHide();
        self.clear = function() {
            init();
        };
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }
    /**
     * 应用按钮事件
     * @method save
     */
        self.save = function() {
            showLoading();
            var params = {};
            params.dmzSetting = self.dmzSetting();
            params.ipAddress = self.ipAddress();
            params.CSRFToken = self.CSRFToken;
            service.setDmzSetting(params, function(result) {
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
     * @method getDmzSetting
     */
    function getDmzSetting() {
        return service.getDmzSetting();
    }

    /**
     * 初始化DmzSettingVM model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DmzSettingVM();
		ko.applyBindings(vm, container[0]);
        $('#dmzSettingForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtIpAddress: 'dmz_ip_check'
            }
        });
	}

	return {
		init : init
	};
});