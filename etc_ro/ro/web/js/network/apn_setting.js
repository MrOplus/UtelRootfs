/**
 * APN Setting 模块
 * @module apn_setting
 * @class apn_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore','util' ],

function($, ko, config, service, _, util) {
	var language = service.getLanguage().Language;
	/**
	 * 获取鉴权方式
	 * @method getAuthModes
	 * @return {Array} Auth mode Options
	 */
	function getAuthModes(){
		return _.map(config.APN_AUTH_MODES, function(item){
			if(language == "el" && item.name=="NONE")
					item.name = "Sin autenticación";
			return new Option(item.name, item.value);
		});
	}
	
    function getPdpTypes(){
        var pdpTypesTmp = [new Option('IPv4', 'IP')];
        if(config.IPV6_SUPPORT){
            pdpTypesTmp.push(new Option('IPv6', 'IPv6'));
            if (config.IPV4V6_SUPPORT) {
                pdpTypesTmp.push(new Option('IPv4v6', 'IPv4v6'));
            }
            if (config.IPV4_AND_V6_SUPPORT) {
                pdpTypesTmp.push(new Option('IPv4 & IPv6', 'IPv4v6'));
            }
		}
		return pdpTypesTmp;
	}

	/**
	 * 获取apn相关信息
	 * @method getApnSettings
	 */
	function getApnSettings(){
		var settings = service.getApnSettings();
		settings.ipv6ApnConfigs = getApnConfigs(settings.ipv6APNs, true);
		settings.apnConfigs = getApnConfigs(settings.APNs, false);
		settings.autoApnConfigs = getAutoApns(settings.autoApns, settings.autoApnsV6);
		return settings;
	}
	var apnConfigs = {};
	var ipv6ApnConfigs = {};
	var autoApnConfigs = {};

	/**
	 * 解析apn信息
	 * @method getApnConfigs
	 * @param apnsStr {String} 用||分割的apns字符串,eg."APN_config0||APN_config1..."
	 * @param isIpv6 {Boolean} 是否为ipv6 apns字符串
	 */
	function getApnConfigs(apnsStr, isIpv6){
		var configs = [];
		var theApnConfigs = {};
		if(apnsStr && apnsStr.length > 10){
			var apnArr = apnsStr.split("||");
			for (var i = 0; i < apnArr.length; i++) {
				if (apnArr[i] != "") {
					var apnItem = parseApnItem(apnArr[i], isIpv6);
					configs.push(apnItem);
					
					theApnConfigs[apnItem.profileName] = apnItem;
				}
			}
		}
	
		if(isIpv6){
			ipv6ApnConfigs = theApnConfigs;
		}else{
			apnConfigs = theApnConfigs;
		}

		
		return configs;
	}
	/**
	 * 解析自动apn信息
	 * @method getAutoApns
	 * @param apnsStr {String} 用||分割的apns ipv4字符串
	 * @param apnsV6Str {String} 用||分割的apns ipv6字符串
	 */
	function getAutoApns(autoApnV4, autoApnV6){
		var autoApnsV4 = [];
		var autoApnsV6 = [];

		if(autoApnV4 && autoApnV4.length > 5){
			var apnArr = autoApnV4.split("||");
			for (var i = 0; i < apnArr.length; i++) {
				if (apnArr[i] != "") {
					var apnItem = parseApnItem(apnArr[i], false);
					autoApnsV4.push(apnItem);
				}
			}
		}
		if(autoApnV6 && autoApnV6.length > 5){
			var apnArr = autoApnV6.split("||");
			for (var i = 0; i < apnArr.length; i++) {
				if (apnArr[i] != "") {
					var apnItem = parseApnItem(apnArr[i], false);
					autoApnsV6.push(apnItem);
				}
			}
		}
		return dealAutoApnsV6(autoApnsV4, autoApnsV6);
	}
	/**
	 * 合并V4\V6自动apn信息
	 * @method dealAutoApnsV6
	 * @param v4 {Array} autoApnsV4字符串
	 * @param v6 {Array} autoApnsV6字符串
	 */	
	function dealAutoApnsV6(v4, v6){
		autoApnConfigs = {};
		var autoApns = []; 
		for(var i = 0; i < v4.length; i++){
			var apn = v4[i];
			var itemsV6 = v6[i];
			if(itemsV6 && (itemsV6.pdpType == 'IPv6' || itemsV6.pdpType == 'IPv4v6')){
				apn.wanApnV6 = itemsV6.wanApn;
				apn.authModeV6 = itemsV6.authMode;
				apn.usernameV6 = itemsV6.username;
				apn.passwordV6 = itemsV6.password;
				apn.dnsModeV6 = itemsV6.dnsMode;
				apn.dns1V6 = itemsV6.dns1;
				apn.dns2V6 = itemsV6.dns2;
			}
			autoApns.push(apn);
			autoApnConfigs[apn.profileName] = apn;
		}
		return autoApns;
	}

	/**
	 * 解析单条apn信息
	 * @method parseApnItem
	 * @param apnsStr {String} 用($)分割的apn字符串
	 */
	function parseApnItem(apnStr, isIpv6){
		var apn = {};
		var items = apnStr.split("($)");
		for(var i = 0; i < items.length; i++){
			apn.profileName = items[0];
			apn.pdpType = items[7];
			if(isIpv6){
                apn.wanApnV6 = items[1];
                apn.authModeV6 = items[4].toLowerCase();
                apn.usernameV6 = items[5];
                apn.passwordV6 = items[6];
                apn.dnsModeV6 = items[10];
                apn.dns1V6 = items[11];
                apn.dns2V6 = items[12];
			} else {
				apn.wanApn = items[1];
				apn.authMode = items[4].toLowerCase();
				apn.username = items[5];
				apn.password = items[6];
				apn.dnsMode = items[10];
				apn.dns1 = items[11];
				apn.dns2 = items[12];
			}
		}
		return apn;
	}
	
	function getProfileOptions(apns){
		return _.map(apns, function(item){
			return new Option(item.profileName, item.profileName);
		});
	}
    var versionData = service.getDeviceVersion();
    var infoData = service.getSystemStatus();
    var withoutSim = service.getSystemStatus().service_status != "ok";
	/**
	 * APNViewModel
	 * @class APNViewModel
	 */
	function APNViewModel(){
		var self = this;
		var getControlApn = service.getAllOnceDatas();
		var apnSettings = getApnSettings();
        if (apnSettings.apnNumPreset) {
            config.maxApnNumber = apnSettings.apnNumPreset;
        }
         var info = service.getStatusInfo();
        var isConnectFlag = info.connectStatus;
        self.CSRFToken = service.getToken().token;
        self.showApnItems = ko.observable(service.itemFuncMode(itemsFuncList.APN_MODE));
        self.showApnDns = ko.observable(config.SHOW_APN_DNS);
		self.index = ko.observable(apnSettings.currIndex);
        self.supportIPv6 = ko.observable(config.IPV6_SUPPORT);
        self.supportIpv4AndIpv6 = ko.observable(config.IPV4_AND_V6_SUPPORT);
        self.apnShowHomeDatas = ko.observable(false);

        if(getControlApn.login_enter_apn == "yes"){
        	self.apnShowHomeDatas(true);
        }
        self.rsrp = infoData.rsrp == "" ? "-" : infoData.rsrp;
        self.sinr = infoData.sinr == "" ? "-" : Math.round(+(infoData.sinr));
        self.cell_id_f = infoData.tz_lock_current_cellid;
        self.lte_bands = infoData.lte_band == "" ? "-" : infoData.lte_band;
        self.PhysCellId = infoData.phy_cell_id == "" ? "-" : infoData.phy_cell_id;
        self.sw_version = versionData.device_version;

		self.defApn = ko.observable(apnSettings.profileName);//当前APN
		self.apnMode = ko.observable(apnSettings.apnMode);
		self.autoProfiles = ko.observableArray(getProfileOptions(apnSettings.autoApnConfigs));
		self.profiles = ko.observableArray(getProfileOptions(apnSettings.apnConfigs));
		self.wanDial = ko.observable(apnSettings.wanDial);

		self.pdpTypes = ko.observableArray(getPdpTypes());
		self.selectedPdpType = ko.observable(apnSettings.pdpType);
		self.selectedPdpTypeTmp = ko.observable(apnSettings.pdpType);//the PdpType select's value before chang
		self.profileName = ko.observable(apnSettings.profileName);
		
		self.apn = ko.observable(apnSettings.wanApn);
		self.dnsMode = ko.observable(apnSettings.dnsMode == 'manual' ? 'manual' : 'auto');
		self.dns1 = ko.observable(apnSettings.dns1);
		self.dns2 = ko.observable(apnSettings.dns2);
		self.authModes = ko.observableArray(getAuthModes());
		self.username = ko.observable(apnSettings.username);
		self.password = ko.observable(apnSettings.password);
		self.noclickDelete = ko.observable(false);
		self.apnV6 = ko.observable(apnSettings.wanApnV6);
		self.dnsModeV6 = ko.observable(apnSettings.dnsModeV6 == 'manual' ? 'manual' : 'auto');
		self.dns1V6 = ko.observable(apnSettings.dns1V6);
		self.dns2V6 = ko.observable(apnSettings.dns2V6);
		self.authModesV6 = ko.observableArray(getAuthModes());
		self.usernameV6 = ko.observable(apnSettings.usernameV6);
		self.passwordV6 = ko.observable(apnSettings.passwordV6);
        self.pdpTypeNote = ko.observable(true);
		self.selectedProfile = ko.observable(apnSettings.profileName);
		if(apnSettings.autoApnConfigs && apnSettings.autoApnConfigs.length > 0){
			self.selectedAutoProfile = ko.observable(apnSettings.autoApnConfigs[0].profileName);
		}else{
			self.selectedAutoProfile = ko.observable();
		}
        // if(config.EMPTY_APN_SUPPORT) {
        //     $("#apn_ipv4_apn").removeClass("required");
        //     $("#apn_ipv6_apn").removeClass("required");
        // }else {
        //     $("#apn_ipv4_apn").addClass("required");
        //     $("#apn_ipv6_apn").addClass("required");
        // }
		self.selectedAuthentication = ko.observable(apnSettings.authMode);
		self.selectedAuthenticationV6 = ko.observable(apnSettings.authModeV6);
		
		self.disableProfile = ko.observable(false);//表示处于新增页面
		self.addApnHide = ko.observable(true);
		self.defaultCfg = ko.observable(true);
		self.addedDefaultCfg = ko.observable(false);
        self.transApn = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_ipv4_apn' : 'apn');
        self.transDnsMode = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_dns_mode_ipv4' : 'apn_dns_mode');
        self.transDns1 = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_dns1_ipv4' : 'apn_dns1');
        self.transDns2 = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_dns2_ipv4' : 'apn_dns2');
        self.transAuth = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_authentication_ipv4' : 'apn_authentication');
        self.transUserName = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_user_name_ipv4' : 'apn_user_name');
        self.transPassword = ko.observable(config.IPV4_AND_V6_SUPPORT ? 'apn_password_ipv4' : 'apn_password');

        self.transApnV6 = ko.observable('apn');
        self.transDnsModeV6 = ko.observable('apn_dns_mode');
        self.transDns1V6 = ko.observable('apn_dns1');
        self.transDns2V6 = ko.observable('apn_dns2');
        self.transAuthV6 = ko.observable('apn_authentication');
        self.transUserNameV6 = ko.observable('apn_user_name');
        self.transPasswordV6 = ko.observable('apn_password');

        service.bindCommonData(self);
        service.connectedHide();
		self.setDefaultVisible = ko.observable(!isConnectedNetWork());
		self.isConnectStatus = ko.observable(!isConnectedNetWork());

        self.tmp1 = ko.computed(function(){
            if (self.selectedPdpType() == "IP" || self.selectedPdpType() == "IPv4") {
                self.transApn('apn');
                self.transDnsMode('apn_dns_mode');
                self.transDns1('apn_dns1');
                self.transDns2('apn_dns2');
                self.transAuth('apn_authentication');
                self.transUserName('apn_user_name');
                self.transPassword('apn_password');
            } else if (self.selectedPdpType() == "IPv6") {
                self.transApnV6('apn');
                self.transDnsModeV6('apn_dns_mode');
                self.transDns1V6('apn_dns1');
                self.transDns2V6('apn_dns2');
                self.transAuthV6('apn_authentication');
                self.transUserNameV6('apn_user_name');
                self.transPasswordV6('apn_password');
            } else if (config.IPV4_AND_V6_SUPPORT && self.selectedPdpType() == 'IPv4v6') {
                self.transApn('apn_ipv4_apn');
                self.transDnsMode('apn_dns_mode_ipv4');
                self.transDns1('apn_dns1_ipv4');
                self.transDns2('apn_dns2_ipv4');
                self.transAuth('apn_authentication_ipv4');
                self.transUserName('apn_user_name_ipv4');
                self.transPassword('apn_password_ipv4');

                self.transApnV6('apn_ipv6_apn');
                self.transDnsModeV6('apn_dns_mode_ipv6');
                self.transDns1V6('apn_dns1_ipv6');
                self.transDns2V6('apn_dns2_ipv6');
                self.transAuthV6('apn_authentication_ipv6');
                self.transUserNameV6('apn_user_name_ipv6');
                self.transPasswordV6('apn_password_ipv6');
            } else { //config.IPV4V6_SUPPORT && self.selectedPdpType() == 'IPv4v6'
                self.transApn('apn');
                self.transDnsMode('apn_dns_mode');
                self.transDns1('apn_dns1');
                self.transDns2('apn_dns2');
                self.transAuth('apn_authentication');
                self.transUserName('apn_user_name');
                self.transPassword('apn_password');
            }
            $("#apn_setting_form").translate();
        });

        self.hasCapacity = ko.computed(function(){
            if(self.profiles().length >= config.maxApnNumber){
                return false;
            } else {
                return true;
            }
        });
        self.controlApn = ko.observable(false);
        if(getControlApn.control_apn_edit == "no"){
        	self.controlApn(true);
        }
		self.autoApnChecked = ko.computed(function(){
        		return self.apnMode() == "auto";
			
		});
		self.hideDelete = ko.computed(function(){
			if(self.apnMode() == "auto"){
				return false;
			}else{
				return true;
			}
		});
		self.hideAddNew = ko.computed(function(){
			if(self.apnMode() == "auto"){
				return false;
			}else{
				return true;
			}
		});
		self.showDns = ko.computed(function(){
			return self.dnsMode() == "manual";
		});
		
		self.showDnsV6 = ko.computed(function(){
			return self.dnsModeV6() == "manual";
		});
		self.controlApn2 = ko.observable(true);	
		self.controlApn3 = ko.observable(false);	
        checkDefaultProfileStatus();
		self.checkInputDisable = ko.computed(function(){
			if(getControlApn.control_apn_edit == "no"){

				self.controlApn3(true);
				self.controlApn2(false);
				return true;
			}
			
			if(self.apnMode() != "auto"){
				self.controlApn2(false);
				return false;
			}else{
				self.controlApn2(true);
			}
			// if(self.apnMode() != "auto" && !isConnectedNetWork() && self.addedDefaultCfg()){
			// 	return false;
			// }
			// if(self.apnMode() == "auto" || ((self.apnMode() != "auto" && self.defaultCfg() && !self.disableProfile()))){
			// 	return true;
			// }
			// if(self.apnMode() != "auto" && (!self.disableProfile() || !self.defaultCfg())){
			// 	return false;
			// }
			 return true;
			
		});
		var data = service.getDeviceInfo();
        self.pdpTypeChangeAlert = function() {
            if(self.pdpTypeNote()){
                showAlert({msg:"apn_pdptype_change_note", params: [data.lanDomain,data.ipAddress]});
            }
            if(self.apnMode() != "auto" && !self.disableProfile()){//如果是手动非ADD状态，切换PDP类型时，不改变界面显示的各项值
              
                if((config.IPV4_AND_V6_SUPPORT && self.selectedPdpTypeTmp() != 'IPv4v6' && self.selectedPdpType() != 'IPv4v6') || !config.IPV4_AND_V6_SUPPORT){//
                    if(self.selectedPdpTypeTmp() == 'IPv6'){//V6 -> V4 / V4V6
                        self.apn(self.apnV6());
                        self.dnsMode(self.dnsModeV6());
                        self.dns1(self.dns1V6());
                        self.dns2(self.dns2V6());
                        self.username(self.usernameV6());
                        self.password(self.passwordV6());
                        self.selectedAuthentication(self.selectedAuthenticationV6());			
                    } else if(self.selectedPdpType() == 'IPv6'){//V4 / V4V6 -> V6
                        self.apnV6(self.apn());
                        self.dnsModeV6(self.dnsMode());
                        self.dns1V6(self.dns1());
                        self.dns2V6(self.dns2());
                        self.usernameV6(self.username());
                        self.passwordV6(self.password());
                        self.selectedAuthenticationV6(self.selectedAuthentication());	
                    }
                }
            }
            self.selectedPdpTypeTmp(self.selectedPdpType());
        };

		self.showAutoApnDetail = ko.computed(function(){
			if(self.apnMode() == "auto"){
				return self.autoProfiles().length > 0;
			} else {
				return true;
			}
		});

		/**
		 * profile change 事件处理
		 * @event profileChangeHandler
		 */
        self.profileChangeHandler = function(data, event) {
            self.pdpTypeNote(true);
            if(self.apnMode() != 'manual'){
                return true;
            }
            var cfg = self.getSelectedManualProfile();
            self.setUIData(cfg);
            checkDefaultProfileStatus();
            return true;
        };

		/**
		 * auto apn profile change 事件处理
		 * @event autoProfileChangeHandler
		 */
		self.autoProfileChangeHandler = function(data, event) {
			if(self.apnMode() != 'auto'){
				return true;
			}
			var cfg = autoApnConfigs[self.selectedAutoProfile()];
			self.setUIData(cfg);
			checkDefaultProfileStatus();
			return true;
		};



		//切换profile时重置下面的显示项
		self.setUIData = function(data){
			clearValidateMsg('#apn_setting_form');
			if(!data){
				return;
			}
			self.selectedPdpType(data.pdpType || 'IP');
			self.selectedPdpTypeTmp(data.pdpType || 'IP');
			self.profileName(data.profileName);

			self.apn(data.wanApn);
			self.dnsMode(data.dnsMode != 'manual' ? 'auto' : 'manual');
			self.dns1(data.dns1);
			self.dns2(data.dns2);
			self.username(data.username);
			self.password(data.password);
			self.selectedAuthentication(data.authMode || 'none');
			
			self.apnV6(data.wanApnV6);
			self.dnsModeV6(data.dnsModeV6 != 'manual' ? 'auto' : 'manual');
			self.dns1V6(data.dns1V6);
			self.dns2V6(data.dns2V6);
			self.usernameV6(data.usernameV6);
			self.passwordV6(data.passwordV6);
			self.selectedAuthenticationV6(data.authModeV6 || 'none');
		};
        self.autoProfileChangeHandler();
		/**
		 * 设置默认apn状态
		 * @method checkDefaultProfileStatus
		 */
		function checkDefaultProfileStatus(){
			var index = getProfileIndex();
			//默认apn不允许编辑
			// if(index < config.defaultApnSize || self.selectedProfile() == self.defApn()){
			if(index < config.defaultApnSize || self.selectedProfile() == self.defApn()){
				self.defaultCfg(true);
			}else{
				self.defaultCfg(false);
			}
			
            // if(!(index < config.defaultApnSize) && self.selectedProfile() == self.defApn()){
            if(!(index < config.defaultApnSize) && self.selectedProfile() == self.defApn()){
				self.addedDefaultCfg(true);//用户手动增加的设为默认的APN
			}else{
				self.addedDefaultCfg(false);
			}
		}
		/**
		 * APN mode change 事件处理
		 * @event apnModeChangeHandler
		 */
		self.apnModeChangeHandler = function(data, event) {
			if(self.apnMode() == 'auto'){
				if(self.showAutoApnDetail()){
					self.autoProfileChangeHandler();
				}
			} else {
				self.profileChangeHandler();
			}
			return true;
		};

		/**
		 * 设置为默认apn
		 * @event setDefaultAct
		 */
		self.setDefaultAct = function(){
            var info = service.getStatusInfo();
            self.isConnectStatus(checkConnectedStatus(info.connectStatus));
            if (checkConnectedStatus(info.connectStatus)) {
                showConfirm("diconneted_network_confirm", function () {
                    showLoading('disconnecting');
                    service.disconnect({
                        CSRFToken: self.CSRFToken
                    }, function(data) {
                        if(data.result){
                            config.connect_flag = true;
                            setDefault();
                        }else{
                            errorOverlay();
                        }
                    });
                });
            }else{
                setDefault();
            }
		};
		
		self.doConnect = function () {
            showLoading('connecting');
            service.connect({}, function (data) {
                if (data.result) {
                   showConfirm("confirm_data_effect", function () {
			                showLoading("restarting");
		            		service.restart({}, function (data) {
		                		if (data && data.result == "success") {
		                    		successOverlay();
		                		} else {
		                    		errorOverlay();
		                		}
		            		}, $.noop);
			            });
                } else {
                    errorOverlay();
                }
            });
        }

        function setDefault() {
            if(!self.selectedProfile()){
                showAlert("apn_no_select_alert");
                return false;
            }
            var connectStatus = service.getConnectionInfo().connectStatus;
            if (checkConnectedStatus(connectStatus)) {
                showAlert({msg: "apn_cant_modify_status", params:[$.i18n.prop("connected").toLowerCase()]});
                return false;
            } else if (connectStatus == "ppp_disconnecting") {
                showAlert({msg: "apn_cant_modify_status", params:[$.i18n.prop("disconnecting").toLowerCase()]});
                return false;
            } else if (connectStatus == "ppp_connecting") {
                showAlert({msg: "apn_cant_modify_status", params:[$.i18n.prop("connecting").toLowerCase()]});
                return false;
            }
            if(self.apnMode() == 'auto' || self.defaultCfg()){
                showLoading();
                doSetDefaultAct();
            } else {
                if($('#apn_setting_form').valid()){
                    var exist = false;
                    $.each(self.profiles(), function (i, e) {
                        if (e.value == self.profileName()) {
                            exist = true;
                        }
                    });
                    if (exist && self.selectedProfile() != self.profileName()) {
                        showInfo("apn_save_profile_exist");
                        return false;
                    }
                    showLoading();
                    editApn(function () {
                        doSetDefaultAct();
                    });
                }else{
                    $(".error:first", "#apn_setting_form").focus();
                }
            }
        }
		
        function doSetDefaultAct(){
            var index = 0;
            if(self.apnMode() == 'auto'){
                index = getAutoApnIndex();
                self.selectedAutoProfile($("#autoProfile").val());
            } else {
                index = getApnIndex();
                self.selectedProfile($("#profile").val());
            }
            var selectedProfileDetail = self.getSelectedManualProfile();
            service.setDefaultApn({
                index : index,
                apnMode : self.apnMode(),
                pdpType : selectedProfileDetail.pdpType,

                profileName: selectedProfileDetail.profileName,
                wanApn : selectedProfileDetail.wanApn,
                authMode : selectedProfileDetail.authMode,
                username : selectedProfileDetail.username,
                password : selectedProfileDetail.password,
                dnsMode : config.SHOW_APN_DNS?selectedProfileDetail.dnsMode:'auto',
                dns1 : config.SHOW_APN_DNS?selectedProfileDetail.dns1:'',
                dns2 : config.SHOW_APN_DNS?selectedProfileDetail.dns2:''
            }, function(data) {
                if(data.result){
					var apnModeChange;
                    addTimeout(function(){
                    	init(true);
                        self.apnModeChangeHandler();
                        if(isConnectFlag == 'ppp_connected'){
                        	setTimeout(function(){
                        		self.doConnect();
                        	},6000)
                        }else{
                        	 showConfirm("confirm_data_effect", function () {
			                showLoading("restarting");
		            		service.restart({}, function (data) {
		                		if (data && data.result == "success") {
		                    		successOverlay();
		                		} else {
		                    		errorOverlay();
		                		}
		            		}, $.noop);
			            });
                        }
                        
                    }, self.apnMode() == 'auto' ? 5000 : 500);
					if(config.connect_flag == true){
						//service.scanRegist();
					}else{config.connect_flag = false;}
                } else {
                    errorOverlay();
                }
            }, function(data) {
                errorOverlay();
            });
        }

        self.getSelectedManualProfile = function(){
            var cfg = {};
            var profileVal = $("#profile").val();
            if(typeof self.selectedProfile() == 'undefined'){
                self.selectedProfile(profileVal);
            }
            var cfgV4 = apnConfigs[profileVal];
            var cfgV6 = ipv6ApnConfigs[profileVal];
            if(cfgV4 && cfgV6){
                if(!!cfgV4.pdpType){
                    $.extend(cfg, cfgV6);
                    $.extend(cfg, cfgV4);
                } else {
                    $.extend(cfg, cfgV4);
                    $.extend(cfg, cfgV6);
                }
            } else if(cfgV4 && !cfgV6){
                $.extend(cfg, cfgV4);
            }
            return cfg;
        };
		
		
		/**
		 * 获取apn索引
		 * @method getApnIndex
		 */
		function getApnIndex(){
			var opts = $("#profile option");
			for(var i = 0; i < opts.length; i++){
				if(opts[i].value == self.selectedProfile()){
					return i;
				}
			}
			return opts.length - 1;
		}
		/**
		 * 获取自动apn索引
		 * @method getAutoApnIndex
		 */
		function getAutoApnIndex(){
			var opts = $("#autoProfile option");
			for(var i = 0; i < opts.length; i++){
				if(opts[i].value == self.selectedAutoProfile()){
					return i;
				}
			}
			return opts.length - 1;
		}
		
		/**
		 * 保存APN设置信息
		 * @event saveAct
		 */
        self.saveAct = function(){
            if(!$('#apn_setting_form').valid()) {
                return false;
            }			
			if(!self.selectedProfile() && !self.disableProfile()){//不是增加时的设置需要判断是否选择了Profile
				showAlert("apn_no_select_alert");
				return false;
			}
			var exist = false;
			$.each(self.profiles(), function(i, e){
				if(e.value == self.profileName()){
					exist = true;
				}
			});
			
			if(self.disableProfile() == true){
				if($("#profile option").length >= config.maxApnNumber){
					showInfo({msg: "apn_profile_full", params: [config.maxApnNumber]});
					return false;
				}
				if(exist){
					showInfo("apn_save_profile_exist");
					return false;
				}
				var info = service.getStatusInfo();
				self.isConnectStatus(checkConnectedStatus(info.connectStatus));
				if (checkConnectedStatus(info.connectStatus)) {
					showConfirm("diconneted_network_confirm", function () {
					showLoading('disconnecting');
						service.disconnect({
                            CSRFToken: self.CSRFToken
                        }, function(data) {
							if(data.result){
								config.connect_flag = true;
								addNewApn();
							}else{
								errorOverlay();
							}
						});
					});
				}else{
					addNewApn();
				}
			}else{
				if(exist && self.selectedProfile() != self.profileName()){
					showInfo("apn_save_profile_exist");
					return false;
				}
				editApn();
			}
		};

		/**
		 * 新增APN信息
		 * @event addNewApn
		 */
		function addNewApn(){
			showLoading();
            var optionLen = $("option", "#profile").length;
            if(optionLen < config.defaultApnSize){
                errorOverlay();
                return;
            }
            // 支持IPv4v6，并且选择IPv4v6时，IPv4 与 IPv6下发相同的信息
            // 支持IPv4 & v6，并且选择IPv4v6时，IPv4 与 IPv6下发各自的信息
            var sameInfo = false;
            if (config.IPV4V6_SUPPORT && self.selectedPdpType() == 'IPv4v6') {
                sameInfo = true;
            }
			service.addOrEditApn({
				profileName: self.profileName(),
				pdpType: self.selectedPdpType(),
				index: optionLen,

                wanApn: self.apn(),
                authMode: self.selectedAuthentication(),
                username: self.username(),
                password: self.password(),
                dnsMode: config.SHOW_APN_DNS ? self.dnsMode() : 'auto',
                dns1: config.SHOW_APN_DNS ? self.dns1() : '',
                dns2: config.SHOW_APN_DNS ? self.dns2() : '',

                wanApnV6: sameInfo ? self.apn() : self.apnV6(),
                authModeV6: sameInfo ? self.selectedAuthentication() : self.selectedAuthenticationV6(),
                usernameV6: sameInfo ? self.username() : self.usernameV6(),
                passwordV6: sameInfo ? self.password() : self.passwordV6(),
                dnsModeV6: config.SHOW_APN_DNS ? (sameInfo ? self.dnsMode() : self.dnsModeV6()) : 'auto',
                dns1V6: config.SHOW_APN_DNS ? (sameInfo ? self.dns1() : self.dns1V6()) : '',
                dns2V6: config.SHOW_APN_DNS ? (sameInfo ? self.dns2() : self.dns2V6()) : ''
			}, function(data) {
                if(data.result){
                    apnSettings = getApnSettings();
                    if(self.profileName() != self.selectedProfile()){
                        var newProfileName = self.profileName();
                        self.profiles(getProfileOptions(apnSettings.apnConfigs));
                        $('#profile').val(newProfileName).trigger('change');
                    }
                    doSetDefaultAct();
                } else {
                    errorOverlay();
                }
            }, function(data) {
				errorOverlay();
			});
		}

		/**
		 * 编辑APN信息
		 * @event editApn
		 */
		function editApn(cb){
            var preAct = $.isFunction(cb);
            if(!preAct){
                showLoading();
            }
            if(self.selectedProfile() == self.defApn() && preAct){//if(self.selectedProfile() == self.defApn()){
                if(preAct){
                    cb();
                }else{
                    errorOverlay("apn_cant_modify_current");
                }
                return false;
			}
            var apnIndex = getApnIndex();
            // if(apnIndex < config.defaultApnSize){
            //     errorOverlay();
            //     return;
            // }
            var sameInfo = false;
            if (config.IPV4V6_SUPPORT && self.selectedPdpType() == 'IPv4v6') {
                sameInfo = true;
            }
			var editDefault = self.defaultCfg() ? true : false;
			service.addOrEditApn({
				profileName: self.profileName(),
				pdpType: self.selectedPdpType(),
				index: apnIndex,

                wanApn: self.apn(),
                authMode: self.selectedAuthentication(),
                username: self.username(),
                password: self.password(),
                dnsMode: config.SHOW_APN_DNS ? self.dnsMode() : 'auto',
                dns1: config.SHOW_APN_DNS ? self.dns1() : '',
                dns2: config.SHOW_APN_DNS ? self.dns2() : '',

                wanApnV6: sameInfo ? self.apn() : self.apnV6(),
                authModeV6: sameInfo ? self.selectedAuthentication() : self.selectedAuthenticationV6(),
                usernameV6: sameInfo ? self.username() : self.usernameV6(),
                passwordV6: sameInfo ? self.password() : self.passwordV6(),
                dnsModeV6: config.SHOW_APN_DNS ? (sameInfo ? self.dnsMode() : self.dnsModeV6()) : 'auto',
                dns1V6: config.SHOW_APN_DNS ? (sameInfo ? self.dns1() : self.dns1V6()) : '',
                dns2V6: config.SHOW_APN_DNS ? (sameInfo ? self.dns2() : self.dns2V6()) : ''
			}, function(data) {
				if(data.result){
                    apnSettings = getApnSettings();
                    if(self.profileName() != self.selectedProfile()){
                        var newProfileName = self.profileName();
                        self.profiles(getProfileOptions(apnSettings.apnConfigs));
                        $('#profile').val(newProfileName).trigger('change');
                    }
                    if(preAct){
                        cb();
                    } else {
                        if(editDefault){
                            doSetDefaultAct();
                        }else{
                            successOverlay();
                        }
                    }
				} else {
					errorOverlay();
				}
			}, function(data) {
				errorOverlay();
			});
		}

		var tempApn = {};
		/**
		 * 进入新增APN页面
		 * @event addAct
		 */
		self.addAct = function(){
			clearValidateMsg('#apn_setting_form');
			self.pdpTypeNote(true);
			$("#addAct").hide();
			self.noclickDelete(true);
			self.disableProfile(true);
			self.addApnHide(true);
			tempApn = {
				profileName : self.profileName(),
				selectedPdpType : self.selectedPdpType(),
				
				wanApn : self.apn(),
				dnsMode : config.SHOW_APN_DNS?self.dnsMode():'auto',
				dns1 : config.SHOW_APN_DNS?self.dns1():'',
				dns2 : config.SHOW_APN_DNS?self.dns2():'',
				authMode : self.selectedAuthentication(),
				username : self.username(),
				password : self.password(),
				
				wanApnV6 : self.apnV6(),
				dnsModeV6 : config.SHOW_APN_DNS?self.dnsModeV6():'auto',
				dns1V6 : config.SHOW_APN_DNS?self.dns1V6():'',
				dns2V6 : config.SHOW_APN_DNS?self.dns2V6():'',
				authModeV6 : self.selectedAuthenticationV6(),
				usernameV6 : self.usernameV6(),
				passwordV6 : self.passwordV6()
			};
			self.profileName("");
			self.selectedPdpType("IP");
			self.selectedPdpTypeTmp("IP");
			
			self.apn("");
			self.dnsMode("auto");
			self.dns1("");
			self.dns2("");
			self.selectedAuthentication("none");
			self.username("");
			self.password("");
			
			self.apnV6("");
			self.dnsModeV6("auto");
			self.dns1V6("");
			self.dns2V6("");
			self.selectedAuthenticationV6("none");
			self.usernameV6("");
			self.passwordV6("");
		};

		/**
		 * 取消新增APN
		 * @event cancelAddAct
		 */
		self.cancelAddAct = function(){
			clearValidateMsg('#apn_setting_form');
			self.pdpTypeNote(false);
			$("#addAct").show();	
			self.disableProfile(false);
			self.noclickDelete(false);
			self.addApnHide(false);
			self.profileName(tempApn.profileName);
			self.selectedPdpType(tempApn.selectedPdpType);
			self.selectedPdpTypeTmp(tempApn.selectedPdpType);
			
			self.apn(tempApn.wanApn);
			self.dnsMode(tempApn.dnsMode);
			self.dns1(tempApn.dns1);
			self.dns2(tempApn.dns2);
			self.selectedAuthentication(tempApn.authMode);
			self.username(tempApn.username);
			self.password(tempApn.password);

			self.apnV6(tempApn.wanApnV6);
			self.dnsModeV6(tempApn.dnsModeV6);
			self.dns1V6(tempApn.dns1V6);
			self.dns2V6(tempApn.dns2V6);
			self.selectedAuthenticationV6(tempApn.authModeV6);
			self.usernameV6(tempApn.usernameV6);
			self.passwordV6(tempApn.passwordV6);
		};

		/**
		 * 删除APN
		 * @event deleteAct
		 */
		self.deleteAct = function(){
			if(!self.selectedProfile()){
				showAlert("apn_no_select_alert");
				return false;
			}
			var i = getProfileIndex();
			// if(i < config.defaultApnSize){//默认apn不允许删除
			// 	errorOverlay("apn_delete_cant_delete_default");
			// 	return false;
			// }
			
			var opts = $("#profile option");
			for(var i=0;i<opts.length;i++){
				if(opts[0].value == self.profileName()){
					errorOverlay("apn_delete_cant_delete_default");
					return false;
				}
				
			}
			if(getApnSettings().profileName == self.profileName()){
				errorOverlay("apn_cant_delete_current");
				return false;
			}
			
			showConfirm("apn_delete_confirm", function(){
                showLoading('deleting');
				service.deleteApn({
					index: getApnIndex()
				}, function(data){
					if(data.result){
						self.profiles(getProfileOptions(getApnSettings().apnConfigs));
                        self.selectedProfile(self.defApn());
                        self.profileChangeHandler();
						successOverlay();
					} else {
						errorOverlay();
					}
				}, function(data){
					errorOverlay();
				});
			});
		};
		
		function getProfileIndex(){
			var opts = $("#profile").find("option");
			if(opts.length == 0){
				opts = self.profiles();
			}
			var i = 0;
			for(; i < opts.length; i++){
				if(opts[i].value == self.profileName()){
					break;
				}
			}
			return i;
		}

    }

	/**
	 * 是否已联网
	 * @method isConnectedNetWork
	 */
	function isConnectedNetWork(){
		var info = service.getConnectionInfo();
		return checkConnectedStatus(info.connectStatus);
	}

    function initVar(){
        apnConfigs = {};
        ipv6ApnConfigs = {};
        autoApnConfigs = {};
    }

	/**
	 * 初始化ViewModel
	 * @method init
	 */
	function init(formInit) {
	    if(this.init){
            getRightNav(CONNECTION_SETTINGS_COMMON_URL);
            getTabsNav(SETTINGS_APN_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        initVar();
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new APNViewModel();
		ko.applyBindings(vm, container[0]);

        if(!formInit){
            addInterval(function () {
                vm.setDefaultVisible(!isConnectedNetWork());
            }, 1000);
        }

		$('#apn_setting_form').validate({
			submitHandler : function() {
				vm.saveAct();
			},
			rules:{
				profile_name : 'apn_profile_name_check',
				apn_ipv4_apn : 'apn_check',
				apn_dns1_ipv4 : "ipv4",
				apn_dns2_ipv4 : "ipv4",
				apn_ipv6_apn : 'apn_check',
				apn_dns1_ipv6 : "ipv6",
				apn_dns2_ipv6 : "ipv6",
				apn_user_name_ipv4 : 'ppp_username_check',
				apn_password_ipv4 : 'ppp_password_check',
				apn_user_name_ipv6 : 'ppp_username_check',
				apn_password_ipv6 : 'ppp_password_check'
			}
		});
	}

	return {
		init : init
	};
});