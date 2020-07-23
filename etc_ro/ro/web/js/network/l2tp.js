/**
 * Router设置
 * @module lan
 * @class lan
 */
define([ 'jquery', 'knockout', 'config/config', 'service','underscore'],
    function ($, ko, config, service) {
        function LanVM() {
            var self = this;
            var info = service.getL2tp();
            self.static_ip_enable = ko.observable(info.tz_l2tp_state);
            self.tz_l2tp_lac_name = ko.observable(info.tz_l2tp_lac_name);
            self.tz_l2tp_lns_server = ko.observable(info.tz_l2tp_lns_server);
            self.tz_l2tp_tunnel_name = ko.observable(info.tz_l2tp_tunnel_name);
            self.tz_l2tp_challenge_pass = ko.observable(info.tz_l2tp_challenge_pass);
            self.tz_l2tp_auth_name = ko.observable(info.tz_l2tp_auth_name);
            self.tz_l2tp_mtu = ko.observable(info.tz_l2tp_mtu);
            self.tz_l2tp_lns_checkalive = ko.observable(info.tz_l2tp_lns_checkalive == "yes");
            self.tz_l2tp_auth_pass = ko.observable(info.tz_l2tp_auth_pass);
            self.tz_l2tp_peer_ip = ko.observable(info.tz_l2tp_peer_ip);
            self.tz_l2tp_get_ip = ko.observable(info.tz_l2tp_get_ip);

            self.static_ip_enable = ko.observable(info.tz_l2tp_state == "" ? "0" : info.tz_l2tp_state);

        	self.isShowStaticIpDiv = ko.observable(self.static_ip_enable() == "1");

        	self.staticIpHandle = function (enable) {
            	enable == "1" ? $("#showL2tpDiv").show() : $("#showL2tpDiv").hide();
            	return true;
       	 };
            service.bindCommonData(self);
            service.systemSettingHide();
            self.saveAct = function() {
                showLoading();
                var params = {
                    tz_l2tp_state: self.static_ip_enable(),
                    tz_l2tp_lac_name: self.tz_l2tp_lac_name(),
                    tz_l2tp_lns_server: self.tz_l2tp_lns_server(),
                    tz_l2tp_tunnel_name: self.tz_l2tp_tunnel_name(),
                    tz_l2tp_challenge_pass: self.tz_l2tp_challenge_pass(),
                    tz_l2tp_auth_name: self.tz_l2tp_auth_name(),
                    tz_l2tp_mtu: self.tz_l2tp_mtu(),
                    tz_l2tp_lns_checkalive: self.tz_l2tp_lns_checkalive() == true ?  "yes" : "no",
                    tz_l2tp_auth_pass: self.tz_l2tp_auth_pass(),
                    CSRFToken: self.CSRFToken
                };
                service.setL2tp(params, function(result) {
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
