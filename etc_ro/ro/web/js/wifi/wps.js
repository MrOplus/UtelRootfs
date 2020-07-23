/**
 * @module wps
 * @class wps
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    var isWifi = false;

	/**
	 * WPS View Model
	 * @class WpsVM
	 */
	function WpsVM() {
        var self = this;
        service.bindCommonData(self);
        service.wirelessHide();
        self.hasMultiSSID = config.HAS_MULTI_SSID;
        self.hasAPStation = config.AP_STATION_SUPPORT;
        self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
		self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
		
        var info = getWpsInfo();
		self.origin_ap_station_enable = info.ap_station_enable;
        self.wpsType = ko.observable(true);
        self.wpsPin = ko.observable('');
        //wps on/off
        self.wpsFlag = ko.observable(info.wpsFlag);
        self.authMode = ko.observable(info.authMode);
        //radio on/off
        self.radioFlag = ko.observable(info.radioFlag);
        self.encrypType = ko.observable(info.encrypType);

		self.mulOption = ko.observable(drawMulSSIDOption(info));

        self.wpsSSID = ko.observable(getCurrentWpsSsid(info));

        var infoBasic = service.getWifiBasic();
        self.wifi_enable = ko.observable(infoBasic.wifi_enable);
        var tz_enable;
        if(info.tz_wps_enable == "0"){
            tz_enable = 0;
        }else{
            tz_enable = 1;
        }
		self.wps_enable = ko.observable(tz_enable); 
        self.isShowSSIDWps = ko.observable(false);  
        self.isShowSSIDInfoDiv = ko.observable(false);	
        if (config.WIFI_SWITCH_SUPPORT) {
            if (infoBasic.wifi_enable == "1") {
                self.isShowSSIDInfoDiv(true);
            } else {
                self.isShowSSIDInfoDiv(false);
            }
        } else {
            self.isShowSSIDInfoDiv(true);//如果不支持软开关，整个SSID信息块显示
        }
        
        if(info.tz_wps_enable == "0"){
            self.isShowSSIDWps(false);
        }else{
            self.isShowSSIDWps(true);
        }
        
        self.multi_ssid_enable = ko.observable(infoBasic.multi_ssid_enable);
        self.origin_multi_ssid_enable = infoBasic.multi_ssid_enable;
    /**
     * WPS应用按钮事件
     * @method getWpsInfo
     */
        self.save = function() {
            var info = getWpsInfo();
		
            if(info.radioFlag == '0') {
                showAlert('wps_wifi_off');
                return;
            }

            if(info.wpsFlag == '1') {
                showAlert('wps_on_info');
                return true;
            }

            if(self.wpsSSID() == "SSID1") {
                var checkResult = (info.AuthMode == "OPEN" && info.encrypType == "WEP")
                    || (info.AuthMode == "SHARED" && info.encrypType == "WEP")
                    || (info.AuthMode == "WPAPSK" && info.encrypType == "TKIP")
                    || (info.AuthMode == "WPAPSK" && info.encrypType == "AES")
                    || (info.AuthMode == "WPAPSK" && info.encrypType == "TKIPCCMP")
                    || (info.AuthMode == "WPA2PSK" && info.encrypType == "TKIP")
                    || (info.AuthMode == "WPAPSKWPA2PSK" && info.encrypType == "TKIP");
                if(checkResult){
                    showAlert('wps_auth_open');
                    return ;
                }
            } else {
                var checkMResult = (info.m_AuthMode == "OPEN" && info.m_encrypType == "WEP")
                    || (info.m_AuthMode == "SHARED" && info.m_encrypType == "WEP")
                    || (info.m_AuthMode == "WPAPSK" && info.m_encrypType == "TKIP")
                    || (info.m_AuthMode == "WPAPSK" && info.m_encrypType == "AES")
                    || (info.m_AuthMode == "WPAPSK" && info.m_encrypType == "TKIPCCMP")
                    || (info.m_AuthMode == "WPA2PSK" && info.m_encrypType == "TKIP")
                    || (info.m_AuthMode == "WPAPSKWPA2PSK" && info.m_encrypType == "TKIP");
                if(checkMResult){
                    showAlert('wps_auth_open');
                    return ;
                }
            }
			
			var wpsSSID;
            var wpsIndex;
			if(self.wpsSSID() == "SSID1") {
                wpsSSID = info.ssid;
                wpsIndex = 1;
            } else {
                wpsSSID = info.multiSSID;
                wpsIndex = 2;
            }
			
			var basic=service.getWifiBasic();
			if(wpsSSID==basic.SSID && wpsIndex == 1){
				if(basic.broadcast=='1'){
					showAlert('wps_ssid_broadcast_disable');
                    return ;
				}
			}else if(wpsSSID==basic.m_SSID && wpsIndex == 2){
				if(basic.m_broadcast=='1'){
					showAlert('wps_ssid_broadcast_disable');
                    return ;
				}
			}

            showLoading('waiting');
            var params = {};
            params.wpsType = self.wpsType();
            params.wpsPin = change9bitPIN(self.wpsPin());
            params.wpsSSID = wpsSSID;
            params.wpsIndex = wpsIndex;
            //params.CSRFToken = CSRFToken;

            service.openWps(params, function(result) {
                if (result.result == "success") {
                    self.wpsPin('');
                    clearValidateMsg();
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };
        
        if(info.wpsFlag != '0') {
           self.wpsType(info.wpsType == 'PIN' ? 'PIN' : 'PBC');
        }
        else {
            self.wpsType('PBC');
        }

    /**
     * WiFi开关按钮事件
     * @method setMultiSSIDSwitch
     */
        self.setMultiSSIDSwitch = function () {
            showLoading('waiting');
             var params = {};
            params.tz_wps_enable = self.wps_enable();
            service.setWpsEnable(params,function(result){
                if (result.result == "success") {
                    setTimeout(function(){
                        var info = getWpsInfo();
                        if(info.tz_wps_enable == 1){
                         self.isShowSSIDWps(true);
                     }else{
                         self.isShowSSIDWps(false);
                     }
                    },1000);
                    successOverlay();
                    
                } else {
                        errorOverlay();
                }
            });


        };

    /**
     * 检查当前WPS状态
     * @method checkSettings
     */
        self.checkSettings = function (ssid) {
            var status = getWpsInfo();
            if (status.wpsFlag == '1') {
                showAlert('wps_on_info');
                return true;
            }
            return false;
        };
    }

    function change9bitPIN(value){
        if(value.length == 9) {
            return value.substring(0,4) + value.substring(5);
        } else {
            return value;
        }
    }

    /**
     * 获取wps相关信息
     * @method getWpsInfo
     */
    function getWpsInfo() {
        return service.getWpsInfo();
    }

    /**
     * 获取当前开启wps的ssid
     * @param info
     * @returns {string}
     */
    function getCurrentWpsSsid(info) {
        if(info.ssid == info.multiSSID) {
            if(info.wifi_wps_index == '2') {
                return "SSID2";
            }else {
                return "SSID1";
            }
        }else {
            return info.wpsSSID == info.multiSSID ? "SSID2" : "SSID1";
        }
    }

	/**
     * 获取wps相关信息
     * @method getWpsInfo
     */
	function drawMulSSIDOption(info) {
		var opts = [];
		opts.push(new Option(info.ssid, "SSID1"));
		if(info.ssidEnable == "1"){
			opts.push(new Option(info.multiSSID, "SSID2"));
		}			
		return opts;
	}
	/**
     * 检查当前apstation连接状态
     * @method checkConnectedDevice
     */
    function checkConnectedDevice(){
        service.getParams({nv: 'user_ip_addr'}, function (dataIp) {
            service.getParams({nv: 'station_list'}, function (dataList) {
                isWifi = isWifiConnected(dataIp.user_ip_addr, dataList.station_list);
            });
        });
    }

    /**
     * 初始化wps view model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(WIRELESS_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new WpsVM();
		ko.applyBindings(vm, container[0]);

        addTimeout(function(){
            checkConnectedDevice();
        }, 600);

        $('#frmWifiSwitch').validate({
            submitHandler:function () {
                vm.setMultiSSIDSwitch();
            }
        });
		$('#wpsForm').validate({
			submitHandler : function() {
				vm.save();
			},
            rules: {
                txtPin: {
                    "wps_pin_validator": true
                }
            }
		});

	}

	return {
		init : init
	};
});