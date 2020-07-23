/**
 * switch 模块
 * @module switch
 * @class switch
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /**
         * SwitchPortVM
         * @class SwitchPortVM
         */
        function SwitchPortVM() {
            var self = this;
            self.openSerialPort = ko.observable();
            /**
             * 转换端口
             * @event switch
             */
        self.switchPort = function () {
                showLoading("switching");
                var openSerialPort = self.openSerialPort();
                if(typeof openSerialPort == 'undefined') {
                    showInfo("select_an_option");
                    return;
                }
                service.switchPortForLog({
                    change_mode: openSerialPort
                }, function (data) {
                    if (data && data.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                }, $.noop);
            }
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new SwitchPortVM();
            ko.applyBindings(vm, $('#container')[0]);

            $('#frmSwitchPort').validate({
                submitHandler:function () {
                    vm.switchPort();
                }
            });
        }

        return {
            init:init
        }
    });
