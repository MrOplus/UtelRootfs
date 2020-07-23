/**
 * Router设置
 * @module lan
 * @class lan
 */
define([ 'jquery', 'knockout', 'config/config', 'service','underscore'],
    function ($, ko, config, service) {
	var originfrmLan="";
        function LanVM() {
            var self = this;

            var info = service.getSipServerData();
            self.sip_reg_server = ko.observable(info.sip_reg_server);
            self.port_settings = ko.observable(info.is_show_sipServer == "yes" ? "yes" : "no");
            if(info.is_show_sipServer == "yes"){
                self.isShowContent = ko.observable(true);
            }else{
                self.isShowContent = ko.observable(false);
            }
            self.staticIpHandle = function(enable){
            enable == 'yes' ? $(".content").show() : $(".content").hide();
            return true;
            }
            self.voip_apn_enable = ko.observable(info.voip_apn_enable=="0" ? "0" : "1");
            self.voip_apn = ko.observable(info.voip_apn);
            self.isShowVoipApn = ko.observable(info.voip_apn_enable=="1" ? true : false);
            self.sip_reg_port = ko.observable(info.sip_reg_port);
            self.sip_domain_address = ko.observable(info.sip_domain_address);
            self.sip_domain_port = ko.observable(info.sip_domain_port);
            self.sip_proxy_address = ko.observable(info.sip_proxy_address);
            self.sip_proxy_port = ko.observable(info.sip_proxy_port);
            self.sip_proxy_enable = ko.observable(info.sip_proxy_enable == "1");
            self.sip_display_name = ko.observable(info.sip_display_name);
            self.sip_user_name = ko.observable(info.sip_user_name);
            self.sip_reg_account = ko.observable(info.sip_reg_account);
            self.sip_reg_pwd = ko.observable(info.sip_reg_pwd);
            self.hasWifi = ko.observable(config.HAS_WIFI);
            setInterval(function(){
                status();
            },3000);
            self.changedEnable = function(){
                if(self.voip_apn_enable() == "1"){
                    self.isShowVoipApn(true);
                }else{
                    self.isShowVoipApn(false);
                }
            }
            function status(){
                if(info.voip_reg_st  == "1"){
                    $("#voip_reg_st").attr('data-trans', 'register_connecting');
                }else if(info.voip_reg_st  == "2"){
                    $("#voip_reg_st").attr('data-trans', 'register_failed');
                }else if(info.voip_reg_st  == "3"){
                    $("#voip_reg_st").attr('data-trans', 'register_success');
                }else{
                    $("#voip_reg_st").attr('data-trans', 'volte_Unregistered');
                }
                if(info.voip_auth_st  == "1"){
                    $("#voip_auth_st").attr('data-trans', 'authorization_state_1');
                }else if(info.voip_auth_st  == "2"){
                    $("#voip_auth_st").attr('data-trans', 'authorization_state_2');
                }else if(info.voip_auth_st  == "3"){
                    $("#voip_auth_st").attr('data-trans', 'authorization_state_3');
                }else{
                    $("#voip_auth_st").attr('data-trans', 'authorization_state_4');
                }
            }
             status();
            service.bindCommonData(self);
            service.volteSettingHide();
            self.saveAct = function() {
                showLoading();
                var params = {
                    sip_reg_server: self.sip_reg_server(),
                    sip_reg_port: self.sip_reg_port(),
                    sip_domain_address: self.sip_domain_address(),
                    sip_domain_port: self.sip_domain_port(),
                    sip_proxy_address: self.sip_proxy_address(),
                    sip_proxy_port: self.sip_proxy_port(),
                    sip_proxy_enable: self.sip_proxy_enable() == true ? "1" :"0",
                    sip_display_name: self.sip_display_name(),
                    sip_user_name: self.sip_user_name(),
                    sip_reg_account: self.sip_reg_account(),
                    sip_reg_pwd: self.sip_reg_pwd(),
                    voip_apn_enable:self.voip_apn_enable(),
                    is_show_sipServer:self.port_settings(),
                    voip_apn:self.voip_apn(),
                    CSRFToken: self.CSRFToken
                };
                service.setSipServer(params, function(result) {
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
               getRightNav(VOLTE_SETTINGS_URL);
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
                    txtDestPort1: {
                    digits: true,
                    range: [1, 65535]
                    },
                    txtDestPort2: {
                    digits: true,
                    range: [1, 65535]
                    },
                    txtDestPort3: {
                    digits: true,
                    range: [1, 65535]
                    },
                    voipApn : 'apn_check'
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
