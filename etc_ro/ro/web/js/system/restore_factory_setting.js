/**
 * others 模块
 * @module others:Restart and Reset、Turn Off Device、Fast Boot Settings、SNTP、PIN Management
 * @class others
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
    
        /**
         * othersViewModel
         * @class othersVM
         */
        function othersVM() {
            var self = this;
            service.bindCommonData(self);
            service.systemSettingHide();
			var inChildGroup = false;
			if (config.HAS_PARENTAL_CONTROL) {
				inChildGroup = service.checkCurrentUserInChildGroup().result;
			}
			self.currentUserInChildGroup = ko.observable(inChildGroup);
            /**
             * 恢复出厂设置
             * @event restore
             */
            self.restore = function () {
                showConfirm("restore_confirm", function () {
                    showLoading("restoring");
                    setTimeout(function(){
                        service.restoreFactorySettings({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, function (result) {
                        if (isErrorObject(result) && result.errorType == 'no_auth') {
                            errorOverlay();
                        }
                    });
                    },1000)
                });
            };
            /**
             * 重启
             * @method restart
             */
            self.restart = function () {
                showConfirm("restart_confirm", function () {
                    showLoading("restarting");
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
            };
        }
        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(SYSTEM_SETTING_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = new othersVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });
