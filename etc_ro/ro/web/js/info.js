/**
 * Created by hewq on 27/06/17.
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function($, ko, config, service, _) {


        function SystemCheckModeVM() {
            var self = this;
            var info = service.getSystemCheckMessage();
            var statusInfo = service.getSystemStatus();
            var permission = service.getStatusInfo().accountPower;
            var deviceInfo = service.getDeviceInfo();
            var versionData = service.getDeviceVersion();

            self.imei = deviceInfo.imei;
            self.lanMac = versionData.eth0_mac;
            self.buildTime = versionData.build_time;

            self.upTime = statusInfo.online_time == "" ? "FAIL" : transSecond2Time(statusInfo.online_time);
            self.internet = info.internet == "" ? "FAIL" : permission == '1' ? info.internet : "OK";
            self.netRegisterStatus = statusInfo.service_status == "" ? "FAIL" : permission == '1' ? statusInfo.service_status : "OK";
            self.signal = info.signal == "" ? "FAIL" : +(info.signal) < -115 ? permission == '1' ? info.signal : "FAIL" : permission == '1' ? info.signal : "OK";
            self.pin = info.pin == "" ? "FAIL" : permission == '1' ? info.pin : "OK";
            self.puk = info.puk == "" ? "FAIL" : permission == '1' ? info.puk : "OK";
            self.sim = statusInfo.sim_status == "" ? "FAIL" : permission == '1' ? statusInfo.sim_status : "OK";
            self.wanIP = statusInfo.wan_ip == "" ? "FAIL" : permission == '1' ? statusInfo.wan_ip : "OK";
            self.wanNetMask = info.wan_netmask == "" ? "FAIL" : permission == '1' ? info.wan_netmask : "OK";
            self.gateway = info.gateway == "" ? "FAIL" : permission == '1' ? info.gateway : "OK";
            if( statusInfo.service_status != "ok" ){
                self.dns = "FAIL";
            }else{
                self.dns = statusInfo.dns == "" ? "FAIL" : permission == '1' ? statusInfo.dns : "OK";
            }
        }

        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SystemCheckModeVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init : init
        };
    });
