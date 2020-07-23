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
	function NatSettingVM() {
        var self = this;
        var info = getNatSetting();

        self.main_nat = ko.observable(info.main_nat);
        self.main_nat_1 = ko.observable(info.main_nat_1);
        self.main_nat_2 = ko.observable(info.main_nat_2);
        service.bindCommonData(self);
        service.advanceHide();
        self.save = function() {
            showLoading();
            var params = {};
            params.main_nat = self.main_nat();
            params.main_nat_1 = self.main_nat_1();
            params.main_nat_2 = self.main_nat_2();
            params.CSRFToken = self.CSRFToken;
            service.setNatSetting(params, function(result) {
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
    function getNatSetting() {
        return service.getNatSetting();
    }

    /**
     * 初始化UpnpSettingVM model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new NatSettingVM();
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