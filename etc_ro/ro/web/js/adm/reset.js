/**
 * others 模块
 * @module others:Restart and Reset、Turn Off Device、Fast Boot Settings、SNTP、PIN Management
 * @class others
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
		
        /**
         * othersViewModel
         * @class ResetVM
         */
        function ResetVM() {
            var self = this;
            self.fastbootSupport = config.FAST_BOOT_SUPPORT;
            self.turnOffSupport = config.TURN_OFF_SUPPORT;
            self.hasUssd = config.HAS_USSD;
            self.SNTPSupport = config.HAS_SNTP;
            self.hasUsb = config.HAS_USB;
		    self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
			self.hasDdns = config.DDNS_SUPPORT;
			self.hasTr069 = config.TR069_SUPPORT;
			
            var inChildGroup = false;
            if (config.HAS_PARENTAL_CONTROL) {
                inChildGroup = service.checkCurrentUserInChildGroup().result;
            }
            self.currentUserInChildGroup = ko.observable(inChildGroup);

            var fastbootInfo = service.getFastbootSetting();
            self.fastbootEnableFlag =  ko.observable(config.RJ45_SUPPORT ? (fastbootInfo.need_sim_pin != "yes" && service.getRj45PlugState().rj45_plug == "wan_lan_off") : fastbootInfo.need_sim_pin != "yes");
            self.fastbootSetting = ko.observable(fastbootInfo.fastbootEnabled);
 

            /**
             * 恢复出厂设置
             * @event restore
             */
            self.restore = function () {
                showConfirm("restore_confirm", function () {
                    showLoading("restoring");
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
            /**
             * 关机
             * @method turnoff
             */
            self.turnoff = function () {
                showConfirm("turnoff_confirm", function () {
                    showLoading("turnoff");
                    service.turnOffDevice({}, function (data) {
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
            var vm = new ResetVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });
