/**
 * Router设置
 * @module lan
 * @class lan
 */
define([ 'jquery', 'knockout', 'config/config', 'service'],
    function ($, ko, config, service) {
    var originfrmLan="";
        function LanVM() {
            var self = this;

            var info = getLanInfo();
            self.ipAddress = ko.observable(info.va0_ipaddr);
            self.ipAddress2 = ko.observable(info.ipAddress);
            self.ipAddress3 = ko.observable(info.va1_ipaddr);
            self.subnetMask = ko.observable(info.va0_netmask);
            self.macAddress = ko.observable(info.macAddress);
            self.dhcpServer = ko.observable(info.tz_dhcp2_enable);
            self.dhcpStart = ko.observable(info.va0_dhcpStart);
            self.dhcpEnd = ko.observable(info.va0_dhcpEnd);
            self.dhcpDns = ko.observable(info.va0_dhcpDns);
            self.dhcpLease = ko.observable(info.va0_dhcpLease);
            self.showMacAddress = ko.observable(config.SHOW_MAC_ADDRESS);
            self.hasWifi = ko.observable(config.HAS_WIFI);
            service.bindCommonData(self);
            service.advanceHide();
            self.clear = function() {
                clearTimer();
                init();
                clearValidateMsg();
            };
            /**
             * 设置响应函数，进行设置保存
             * @method save
             */
            self.save = function(){
                var frmLanObj = $('#frmLan').serialize();
                if(frmLanObj == originfrmLan){
                    showAlert("setting_no_change");
                    return false;
                }
                if(config.RJ45_SUPPORT){
                    var pppObj = service.getPppoeParams();
                    if(isStaticIPValid(pppObj.static_wan_ipaddr, self.ipAddress(), self.subnetMask())){
                        showAlert("lan_tip_staticip_notsame");
                        return false;
                    }
                }
                var ipAddress = self.ipAddress();
               var ipAddress2 = self.ipAddress2();
               var ipAddress3 = self.ipAddress3();
               if(ipAddress == ipAddress2){
                showAlert("dhcp2_dhcp3");
                return false;
               }else if(ipAddress == ipAddress3){
                showAlert("dhcp_dhcp3");
                return false;
               }
                showConfirm("lan_confirm_reopen", function(){
                    self.saveAct();
                });
            };
             $("#txtIpAddress").on("blur",function(){
                var ipAddress = self.ipAddress();
               var ipAddress2 = self.ipAddress2();
               var ipAddress3 = self.ipAddress3();
               var dhcpDns = self.dhcpDns();
               var dhcpStart = self.dhcpStart();
               var dhcpEnd = self.dhcpEnd();
               var ipAddressLangth = ipAddress.lastIndexOf(".");
               var dhcpDnsLangth = dhcpDns.lastIndexOf(".");
               var dhcpStartLangth = dhcpStart.lastIndexOf(".");
               var dhcpEndLangth = dhcpEnd.lastIndexOf(".");
               var dhcpDnsLangth1= dhcpDns.replace(dhcpDns.substr(0, dhcpDnsLangth),ipAddress.substr(0, ipAddressLangth));
               var dhcpDnsLangth2= dhcpStart.replace(dhcpDns.substr(0, dhcpStartLangth),ipAddress.substr(0, ipAddressLangth));
               var dhcpDnsLangth3= dhcpEnd.replace(dhcpDns.substr(0, dhcpEndLangth),ipAddress.substr(0, ipAddressLangth));
               
               if(ipAddress == ipAddress2){
                showAlert("dhcp2_dhcp3");
                return false;
               }else if(ipAddress == ipAddress3){
                showAlert("dhcp_dhcp3");
                return false;
               }
               self.dhcpDns(dhcpDnsLangth1);
               self.dhcpStart(dhcpDnsLangth2);
               self.dhcpEnd(dhcpDnsLangth3);
            })
            self.saveAct = function() {

                showLoading();
                var params = {
                    ipAddress: self.ipAddress(),
                    subnetMask: self.subnetMask(),
                    dhcpServer: self.dhcpServer(),
                    dhcpStart: self.dhcpStart(),
                    dhcpEnd: self.dhcpEnd(),
                    dhcpDns: self.dhcpDns(),
                    dhcpLease: self.dhcpLease()*3600,
                    CSRFToken: self.CSRFToken
                };
                service.setLanInfo1(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                        self.clear();
                    } else {
                        errorOverlay();
                    }
                });
            };

            /**
             * dhcpServer切换响应函数
             * @method dhcpServerHandler
             */
            self.dhcpServerHandler = function () {
                $("#txtIpAddress").parent().find(".error").hide();
                $("#txtIpAddress").show();
                return true;
            };
            addTimeout(function(){
                    originfrmLan=$('#frmLan').serialize();
            },500);
        }
        /**
         * 获取路由设置相关信息
         * @method getLanInfo
         */
        function getLanInfo() {
            return service.getLanInfo();
        }
        /**
         * 初始化
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
                getTabsNav(SETTINGS_DHCP_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new LanVM();
            ko.applyBindings(vm, container[0]);

            $('#frmLan').validate({
                submitHandler:function () {
                    vm.save();
                },
                rules:{
                    txtIpAddress: {
                        lanip_check: true,
                        ipRange: true
                    },
                    txtSubnetMask: {
                        ipv4: true,
                        subnetmask_check: true
                    },
                    txtDhcpIpPoolStart: {
                        lanip_check: true,
                        dhcp_check: "start",
                        dhcpCompare: "#txtDhcpIpPoolEnd"
                    },
                    txtDhcpIpPoolEnd: {
                        lanip_check: true,
                        dhcp_check: "end",
                        dhcpCompare: "#txtDhcpIpPoolStart"
                    },
                    txtDhcpLease: {
                        range: [1, 65535],
                        digits: true
                    },
                    txtDhcpDns: {
                        lanip_check: true
                    }
                },
                groups: {
                    lanip_check: "txtDhcpIpPoolStart txtDhcpIpPoolEnd"
                },
                errorPlacement: function (error, element) {
                    if (element.attr("name") == "txtDhcpIpPoolStart") {
                        error.insertAfter("#txtDhcpIpPoolEnd");
                    } else if (element.attr("name") == "txtDhcpLease") {
                        error.insertAfter("#errorHolder");
                    }
                    else
                        error.insertAfter(element);
                }
            });

        }
        
        /* 界面相关表单校验规则*/
        $.validator.addMethod("subnetmask_check", function (value, element, param) {
            var result = validateNetmask(value);
            return this.optional(element) || result;
        });

        $.validator.addMethod("dhcp_check", function (value, element, param) {
            var dhcpIp =  param == "start" ?  $('#txtDhcpIpPoolStart').val() : $('#txtDhcpIpPoolEnd').val();
            var result = validateGateway($('#txtIpAddress').val(), $('#txtSubnetMask').val(), dhcpIp);
            return this.optional(element) || result;
        });

        $.validator.addMethod("dhcpCompare", function (value, element, param) {
            var result;
            if(param == "#txtDhcpIpPoolStart") {
                result = validateStartEndIp($('#txtIpAddress').val(), $('#txtSubnetMask').val(), $(param).val(), value);
            }
            else {
                result = validateStartEndIp($('#txtIpAddress').val(), $('#txtSubnetMask').val(), value, $(param).val());
            }
            return result != 1;
        });

        $.validator.addMethod("ipRange", function (value, element, param) {
            var DHCP_flag = false;
            if($('#dhcpEnable').is(':checked')){
                DHCP_flag = true;
            }
            var result = validateStartEndIp(value, $('#txtSubnetMask').val(), $('#txtDhcpIpPoolStart').val(), $('#txtDhcpIpPoolEnd').val(), DHCP_flag);
            return result != 2;
        });

        /**
         * 静态有效IP校验函数
         * @method isStaticIPValid
         */
        function isStaticIPValid(ip, lanip, lanmask){
            if(!ip || !lanip || !lanmask){//各参数不能为空
                return false;
            }
            if(ip == lanip){// 与内网IP相等
                return true;
            }
            var  res1 = [], res2 = [], mask = [];
            addr1 = ip.split(".");
            addr2 = lanip.split(".");
            mask  = lanmask.split(".");
            for(var i = 0; i < addr1.length; i += 1){
                res1.push(parseInt(addr1[i]) & parseInt(mask[i]));
                res2.push(parseInt(addr2[i]) & parseInt(mask[i]));
            }
            if(res1.join(".") == res2.join(".")){//在同一个网段
                return true;
            }else{//不在同一个网段
                return false;
            }
        }
        /**
         * 子网掩码校验函数
         * @method validateNetmask
         */     
        function validateNetmask(netmask) {
            var array = netmask.split(".");

            if (array.length != 4) {
                return false;
            }

            array[0] = parseInt(array[0]);
            array[1] = parseInt(array[1]);
            array[2] = parseInt(array[2]);
            array[3] = parseInt(array[3]);

            if (array[3] != 0) {
                if (array[2] != 255 || array[1] != 255 || array[0] != 255) {
                    return false;
                } else {
                    if (!isNetmaskIPValid(array[3])) {
                        return false;
                    }
                }
            }

            if (array[2] != 0) {
                if (array[1] != 255 || array[0] != 255) {
                    return false;
                } else {
                    if (!isNetmaskIPValid(array[2])) {
                        return false;
                    }
                }
            }

            if (array[1] != 0) {
                if (array[0] != 255) {
                    return false;
                } else {
                    if (!isNetmaskIPValid(array[1])) {
                        return false;
                    }
                }
            }
            if (array[0] != 255) {
                return false;
            }
            if ("0.0.0.0" == netmask || "255.255.255.255" == netmask) {
                return false;
            }

            return true;
        }

        function isNetmaskIPValid(ip) {
            return (ip == 255 || ip == 254 || ip == 252 || ip == 248
                || ip == 240 || ip == 224 || ip == 192 || ip == 128 || ip == 0);
        }
        /**
         * 网关校验函数
         * @method validateGateway
         */ 
        function validateGateway(wanIp, netmaskIp, gatewayIp) {
            var i1,i2,i3, wip, nip, gip;
            var lan4, mask4, pool4, net_no, lo_broadcast;

            i1=wanIp.indexOf('.');
            i2=wanIp.indexOf('.',(i1+1));
            i3=wanIp.indexOf('.',(i2+1));
            wip = hex(wanIp.substring(0,i1)) + hex(wanIp.substring((i1+1),i2)) +hex(wanIp.substring((i2+1),i3))+hex(wanIp.substring((i3+1),wanIp.length));
            wip = '0x'+wip;
            lan4 = wanIp.substring((i3+1),wanIp.length)-0;

            i1=netmaskIp.indexOf('.');
            i2=netmaskIp.indexOf('.',(i1+1));
            i3=netmaskIp.indexOf('.',(i2+1));
            nip = hex(netmaskIp.substring(0,i1)) + hex(netmaskIp.substring((i1+1),i2)) +hex(netmaskIp.substring((i2+1),i3)) +hex(netmaskIp.substring((i3+1),netmaskIp.length));
            nip = '0x'+nip;
            mask4 = netmaskIp.substring((i3+1),netmaskIp.length)-0;

            i1=gatewayIp.indexOf('.');
            i2=gatewayIp.indexOf('.',(i1+1));
            i3=gatewayIp.indexOf('.',(i2+1));
            gip = hex(gatewayIp.substring(0,i1)) + hex(gatewayIp.substring((i1+1),i2)) +hex(gatewayIp.substring((i2+1),i3)) +hex(gatewayIp.substring((i3+1),gatewayIp.length));
            gip = '0x'+gip;
            pool4 = gatewayIp.substring((i3+1),gatewayIp.length)-0;

            if (Op_AND_4Byte(wip, nip) != Op_AND_4Byte(gip, nip)) {
                return false;
            }

            net_no = (lan4 & mask4);
            lo_broadcast =  (lan4 & mask4) + (255-mask4);

            return !(pool4==net_no || pool4==lo_broadcast);
        }

        function hex(val) {
            var h = (val-0).toString(16);
            if(h.length==1) h='0'+h;
            return h.toUpperCase();
        }

        function Op_AND_4Byte(v1, v2) {
            var i;
            var var1 = [];
            var var2 = [];
            var result='0x';

            for (i=2,j=0;i<10;i+=2,j++) {
                var1[j]='0x'+v1.substring(i,i+2);
                var2[j]='0x'+v2.substring(i,i+2);
            }

            for (i=0;i<4;i++) {
                result = result + hex(var1[i]&var2[i]);
            }

            return result - 0;
        }

        /**
         * DHCP IP池校验函数
         * @method validateStartEndIp
         */ 
        function validateStartEndIp(lan_ipaddr, netip, startip, endip, DHCP_flag) {
            i1 = startip.indexOf('.');
            i2 = startip.indexOf('.', (i1 + 1));
            i3 = startip.indexOf('.', (i2 + 1));
            sip = hex(startip.substring(0, i1)) + hex(startip.substring((i1 + 1), i2)) + hex(startip.substring((i2 + 1), i3)) + hex(startip.substring((i3 + 1), startip.length));
            sip = '0x' + sip;

            i1=endip.indexOf('.');
            i2=endip.indexOf('.',(i1+1));
            i3=endip.indexOf('.',(i2+1));
            eip = hex(endip.substring(0,i1)) + hex(endip.substring((i1+1),i2)) +hex(endip.substring((i2+1),i3))+hex(endip.substring((i3+1),endip.length));
            eip = '0x'+eip;

            i1=lan_ipaddr.indexOf('.');
            i2=lan_ipaddr.indexOf('.',(i1+1));
            i3=lan_ipaddr.indexOf('.',(i2+1));

            var compLanIp = '0x' + hex(lan_ipaddr.substring(0,i1)) + hex(lan_ipaddr.substring((i1+1),i2)) +hex(lan_ipaddr.substring((i2+1),i3))+hex(parseInt(lan_ipaddr.substring((i3+1),lan_ipaddr.length)) + 18);
            lan_ipaddr = hex(lan_ipaddr.substring(0,i1)) + hex(lan_ipaddr.substring((i1+1),i2)) +hex(lan_ipaddr.substring((i2+1),i3))+hex(lan_ipaddr.substring((i3+1),lan_ipaddr.length));
            lan_ipaddr = '0x'+lan_ipaddr;

            if(sip>eip) {
                return 1;
            }

            if(lan_ipaddr >= sip && lan_ipaddr <= eip) {
                return 2;
            }

            return 0;
        }

        return {
            init:init
        }
    }
);
