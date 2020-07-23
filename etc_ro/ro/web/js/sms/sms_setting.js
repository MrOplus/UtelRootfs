/**
 * 短信参数设置
 * @module sms_setting
 * @class sms_setting
 */
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service' ],
    function(_, $, ko, config, service) {

        var validityModes = _.map(config.SMS_VALIDITY, function(item) {
            return new Option(item.name, item.value);
        });

        function SmsSettingVM() {
            var self = this;
            var setting = getSmsSetting();
            var control_sms_edit = service.getAllOnceDatas().control_sms_edit;
            self.CSRFToken = service.getToken().token;
            self.modes = ko.observableArray(validityModes);
            self.selectedMode = ko.observable(setting.validity);
            self.centerNumber = ko.observable(setting.centerNumber);
            self.deliveryReport = ko.observable(setting.deliveryReport);

            self.smsEdit = ko.observable(false);
            if(control_sms_edit == "no"){
                 self.smsEdit(true);
            }
            self.clear = function() {
                init();
                clearValidateMsg();
            };
            self.homes = function () {
                window.location = "#home";
            };
            self.smss = function () {
                window.location = "#sms";
            };
            self.messages = function () {
                window.location = "#sim_messages";
            };
            self.active = function () {
                window.location = "#sms_setting";
            };
	        /**
	         * 保存设置
	         * @method save
	         */
            self.save = function() {
                showLoading('waiting');
                var params = {};
                params.validity = self.selectedMode();
                params.centerNumber = self.centerNumber();
                params.deliveryReport = self.deliveryReport();
                params.CSRFToken = self.CSRFToken;
                service.setSmsSetting(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };
        }

        /**
         * 获取短信设置参数
         * @method getSmsSetting
         * @return {Object}
         */
        function getSmsSetting() {
            return service.getSmsSetting();
        }
	    /**
	     * 页面初始化
	     * @method init
	     */
        function init() {
            getRightNav( SMS_COMMON_URL );
            getInnerHeader( INNER_HEADER_COMMON_URL );

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SmsSettingVM();
            ko.applyBindings(vm, container[0]);
            $('#smsSettingForm').validate({
                submitHandler : function() {
                    vm.save();
                },
                rules: {
                    txtCenterNumber: "sms_service_center_check"
                }
            });
        }

        return {
            init : init
        };
    }
);
