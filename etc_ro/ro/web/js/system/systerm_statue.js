/**
 * 系统状态设置模块
 * @module Systerm Statue
 * @class DDNS
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],
    function ($, ko, config, service, _) {
        var CONNECT_STATUS = {CONNECTED: 1, DISCONNECTED: 2, CONNECTING: 3, DISCONNECTING: 4};
        var dhcpenable = {dhcp_connect: 1, dhcp_unconnect: 0};
        var pdptype = {ipv4: "IP", ipv6: "IPv6", ipv4v6: "IPv4v6"};
        var lanconnectstatue = {plug_on: "plug_on", plug_off: "plug_off"};

        /**
         * 系统状态view model
         * @class SystermStatueViewModel
         */
        function SystermStatueViewModel() {
            var self = this;

            var data = service.getSystermStatue();
            var info = service.getApnSettings();//add by litao

            //获取WAN口相关信息
            self.wandnsserver = ko.observable("");
            self.ipv6_wandnsserver = ko.observable("");
            self.wannetmask = ko.observable(data.wannetmask);
            self.wandefaultnetgate = ko.observable("");
            self.ipv6_wandefaultnetgate = ko.observable("");

            self.wan_ipaddr = ko.observable("");
            self.ipv6_wan_ipaddr = ko.observable("");
            self.pdp_type = ko.observable(data.pdp_type);
            self.pdptype_display = ko.observable("");
            self.pdptype_trans = ko.computed(function () {
                if (pdptype.ipv4 == self.pdp_type()) {
                    self.pdptype_display($.i18n.prop("IPV4"));
                    return "IPV4";
                } else if (pdptype.ipv6 == self.pdp_type()) {
                    self.pdptype_display($.i18n.prop("IPV6"));
                    return "IPV6";
                } else if (pdptype.ipv4v6 == self.pdp_type()) {
                    self.pdptype_display($.i18n.prop("IPV4V6"));
                    return "IPV4V6";
                }
            });

            self.lanipaddr = ko.observable("");
            self.ipv6_lanipaddr = ko.observable("");
            self.lanmacaddr = ko.observable(data.lanmacaddr);
            self.lannetmask = ko.observable(data.lannetmask);

            self.landhcpstatue = ko.observable(data.landhcpstatue);
            self.dhcpenable_display = ko.observable("");
            self.landhcpstatue_trans = ko.computed(function () {
                if (dhcpenable.dhcp_connect == self.landhcpstatue()) {
                    self.dhcpenable_display($.i18n.prop("dhcp_connect"));
                    return "dhcp_connect";
                } else {
                    self.dhcpenable_display($.i18n.prop("dhcp_unconnect"));
                    return "dhcp_unconnect";
                }
            });

            self.lanconnectstatue = ko.observable(data.lanconnectstatue);
            self.lanconnectstatue_display = ko.observable("");
            self.lanconnectstatue_trans = ko.computed(function () {
                if (lanconnectstatue.plug_on == self.lanconnectstatue()) {
                    self.lanconnectstatue_display($.i18n.prop("lan_connect"));
                    return "lan_connect";
                } else {
                    self.lanconnectstatue_display($.i18n.prop("lan_unconnect"));
                    return "lan_unconnect";
                }
            });
            self.homee = function () {
                window.location = "#home";
            };
            self.modifypassword = function () {
                window.location = "#modify_password";
            };
            self.systemcheck = function () {
                window.location = "#system_check";
            };
            self.systemupgrade = function () {
                window.location = "#system_upgrade";
            };
            self.ping = function () {
                window.location = "#ping";
            };
            self.reboot = function () {
                window.location = "#reboot";
            };
            self.systemlog = function () {
                window.location = "#system_log";
            };

            self.getNetInfo = function (data) {
                var addrInfo = {
                    wanIpAddress: '',
                    ipv6WanIpAddress: '',
                    wanDnsServer: '',
                    ipv6wanDnsServer: '',
                    wan_gw: '',
                    ipv6_wan_gw: '',
                    lanIpaddr: '',
                    ipv6_lanIpaddr: ''

                };
                var currentMode = checkCableMode(data.blc_wan_mode);
                if (currentMode && data.ethwan_mode != "STATIC") {// 有线模式下的PPPOE、DHCP、auto

                } else if (currentMode && data.ethwan_mode == "STATIC") {// 有线模式下的STATIC

                } else {
                    // var pdp_type = self.getpdptype(data.pdp_type);
                    var pdp_type = info.pdpType;
                    if (pdp_type == 'IP') {
                        self.wan_ipaddr(verifyDeviceInfo(data.wan_ipaddr));
                        self.ipv6_wan_ipaddr("--");
                        self.wandnsserver(verifyDeviceInfo(data.wandnsserver));
                        self.ipv6_wandnsserver("--");
                        self.wandefaultnetgate(verifyDeviceInfo(data.wan_gateway));
                        self.ipv6_wandefaultnetgate("--");
                        self.lanipaddr(verifyDeviceInfo(data.lanipaddr));
                        self.ipv6_lanipaddr("--");
                    } else if (pdp_type == 'IPv6') {
                        self.ipv6_wan_ipaddr(verifyDeviceInfo(data.ipv6_wan_ipaddr));
                        self.wan_ipaddr("--");
                        self.wandnsserver("--");
                        self.ipv6_wandnsserver(verifyDeviceInfo(data.ipv6_wandnsserver));
                        self.wandefaultnetgate("--");
                        self.ipv6_wandefaultnetgate(verifyDeviceInfo(data.ipv6_wan_gateway));
                        self.lanipaddr("--");
                        self.ipv6_lanipaddr(verifyDeviceInfo(data.ipv6_lanipaddr));
                    } else if (pdp_type == 'IPv4v6') {
                        self.wan_ipaddr(verifyDeviceInfo(data.wan_ipaddr));
                        self.ipv6_wan_ipaddr(verifyDeviceInfo(data.ipv6_wan_ipaddr));
                        self.wandnsserver(verifyDeviceInfo(data.wandnsserver));
                        self.ipv6_wandnsserver(verifyDeviceInfo(data.ipv6_wandnsserver));
                        self.wandefaultnetgate(verifyDeviceInfo(data.wan_gateway));
                        self.ipv6_wandefaultnetgate(verifyDeviceInfo(data.ipv6_wan_gateway));
                        self.lanipaddr(verifyDeviceInfo(data.lanipaddr));
                        self.ipv6_lanipaddr(verifyDeviceInfo(data.ipv6_lanipaddr));
                    } else {
                        self.wan_ipaddr("--");
                        self.ipv6_wan_ipaddr("--");
                        self.wandnsserver("--");
                        self.ipv6_wandnsserver("--");
                        self.wandefaultnetgate("--");
                        self.ipv6_wandefaultnetgate("--");
                        self.lanipaddr("--");
                        self.ipv6_lanipaddr("--");
                    }
                }
                return addrInfo;
            };

            self.getNetInfo(data);

            self.FreshParam = function () {
                var data = service.getSystermStatue();
                var info = service.getStatusInfo();//add by litao


                //获取WAN口相关信息
                self.wannetmask(data.wannetmask);
                self.pdp_type(data.pdp_type);

                self.lanmacaddr(data.lanmacaddr);
                self.lannetmask(data.lannetmask);
                self.landhcpstatue(data.landhcpstatue);
                self.lanconnectstatue(data.lanconnectstatue);

                self.getNetInfo(data);
            };
        }

        /**
         * 初始化
         * @method init
         */
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SystermStatueViewModel();
            ko.applyBindings(vm, container[0]);

            addInterval(function () {
                vm.FreshParam();
            }, 1000);
        }

        return {
            init: init
        };
    });
