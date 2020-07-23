/**
 * @module wifi basic
 * @class wifi basic
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ], function ($, ko, config, service, _) {
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
            var info = getWifiBasic();
            var advanceInfo = service.getWifiAdvance();
            service.bindCommonData(self);
            service.wirelessHide();
            self.CSRFToken = service.getToken().token;

            self.adBand = ko.observable(advanceInfo.wifiBand);
            self.adMode = ko.observable(advanceInfo.mode);
            self.showQRSwitch = config.WIFI_SUPPORT_QR_CODE && config.WIFI_SUPPORT_QR_SWITCH;
            self.showQR = ko.observable(info.show_qrcode_flag);
            if(config.WIFI_SUPPORT_QR_SWITCH){
                self.showQRCode = ko.observable(config.WIFI_SUPPORT_QR_CODE && self.showQR());
            }else{
                self.showQRCode = ko.observable(config.WIFI_SUPPORT_QR_CODE);
            }
            // self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();
            
            self.origin_ap_station_enable = info.ap_station_enable;
            self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
            self.hasMultiSSID = config.HAS_MULTI_SSID;
            self.showIsolated = config.SHOW_WIFI_AP_ISOLATED;
            self.wifi_enable = ko.observable(info.tz_ssid4_enable);
            if(info.tz_ssid4_enable==""||info.tz_ssid4_enable==null){
                self.wifi_enable = ko.observable('0');
            }
            self.hasAPStation = config.AP_STATION_SUPPORT;
            self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
            self.hasWifiWep = config.WIFI_WEP_SUPPORT;
        
            self.isShowSSIDInfoDiv = ko.observable(true);
            self.isShowSSIDInfoDiv44 = ko.observable(false);
            if(config.WIFI_SWITCH_SUPPORT) {
                if(info.tz_ssid4_enable == "1") {
                    self.isShowSSIDInfoDiv44(true);
                } else {
                    self.isShowSSIDInfoDiv44(false);
                }
            } else {
                self.isShowSSIDInfoDiv22(true);//如果不支持软开关，整个SSID信息块显示
            }
         
            self.multi_ssid_enable = ko.observable(info.multi_ssid_enable);
            self.origin_multi_ssid_enable = info.multi_ssid_enable;

            self.maxStationNumber = ko.computed(function () {
                return config.MAX_STATION_NUMBER;
            });

            self.modes = ko.observableArray(securityModes);
            self.selectedMode = ko.observable(info.AuthMode4);
            self.passPhrase = ko.observable(info.passPhrase4);
            self.showPassword = ko.observable(false);
            self.ssid = ko.observable(info.SSID4);
            self.broadcast = ko.observable(info.broadcast4 == '1' ? '1' : '0');
            self.apIsolation = ko.observable(info.apIsolation == '1' ? '1' : '0');
            self.cipher = info.cipher4;
            self.selectedStation = ko.observable(info.MAX_Access_num4);
            var MAX_Station_num;
            var getPermissionInfo = service.getPermissionInfo().tz_account_power;
            if((getPermissionInfo == '1') ||(getPermissionInfo == '2')){
                MAX_Station_num = "32";
            }else{
                MAX_Station_num = info.MAX_Station_num;
            }
            self.maxStations = ko.observableArray(maxStationOption(MAX_Station_num));
            self.encryptType = ko.observable(info.encryptType4);
            self.keyID = ko.observable(info.S4_keyID);
            self.wepPassword = ko.observable("");

            self.m_modes = ko.observableArray(securityModes);
            self.m_selectedMode = ko.observable(info.m_AuthMode);
            self.m_passPhrase = ko.observable(info.m_passPhrase);
            self.m_showPassword = ko.observable(false);
            self.m_ssid = ko.observable(info.m_SSID);
            self.m_broadcast = ko.observable(info.m_broadcast == '1' ? '1' : '0');
            self.m_apIsolation = ko.observable(info.m_apIsolation == '1' ? '1' : '0');
            self.m_cipher = info.m_cipher;
            self.m_selectedStation = ko.observable(info.m_MAX_Access_num);
            self.m_maxStations = ko.observableArray(maxStationOption(MAX_Station_num));

            self.getWepPassword = function(){
                return self.keyID() == '3' ? info.S4_Key4Str1 : (self.keyID() == '2' ? info.S4_Key3Str1 : self.keyID() == '1' ? info.S4_Key2Str1 : info.S4_Key1Str1);
            }
            self.wepPassword(self.getWepPassword());
            self.profileChangeHandler = function(data, event) {
                $("#pwdWepKey").parent().find("label[class='error']").hide();       
                self.wepPassword(self.getWepPassword());
                return true;
            };  
            
            self.clear = function (option) {
                if (option == "switch") {
                    self.multi_ssid_enable(info.multi_ssid_enable);
                    self.wifi_enable(info.tz_ssid4_enable);
                } else if (option == "ssid1") {
                    self.selectedMode(info.AuthMode4);
                    self.passPhrase(info.passPhrase4);
                    self.ssid(info.SSID4);
                    self.broadcast(info.broadcast4 == '1' ? '1' : '0');
                    self.cipher = info.cipher4;
                    self.selectedStation(info.MAX_Access_num4);
                    self.apIsolation(info.apIsolation == '1' ? '1' : '0');
                    if(config.WIFI_WEP_SUPPORT){
                        self.encryptType(info.encryptType4);
                        self.keyID(info.S4_keyID);
                        self.wepPassword(self.getWepPassword());
                    }
                } else if (option == "ssid2") {
                    self.m_selectedMode(info.m_AuthMode);
                    self.m_passPhrase(info.m_passPhrase);
                    self.m_ssid(info.m_SSID);
                    self.m_broadcast(info.m_broadcast == '1' ? '1' : '0');
                    self.m_cipher = info.m_cipher;
                    self.m_selectedStation(info.m_MAX_Access_num);
                    self.m_apIsolation(info.m_apIsolation == '1' ? '1' : '0');
                } else {
                    clearTimer();
                    clearValidateMsg();
                    init();
                }
            };

            /**
             * 检测wps是否开启，最大接入数是否超过最大值。
             *
             * @event checkSettings
             */
            self.checkSettings = function (ssid) {
                var status = getWpsInfo();
                if(ssid == "ssid1" || ssid == "ssid2"){                 
                    if(ssid == "ssid1"){
                         var accessDevice = service.getAllOnceDatas().tz_ssid4_station_num;
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
                
                if (status.wpsFlag == '1') {
                    showAlert('wps_on_info');
                    return true;
                }

                if (config.HAS_MULTI_SSID && info.multi_ssid_enable == "1") {
                    if ((ssid == "ssid1" && parseInt(self.selectedStation()) + parseInt(info.m_MAX_Access_num) > info.MAX_Station_num)
                        || (ssid == "ssid2" && parseInt(self.m_selectedStation()) + parseInt(info.MAX_Access_num4) > info.MAX_Station_num)) {
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
                var ssid_and_pwd= service.getSSIDPwdRuless().ssid_and_pwd;
                if(ssid_and_pwd == 1){
                if($("#txtWPAKey").val().indexOf(" ") != -1){
                    showAlert("connot_input_space");    
                    return false;
                }
                if(($("#txtWepKey").val().indexOf("\"") >= 0) ||($("#txtWepKey").val().indexOf("\\") >= 0) ){
                    showAlert("not_support_symbol");
                    return false;
                }
                }
                showLoading('waiting');
                self.broadcast($("#broadcastCheckbox:checked").length > 0? '0' : '1');
                self.apIsolation($("#apisolatedCheckbox:checked").length);
                var params = {};
                params.AuthMode = self.selectedMode();
                params.CSRFToken = self.CSRFToken;
                params.passPhrase = self.passPhrase();
                params.SSID = self.ssid();
                params.broadcast = self.broadcast();
                params.station = self.selectedStation();
                params.cipher = self.selectedMode() == "WPA2PSK" ? 1: 2;
                params.NoForwarding = self.apIsolation();
                params.show_qrcode_flag = self.showQR() == true ? 1 : 0;
                if(config.WIFI_WEP_SUPPORT){
                    if (params.AuthMode == "WPAPSK" || params.AuthMode == "WPA2PSK" || params.AuthMode == "WPAPSKWPA2PSK") {
                    } else if (params.AuthMode == "SHARED") {
                        params.encryptType = "WEP";
                    } else {
                        params.encryptType = self.encryptType();
                    }
                    params.wep_default_key = self.keyID();
                    params.wep_key_1 = info.S4_Key1Str1;   
                    params.wep_key_2 = info.S4_Key2Str1;   
                    params.wep_key_3 = info.S4_Key3Str1;
                    params.wep_key_4 = info.S4_Key4Str1;
                    var WEPSelect = '0';
                    if(self.wepPassword().length =='5' ||self.wepPassword().length =='13'){
                        WEPSelect = '1';    
                    }else{
                        WEPSelect = '0';    
                    }
                    if(self.keyID() =='1'){ 
                        params.wep_key_2 = self.wepPassword();
                        params.WEP2Select = WEPSelect;
                    }else if(self.keyID() =='2'){                   
                        params.wep_key_3 = self.wepPassword();
                        params.WEP3Select = WEPSelect;
                    }else if(self.keyID() =='3'){
                        params.wep_key_4 = self.wepPassword();
                        params.WEP4Select = WEPSelect;
                    }else{
                        params.wep_key_1 = self.wepPassword();                  
                        params.WEP1Select = WEPSelect;
                    }
                }
                
                service.setWifiBasic5(params, function (result) {
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
                                if(info.tz_ssid4_enable == "1"){
                                    successOverlay();
                                    self.clear();
                                }
                            }, 1000);
                        } 
                    } else {
                        if(result.result == "ssid_long"){
                                var Logo = service.getAllOnceDatas().logo;
                                if((Logo == "teletechno.png") || (Logo == "siempre.png") || (Logo == "claro.png")){
                                    showAlert("no_more_characters");
                                }else{
                                    showAlert("no_more_characters2");
                                }
                                return false;
                             }
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
                var params = {};
                params.m_AuthMode = self.m_selectedMode();
                params.m_passPhrase = self.m_passPhrase();
                params.m_SSID = self.m_ssid();
                params.m_broadcast = self.m_broadcast();
                params.m_station = self.m_selectedStation();
                params.m_cipher = self.m_selectedMode() == "WPA2PSK" ? 1: 2;
                params.m_NoForwarding = self.m_apIsolation();
                params.m_show_qrcode_flag = self.showQR() == true ? 1 : 0;
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
                                if(info.tz_ssid4_enable == "1"){
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
                    params.CSRFToken = self.CSRFToken;
                    if(config.WIFI_SWITCH_SUPPORT) {
                        params.wifiEnabled = self.wifi_enable();
                    }   
                    params.wifiOrder = 3;                   
                    service.setWifiBasicMultiSSIDSwitch2(params, function (result) {
                        if (result.result == "success") {
                            if(isWifi){
                                setTimeout(function () {
                                    successOverlay();
                                    setTimeout(function () {
                                        window.location.reload();
                                    }, 1000);
                                    service.refreshAPStationStatus();
                                    self.clear();
                                }, 15000);
                            }else{
                                addInterval(function(){
                                    var info = getWifiBasic();
                                    service.refreshAPStationStatus();
                                    if(info.tz_ssid4_enable == self.wifi_enable()){
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

            self.toPassword = function () {
                $("#pwdWPAKey").removeAttr("readonly");
                $("#ssid").removeAttr("readonly");
            };

            self.toReadonly = function () {
                $("#pwdWPAKey").attr("readonly","readonly");
                $("#ssid").attr("readonly","readonly");
            };

            /**
             * SSID1密码显示事件
             *
             * @event showPasswordHandler
             */
            self.showPasswordHandler = function () {
                $("#pwdWepKey").parent().find(".error").hide();
                $("#pwdWPAKey").parent().find(".error").hide();
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
                getTabsNav(ADVANCE_SETTINGS_SSID_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new WifiBasicVM();
            ko.applyBindings(vm, container[0]);
            addTimeout(function(){
                checkConnectedDevice();
            }, 600);
            /**
             * 根据APSTATION状态设置界面输入框的可用状态
             * @method checkWifiStatusAccordingToWDS
             */
            function checkWifiStatus() {
                var info = service.getAPStationBasic();
                if (info.ap_station_enable == "1") {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).prop("disabled", true);
                    });
                } else {
                    $('#frmMultiSSID :input').each(function () {
                        $(this).prop("disabled", false);
                    });
                }
            }
            /**
             * 根据当前模式设置界面输入框的可用状态
             * @method checkWifiStatusAccordingToWDS
             */         
            function checkWifiStatusAccordingToWDS() {
                var info = service.getWdsInfo();
                if(info.currentMode != "0") {
                    $('#frmWifiSwitch :input').each(function () {
                        $(this).prop("disabled", true);
                    });
                    $('#frmSSID1 :input').each(function () {
                        $(this).prop("disabled", true);
                    }); 
                    $('#frmSSID2 :input').each(function () {
                        $(this).prop("disabled", true);
                    });
                } else {
                    $('#frmWifiSwitch :input').each(function () {
                        $(this).prop("disabled", false);
                    });
                    $('#frmSSID1 :input').each(function () {
                        $(this).prop("disabled", false);
                    }); 
                    $('#frmSSID2 :input').each(function () {
                        $(this).prop("disabled", false);
                    });
                }
            }

            if(config.AP_STATION_SUPPORT) {
                checkWifiStatus();
            } else if(config.WDS_SUPPORT) {
                checkWifiStatusAccordingToWDS();
            }
            /*表单提交函数、校验规则配置*/
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
                var ssid_and_pwd= service.getSSIDPwdRuless().ssid_and_pwd;
                var rules;
                var rules1 = {
                    ssid:'ssid',
                    pwdWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
                    txtWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
                    pwdWPAKey:'wifi_password_check',
                    txtWPAKey:'wifi_password_check'
                };
                var rules2 = {
                    pwdWepKey: {wifi_wep_password_check:true,wifi_password_test_check: true},
                    txtWepKey: {wifi_wep_password_check:true,wifi_password_test_check: true},
                    pwdWPAKey:'wifi_password_test_check',
                    txtWPAKey:'wifi_password_test_check'
                };
                if(ssid_and_pwd == 1){
                    rules = rules2;
                }else{
                    rules = rules1;
                }
                $.validator.addMethod("wifi_password_test_check", function (value, element) {
                return this.optional(element) || /^[\x00-\x7f]*$/.test(value);
            }, $.i18n.prop('wifi_password_test_check'));
            $.validator.addMethod("wifi_password_check", function (value, element) {
                return this.optional(element) || /^[0-9a-zA-Z!#\(\)\+\-\.\/%=\?@\^_\{|\}~]*$/.test(value);
            },$.i18n.prop('wifi_password_check'));
            $('#frmSSID1').validate({
                submitHandler:function () {
                    vm.saveSSID1();
                },
                rules:rules,
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pwdWepKey" || id == "txtWepKey") {
                        error.insertAfter("#lblShowWepPassword");
                    } else if (id == "pwdWPAKey" || id == "txtWPAKey") {
                        error.insertAfter("#lblshowWPAPassword");
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
                    m_pass:'wifi_password_check',
                    m_passShow:'wifi_password_check'
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pass" || id == "passShow") {
                        error.insertAfter("#lblShowPassword");
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