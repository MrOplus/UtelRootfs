/**
 * mac filter 模块
 * @module wifi advance
 * @class wifi advance
 */
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service' ], function(_, $, ko, config, service) {

	var isWifi = false;
	
	/**
	 * macFilterViewModel
	 * @class macFilterViewModel
	 */
	function macFilterViewModel() {
		var self = this;
		var info = service.getMacFilterInfo();
		var wifiBaseInfo = service.getWifiBasic();
        service.bindCommonData(self);
        service.wirelessHide();
		self.multi_ssid_enable = ko.observable(wifiBaseInfo.multi_ssid_enable);
		self.origin_ap_station_enable = wifiBaseInfo.ap_station_enable;
        self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
        self.hasMultiSSID = config.HAS_MULTI_SSID;
        self.showIsolated = config.SHOW_WIFI_AP_ISOLATED;
        self.wifi_enable = ko.observable(wifiBaseInfo.wifi_enable);
        self.hasAPStation = config.AP_STATION_SUPPORT;
        self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
        
		self.isShowSSIDInfoDiv = ko.observable(false);
        if(config.WIFI_SWITCH_SUPPORT) {
		    if(wifiBaseInfo.wifi_enable == "1") {
				self.isShowSSIDInfoDiv(true);
			} else {
				self.isShowSSIDInfoDiv(false);
			}
        } else {
			self.isShowSSIDInfoDiv(true);//如果不支持软开关，整个SSID信息块显示
        }
		
		self.selectedAction = ko.observable(info.ACL_mode);
		self.mac1 = ko.observable("");
		self.mac2 = ko.observable("");
		self.mac3 = ko.observable("");
		self.mac4 = ko.observable("");
		self.mac5 = ko.observable("");
		self.mac6 = ko.observable("");
		self.mac7 = ko.observable("");
		self.mac8 = ko.observable("");
		self.mac9 = ko.observable("");
		self.mac10 = ko.observable("");
		if(info.ACL_mode == "1"){
			macInfoWhite = info.wifi_mac_white_list.split(";");
			self.mac1 = ko.observable(macInfoWhite[0]);
			self.mac2 = ko.observable(macInfoWhite[1]);
			self.mac3 = ko.observable(macInfoWhite[2]);
			self.mac4 = ko.observable(macInfoWhite[3]);
			self.mac5 = ko.observable(macInfoWhite[4]);
			self.mac6 = ko.observable(macInfoWhite[5]);
			self.mac7 = ko.observable(macInfoWhite[6]);
			self.mac8 = ko.observable(macInfoWhite[7]);
			self.mac9 = ko.observable(macInfoWhite[8]);
			self.mac10 = ko.observable(macInfoWhite[9]);			
		}
		if(info.ACL_mode == "2"){
			macInfoBlack = info.wifi_mac_black_list.split(";");
			self.mac1 = ko.observable(macInfoBlack[0]);
			self.mac2 = ko.observable(macInfoBlack[1]);
			self.mac3 = ko.observable(macInfoBlack[2]);
			self.mac4 = ko.observable(macInfoBlack[3]);
			self.mac5 = ko.observable(macInfoBlack[4]);
			self.mac6 = ko.observable(macInfoBlack[5]);
			self.mac7 = ko.observable(macInfoBlack[6]);
			self.mac8 = ko.observable(macInfoBlack[7]);
			self.mac9 = ko.observable(macInfoBlack[8]);
			self.mac10 = ko.observable(macInfoBlack[9]);				
		}
        /**
         * 保存设置
         * @event save
         */
		self.save = function() {
			var status = service.getWpsInfo();
			if (status.wpsFlag == '1') {
                showAlert('wps_on_info');
                return true;
            }
			
			if(self.mac1() == undefined || self.mac1().indexOf(" ") >= 0){self.mac1("")}
			if(self.mac2() == undefined || self.mac2().indexOf(" ") >= 0){self.mac2("")}
			if(self.mac3() == undefined || self.mac3().indexOf(" ") >= 0){self.mac3("")}
			if(self.mac4() == undefined || self.mac4().indexOf(" ") >= 0){self.mac4("")}
			if(self.mac5() == undefined || self.mac5().indexOf(" ") >= 0){self.mac5("")}
			if(self.mac6() == undefined || self.mac6().indexOf(" ") >= 0){self.mac6("")}
			if(self.mac7() == undefined || self.mac7().indexOf(" ") >= 0){self.mac7("")}
			if(self.mac8() == undefined || self.mac8().indexOf(" ") >= 0){self.mac8("")}
			if(self.mac9() == undefined || self.mac9().indexOf(" ") >= 0){self.mac9("")}
			if(self.mac10() == undefined || self.mac10().indexOf(" ") >= 0){self.mac10("")}
			
			var maclist_arr = new Array(self.mac1(), self.mac2(), self.mac3(), self.mac4(), self.mac5(), self.mac6(), self.mac7(), self.mac8(), self.mac9(), self.mac10());			
			if(self.selectedAction() == "2" && info.client_mac_address != "" && $.inArray(info.client_mac_address, maclist_arr) != -1){
                showAlert('black_yourself_tip');
                return false;
            }
			var nary = maclist_arr.sort();//对数组排序
			for(var i = 0; i < nary.length - 1; i++){
				if (nary[i] != "" && nary[i] == nary[i+1]){
					showAlert('mac_repeat_tip');
					return false;
				}
			}
			var maclist_str = "";
			for(var i = 0; i < 10; i++){
				if(maclist_str == ""){
					maclist_str = maclist_arr[i];
				}else{
					if(maclist_arr[i]){
						maclist_str = maclist_str + ";" + maclist_arr[i];
					}
				}
			}			
			var params = {};
			params.ACL_mode = self.selectedAction();
			params.CSRFToken = self.CSRFToken;
			if(self.selectedAction() == "1"&& maclist_str.length < 1){
					showConfirm("list_is_empty",function(){
						showLoading('waiting');
						service.setMacFilter(params, function(result) {
						if (result.result == "success") {
		                        successOverlay();
						} else {
								errorOverlay();
						}
					});	
					});
			}else{ 
				if(self.selectedAction() == "1"){
					params.wifi_mac_white_list = maclist_str;
                                  }
				if(self.selectedAction() == "2"){
					params.wifi_mac_black_list = maclist_str;			
				}
				showLoading('waiting');
				service.setMacFilter(params, function(result) {
				if (result.result == "success") {
                        successOverlay();
				} else {
						errorOverlay();
				}
			});	
			}
			
		};
        /**
         * 切换MAC过滤规则事件
         * @event ChangeHandler
         */
		self.ChangeHandler = function() {
			$("#mac_filter_form").find(".error").hide();
			$("#mac_filter_form").find("input[type=text]").show();
			var info = service.getMacFilterInfo();
			if(self.selectedAction() == "1"){
				macInfoWhite = info.wifi_mac_white_list.split(";");
				self.mac1(macInfoWhite[0]);
				self.mac2(macInfoWhite[1]);
				self.mac3(macInfoWhite[2]);
				self.mac4(macInfoWhite[3]);
				self.mac5(macInfoWhite[4]);
				self.mac6(macInfoWhite[5]);
				self.mac7(macInfoWhite[6]);
				self.mac8(macInfoWhite[7]);
				self.mac9(macInfoWhite[8]);
				self.mac10(macInfoWhite[9]);				
			}else if(self.selectedAction() == "2"){
				macInfoBlack = info.wifi_mac_black_list.split(";");
				self.mac1(macInfoBlack[0]);
				self.mac2(macInfoBlack[1]);
				self.mac3(macInfoBlack[2]);
				self.mac4(macInfoBlack[3]);
				self.mac5(macInfoBlack[4]);
				self.mac6(macInfoBlack[5]);
				self.mac7(macInfoBlack[6]);
				self.mac8(macInfoBlack[7]);
				self.mac9(macInfoBlack[8]);
				self.mac10(macInfoBlack[9]);				
			}else{
				self.mac1("");
				self.mac2("");
				self.mac3("");
				self.mac4("");
				self.mac5("");
				self.mac6("");
				self.mac7("");
				self.mac8("");
				self.mac9("");
				self.mac10("");				
			}
		}
        /**
         * 检查WPS状态
         * @event checkSettings
         */	    
        self.checkSettings = function (ssid) {
            var status = service.getWpsInfo();
            if (status.wpsFlag == '1') {
                showAlert('wps_on_info');
                return true;
            }
            return false;
        };
		
        /**
         * 设置多SSID开关
         *
         * @event setMultiSSIDSwitch
        */
        self.setMultiSSIDSwitch = function () {
            if (self.checkSettings("switch")) {
                return;
            }

            var setSwitch = function () {
                showLoading('waiting');
                var params = {};
                params.m_ssid_enable = self.multi_ssid_enable();
		    	if(config.WIFI_SWITCH_SUPPORT) {
			    	params.wifiEnabled = self.wifi_enable();
				}					
                service.setWifiBasicMultiSSIDSwitch(params, function (result) {
                    if (result.result == "success") {
                      	if(isWifi){
                       		setTimeout(function () {
                       			successOverlay();
                       			setTimeout(function () {
                       				window.location.reload();
                       			}, 1000);
                       			clearTimer();
			                    clearValidateMsg();
			                    service.refreshAPStationStatus();
			                    init();
                       		}, 15000);
                       	}else{
                       		addInterval(function(){
                       			var info = service.getWifiBasic();
                       			service.refreshAPStationStatus();
                       			if(info.wifi_enable == self.wifi_enable()){
                       				successOverlay();
                       				clearTimer();
			                        clearValidateMsg();
			                        service.refreshAPStationStatus();
			                        init();
                       			}
                       	    }, 1000);
                       	}
                    } else {
                        errorOverlay();
                    }
                });
            };

            var info = service.getStatusInfo();
			if(config.HAS_MULTI_SSID && self.wifi_enable() == "1"){
				if(self.multi_ssid_enable() == "1" && config.AP_STATION_SUPPORT && self.origin_ap_station_enable == "1"){
					if(info.wifiStatus){
						showConfirm("multi_ssid_enable_confirm2", function () {
                            setSwitch();
                        });
					}else{
						showConfirm("multi_ssid_enable_confirm", function () {
                            setSwitch();
                        });
					}					
				} else {
					if(info.wifiStatus){
						showConfirm("wifi_disconnect_confirm2", function () {
                            setSwitch();
                        });
					}else{
						setSwitch();
					}					
				}
			}else{
				setSwitch();
			}
        };
		
	}
        /**
         * 检查当前是否通过WiFi连接
         *
         * @event checkConnectedDevice
        */	
	function checkConnectedDevice(){
        service.getParams({nv: 'user_ip_addr'}, function (dataIp) {
            service.getParams({nv: 'station_list'}, function (dataList) {
                isWifi = isWifiConnected(dataIp.user_ip_addr, dataList.station_list);
            });
        });
    }
	
	/**
	 * view model初始化
	 * @method init
	 */
	function init() {
	    if(this.init){
            getRightNav(WIRELESS_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new macFilterViewModel();
		ko.applyBindings(vm, container[0]);
		$('#mac_filter_form').validate({
			submitHandler:function () {
					vm.save();
			},
			rules:{
				mac_1 : 'mac_check',
				mac_2 : 'mac_check',
				mac_3 : 'mac_check',
				mac_4 : 'mac_check',
				mac_5 : 'mac_check',
				mac_6 : 'mac_check',
				mac_7 : 'mac_check',
				mac_8 : 'mac_check',
				mac_9 : 'mac_check',
				mac_10 : 'mac_check'
			}
		});
		
		$('#frmWifiSwitch').validate({
			submitHandler:function () {
				vm.setMultiSSIDSwitch();
			}
		});
		
		addTimeout(function(){
            checkConnectedDevice();
        }, 600);
	}

	return {
		init : init
	};
});
