/**
 * Created by hewq on 18/04/17.
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        function systemLogVM() {
            var self = this;
            self.getSysLog = getTextData("/data/syslogd.html");
            service.getSystemLog({
                subcmd: 0
            },function(){

            });
            self.clearLog = function(){
                showConfirm("system_log_clear", function () {
                    service.getSystemLog({
                        subcmd: 1
                    },function(){
                        window.location.reload();
                    });
                });

            }
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new systemLogVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });

