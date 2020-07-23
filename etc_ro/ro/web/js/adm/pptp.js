/**
 * Router设置
 * @module lan
 * @class lan
 */
define([ 'jquery', 'knockout', 'config/config', 'service','underscore'],
    function ($, ko, config, service) {
        function LanVM() {
            var self = this;
            var info = service.getPptp();
            self.tz_pptp_vpn_state = ko.observable(info.tz_pptp_vpn_state == "" ? "no" : info.tz_pptp_vpn_state);
            console.log(self.tz_pptp_vpn_state());
            self.tz_pptp_vpn_server = ko.observable(info.tz_pptp_vpn_server);
            self.tz_pptp_vpn_name = ko.observable(info.tz_pptp_vpn_name);
            self.tz_pptp_vpn_pass = ko.observable(info.tz_pptp_vpn_pass);
            self.tz_pptp_vpn_mtu = ko.observable(info.tz_pptp_vpn_mtu);
            self.tz_pptp_vpn_mppe = ko.observable(info.tz_pptp_vpn_mppe);
            self.tz_pptp_vpn_defaultroute = ko.observable(info.tz_pptp_vpn_defaultroute == "" ? "no" : info.tz_pptp_vpn_defaultroute);
            self.tz_pptp_get_ip = ko.observable(info.tz_pptp_get_ip);
            self.tz_pptp_peer_ip = ko.observable(info.tz_pptp_peer_ip);

            self.isShowStaticIpDiv = ko.observable(self.tz_pptp_vpn_state() == "yes");

            self.staticIpHandle = function (enable) {
                enable == "yes" ? $("#showL2tpDiv").show() : $("#showL2tpDiv").hide();
                return true;
         };
            service.bindCommonData(self);
            service.systemSettingHide();
            self.saveAct = function() {
                showLoading();
                var params = {
                    tz_pptp_vpn_state: self.tz_pptp_vpn_state(),
                    tz_pptp_vpn_server: self.tz_pptp_vpn_server(),
                    tz_pptp_vpn_name: self.tz_pptp_vpn_name(),
                    tz_pptp_vpn_pass: self.tz_pptp_vpn_pass(),
                    tz_pptp_vpn_mtu: self.tz_pptp_vpn_mtu(),
                    tz_pptp_vpn_mppe: self.tz_pptp_vpn_mppe(),
                    tz_pptp_vpn_defaultroute: self.tz_pptp_vpn_defaultroute(),
                    CSRFToken: self.CSRFToken
                };
                service.setPptp(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };
}
        /**
         * 初始化
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(VPV_SETTINGS_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new LanVM();
            ko.applyBindings(vm, container[0]);

            $('#frmLan').validate({
                submitHandler:function () {
                    vm.saveAct();
                },
                rules:{
                    tz_l2tp_mtu:{range: [1, 1460],digits: true},
                    tz_l2tp_lns_server:"lanip_check"
                }
            });

        }
        return {
            init:init
        }
    }
);
