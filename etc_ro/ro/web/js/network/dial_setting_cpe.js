/**
 * RJ45联网设置模块
 * @module dial_setting_cpe
 * @class dial_setting_cpe
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	var dialModes = _.map(config.pppoeModes, function(item) {
		return new Option(item.name, item.value);
	});
	
	var dialActions = _.map(config.dialActions, function(item){
		return new Option(item.name, item.value);
	});
	
    var checkStatusTimer = 0;
    var checkConCounter = 0;
    var timeoutTipShowed = false;

    /**
     * 联网设置view model
     * @class PPPoEViewModel
     */
	function PPPoEViewModel() {
		var pppObj = service.getPppoeParams();
        var ethParams = pppObj;
		var self = this;
		self.modes = ko.observableArray(dialModes);
		self.isPppoeMode = ko.observable(false);
		self.isStaticMode = ko.observable(false);
		self.isAutoMode = ko.observable(false);
		self.action = ko.observable();
		self.btnTrans = ko.observable();
		self.enableFlag = ko.observable();
		self.isShowDisbtn = ko.observable();
		self.isShowCancelbtn = ko.observable();
		
		self.staticNoticeShow = ko.observable();
		self.dhcpNoticeShow = ko.observable();
		self.pppoeNoticeShow = ko.observable();
		self.autoNoticeShow = ko.observable();
		self.staticNotice = ko.observable();
		self.dhcpNotice = ko.observable();
		self.pppoeNotice = ko.observable();
		self.autoNotice = ko.observable();
		self.dhcpNoticeText = ko.observable();
		self.staticNoticeText = ko.observable();
		self.pppoeNoticeText = ko.observable();
        self.autoNoticeText = ko.observable();		
		self.currentMode = ko.observable(pppObj.ethwan_mode);//auto dhcp pppoe static
		
		if(pppObj.rj45_state == "working"){
			setWorkingTip();
		} else if(pppObj.rj45_state == "connect"){
			timeoutTipShowed = true;
			setCheckTimer("connect");
		} else if(pppObj.rj45_state == "dead"){
			checkDeadTip();
		}
		
		self.user = ko.observable(pppObj.pppoe_username);
		self.password = ko.observable(pppObj.pppoe_password);
		self.autoUser = ko.observable(pppObj.pppoe_username);
		self.autoPassword = ko.observable(pppObj.pppoe_password);
		self.pppMode = ko.observable(pppObj.ethwan_dialmode);
		initContronler();
			
		self.radioHandler = function(){
			initContronler();
			return true;
		};
		//下拉框选择改变下面DIV模块
		self.changeModeDiv = function(){
			initContronler();
		};
		
		self.ipAddress = ko.observable(pppObj.static_wan_ipaddr);
		self.subnetMask = ko.observable(pppObj.static_wan_netmask);
		self.defaultGateway = ko.observable(pppObj.static_wan_gateway);
		self.primaryDNS = ko.observable(pppObj.static_wan_primary_dns);
		self.secondaryDNS = ko.observable(pppObj.static_wan_secondary_dns);
		
		addInterval(function(){
			ethParams = service.getPppoeParams();
			pppObj.rj45_state = ethParams.rj45_state;
			initContronler();
		}, 1000);
		
        /**
         * 应用按钮事件
         * @method save
         */		
		self.save = function(){
			self.dhcpNoticeShow(false);
			self.staticNoticeShow(false);
			self.pppoeNoticeShow(false);
			self.autoNoticeShow(false);
			if(pppObj.rj45_state == "dead"){
				showAlert("pppoe_msg");
				return;
			}
			var requestParams = {};
			if($("#pppoe_mode").val() == "PPPOE") {
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_PPPOE",
					pppoe_username: self.user(),
					pppoe_password: self.password()
				});
			}else if($("#pppoe_mode").val() == "STATIC") {
				if(self.ipAddress() == self.defaultGateway()){
					showAlert("ip_gate_not_same");
					return;
				}
				if(isStaticIPValid(self.ipAddress(), pppObj.lan_ipaddr, pppObj.lan_netmask)){
					showAlert("ip_innergate_not_same");
					return;
				}
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_STATIC",
					static_wan_ipaddr: self.ipAddress(),
					static_wan_netmask: self.subnetMask(),
					static_wan_gateway: self.defaultGateway(),
					static_wan_primary_dns: self.primaryDNS(),
					static_wan_secondary_dns: self.secondaryDNS(),
					WAN_MODE: "STATIC"
				});
			} else if($("#pppoe_mode").val() == "AUTO") {
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_AUTO",
					pppoe_username: self.autoUser(),
					pppoe_password: self.autoPassword()
				});
			} else {
				requestParams = $.extend({}, {
					goformId: "WAN_GATEWAYMODE_DHCP"
				});
			}
			requestParams.action_link = "connect";
			requestParams.dial_mode = self.pppMode();
			showLoading("waiting");
			
			service.setPppoeDialMode(requestParams, function(data){
				if(data.result){
					self.currentMode($("#pppoe_mode").val());
					pppObj = service.getPppoeParams();
					checkConCounter = 0;
					timeoutTipShowed = false;
					setCheckTimer("connect");					
					$("#pppoeApply").translate();
                } else {
					errorOverlay("pppoe_message_send_fail");
                }
			});
			
		};
        /**
         * 取消连接按钮事件
         * @method cancelConnect
         */					
		self.cancelConnect = function(){
			self.dhcpNoticeShow(false);
			self.staticNoticeShow(false);
			self.pppoeNoticeShow(false);
			self.autoNoticeShow(false);
			if(pppObj.rj45_state == "dead"){
				showAlert("pppoe_msg");
				return;
			}
			var requestParams = {
				dial_mode: self.pppMode(),
				action_link: "disconnect"
			};
			if(pppObj.ethwan_mode == "PPPOE") {
				requestParams = $.extend(requestParams, {
					goformId: "WAN_GATEWAYMODE_PPPOE",
					pppoe_username: pppObj.pppoe_username,
					pppoe_password: pppObj.pppoe_password					
				});
			}else if(pppObj.ethwan_mode == "STATIC") {
				requestParams = $.extend(requestParams, {
					goformId: "WAN_GATEWAYMODE_STATIC",
					static_wan_ipaddr: pppObj.static_wan_ipaddr,
					static_wan_netmask: pppObj.static_wan_netmask,
					static_wan_gateway: pppObj.static_wan_gateway,
					static_wan_primary_dns: pppObj.static_wan_primary_dns,
					static_wan_secondary_dns: pppObj.static_wan_secondary_dns,
					WAN_MODE: "STATIC"
				});
			}else if(pppObj.ethwan_mode == "AUTO") {
				requestParams = $.extend(requestParams, {
					goformId: "WAN_GATEWAYMODE_AUTO",
					pppoe_username: pppObj.pppoe_username,
					pppoe_password: pppObj.pppoe_password					
				});
			}else {
				requestParams = $.extend(requestParams, {
					goformId: "WAN_GATEWAYMODE_DHCP"
				});
			}
			showLoading("waiting");
			service.setPppoeDialMode(requestParams, function(data){
				if(data.result){
                    checkConCounter = 0;
					timeoutTipShowed = false;
					setCheckTimer("disconnect");
					$("#pppoeApply").translate();
                } else {
					errorOverlay("pppoe_message_send_fail");
                }
			});
			
		};
        /**
         * 更新当前界面状态、按钮、提示语等
         * @method initContronler
         */			
		function initContronler() {	
            checkDeadTip();		
			if(self.currentMode() == "PPPOE"){
				self.isPppoeMode(true);
				self.isStaticMode(false);
				self.isAutoMode(false);
				self.staticNoticeShow(false);
				self.dhcpNoticeShow(false);	
				self.autoNoticeShow(false);	
			}else if(self.currentMode() == "STATIC"){
				self.isStaticMode(true);
				self.isPppoeMode(false);
				self.isAutoMode(false);
				self.dhcpNoticeShow(false);
				self.pppoeNoticeShow(false);
				self.autoNoticeShow(false);
			} else if(self.currentMode() == "AUTO"){
				self.isStaticMode(false);
				self.isPppoeMode(false);
				self.isAutoMode(true);
				self.dhcpNoticeShow(false);
				self.pppoeNoticeShow(false);
				self.staticNoticeShow(false);
			} else{
				self.isStaticMode(false);
				self.isPppoeMode(false);
				self.isAutoMode(false);
				self.staticNoticeShow(false);
				self.pppoeNoticeShow(false);
                self.autoNoticeShow(false);					
			}
			if((pppObj.rj45_state == "working" || pppObj.rj45_state =="connect") && ethParams.ethwan_dialmode != "auto_dial"){
				self.enableFlag(false);
			} else {
				self.enableFlag(true);
			}
			
			if(pppObj.rj45_state == "working"){
				self.action("disconnect");
			}else if(pppObj.rj45_state == "connect"){
				if(self.pppMode() == "auto_dial"){
					self.action("connect");
				}else{
					self.action("disconnect");
				}					
			}else{
				self.action("connect");
			}
			//应用/连接按钮
			if(self.pppMode() != "auto_dial" && self.currentMode() == ethParams.ethwan_mode){
				self.btnTrans("connect");
			} else{
				self.btnTrans("apply");
			}
			if(pppObj.rj45_state == "idle"){
				$("#pppoeApply").attr("disabled", false);
		    }else {
				$("#pppoeApply").attr("disabled", true);
            }
			
			//取消/断开按钮
			self.isShowDisbtn(self.pppMode() != "auto_dial" && pppObj.rj45_state == "working");
			self.isShowCancelbtn(self.pppMode() != "auto_dial" && pppObj.rj45_state == "connect");
			
			$("#pppoeApply").translate();
		}
        /**
         * 设置后通过定时检查rj45_state状态，判断连接或断开操作结果
         * @method setCheckTimer
         */		
	    function setCheckTimer(action){
            checkStatusTimer && window.clearInterval(checkStatusTimer);
            if("connect" == action){
                if(self.currentMode() == "DHCP"){
                    self.dhcpNoticeShow(true);
                    self.dhcpNotice("dyn_processing");
                    self.dhcpNoticeText($.i18n.prop("dyn_processing"));
                }else if(self.currentMode() == "STATIC"){
                    self.staticNoticeShow(true);
                    self.staticNotice("static_processing");
                    self.staticNoticeText($.i18n.prop("static_processing"));
                }else if(self.currentMode() == "PPPOE"){
                    self.pppoeNoticeShow(true);
                    self.pppoeNotice("pppoe_processing");
                    self.pppoeNoticeText($.i18n.prop("pppoe_processing"));
                }else{
                    self.autoNoticeShow(true);
                    self.autoNotice("auto_processing");
                    self.autoNoticeText($.i18n.prop("auto_processing"));
                }
                checkStatusTimer = addInterval(function () {
                    checkConnectionStatus();
                }, 2000);
            }else{
                checkStatusTimer = addInterval(function () {
                    checkDisconnectStatus();
                }, 2000);
            }			
        }
        /**
         * 设置后通过定时检查rj45_state状态，判断连接操作结果
         * @method checkConnectionStatus
         */			
        function checkConnectionStatus(){
            if(checkConCounter < 1){
				checkConCounter++;
				return;
            }
            if(pppObj.rj45_state == "connect"){
                if(self.currentMode() == ethParams.ethwan_mode){
                    if(self.currentMode() == "DHCP"){
                        self.dhcpNoticeShow(true);
                    }else if(self.currentMode() == "STATIC"){
                        self.staticNoticeShow(true);
                    }else if(self.currentMode() == "PPPOE"){
                        self.pppoeNoticeShow(true);
                    }else if(self.currentMode() == "AUTO"){
                        self.autoNoticeShow(true);
                    }
                }
                if(checkConCounter > 6){
                    if(timeoutTipShowed == false){
                        timeoutTipShowed = true;
                        showAlert("ussd_operation_timeout");
                    }
                }
                checkConCounter++;
            } else if(pppObj.rj45_state == "idle"){
                hideLoading();
                if(self.currentMode() == "DHCP" && ethParams.ethwan_mode == "DHCP") {
                    timeoutTipShowed == false && self.dhcpNoticeShow(true);
                    self.dhcpNotice("dyn_fail");
                    self.dhcpNoticeText($.i18n.prop("dyn_fail"));
                }
                if(self.currentMode() == "STATIC" && ethParams.ethwan_mode == "STATIC") {
                    timeoutTipShowed == false && self.staticNoticeShow(true);
                    self.staticNotice("static_fail");
                    self.staticNoticeText($.i18n.prop("static_fail"));
                }
                if(self.currentMode() == "PPPOE" && ethParams.ethwan_mode == "PPPOE") {
                    timeoutTipShowed == false && self.pppoeNoticeShow(true);
                    self.pppoeNotice("pppoe_fail");
                    self.pppoeNoticeText($.i18n.prop("pppoe_fail"));
                }
                if(self.currentMode() == "AUTO" && ethParams.ethwan_mode == "AUTO") {
                    timeoutTipShowed == false && self.autoNoticeShow(true);
                    self.autoNotice("auto_fail");
                    self.autoNoticeText($.i18n.prop("auto_fail"));
                }
                window.clearInterval(checkStatusTimer);
            } else if (pppObj.rj45_state == "dead") {
				hideLoading();
				checkDeadTip();
                window.clearInterval(checkStatusTimer);
            } else if (pppObj.rj45_state == "working") {
                hideLoading();
                setWorkingTip();
                window.clearInterval(checkStatusTimer);						
            } else{
                hideLoading();
				window.clearInterval(checkStatusTimer);
			}
        }
        /**
         * 设置后通过定时检查rj45_state状态，判断断开操作结果
         * @method checkDisconnectStatus
         */		
        function checkDisconnectStatus(){
            if(checkConCounter < 1){
                checkConCounter++;
            } else if (pppObj.rj45_state != "working" && pppObj.rj45_state != "connect") {
                self.dhcpNoticeShow(false);
                self.staticNoticeShow(false);
                self.pppoeNoticeShow(false);
                self.autoNoticeShow(false);
                window.clearInterval(checkStatusTimer);
                successOverlay();
            } else if(checkConCounter > 6){
                if(timeoutTipShowed == false){
                    timeoutTipShowed = true;
                    showAlert("ussd_operation_timeout");
                }
                window.clearInterval(checkStatusTimer);
            } else if(checkConCounter < 7) {
                checkConCounter++;
            } else {
                hideLoading();
                window.clearInterval(checkStatusTimer);
            }				
        }
        /**
         * 设置网线断开提示语状态
         * @method checkDeadTip
         */		
        function checkDeadTip(){
            if(pppObj.rj45_state == "dead"){
                self.dhcpNotice("pppoe_msg");
                self.dhcpNoticeText($.i18n.prop("pppoe_msg"));
                self.staticNotice("pppoe_msg");
                self.staticNoticeText($.i18n.prop("pppoe_msg"));
                self.pppoeNotice("pppoe_msg");
                self.pppoeNoticeText($.i18n.prop("pppoe_msg"));
                self.autoNotice("pppoe_msg");
                self.autoNoticeText($.i18n.prop("pppoe_msg"));
                if(self.currentMode() == "DHCP") {
                    self.dhcpNoticeShow(true);
                }else if(self.currentMode() == "STATIC") {
                    self.staticNoticeShow(true);
                }else if(self.currentMode() == "PPPOE") {
                    self.pppoeNoticeShow(true);
                }else if(self.currentMode() == "AUTO") {
                    self.autoNoticeShow(true);
                }
            } else{
                if(self.currentMode() == "DHCP" && self.dhcpNotice() == "pppoe_msg") {
                    self.dhcpNoticeShow(false);
                }else if(self.currentMode() == "STATIC"  && self.staticNotice() == "pppoe_msg") {
                    self.staticNoticeShow(false);
                }else if(self.currentMode() == "PPPOE"  && self.pppoeNotice() == "pppoe_msg") {
                    self.pppoeNoticeShow(false);
                }else if(self.currentMode() == "AUTO"  && self.autoNotice() == "pppoe_msg") {
                    self.autoNoticeShow(false);
                }
            }            
		}
        /**
         * 设置连接成功时提示语状态
         * @method setWorkingTip
         */		
        function setWorkingTip(){
            if(self.currentMode() == ethParams.ethwan_mode){
                if(self.currentMode() == "DHCP" ) {
                    self.dhcpNoticeShow(true);
                    self.dhcpNotice("dyn_success");
                    self.dhcpNoticeText($.i18n.prop("dyn_success"));
                }else if(self.currentMode() == "STATIC") {
                    self.staticNoticeShow(true);
                    self.staticNotice("static_success");
                    self.staticNoticeText($.i18n.prop("static_success"));
                }else if(self.currentMode() == "PPPOE") {
                    self.pppoeNoticeShow(true);
                    self.pppoeNotice("pppoe_success");
                    self.pppoeNoticeText($.i18n.prop("pppoe_success"));
                }else if(self.currentMode() == "AUTO") {
                    self.autoNoticeShow(true);
                    self.autoNotice("auto_success");
                    self.autoNoticeText($.i18n.prop("auto_success"));
                }
            }
        }
    }

    /**
     * 联网设置初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new PPPoEViewModel();
		ko.applyBindings(vm, container[0]);
		$("#pppoeApply").translate();
		
		$('#pppoeForm').validate({
			submitHandler : function() {
				vm.save();
			},
            rules: {
                txtPin: "wps_pin_check",
				txtIpAddress: "dmz_ip_check",
				txtSubnetMask: {
					ipv4: true,
                    subnetmask_check: true
				},
				txtDefaultGateway: {
					ipv4: true,
					gateway_check: true
				},
				txtPrimaryDNS: {
					ipv4: true,
					dns_check:true
				},
				txtSecondaryDNS: {
					ipv4: true,
					dns_check:true
				}
            }
		});
	}
	
	
//from 4.0
    /**
     * 联网设置初始化
     * @method init
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
     * 有效DNS检查
     * @method validateDns
     */
function validateDns(dns){
	if ( "0.0.0.0" == dns || "255.255.255.255" == dns) {
		return false;
	}
	return true;
}
    /**
     * 有效子网掩码检查
     * @method validateNetmask
     */
function validateNetmask(netmask) {
	var array = new Array();
	array = netmask.split(".");

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
		} else{
			if (!isNetmaskIPValid(array[1])) {
				return false;
			}
		}
	}
	if(array[0]!=255) {
		return false;
	}
	if ( "0.0.0.0" == netmask || "255.255.255.255" == netmask) {
		return false;
	}
	return true;
}
    /**
     * 有效子网掩码验证
     * @method isNetmaskIPValid
     */
function isNetmaskIPValid(ip) {
	if (ip == 255 || ip == 254 || ip == 252 || ip == 248
		|| ip == 240 || ip == 224 || ip == 192 || ip == 128 || ip == 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}
    /**
     * subnetmask_check校验规则
     */
jQuery.validator.addMethod("subnetmask_check", function (value, element, param) {
	var result = validateNetmask(value);
    return this.optional(element) || result;
});
    /**
     * dns_check校验规则
     */
jQuery.validator.addMethod("dns_check", function (value, element, param) {
	var result = validateDns(value);
    return this.optional(element) || result;
});
    /**
     * 有效网关检查
     * @method validateGateway
     */
function validateGateway(wanIp, netmaskIp, gatewayIp) {
	if(myConcat(wanIp,netmaskIp) == myConcat(netmaskIp, gatewayIp)) {
		return true;
	} else {
		return false;
	}
}
    /**
     * IP和子网掩码转换成数组形式并相与，返回相与后的IP
     * @method myConcat
     */
function myConcat(ip1,ip2){
	var result = [];
	var iplArr = ip1.split(".");
	var ip2Arr = ip2.split(".");
	for(var i = 0; i < iplArr.length;i++){
		result[i] = (iplArr[i] & ip2Arr[i]);
	}
	return result.join(".");
}
    /**
     * gateway_check校验规则
     */
jQuery.validator.addMethod("gateway_check", function (value, element, param) {
	var result = validateGateway($('#txtIpAddress').val(), $('#txtSubnetMask').val(), $("#txtDefaultGateway").val());
    return this.optional(element) || result;
});
	
	return {
		init: init
	};
});