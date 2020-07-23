/**
 * @module usb
 * @class usb
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function($, ko, config, service, _) {

        var container = $('#container')[0];
        var vm;
        /**
         * system usb VM
         * @class UsbModeVM
         */
        function UsbModeVM() {
            var self = this;
            var info = service.getAllOnceDatas();

            self.usbPortFlag = ko.observable(info.usbPortFlag);
            self.usbDownloadFlag = ko.observable(info.usbDownloadFlag);

            service.bindCommonData(self);
            service.systemSettingHide();
            self.clear = function() {
                init();
            };

            self.save = function() {
                showLoading();
                var params = {};
                params.usbPortFlag = self.usbPortFlag();
                params.usbDownloadFlag = self.usbDownloadFlag();
                service.setUsbStatus(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };
        }

        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(SYSTEM_SETTING_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            ko.cleanNode(container);
            vm = new UsbModeVM();
            ko.applyBindings(vm, container);
        }

        return {
            init : init
        };
    });