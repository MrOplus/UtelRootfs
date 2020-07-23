/**
 * @module wifi basic
 * @class wifi basic
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ,'jqui'], function ($, ko, config, service, _,jqui) {
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
         var $sliderRange = null;

    /**
     * 速率表
     * @attribute {Array} modeRate 
     */
    var modeRate = [0, 
                    1, 2, 5.5, 6, 6.5, 
                    9, 11, 12, 13, 18, 
                    19.5, 24, 26, 36, 39, 
                    48, 52, 54, 58.5, 65
                   ];

    /**
     * 删除重复的速率
     * @method unionArr
     * @param {Array} arr 速率
     */
    function unionArr(arr) {
        var rates = [], result = [];
        for ( var i = 0; i < arr.length; i++) {
            for ( var j = 0; j < arr[i].length; j++) {
                if (ko.utils.arrayIndexOf(rates, arr[i][j]) == -1) {
                    rates.push(arr[i][j]);
                    result.push({index: arr[i][j], rate: modeRate[arr[i][j]]});
                }
            }
        }
        result.sort(function(a, b) {
            return a.rate - b.rate;
        });
        return result;

    }

    /**
     * 根据模式生成Options
     * @method rateOption
     * @param {String} mode 模式 mode in 0, 1, 2, 3, 4
     */
    function rateOption(mode) {
        var rates = [];
        var modeB = [0, 1, 2, 3, 7];
        var modeG = [0, 4, 6, 8, 10, 12, 14, 16, 18];
        var modeN = [0, 5, 9, 11, 13, 15, 17, 19, 20];

        switch (mode) {
        case '0':
            rates.push(modeB);
            break;
        case '1':
            rates.push(modeG);
            break;
        case '2':
            rates.push(modeN);
            break;
        case '3':
            rates.push(modeB);
            rates.push(modeG);
            break;
        case '4':
            rates.push(modeB);
            rates.push(modeG);
            rates.push(modeN);
            break;
        default:
            rates.push(modeN);
            break;
        }
        var result = unionArr(rates);
        return drawRateOption(result);
    }

    function drawRateOption(data) {
        var opts = [];
        for ( var i = 0; i < data.length; i++) {
            var rate = data[i].rate == 0 ? "Auto" : data[i].rate + " Mbps";
            opts.push(new Option(rate, data[i].index));
        }
        return opts;
    }

    /**
     * 根据国家生成相应的频道
     * @method channelOption
     * @param {String} country 国家码
     */
    function channelOption(country) {
        var options = [new Option('Auto', '0')];
        var type = getCountryType(country) + '';
        switch (type) {
        case '1':
            addChannelOption(options, 2407, 11);
            break;
        case '3':
            addChannelOption(options, 2407, 11);
            addChannelOption(options, 2462, 2);
            break;
        case '7':
            addChannelOption(options, 2307, 13);
            addChannelOption(options, 2407, 11);
            addChannelOption(options, 2462, 2);
            break;
        default:
            addChannelOption(options, 2407, 11);
        }
        return options;
    }

    function channelOption5g(country){
        for(key in config.countryCode_5g){
            var item = config.countryCode_5g[key];
            if($.inArray(country, item.codes) != -1){
                return addChannelOption5g(item.channels);
            }
        }
        return [new Option('Auto', '0')];
    }

    function addChannelOption(options, start, count) {
        for ( var i = 1; i <= count; i++) {
            var txt = start + i * 5 + "MHz (Channel " + options.length + ")";
            options.push(new Option(txt, options.length + "_" + (start + i * 5)));
        }
    }

    function addChannelOption5g(channels) {
        var options = [new Option('Auto', '0')];
        for ( var i = 0; i < channels.length; i++) {
            var channel = channels[i];
            var mhz = 5000 + channel * 5;
            var txt = mhz + "MHz (Channel " + channel + ")";
            options.push(new Option(txt, channel + "_" + (mhz)));
        }
        return options;
    }
    /**
     * 根据WIFI_HAS_5G生成相应的频段选择选项
     * @method getBandOptions
     */ 
    function getBandOptions(){
        var options = [];
        if(config.WIFI_HAS_5G)
        {
            options.push(new Option('2.4GHz', 'b'));
            options.push(new Option('5GHz', 'a'));
        }
        else{
            options.push(new Option('2.4GHz', 'b'));
        }
        return options;
    }
    /**
     * 根据WIFI_BANDWIDTH_SUPPORT_40MHZ生成频带宽度选项
     * @method getChannelBandwidthsOptions
     */     
    function getChannelBandwidthsOptions(isSupport40){
        var options = [];
        if(isSupport40){
            options.push(new Option('20MHz', '0'));
            options.push(new Option('20MHz/40MHz', '1'));
        }else{
            options.push(new Option('20MHz', '0'));
        }
        return options;
    }
    
    /**
     * 获取国家类型
     * @method getCountryType
     * @param {String} country 国家码
     * @return {String} 类型
     */
    function getCountryType(country) {
        var countryCode = config.countryCode;
        var type = '';
        for (key in countryCode) {
            var codes = countryCode[key];
            if ($.inArray(country, codes) != -1) {
                type = key;
                break;
            }
        }
        var typeCode = config.countryCodeType[type];
        return typeCode ? typeCode : "0";
    }
    /**
     * 获取国家/地区码选项
     * @method countryOption
     * @param {String} is5G 是否5G频带
     * @return {options} options
     */
    function countryOption(is5G) {
        var countries = is5G ? config.countries_5g:config.countries;
        var options = [];
        for(key in countries){
            options.push(new Option(countries[key], key));
        }
        options = _.sortBy(options, function(opt){
            return opt.text;
        });
        return options;
    }

    function getWifiAdvance() {
        return service.getWifiAdvance();
    }

    function getWpsInfo() {
        return service.getWpsInfo();
    }
    /**
     * 获取网络模式选项
     * @method getModeOption
     * @param {String} wifiBand 频带
     * @return {array} options
     */   
    function getModeOption(wifiBand){
        var permission = service.getStatusInfo().accountPower;
        var modes = wifiBand == 'a' ? config.NETWORK_MODES_BAND : permission == "1" ? config.NETWORK_MODES_TOZED : config.NETWORK_MODES;
        if (modes.length == 1) {
            $("#mode").hide();
            $("#modeFor5HZ").hide();
        } else if (wifiBand == 'a') {
            $("#modeFor5HZ").show();
            $("#mode").hide();
            $("#modeLabel").attr('for', 'modeFor5HZ');
        } else {
            $("#mode").show();
            $("#modeFor5HZ").hide();
        }
        var modeArr = [];
        for (var i = 0; i < modes.length; i++) {
            modeArr.push(new Option(modes[i].name, modes[i].value));
        }
        return modeArr;
    }
    /**
     * 获取所选的速率对应的value值
     * @method getRateSelectedVal
     * @param {String} 
     * @return {String} value
     */     
    function getRateSelectedVal(rate, rates){
        for(var i = 0; i < rates.length; i++){
            var opt = rates[i];
            if(opt.text == rate + " Mbps"){
                return opt.value;
            }
        }
        return '0';
    }
    /**
     * 获取所选的信道对应的value值
     * @method getChannelSelectedVal
     * @param {String} channel  channels
     * @return {String} value
     */ 
    function getChannelSelectedVal(channel, channels){
        for(var i = 0; i < channels.length; i++){
            var opt = $(channels[i]);
            if(opt.val().split("_")[0] == channel){
                return opt.val();
            }
        }
        return '0';
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
            self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();
            
            self.origin_ap_station_enable = info.ap_station_enable;
            self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
            self.hasMultiSSID = config.HAS_MULTI_SSID;
            self.showIsolated = config.SHOW_WIFI_AP_ISOLATED;
            // self.wifi_enable = ko.observable(info.wifi_enable);
            self.hasAPStation = config.AP_STATION_SUPPORT;
            self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
            self.hasWifiWep = config.WIFI_WEP_SUPPORT;
        
            self.isShowSSIDInfoDiv = ko.observable(false);
         
            self.multi_ssid_enable = ko.observable(info.multi_ssid_enable);
            self.origin_multi_ssid_enable = info.multi_ssid_enable;

            self.maxStationNumber = ko.computed(function () {
                return config.MAX_STATION_NUMBER;
            });

            self.modess = ko.observableArray(securityModes);
            self.selectedMode = ko.observable(info.AuthMode);
            self.passPhrase = ko.observable(info.passPhrase);
            self.showPassword = ko.observable(false);
            self.ssid = ko.observable(info.SSID);
            self.broadcast = ko.observable(info.broadcast == '1' ? '1' : '0');
            self.apIsolation = ko.observable(info.apIsolation == '1' ? '1' : '0');
            self.cipher = info.cipher;
            self.selectedStation = ko.observable(info.MAX_Access_num);
            self.maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));
            self.encryptType = ko.observable(info.encryptType);
            self.keyID = ko.observable(info.keyID);
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
            self.m_maxStations = ko.observableArray(maxStationOption(info.MAX_Station_num));
            self.isShowSSIDW13 = ko.observable(false);
            if(info.wifi_enable == "1") {
                    self.isShowSSIDW13(true);
                } else {
                    self.isShowSSIDW13(false);
            }
            self.getWepPassword = function(){
                return self.keyID() == '3' ? info.Key4Str1 : (self.keyID() == '2' ? info.Key3Str1 : self.keyID() == '1' ? info.Key2Str1 : info.Key1Str1);
            }
            self.wepPassword(self.getWepPassword());
            self.profileChangeHandler = function(data, event) {
                $("#pwdWepKey").parent().find("label[class='error']").hide();       
                self.wepPassword(self.getWepPassword());
                return true;
            };  
            self.hasAPStation = config.AP_STATION_SUPPORT;
        self.hasWifiBand = ko.observable(config.WIFI_BAND_SUPPORT);
        self.hasBandwidth = ko.observable(config.WIFI_BANDWIDTH_SUPPORT);
        self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
        self.hasMultiSSID = config.HAS_MULTI_SSID;
        self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;

        var wifiInfo = service.getWifiAdvance();
        self.origin_ap_station_enable = wifiInfo.ap_station_enable;
        self.modes = ko.observableArray(getModeOption(wifiInfo.wifiBand));
        self.bands = ko.observableArray(getBandOptions());
        
        var countryOpts = countryOption(wifiInfo.wifiBand == 'a');
        self.countries = ko.observableArray(countryOpts);
        self.channels = ko.observableArray(wifiInfo.wifiBand == 'a' ? channelOption5g(wifiInfo.countryCode) : channelOption(wifiInfo.countryCode));
        self.rates = ko.observableArray(rateOption(wifiInfo.mode));     
        
        // Init data
        self.selectedBand = ko.observable(wifiInfo.wifiBand);//5:a, 2.5:b
        self.selectedChannelBandwidth = ko.observable(wifiInfo.bandwidth);//5:a, 2.5:b
        self.selectedMode2 = ko.observable(wifiInfo.mode);
        self.selectedCountry = ko.observable(wifiInfo.countryCode.toUpperCase());
        self.selectedChannel = ko.observable(getChannelSelectedVal(wifiInfo.channel, self.channels()));
        self.selectedRate = ko.observable(getRateSelectedVal(wifiInfo.rate, self.rates()));

        var ipAddress = service.getLanInfo();
            self.ipAddress = ko.observable(ipAddress.w13_lan_ip);

        self.wifi_enable = ko.observable(info.wifi_enable);
        if((info.AuthMode == "OPEN" && info.encryptType == "WEP") || (info.AuthMode == "SHARED" && info.encryptType == "WEP") || info.encryptType == "TKIP"){
            self.isF = ko.observable(true);
        } else if(config.HAS_MULTI_SSID && ((info.m_AuthMode == "OPEN" && info.m_encryptType == "WEP") || (info.m_AuthMode == "SHARED" && info.m_encryptType == "WEP") || info.m_encryptType == "TKIP")){
            self.isF = ko.observable(true);
        } else{
            self.isF = ko.observable(false);            
        }
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
        self.maxStationNumber = ko.observable(wifiInfo.MAX_Station_num);
        self.selectedStation = ko.observable(wifiInfo.MAX_Access_num);
        self.selectedStationM = ko.observable(wifiInfo.m_MAX_Access_num);

        self.oneBandTrans = ko.observable(wifiInfo.wifiBand == 'a' ? '5G' : '2.4G');
        self.oneModeTrans = ko.observable((wifiInfo.wifiBand == 'a' ? 'network_modes_band_select_' : 'network_mode_select_') + wifiInfo.mode);

        self.channelBandwidths = ko.computed(function(){
            if(config.WIFI_BANDWIDTH_SUPPORT_40MHZ){
                return getChannelBandwidthsOptions(true);
            } else {
                return getChannelBandwidthsOptions(false);
            }
        });
        
        wifiInfo = $.extend(wifiInfo, self);

        // //////////////////////Event Handler
        /**
         * 频段切换时更新对应的国家/地区码、信道和网络模式选项
         * @method bandChangeHandler
         */         
        self.bandChangeHandler = function(){
            if(self.selectedBand() == 'a'){ //5g
                //802.11a only；802.11n only；802.11a/n 
                self.modes(getModeOption(self.selectedBand()));
                self.countries(countryOption(true));
            } else { // 2.4g
                //802.11 n only；802.11 b/g/n
                self.modes(getModeOption(self.selectedBand()));
                self.countries(countryOption(false));
            }
            self.selectedCountry('0');
            self.channels(self.generateChannelOption());
            self.selectedChannel('0');
        };
        
        /**
         * 模式切换事件处理
         * @event modeChangeHandler
         */
        self.modeChangeHandler = function(data, event) {
            var opts = rateOption(self.selectedMode2());
            self.rates(opts);
            self.selectedRate('0');
        };

        /**
         * 国家切换事件处理
         * @event countryChangeHandler
         */
        self.countryChangeHandler = function(data, event) {
            var opts = self.generateChannelOption();
            self.channels(opts);
            self.selectedChannel('0');
        };

        self.generateChannelOption = function(){
            if(self.selectedBand() == 'a'){
                return channelOption5g(self.selectedCountry());
            } else {
                return channelOption(self.selectedCountry());
            }
        };
            self.clear = function (option) {
                if (option == "switch") {
                    self.multi_ssid_enable(info.multi_ssid_enable);
                    self.wifi_enable(info.wifi_enable);
                } else if (option == "ssid1") {
                    self.selectedMode2(info.AuthMode);
                    self.passPhrase(info.passPhrase);
                    self.ssid(info.SSID);
                    self.broadcast(info.broadcast == '1' ? '1' : '0');
                    self.cipher = info.cipher;
                    self.selectedStation(info.MAX_Access_num);
                    self.apIsolation(info.apIsolation == '1' ? '1' : '0');
                    if(config.WIFI_WEP_SUPPORT){
                        self.encryptType(info.encryptType);
                        self.keyID(info.keyID);
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
                params.mode = self.selectedMode2();
                var selectedChannel = self.selectedChannel();
                params.channel = selectedChannel == '0' ? '0' : selectedChannel.split("_")[0];
                if(config.WIFI_BANDWIDTH_SUPPORT){
                    params.bandwidth = self.selectedChannelBandwidth();
                }
                params.wifiEnabled = self.wifi_enable();
                params.AuthMode = self.selectedMode();
                params.CSRFToken = self.CSRFToken;
                params.passPhrase = self.passPhrase();
                params.SSID = self.ssid();
                params.ipAddress = self.ipAddress();
                params.broadcast = self.broadcast();
                params.cipher = self.selectedMode() == "WPA2PSK" ? 1: 2;
                if(config.WIFI_WEP_SUPPORT){
                    if (params.AuthMode == "WPAPSK" || params.AuthMode == "WPA2PSK" || params.AuthMode == "WPAPSKWPA2PSK") {
                    } else if (params.AuthMode == "SHARED") {
                        params.encryptType = "WEP";
                    } else {
                        params.encryptType = self.encryptType();
                    }
                    params.wep_default_key = self.keyID();
                    params.wep_key_1 = info.Key1Str1;   
                    params.wep_key_2 = info.Key2Str1;   
                    params.wep_key_3 = info.Key3Str1;
                    params.wep_key_4 = info.Key4Str1;
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
                service.setW13Basic(params, function (result) {
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
                                    successOverlay();
                                    self.clear();
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
                    params.CSRFToken = self.CSRFToken;
                    if(config.WIFI_SWITCH_SUPPORT) {
                        params.wifiEnabled = self.wifi_enable();
                    }
                    if(params.wifiEnabled == 0){
                        params.wifiOrder = 0;
                    }               
                    service.setWifiBasicMultiSSIDSwitch(params, function (result) {
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
                // getRightNav(WIRELESS_SETTINGS_COMMON_URL);
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
            $('#frmSSID1').validate({
                submitHandler:function () {
                    vm.saveSSID1();
                },
                rules:{
                    ssid:'ssid',
                    pwdWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
                    txtWepKey: {wifi_wep_password_check:true,wifi_password_check: true},
                    txtIpAddress: {lanip_check: true},
                    pwdWPAKey:'wifi_password_check',
                    txtWPAKey:'wifi_password_check'
                },
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