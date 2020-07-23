/**
 * AP Station模块
 * @module AP Station
 * @class AP Station
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var isWifi = false;
        /**
         * AP Station ViewModel
         * @class apModel
         */
        function apModel() {
            var self = this;
            self.hasMultiSSID = config.HAS_MULTI_SSID;
            self.hasAPStation = config.AP_STATION_SUPPORT;
            self.hasWifiSwitch = config.WIFI_SWITCH_SUPPORT;
			self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
			
            var securityModes = _.map(config.AUTH_MODES_ALL, function (item) {
                return new Option(item.name, item.value);
            });
            /**
             * 当前页面标识  list列表页 add添加页面  edit编辑页面
             * @object page
             */
            self.page = {list:1, add:2, edit:3};
            /**
             * WiFi热点列表列的配置项
             * @object gridColumn
             */
            var gridColumn = [
                { columnType:"radio", headerTextTrans:"option",rowText:"profileName", width:"10%" },
                { headerTextTrans:"ssid_title", rowText:"ssid", width:"30%" },
                { columnType:"image", headerTextTrans:"signal", rowText:"imgSignal", width:"30%" },
                { headerTextTrans:"security_mode", rowText:"authMode_show", width:"30%" }
            ];
            /**
             * 搜索到的WiFi热点列表列的配置项
             * @object searchGridColumn
             */
            var searchGridColumn = [
                { columnType:"radio", rowText:"index", width:"10%" },
                { headerTextTrans:"ssid_title", rowText:"ssid", width:"30%" },
                { columnType:"image", headerTextTrans:"signal", rowText:"imgSignal", width:"30%" },
                { headerTextTrans:"security_mode", rowText:"authMode_show", width:"30%" }
            ];

            self.pageState = ko.observable(self.page.list);

            var info = service.getAPStationBasic();

            self.origin_ap_station_enable = info.ap_station_enable;
            self.ap_station_enable = ko.observable(info.ap_station_enable);
            self.ap_station_mode = ko.observable(info.ap_station_mode);
            self.origin_ap_station_mode = info.ap_station_mode;
            self.apList = ko.observable([]);
            if (self.origin_ap_station_enable == "1") {
                var apList = service.getHotspotList();
                self.apList(fixHotspotList(apList.hotspotList));
            }

            self.apSearchList = ko.observable([]);

            self.connectButtonStatus = ko.observable("disable");
            self.hasSelectFromUser = ko.observable();
            self.showPassword = ko.observable(false);
			
			self.isCableMode = ko.observable();
			
            var infoBasic = service.getWifiBasic();
            self.wifi_enable = ko.observable(infoBasic.wifi_enable);
			
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
            self.multi_ssid_enable = ko.observable(infoBasic.multi_ssid_enable);
			
            /**
             * 密码显示事件
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
             * 密码显示事件
             * @event showWPAPasswordHandler
             */					
            self.showWPAPasswordHandler = function () {
                $("#pwdWepKey").parent().find(".error").hide();
                $("#pwdWPAKey").parent().find(".error").hide();
                if ($("#showWPAPassword").is(":checked")) {
                    self.showPassword(true);
                } else {
                    self.showPassword(false);
                }
            };

            /**
             * 计算并设置按钮的状态
             * @method computeButtonState
             */
            function computeButtonState() {
                var profileName = self.apGrid.radioSelectValue();
                if (!profileName) {
                    self.hasSelectFromUser(false);
                    self.connectButtonStatus("disable");
                    return;
                }

                var status = "";
                var fromProvider = "";
                for (var i = 0; i < self.apList().length; i++) {
                    var item = self.apList()[i];
                    if (item.profileName == profileName) {
                        status = item.connectStatus;
                        fromProvider = item.fromProvider;
                        break;
                    }
                }

                if (status == "1") {
                    self.connectButtonStatus("hide");
                    self.hasSelectFromUser(false);
                } else {
                    var btnStatus = (self.origin_ap_station_mode == "dial_pref") ? "disable" : "show";
                    if (btnStatus == "disable") {
                        var info = service.getStatusInfo();
                        var networkType = info.networkType.toLowerCase();
                        if (networkType == '' || networkType == 'limited_service' || networkType == 'no_service') {
                            btnStatus = "show";
                        }
                    }
                    self.connectButtonStatus(btnStatus);
                    self.hasSelectFromUser(fromProvider == "0");
                }
            }
            /**
             * 列表模板创建
             * @object apGrid
             */
            self.apGrid = new ko.simpleGrid.viewModel({
                data:self.apList(),
                idName:"profileName",
                columns:gridColumn,
                pageSize:100,
                tmplType:'list',
                primaryColumn:"fromProvider",
                radioClickHandler:function () {
                    computeButtonState();
                }
            });
            /**
             * 热点搜索结果列表模板创建
             * @object apSearchGrid
             */
            self.apSearchGrid = new ko.simpleGrid.viewModel({
                data:self.apSearchList(),
                idName:"index",
                columns:searchGridColumn,
                pageSize:100,
                tmplType:'list',
                radioClickHandler:function () {
                    var index = self.apSearchGrid.radioSelectValue();
                    var aplist = self.apSearchList();
                    for (var i = 0; i < aplist.length; i++) {
                        var item = aplist[i];
                        if (item.index == index) {
                            self.profileName("");
                            self.ssid(item.ssid);
                            self.signal(item.signal);
                            self.authMode(item.authMode);
                            self.password(item.password);
                            self.mac(item.mac);
                            if (item.authMode == "WPAPSK" || item.authMode == "WPA2PSK" || item.authMode == "WPAPSKWPA2PSK") {
                                self.encryptType_WPA(item.encryptType);
                            } else {
                                self.encryptType(item.encryptType);
                            }
                            self.keyID(item.keyID);
							renderCustomElement($("#cipherGroup"));
                            break;
                        }
                    }
                }
            });

            /**
             * 计算并设置当前连接和按钮的状态
             * @method computeConnectStatus
             *
             */
            self.computeConnectStatus = function () {
                computeButtonState();

                var networkStatus = self.connectStatus();
                if (checkConnectedStatus(networkStatus)) {
                    self.current_status_trans("ap_station_wan_connected");
                    self.current_status_text($.i18n.prop("ap_station_wan_connected"));
                    return;
                }

                var ssid = self.connectWifiSSID();
                var wifiStatus = self.connectWifiStatus();
                if (ssid && wifiStatus == "connect") {
                    self.current_status_trans("ap_station_wlan_connected");
                    self.current_status_text($.i18n.prop("ap_station_wlan_connected"));
                    return;
                }

                self.current_status_trans("ap_station_no_connection");
                self.current_status_text($.i18n.prop("ap_station_no_connection"));
            };

            var statusInfo = service.getStatusInfo();
            self.networkType = ko.observable(statusInfo.networkType);
            self.networkOperator = ko.observable(statusInfo.networkOperator);
            self.connectStatus = ko.observable(statusInfo.connectStatus);
            self.connectWifiStatus = ko.observable(statusInfo.connectWifiStatus);
            self.connectWifiProfile = ko.observable(statusInfo.connectWifiProfile);
            self.connectWifiSSID = ko.observable(statusInfo.connectWifiSSID);

            self.current_status_trans = ko.observable("");
            self.current_status_text = ko.observable("");
            self.current_status = ko.computed(function () {
                self.computeConnectStatus()
            });

            self.modes = securityModes;
            self.profileName = ko.observable("");
            self.ssid = ko.observable();
            self.signal = ko.observable("0");
            self.authMode = ko.observable();
            self.password = ko.observable();
            self.encryptType = ko.observable();
            self.encryptType_WPA = ko.observable("TKIPCCMP");
            self.keyID = ko.observable("0");
            self.mac = ko.observable();

            /**
             * 打开添加页面
             * @event openAddPage
             */
            self.openAddPage = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                self.clear();
                getSearchHotspot();
            };

            /**
             * 打开基本设置页面
             * @event openAddPage
             */
            self.openListPage = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                self.clear();
                self.pageState(self.page.list);
                self.apGrid.data(self.apList());
                self.computeConnectStatus();
            };

            /**
             * 添加热点
             * @event addHotspot
             *
             */
            self.addHotspot = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                if (self.pageState() == self.page.add && self.apList().length >= config.AP_STATION_LIST_LENGTH) {
                    showAlert({msg:"ap_station_exceed_list_max", params:config.AP_STATION_LIST_LENGTH});
                    return;
                }
                showLoading('waiting');
                var para = {};
                var profileName = self.apGrid.radioSelectValue();
                para.profileName = self.profileName();
                para.ssid = self.ssid();
                para.signal = self.signal();
                para.authMode = self.authMode();
                para.password = self.password();
                if (para.authMode == "WPAPSK" || para.authMode == "WPA2PSK" || para.authMode == "WPAPSKWPA2PSK") {
                    para.encryptType = self.encryptType_WPA();
                } else if (para.authMode == "SHARED") {
                    para.encryptType = "WEP";
                } else {
                    para.encryptType = self.encryptType();
                }
                para.keyID = self.keyID();
                para.mac = self.mac() == "" ? "0F:00:00:00:00:00" : self.mac();
                para.apList = self.apList();
                service.saveHotspot(para, function (data) {
                    self.callback(data, true);
                });
            };

            /**
             * 删除热点
             * @event deleteHotspot
             *
             */
            self.deleteHotspot = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                showConfirm("confirm_data_delete", function () {
                    var para = {};
                    para.profileName = self.apGrid.radioSelectValue();
                    para.apList = self.apList();
                    showLoading('waiting');
                    service.deleteHotspot(para, function (data) {
                        self.callback(data, true);
                    });
                });
            };

            /**
             * 打开编辑页面
             * @event openEditPage
             *
             */
            self.openEditPage = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                var profileName = self.apGrid.radioSelectValue();
                var aplist = self.apList();
                for (var i = 0; i < aplist.length; i++) {
                    var item = aplist[i];
                    if (item.profileName == profileName) {
                        self.profileName(profileName);
                        self.ssid(item.ssid);
                        self.signal(item.signal);
                        self.authMode(item.authMode);
                        self.password(item.password);
                        self.mac(item.mac);
                        if (item.authMode == "WPAPSK" || item.authMode == "WPA2PSK" || item.authMode == "WPAPSKWPA2PSK") {
                            self.encryptType_WPA(item.encryptType);
                        } else {
                            self.encryptType(item.encryptType);
                        }
                        self.keyID(item.keyID);
                    }
                }
                self.pageState(self.page.edit);
            };

            /**
             * 连接热点
             * @event connectHotspot
             *
             */
            self.connectHotspot = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                var profileName = self.apGrid.radioSelectValue();
                var apList = self.apList();

                /**
                 * 将用户选中的那个profile放在运营商定制profile下面第一位
                 */
                function refreshApList(profile, aplist){
                    var apListPre = [];
                    var apListLeft = [];
                    for (var i = 0; i < aplist.length; i++) {
                        if (aplist[i].fromProvider == "1") {
                            apListPre.push(apList[i])
                        }else{
                            if(aplist[i].profileName == profile){
                                apListPre.push(apList[i]);
                            }else{
                                apListLeft.push(apList[i]);
                            }
                        }
                    }
                    var apListNew = apListPre.concat(apListLeft);
                    service.saveHotspot({apList : apListNew}, function(data){
                        if (data && data.result == "success"){
                            apList = apListNew;
                            self.apList(fixHotspotList(apList));
                        } 
                    });
                }

                function connect() {
                    showLoading("connecting");
                    var para = {};
                    var connectIndex = -1;
                    var ssid = "";
                    for (var i = 0; i < apList.length; i++) {
                        if (apList[i].profileName == profileName) {
                            connectIndex = i;
                            ssid = apList[i].ssid;
                            para.EX_SSID1 = apList[i].ssid;
                            para.EX_AuthMode = apList[i].authMode;
                            para.EX_EncrypType = apList[i].encryptType;
                            para.EX_DefaultKeyID = apList[i].keyID;
                            para.EX_WEPKEY = apList[i].password;
                            para.EX_WPAPSK1 = apList[i].password;
                            para.EX_wifi_profile = apList[i].profileName;
                            para.EX_mac = apList[i].mac;
                            break;
                        }
                    }

                    self.connectWifiSSID(ssid);
                    self.connectWifiStatus("connecting");
                    self.apGrid.setRadioSelect(profileName);
                    self.connectButtonStatus("disable");

                    service.connectHotspot(para, function (data) {
                        if (data && data.result == "success") {
                            self.connectButtonStatus("disable");
                            //有时会出现取得的状态不是最新的，所以延迟检测状态
                            addTimeout(checkWifiStatus, 3000);
                        } else if(data && data.result == "processing"){
                            showAlert("ap_station_processing");
                        } else {
                            apList[connectIndex].connectStatus = "0";
                            self.connectButtonStatus("show");
                            self.connectWifiStatus("disconnect");
                            hideLoading();
                            errorOverlay();
                        }
                        var apList = service.getHotspotList();
                        self.apList(fixHotspotList(apList.hotspotList));
                        self.connectWifiSSID(ssid);
                        self.connectWifiProfile(profileName);
                        self.apGrid.data([]);
                        self.apGrid.data(self.apList());
                        self.apGrid.setRadioSelect(profileName);
                    });
                }

                var count = 0;
                var connectStatus = false;

                function checkWifiStatus() {
                    count = count + 1;
                    if (count > 60) {
                        hideLoading();
                        errorOverlay();
                        return;
                    }
                    if (!connectStatus) {
                        var status = service.getStatusInfo();
                        if(status.connectWifiStatus == "connect"){
                            connectStatus = true;
                        } else {
                            addTimeout(checkWifiStatus, 1000);
                        }
                    }
                    if (connectStatus) {
                        //继续判断profile中连接状态是否为1
                        service.getHotspotList({}, function (data) {
                            for (var i = 0, len = data.hotspotList.length; i < len; i++) {
                                var item = data.hotspotList[i];
                                if (item.profileName == profileName) {
                                    if (item.connectStatus == "1") {
                                        hideLoading();
                                        return;
                                    }else{
										var errorMsg = {msg: 'ap_connect_error', params: [item.ssid]};
										showAlert(errorMsg);
										return;
									}
                                    break;
                                }
                            }						
                            addTimeout(checkWifiStatus, 1000);
                        });
                    }
                }

                var status = service.getStatusInfo();
                if (status.connectStatus == "ppp_connecting" || checkConnectedStatus(status.connectStatus)) {
                    showConfirm("ap_station_connect_change_alert", function () {
                        showLoading();
						connect();
                    });
                } else {
                    connect();
                }

            };

            /**
             * 断开连接
             * @event 断开连接
             *
             */
            self.disconnectHotspot = function () {
                if (wpsOnCheck()) {
                    return;
                }
                showLoading('disconnecting');
                service.disconnectHotspot({}, function (data) {
                    self.callback(data, true);
                })
            };

            /**
             * 刷新搜到的热点列表
             * @event searchHotspot
             *
             */
            self.searchHotspot = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }
                getSearchHotspot();
            };

            /**
             * 获取搜到的热点列表
             * @method getSearchHotspot
             *
             */
            function getSearchHotspot() {
                var count = 0;

                function search() {
                    var result = service.getSearchHotspotList();
                    if (result.scan_finish != "0") {
                        if("2" == result.scan_finish){
                            hideLoading();
                            showAlert("ap_station_processing");
                        }else{
                            self.apSearchList(fixHotspotList(result.hotspotList));
                            self.apSearchGrid.data(self.apSearchList());
                            hideLoading();                            
                        }
                    } else {
                        if (count <= 60) {
                            count = count + 1;
                            addTimeout(search, 1000);
                        } else {
                            hideLoading();
                            showAlert("ap_station_search_hotspot_fail");
                        }
                    }
                }

                showLoading('scanning');
                service.searchHotspot({}, function (data) {
                    if (data && data.result == "success") {
						if(self.pageState() != self.page.add){
							self.pageState(self.page.add);
						}
                        search();
                    } else if(data && data.result == "processing"){
						hideLoading();
                        showAlert("ap_station_processing");
					} else {
						if(self.pageState() != self.page.add){
							self.pageState(self.page.add);
						}
                        hideLoading();
                        showAlert("ap_station_search_hotspot_fail");
                    }
                });
            }

            /**
             * 清除编辑页面的信息
             * @event clear
             *
             */
            self.clear = function () {
                self.apSearchGrid.clearRadioSelect();
                self.profileName("");
                self.ssid("");
                self.signal("0");
                self.authMode("OPEN");
                self.password("");
                self.encryptType("NONE");
                self.encryptType_WPA("TKIPCCMP");
                self.keyID("0");
                self.mac("");
            };

            /**
             * 设置AP station参数
             * @event clear
             *
             */
            self.apply = function () {
                if (wifiClosedCheck()) {
                    return;
                }
				if (wpsOnCheck()) {
                    return;
                }

                function setBasic(){
                    showLoading('waiting');
                    var para = {};
                    para.ap_station_enable = self.ap_station_enable();
                    para.ap_station_mode = self.ap_station_mode();
                    service.setAPStationBasic(para, function (data) {
                        if(self.origin_ap_station_enable == self.ap_station_enable()){
                            self.callback(data, true);
                        }else{
                            self.callback2(data, true);
                        }                        
                    });
                    service.refreshAPStationStatus();
                }
                if(config.HAS_MULTI_SSID){
                    var infoBasic = service.getWifiBasic();
                    if(self.ap_station_enable() == "1" && infoBasic.multi_ssid_enable == "1"){
                        showConfirm("ap_station_enable_confirm", setBasic);
                    }else{
                        setBasic();
                    }
                } else {
                    setBasic();
                }
            };			
			
            /**
             * 和服务器交互时的回调，wifi不重启的情况
             * @event callback
             *
             */
            self.callback = function (data, isInitPage) {
                if (data) {
                    if (isInitPage) {
                        init();
                        $("#apList").translate();
                    }
                    if (data.result == "success") {
                        successOverlay();
                    } else if (data.result == "spot_connecting" || data.result == "spot_connected") {
                        showAlert("ap_station_update_fail");
                    } else if(data.result == "processing"){
						showAlert("ap_station_processing");
					} else if(data.result == "exist"){
						showAlert("ap_station_exist");
					} else {
                        errorOverlay();
                    }
                } else {
                    errorOverlay();
                }
            }
			
			/**
             * 和服务器交互时的回调,wifi会重启的情况
             * @event callback
             *
             */
            self.callback2 = function (data, isInitPage) {
                if (data) {					
                        if(isWifi){
							setTimeout(function () {
                    	        if (data.result == "success") {
							        successOverlay();
									setTimeout(function () {
                                        window.location.reload();
                                    }, 1000);
								    clearTimer();
							        clearValidateMsg();
								    init();
								} else if (data.result == "spot_connecting" || data.result == "spot_connected") {
								    showAlert("ap_station_update_fail");
								} else if (data.result == "processing") {
								    showAlert("ap_station_processing");
								} else {
								    errorOverlay();
								}
                            }, 15000);							
						}else{
							addInterval(function(){
							    var info = service.getWifiBasic();
							    if(info.wifi_enable == "1"){
							    	clearTimer();
							    	clearValidateMsg();
							    	init();
							    	$("#apList").translate();
							    	if (data.result == "success") {
							        	successOverlay();
								    } else if (data.result == "spot_connecting" || data.result == "spot_connected") {
								    	showAlert("ap_station_update_fail");
								    } else {
								    	errorOverlay();
								    }
							    }
						    }, 1000);	
						}	 
                } else {
                    errorOverlay();
                }
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
				var status = service.getWpsInfo();
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
         * 处理热点列表内容，以便在表格显示
         * @method callback
         *
         */
        function fixHotspotList(list) {
            var fixedList = [];
            for (var i = 0; i < list.length; i++) {
                list[i].index = i;
                var imageUrl = "";
                if (list[i].connectStatus == "1") {
                    if (list[i].authMode.toLowerCase() == "open" && list[i].encryptType.toLowerCase() == "none") {
                        imageUrl = "img/wifi_connected.png";
                    } else {
                        imageUrl = "img/wifi_lock_connected.png";
                    }
                } else {
                    if (list[i].authMode.toLowerCase() == "open" && list[i].encryptType.toLowerCase() == "none") {
                        imageUrl = "img/wifi_signal_" + list[i].signal + ".png";
                    } else {
                        imageUrl = "img/wifi_lock_signal_" + list[i].signal + ".png";
                    }
                }
                list[i].imgSignal = imageUrl;
                list[i].authMode_show = $.i18n.prop("ap_station_security_mode_" + list[i].authMode );
            }
            return list;
        }

        /**
         * 检测wifi是否关闭，关闭时提示
         * @method callback
         *
         */
        function wifiClosedCheck() {
            var info = service.getWpsInfo();
            if (info.radioFlag == "0") {
                showAlert('wps_wifi_off');
                return true;
            }
        }
		
		/**
         * 检测WPS是否激活，激活时提示
         * @method callback
         *
         */
		function wpsOnCheck() {
            var info = service.getWpsInfo();
			if (info.wpsFlag == '1') {
                showAlert('wps_on_info');
                return true;
            }	
        }
		

        /**
         * 设置页面的元素是否可用
         * @method callback
         *
         */
        function setPageDisabled(disablePage) {
            if (disablePage) {
                $('#frmAPStation :input').each(function () {
                    $(this).attr("disabled", true);
                });
                clearValidateMsg();
            } else {
                $("#frmAPStation :input[id!='btnDelete'][id!='btnEdit'][id!='btnConnect']").each(function () {
                    $(this).attr("disabled", false);
                });
            }
        }

        function bindEvents(vm){
            $("#showPassword").change(function(){
                vm.showPasswordHandler();
            });
            $("#showWPAPassword").change(function(){
                vm.showWPAPasswordHandler();
            });
        }
		
		function checkConnectedDevice(){
			service.getParams({nv: 'user_ip_addr'}, function (dataIp) {
				service.getParams({nv: 'station_list'}, function (dataList) {
					isWifi = isWifiConnected(dataIp.user_ip_addr, dataList.station_list);
				});
			});
		}

        /**
         * 初始化ViewModel并进行绑定
         * @method init
         */
        function init() {
            var container = $('#container')[0];
            ko.cleanNode(container);
            var vm = new apModel();
            ko.applyBindings(vm, container);
            bindEvents(vm);

            function refreshPage(initPage) {
                var info = service.getStatusInfo();
                if (info.multi_ssid_enable == "1") {
                 //   
                } else {
                    vm.isCableMode(checkCableMode(info.blc_wan_mode));
                    vm.networkType(info.networkType);
                    vm.connectStatus(info.connectStatus);
                    vm.connectWifiProfile(info.connectWifiProfile);
                    vm.connectWifiSSID(info.connectWifiSSID);
                    vm.connectWifiStatus(info.connectWifiStatus);
                    vm.computeConnectStatus();

                    service.getHotspotList({}, function (data) {
                        var list = fixHotspotList(data.hotspotList);
                        vm.apList(list);
						var gripList = vm.apGrid.data();
                        if(list.length > 0 && list[0].connectStatus == "1" && list[0].profileName != gripList[0].profileName){
                            vm.apGrid.data([]);
                            vm.apGrid.data(vm.apList());
                            vm.apGrid.setRadioSelect(list[0].profileName);
                        }
                        renderCustomElement($("#apList"));
                        var radios = $("input[type='radio']", "#apList").each(function () {
                            for (var i = 0, len = list.length; i < len; i++) {
                                if (list[i].profileName == $(this).val()) {
                                    var img = $(this).parent().parent().find("img")[0];
                                    img.src = list[i].imgSignal;
                                    if (initPage) {
                                        if (list[i].connectStatus == "1") {
                                            vm.hasSelectFromUser(false);
                                            vm.connectButtonStatus("disable");
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
            }

            refreshPage(true);
            clearTimer();
            addInterval(function () {
                refreshPage(false);
				checkConnectedDevice();
            }, 1000);
			
			$('#frmWifiSwitch').validate({
				submitHandler:function () {
                    vm.setMultiSSIDSwitch();
                }
			});

            $("#frmAPStation").validate({
                submitHandler:function () {
                    vm.addHotspot();
                },
                rules:{
                    txtSSID:"ssid_ap"
                },
                errorPlacement:function (error, element) {
                    var id = element.attr("id");
                    if (id == "pwdWepKey" || id == "txtWepKey") {
                        error.insertAfter("#lblShowPassword");
                    } else if (id == "pwdWPAKey" || id == "txtWPAKey") {
                        error.insertAfter("#lblshowWPAPassword");
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
        }

        return {
            init:init
        }
    });
