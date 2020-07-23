/**
 * Created by hewq on 17/04/17.
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function($, ko, config, service, _) {


        function SystemCheckModeVM() {
            var random = "#" + Math.random();
            $("#systemChecking").attr("action",random);
            var self = this;
            var info = service.getSystemCheckMessage();
            var statusInfo = service.getSystemStatus();
            var permission = service.getStatusInfo().accountPower;
            service.bindCommonData(self);
            service.systemSettingHide();
            self.upTime = info.uptime == "" ? "FAIL" : transSecond2Time(info.uptime);
            self.internet = info.internet == "" ? "FAIL" : permission == '1' ? info.internet : "OK";
            self.netRegisterStatus = info.net_register_status == "" ? "FAIL" : permission == '1' ? info.net_register_status : "OK";
            self.signal = info.signal == "" ? "FAIL" : +(info.signal) < -115 ? permission == '1' ? info.signal : "FAIL" : permission == '1' ? info.signal : "OK";
            self.pin = info.pin == "" ? "FAIL" : permission == '1' ? info.pin : "OK";
            self.puk = info.puk == "" ? "FAIL" : permission == '1' ? info.puk : "OK";
            self.sim = info.sim == "" ? "FAIL" : permission == '1' ? info.sim : "OK";
            self.wanIP = info.wan_ip == "" ? "FAIL" : permission == '1' ? info.wan_ip : "OK";
            self.wanNetMask = info.wan_netmask == "" ? "FAIL" : permission == '1' ? info.wan_netmask : "OK";
            self.gateway = info.gateway == "" ? "FAIL" : permission == '1' ? info.gateway : "OK";
            self.showNetworkSettingsWindow = function () {
                if (self.hasRj45) {
                    service.getOpMode({}, function (data) {
                        var mode = checkCableMode(data.blc_wan_mode);
                        if(mode){
                            tosms('#net_setting');
                        } else{
                            tosms('#net_select');
                        }
                    });
                }else{
                    tosms('#dial_setting');
                }
            };
            if( statusInfo.service_status != "ok" ){
                self.dns = "FAIL";
            }else{
                self.dns = info.dns == "" ? "FAIL" : permission == '1' ? info.dns : "OK";
            }
        }

        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SystemCheckModeVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init : init
        };
    });