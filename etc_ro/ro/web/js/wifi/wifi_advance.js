/**
 * wifi advance 模块
 * @module wifi advance
 * @class wifi advance
 */
define(['underscore', 'jquery', 'knockout', 'config/config', 'service', 'jqui'], function(_, $, ko, config, service, jqui) {
    var $sliderRange = null;
    /*当前是否WiFi连接*/
    var isWifi = false;

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
	 * WifiAdvanceViewModel
	 * @class WifiBasicViewModel
	 */
	function WifiAdvanceViewModel() {
		// Data
		var self = this;
        service.bindCommonData(self);
        service.wirelessHide();
		self.CSRFToken = service.getToken().token;

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
		self.selectedMode = ko.observable(wifiInfo.mode);
		self.selectedCountry = ko.observable(wifiInfo.countryCode.toUpperCase());
		self.selectedChannel = ko.observable(getChannelSelectedVal(wifiInfo.channel, self.channels()));
		self.selectedRate = ko.observable(getRateSelectedVal(wifiInfo.rate, self.rates()));


		var info = service.getWifiBasic();
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
		self.oneBandTrans = ko.observable(wifiInfo.wifiBand == 'a' ? '5GHz' : '2.4GHz');
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
			var opts = rateOption(self.selectedMode());
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

		/**
		 * 保存修改
		 * @event save
		 */
		self.save = function() {
            var status = getWpsInfo();
            if(status.wpsFlag == '1') {
                showAlert('wps_on_info');
                return;
            }
            var selectedRateTxt = $("#rate option:selected").text();
            var rateVal = null;
            if(selectedRateTxt == $.i18n.prop('rate_0')){
            	rateVal = 0;
            }else{
            	rateVal = $.trim(selectedRateTxt.replace('Mbps', ''));
            }
			var params = {};
			params.mode = self.selectedMode();
			params.CSRFToken = self.CSRFToken;
			params.countryCode = self.selectedCountry();
			var selectedChannel = self.selectedChannel();
			params.channel = selectedChannel == '0' ? '0' : selectedChannel.split("_")[0];
			params.rate = rateVal;
			params.wifiBand = self.selectedBand();
			if(config.WIFI_BANDWIDTH_SUPPORT){
				params.bandwidth = self.selectedChannelBandwidth();
			}
            params.station = self.selectedStation();
            params.m_station = self.selectedStationM();
            showConfirm('wifi_disconnect_confirm', function() {
                showLoading('waiting');
                service.setWifiAdvance(params, function (result) {
                    if (result.result == "success") {
                    	if(isWifi){
                    	    setTimeout(function () {
                    	        successOverlay();
                                setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                            }, 15000);
                        }else{
                            addInterval(function(){
                                var info = service.getWifiBasic();
                                if(info.wifi_enable == "1"){
                                    successOverlay();
                                    clearTimer();
                                    clearValidateMsg();
                                    init();
                                }
                            }, 1000);
                        }
                    } else {
                        errorOverlay();
                    }
                });
            });
		};
		/**
		 * WiFi开关、多SSID开关设置
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
        self.checkSettings = function (ssid) {
            var status = getWpsInfo();
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

    var vm = null;
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
		vm = new WifiAdvanceViewModel();
		ko.applyBindings(vm, container[0]);
        addTimeout(function(){
            checkConnectedDevice();
        }, 600);

        function checkWifiStatus() {
            var info = service.getAPStationBasic();
            if (info.ap_station_enable == "1") {
                $(':input', '#wifi_advance_form').each(function () {
                    $(this).prop("disabled", true);
                });
            } else {
                $(':input', '#wifi_advance_form').each(function () {
                    $(this).prop("disabled", false);
                });
            }
        }
        function checkWifiStatusAccordingToWDS() {
            var info = service.getWdsInfo();
            if(info.currentMode != "0") {
                $(':input','#frmWifiSwitch,#wifi_advance_form').each(function () {
                    $(this).prop("disabled", true);
                });
            } else {
                $(':input','#frmWifiSwitch,#wifi_advance_form').each(function () {
                    $(this).prop("disabled", false);
                });
            }
        }

        if(config.AP_STATION_SUPPORT){
            checkWifiStatus();
        } else if(config.WDS_SUPPORT) {
            checkWifiStatusAccordingToWDS();
        }
        $('#frmWifiSwitch').validate({
            submitHandler:function () {
                vm.setMultiSSIDSwitch();
            }
        });
		$('#wifi_advance_form').validate({
			submitHandler : function() {
				vm.save();
			}
		});
	}

	return {
		init : init
	};
});