/**
 * @module wifi basic
 * @class wifi basic
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        /*当前是否WiFi连接*/
        var isWifi = false;
	    /**
	     * 生成安全模式选项
	     * @attribute {array} securityModes 
	     */
        var securityModes = _.map(config.WIFI_WEP_SUPPORT ? config.AUTH_MODES_WEP : config.AUTH_MODES, function (item) {
            return new Option(item.name, item.value);
        });
	    /**
	     * 生成最大接入数选项
	     * @method {array} maxStationOption 
	     * @param {} max 从底层读取的设备允许的最大接入数
	     * @param {array} options 
	     */
        function maxStationOption(max) {
            var options = [];
            for (var i = 1; i <= max; i++) {
                options.push(new Option(i, i));
            }
            return options;
        }

        /**
         * wifi basic view model
         * @class WifiBasicVM
         */
        function WifiBasicVM() {
            var self = this;
            var info = service.getWifiBasic();
			var advanceInfo = service.getWifiAdvance();
			self.adBand = ko.observable(advanceInfo.wifiBand);
			self.adMode = ko.observable(advanceInfo.mode);
			
			self.showQRSwitch = config.WIFI_SUPPORT_QR_CODE && config.WIFI_SUPPORT_QR_SWITCH;
            self.showQR = ko.observable(info.m_show_qrcode_flag);
            if(config.WIFI_SUPPORT_QR_SWITCH){
				self.showQRCode = ko.observable(config.WIFI_SUPPORT_QR_CODE && self.showQR());
			}else{
				self.showQRCode = ko.observable(config.WIFI_SUPPORT_QR_CODE);
			}
            // self.qrcodeSrc = './img/qrcode_multi_ssid_wifikey.png?_=' + $.now();

            self.origin_ap_station_enable = info.ap_station_enable;
            self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
            self.hasMultiSSID = config.HAS_MULTI_SSID;
            self.showIsolated = config.SHOW_WIFI_AP_ISOLATED;
            self.hasAPStation = config.AP_STATION_SUPPORT;
			self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
			self.hasWifiWep = config.WIFI_WEP_SUPPORT;
            self.wifi_enable = ko.observable(info.wifi_enable);
            self.isShowSSIDInfoDiv = ko.observable(false);
            if(config.WIFI_SWITCH_SUPPORT) {
                if(info.wifi_enable == "1") {
                    self.isShowSSIDInfoDiv(true);
                } else {
                    self.isShowSSIDInfoDiv(false);
                }
            } else {
                self.isShowSSIDInfoDiv(true);//如果不支持软开关，整个SSID信息块显示
            }

            self.multi_ssid_enable = ko.observable(info.multi_ssid_enable);
            self.origin_multi_ssid_enable = info.multi_ssid_enable;

            self.maxStationNumber = ko.computed(function () {
                return config.MAX_STATION_NUMBER;
            });

            self.modes = ko.observableArray(securityModes);
            self.selectedMode = ko.observable(info.AuthMode);
            self.passPhrase = ko.observable(info.passPhrase);
            self.showPassword = ko.observable(false);
            self.ssid = ko.observable(info.SSID);
            self.broadcast = ko.observable(info.broadcast == '1' ? '1' : '0');
			self.apIsolation = ko.observable(info.apIsolation == '1' ? '1' : '0');
            self.cipher = info.cipher;
            self.selectedStation = ko.observable(info.MAX_Access_num);
            self.maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));

            self.m_modes = ko.observableArray(securityModes);
            self.m_selectedMode = ko.observable(info.m_AuthMode);
            self.m_passPhrase = ko.observable(info.m_passPhrase);
            self.m_showPassword = ko.observable(false);
            self.m_ssid = ko.observable(info.m_SSID);
            self.m_broadcast = ko.observable(info.m_broadcast == '1' ? '1' : '0');
			self.m_apIsolation = ko.observable(info.m_apIsolation == '1' ? '1' : '0');
            self.m_cipher = info.m_cipher;
            self.m_selectedStation = ko.observable(info.m_MAX_Access_num);
            self.m_maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));
			self.m_encryptType = ko.observable(info.m_encryptType);
			self.m_keyID = ko.observable(info.m_keyID);
			self.m_wepPassword = ko.observable("");

			self.getWepPassword = function(){
				return self.m_keyID() == '3' ? info.m_Key4Str1 : (self.m_keyID() == '2' ? info.m_Key3Str1 : self.m_keyID() == '1' ? info.m_Key2Str1 : info.m_Key1Str1);
			}
			self.m_wepPassword(self.getWepPassword());
            /**
             * WEP加密模式下网络秘钥切换事件
             * @event profileChangeHandler
             */	
			self.profileChangeHandler = function(data, event) {
			    $("#pwdWepKey").parent().find("label[class='error']").hide();		
			    self.m_wepPassword(self.getWepPassword());
			    return true;
		    };
            /**
             * 刷新界面状态值显示
             * @event clear
             */			
            self.clear = function (option) {
                if (option == "switch") {
                    self.multi_ssid_enable(info.multi_ssid_enable);
                    self.wifi_enable(info.wifi_enable);
                } else if (option == "ssid1") {
                    self.selectedMode(info.AuthMode);
                    self.passPhrase(info.passPhrase);
                    self.ssid(info.SSID);
                    self.broadcast(info.broadcast == '1' ? '1' : '0');
                    self.cipher = info.cipher;
                    self.selectedStation(info.MAX_Access_num);
                    self.apIsolation(info.apIsolation == '1' ? '1' : '0');
                } else if (option == "ssid2") {
                    self.m_selectedMode(info.m_AuthMode);
                    self.m_passPhrase(info.m_passPhrase);
                    self.m_ssid(info.m_SSID);
                    self.m_broadcast(info.m_broadcast == '1' ? '1' : '0');
                    self.m_cipher = info.m_cipher;
                    self.m_selectedStation(info.m_MAX_Access_num);
                    self.m_apIsolation(info.m_apIsolation == '1' ? '1' : '0');
					if(config.WIFI_WEP_SUPPORT){
					    self.m_encryptType(info.m_encryptType);
					    self.m_keyID(info.m_keyID);
					    self.m_wepPassword(self.getWepPassword());
					}
                } else {
                    clearTimer();
                    clearValidateMsg();
                    init();
                    service.refreshAPStationStatus();
                }
            };

            /**
             * 检测wps是否开启，最大接入数是否超过最大值。
             *
             * @event checkSettings
             */
            self.checkSettings = function (ssid) {
                var status = getWpsInfo();
				
                if(config.HAS_MULTI_SSID){
                    if(ssid == "ssid1" || ssid == "ssid2"){					
                        if(ssid == "ssid1"){
                            var accessDevice = service.getStatusInfo().ssid1AttachedNum;
                            if(parseInt(self.selectedStation()) < accessDevice){
                                showAlert('Extend_accessDevice');
                                return true;
                            }
                        } else{
                            var accessDevice = service.getStatusInfo().ssid2AttachedNum;
                            if(parseInt(self.m_selectedStation()) < accessDevice){
                                showAlert('Extend_accessDevice');
                                return true;
                            }
                        }                    
                    }
                }
				
				
                if (status.wpsFlag == '1') {
                    showAlert('wps_on_info');
                    return true;
                }
                if (config.HAS_MULTI_SSID && info.multi_ssid_enable == "1") {
                    if ((ssid == "ssid1" && parseInt(self.selectedStation()) + parseInt(info.m_MAX_Access_num) > info.MAX_Station_num)
                        || (ssid == "ssid2" && parseInt(self.m_selectedStation()) + parseInt(info.MAX_Access_num) > info.MAX_Station_num)) {
                        showAlert({msg:'multi_ssid_max_access_number_alert', params: info.MAX_Station_num});
                        return true;
                    }
                }

                return false;
            };
            self.saveSSID1 = function () {
                if (self.checkSettings("ssid1")) {
                    return;
                }
                showConfirm('wifi_disconnect_confirm', function(){
                    self.saveSSID1Action();
                });
            };
            /**
             * 保存SSID1的设置
             *
             * @event saveSSID1
             */
            self.saveSSID1Action = function () {

                showLoading('waiting');
                self.broadcast($("#broadcastCheckbox:checked").length > 0? '0' : '1');
                self.apIsolation($("#apisolatedCheckbox:checked").length);
                var params = {};
                params.AuthMode = self.selectedMode();
                params.passPhrase = self.passPhrase();
                params.SSID = self.ssid();
                params.broadcast = self.broadcast();
                params.station = self.selectedStation();
                params.cipher = self.selectedMode() == "WPA2PSK" ? 1: 2;
                params.NoForwarding = self.apIsolation();
                params.show_qrcode_flag = self.showQR() == true ? 1 : 0;
                service.setWifiBasic(params, function (result) {
                    if (result.result == "success") {
                        if(isWifi){
                            setTimeout(function () {
                                successOverlay();
                                setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                                self.clear();
                            }, 15000);
                        }else{
                            addInterval(function(){
                                var info = getWifiBasic();
                                if(info.wifi_enable == "1"){
                                    successOverlay();
                                    self.clear();
                                }
                            }, 1000);
                        } 
                    } else {
                        errorOverlay();
                    }
                });
            };

            self.saveSSID2 = function () {
                if (self.checkSettings("ssid2")) {
                    return;
                }
                showConfirm('wifi_disconnect_confirm', function(){
                    self.saveSSID2Action();
                });
            };
            /**
             * 保存SSID2的设置
             *
             * @event saveSSID2
             */
            self.saveSSID2Action = function () {
                showLoading('waiting');
                self.m_broadcast($("#mBroadcastCheckbox:checked").length > 0? '0' : '1');
                self.m_apIsolation($("#mApIsolatedCheckbox:checked").length);
                var params = {};
                params.m_AuthMode = self.m_selectedMode();
                params.m_passPhrase = self.m_passPhrase();
                params.m_SSID = self.m_ssid();
                params.m_broadcast = self.m_broadcast();
                params.m_station = self.m_selectedStation();
                params.m_cipher = self.m_selectedMode() == "WPA2PSK" ? 1: 2;
                params.m_NoForwarding = self.m_apIsolation();
                params.m_show_qrcode_flag = self.showQR() == true ? 1 : 0;
				
				if(config.WIFI_WEP_SUPPORT){
					if (params.m_AuthMode == "WPAPSK" || params.m_AuthMode == "WPA2PSK" || params.m_AuthMode == "WPAPSKWPA2PSK") {
                        //params.m_encryptType = self.m_encryptType_WPA();
                    } else if (params.m_AuthMode == "SHARED") {
                        params.m_encryptType = "WEP";
                    } else {
                        params.m_encryptType = self.m_encryptType();
                    }
				    params.m_wep_default_key = self.m_keyID();
					params.m_wep_key_1 = info.m_Key1Str1;	
					params.m_wep_key_2 = info.m_Key2Str1;	
				    params.m_wep_key_3 = info.m_Key3Str1;
					params.m_wep_key_4 = info.m_Key4Str1;
					var mWEPSelect = '0';
					if(self.m_wepPassword().length =='5' ||self.m_wepPassword().length =='13'){
					    mWEPSelect = '1';	
					}else{
					    mWEPSelect = '0';	
					}
					if(self.m_keyID() =='1'){	
					    params.m_wep_key_2 = self.m_wepPassword();
					    params.m_WEP2Select = mWEPSelect;
				    }else if(self.m_keyID() =='2'){					
					    params.m_wep_key_3 = self.m_wepPassword();
					    params.m_WEP3Select = mWEPSelect;
				    }else if(self.m_keyID() =='3'){
					    params.m_wep_key_4 = self.m_wepPassword();
					    params.m_WEP4Select = mWEPSelect;
				    }else{
					    params.m_wep_key_1 = self.m_wepPassword();					
					    params.m_WEP1Select = mWEPSelect;
				    }
				}
				
                service.setWifiBasic4SSID2(params, function (result) {
                    if (result.result == "success") {
                        if(isWifi){
                            setTimeout(function () {
                                successOverlay();
                                setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                                self.clear();
                            }, 15000);
                        }else{
                            addInterval(function(){
                                var info = getWifiBasic();
                                if(info.wifi_enable == "1"){
                                    successOverlay();
                                    self.clear();
                                }
                            }, 1000);
                        } 
                    } else {
                        errorOverlay();
                    }
                });
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
                                    self.clear();
                                }, 15000);
                        	}else{
                        	    addInterval(function(){
                                    var info = getWifiBasic();
                        			if(info.wifi_enable == self.wifi_enable()){
                        				successOverlay();
                        				self.clear();
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

            /**
             * SSID1密码显示事件
             *
             * @event showPasswordHandler
             */
            self.showPasswordHandler = function () {
                $("#passShow").parent().find(".error").hide();
                var checkbox = $("#showPassword:checked");
                if (checkbox && checkbox.length == 0) {
                    self.showPassword(true);
                } else {
                    self.showPassword(false);
                }
            };
            /**
             * SSID2密码显示事件
             *
             * @event m_showPasswordHandler
             */
            self.m_showPasswordHandler = function () {
				$("#m_pwdWepKey").parent().find(".error").hide();
                $("#m_passShow").parent().find(".error").hide();
                var checkbox = $("#m_showPassword:checked");
                if (checkbox && checkbox.length == 0) {
                    self.m_showPassword(true);
                } else {
                    self.m_showPassword(false);
                }
            }
			
			/**
             * 二维码显示事件
             *
             * @event showQRHandler
             */
            self.showQRHandler = function () {
                var checkbox = $("#showQR:checked");
                if (checkbox && checkbox.length == 0) {
                    self.showQR(true);
                } else {
                    self.showQR(false);
                }
                self.showQRCode(config.WIFI_SUPPORT_QR_CODE && self.showQR());
            }
			
        }

        /**
         * 获取wifi基本信息
         * @method getWifiBasic
         * @return {Object}
         */
        function getWifiBasic() {
            return service.getWifiBasic();
        }

        /**
         * 获取wps信息
         * @method getWpsInfo
         */
        function getWpsInfo() {
            return service.getWpsInfo();
        }
        /**
         * 当前是否WiFi连接
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
         * 初始化wifi基本view model
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(WIRELESS_SETTINGS_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new WifiBasicVM();
            ko.applyBindings(vm, container[0]);
            addTimeout(function(){
                checkConnectedDevice();
            }, 600);

            function checkWifiStatus() {
                var info = service.getAPStationBasic();
                if (info.ap_station_enable == "1") {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).attr("disabled", true);
                    });
                } else {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).attr("disabled", false);
                    });
                }
            }
			
			function checkWifiStatusAccordingToWDS() {
				var info = service.getWdsInfo();
				if(info.currentMode != "0") {
					$('#frmWifiSwitch :input').each(function () {
                        $(this).attr("disabled", true);
                    });
					$('#frmSSID1 :input').each(function () {
                        $(this).attr("disabled", true);
                    });	
					$('#frmSSID2 :input').each(function () {
                        $(this).attr("disabled", true);
                    });
				} else {
					$('#frmWifiSwitch :input').each(function () {
                        $(this).attr("disabled", false);
                    });
					$('#frmSSID1 :input').each(function () {
                        $(this).attr("disabled", false);
                    });	
					$('#frmSSID2 :input').each(function () {
                        $(this).attr("disabled", false);
                    });
				}
			}

            if(config.AP_STATION_SUPPORT) {
				checkWifiStatus();
			} else if(config.WDS_SUPPORT) {
				checkWifiStatusAccordingToWDS();
			}
			
			$('#frmWifiSwitch').validate({
				submitHandler:function () {
                    vm.setMultiSSIDSwitch();
                }
			});

            $('#frmMultiSSID').validate({
                submitHandler:function () {
                    vm.setMultiSSIDSwitch();
                }
            });
            $('#frmSSID1').validate({
                submitHandler:function () {
                    vm.saveSSID1();
                },
                rules:{
                    ssid:'ssid',
                    pass:'wifi_password_check',
                    passShow:'wifi_password_check'
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pass" || id == "passShow") {
                        error.insertAfter("#lblShowPassword");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
            $('#frmSSID2').validate({
                submitHandler:function () {
                    vm.saveSSID2();
                },
                rules:{
                    m_ssid:'ssid',
					m_pwdWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
					m_txtWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
                    m_pass:'wifi_password_check',
                    m_passShow:'wifi_password_check'
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "m_pwdWepKey" || id == "m_txtWepKey") {
                        error.insertAfter("#m_lblShowWepPassword");
                    } else if (id == "m_pass" || id == "m_passShow") {
                        error.insertAfter("#m_lblShowPassword");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
        }

        return {
            init:init
        };
    });