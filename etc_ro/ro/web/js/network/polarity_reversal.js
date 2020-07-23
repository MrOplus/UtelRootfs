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
        var info = service.getAllOnceDatas();

        self.polarity_reversal = ko.observable(info.polarity_reversal);
        service.bindCommonData(self);
        service.volteSettingHide();
        self.save = function() {
            showLoading();
            var params = {};
            params.polarity_reversal = self.polarity_reversal();
            params.CSRFToken = self.CSRFToken;
            service.setPolarityReversa(params, function(result) {
                if (result.result == "success") {
                     showConfirm("restart_confirm", function () {
                    
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
             getRightNav(VOLTE_SETTINGS_URL);
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