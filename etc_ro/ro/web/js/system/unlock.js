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

            $(".btn-lg").click();
            var info = service.getUnlockCode();
            self.tz_unlock_plmn_pwd = ko.observable("");
            self.tz_unlock_private_mark = ko.observable("");
            self.tz_unlock_plmn_times = ko.observable("");
            self.attempt = ko.observable(info.tz_unlock_plmn_times);
            service.bindCommonData(self);
            service.systemSettingHide();
            self.clear = function() {
                init();
            };
            self.save1 = function() {
                 showLoading();
                var params = {};
                params.tz_unlock_private_mark = self.tz_unlock_private_mark();
                params.index = 1;
                service.setUnlockCode(params, function(result) {
                    if (result.result.result == "success") {
                        $("#showUnlock").show();
                        $("#cancel").click();
                        setTimeout(function(){
                            var info = service.getUnlockCode();
                            self.attempt(info.tz_unlock_plmn_times);
                            if(self.attempt() <=0){
                                $("#applyUn").attr("disabled",true);
                            }
                            successOverlay();
                        },1000)
                    } else {
                        errorOverlay();
                    }
                });
            };
            self.save2 = function() {
                showLoading();
                var params = {};
                params.index = 2;
                params.tz_unlock_plmn_pwd = self.tz_unlock_plmn_pwd();
                service.setUnlockCode(params, function(result) {
                    if (result.result.result == "success") {
                     showConfirm2("restart_unlock", function () {
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
                        var info = service.getUnlockCode();
                        self.attempt(info.tz_unlock_plmn_times);
                        if(self.attempt() <=0){
                            $("#applyUn").attr("disabled",true);
                        }
                        errorOverlay();
                    }
                });
            };
        }

        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
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