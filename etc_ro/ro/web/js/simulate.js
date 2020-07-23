define(['underscore', 'config/config', 'smsData'],function (_, config, smsData) {
    console.log(33333);
    var phonebookSize = 10 + getRandomInt(30);
    var phoneNumbers = smsData.getPhoneNumbers();
    var phonebook_sim_max = 50;
    var phonebook_sim_used = 0;
    var phonebook_device_max = 100;
    var phonebook_device_used = 0;
    var sms_nv_capability_used = 0;
    var smsReady = false;
    var smsArr = {
    		messages : []
    	};
	var sntpAutoFlag = false;
    
    var simulate = {
		simulateRequest:function (params, successCallback, errorCallback, async, isPost) {
            if (!!isPost) {
                if (params.goformId == "PBM_CONTACT_ADD") {
                    savePhoneBook(params);
                } else if (params.goformId == "PBM_CONTACT_DEL") {
                    dealPhoneBookDelete(params);
                } else if (params.goformId == "LOGIN") {
                    return login(params);
                } else if (params.goformId == "LOGOUT") {
                    return logout();
                } else if (params.goformId == "ENTER_PIN"){
                    return validatePIN(params);
                }else if (params.goformId == "ENTER_PUK"){
                   return validatePUK(params);
                }else if (params.goformId == "APN_PROC" || params.goformId == "APN_PROC_EX"){
                	if (params.apn_action == 'set_default'){
                		setDefaultApn(params);
                	} else if (params.apn_action == 'delete') {
                		deleteApn(params);
                	} else if (params.apn_action == 'save') {
                		addOrEditApn(params);
                	}
                	return {
                        result:'success'
                    };
                }else if (params.goformId == "ALL_DELETE_SMS"){
                	smsArr.messages = [];
                	smsData.deleteAllSmsData();
                	return {
                        result:'success'
                    };
                }else if (params.goformId == "DELETE_SMS"){
                	deleteMessage(params);
                	return {
                		result:'success'
                	};
                } else if (params.goformId == "SET_MSG_READ"){
                	setSmsRead(params);
	            	return {result:'success'};
	            } else if (params.goformId == "CHANGE_PASSWORD") {
                    return validatePassword(params);
                } else if (params.goformId == "ENABLE_PIN") {
                    return enablePin(params);
                } else if (params.goformId == "DISABLE_PIN") {
                    return disablePin(params);
                } else if (params.goformId == "SEND_SMS") {
                	sendSms(params);
                    return {
                		result:'success'
                	};
                } else if (params.goformId == "SAVE_SMS") {
					saveSms(params);
					return {
						result:'success'
					};
				} else if(params.goformId == "FW_FORWARD_DEL") {
                    var indexs = params.delete_id.split(';');
                    _.each(indexs, function(item) {
                    	simulate["PortForwardRules_" + item] = '';
                    });
                } else if(params.goformId == "FW_FORWARD_ADD") {
                    var result = '';
                    for(var i = 0; i < 10; i++) {
                        if(this["PortForwardRules_" + i] == '') {
                            result = params.ipAddress + ',' + params.portStart + ',' + params.portEnd + ',' + transForFilter(params.protocol) + ',' + params.comment;
                            this["PortForwardRules_" + i] = result;
                            break;
                        }
                    }
                } else if(params.goformId == "ADD_IP_PORT_FILETER") {
                    var result = '';
                    for(var i = 0; i < 10; i++) {
                        if(this["IPPortFilterRules_" + i] == '') {
                            result = params.sip_address + ',' + '1,' + params.sFromPort + ',' + params.sToPort + ',' + params.dip_address + ',' + '5,' + params.dFromPort + ',' + params.dToPort + ',' + transForFilter(params.protocol) + ',' + transAction(params.action) + ',' + params.comment + ',' + params.mac_address;
                            this["IPPortFilterRules_" + i] = result;
                            break;
                        }
                    }
                } else if(params.goformId == "ADD_IP_PORT_FILETER_V4V6") {
                    var result = '';
                    if(params.ip_version == 'ipv4') {
                        for(var i = 0; i < 10; i++) {
                            if(this["IPPortFilterRules_" + i] == '') {
                                result = params.sip_address + ',' + '1,' + params.sFromPort + ',' + params.sToPort + ',' + params.dip_address + ',' + '5,' + params.dFromPort + ',' + params.dToPort + ',' + transForFilter(params.protocol) + ',' + transAction(params.action) + ',' + params.comment + ',' + params.mac_address;
                                this["IPPortFilterRules_" + i] = result;
                                break;
                            }
                        }
                    } else {
                        for(var i = 0; i < 10; i++) {
                            if(this["IPPortFilterRulesv6_" + i] == '') {
                                result = params.sip_address + ',' + '1,' + params.sFromPort + ',' + params.sToPort + ',' + params.dip_address + ',' + '5,' + params.dFromPort + ',' + params.dToPort + ',' + transForFilter(params.protocol) + ',' + transAction(params.action) + ',' + params.comment + ',' + params.mac_address;
                                this["IPPortFilterRulesv6_" + i] = result;
                                break;
                            }
                        }
                    }
                } else if(params.goformId == "DEL_IP_PORT_FILETER") {
                    var indexs = params.delete_id.split(';');
                    _.each(indexs, function(item) {
                    	simulate["IPPortFilterRules_" + item] = '';
                    });
                } else if(params.goformId == "DEL_IP_PORT_FILETER_V4V6") {
                    var indexs = params.delete_id.split(';');
                    _.each(indexs, function(item) {
                        simulate["IPPortFilterRules_" + item] = '';
                    });

                    var indexsv6 = params.delete_id_v6.split(';');
                    _.each(indexsv6, function(item) {
                        simulate["IPPortFilterRulesv6_" + item] = '';
                    });
                }
                else if(params.goformId == "HTTPSHARE_MODE_SET"){
                	setSdCardMode(params);
                } else if(params.goformId == "GOFORM_HTTPSHARE_CHECK_FILE"){
                	return {result: "noexist"};
                } else if (params.goformId == "QUICK_SETUP") {
                    quickSetup(params);
                } else if (params.goformId == "QUICK_SETUP_EX") {
                    quickSetupExtend(params);
	            } else if(params.goformId == "HTTPSHARE_ENTERFOLD"){
	                return getFileList(params);
	            } else if(params.goformId == 'HTTPSHARE_FILE_RENAME'){
	            	fileRename(params);
	            } else if(params.goformId == 'HTTPSHARE_DEL'){
                    this.dlna_scan_state = "1";
	            	deleteFilesAndFolders(params);
	            } else if(params.goformId == 'HTTPSHARE_NEW'){
	            	createFolder(params);
	            } else if(params.goformId == 'UPNP_SETTING') {
                    this.upnpEnabled = params.upnp_setting_option;
                } else if(params.goformId == 'FW_SYS') {
                    this.RemoteManagement = params.remoteManagementEnabled;
                    this.WANPingFilter = params.pingFrmWANFilterEnabled;
                } else if(params.goformId == 'DMZ_SETTING') {
                    this.DMZEnable = params.DMZEnabled;
                    this.DMZIPAddress = params.DMZIPAddress;
                } else if(params.goformId == 'DHCP_SETTING') {
                    this.dhcpEnabled = params.lanDhcpType == "SERVER"? "1" : "0";
                    this.lan_ipaddr = params.lanIp;
                    this.lan_netmask = params.lanNetmask;
                    if(this.dhcpEnabled == "1") {
                        this.dhcpStart = params.dhcpStart;
                        this.dhcpEnd = params.dhcpEnd;
                        this.dhcpLease_hour = params.dhcpLease;
                    }
                } else if(params.goformId == "BASIC_SETTING") {
                    this.IPPortFilterEnable  = params.portFilterEnabled;
                    this.DefaultFirewallPolicy = params.defaultFirewallPolicy;
                } else if(params.goformId == "ADD_PORT_MAP") {
                    this.PortMapEnable = params.portMapEnabled;
                    if(params.ip_address) {
                        var result = '';
                        for(var i = 0; i < 10; i++) {
                            if(this["PortMapRules_" + i] == '') {
                                result = params.ip_address + ','  + params.fromPort + ',' + params.toPort + ',' + transForFilter(params.protocol) + ',' + params.comment;
                                this["PortMapRules_" + i] = result;
                                break;
                            }
                        }
                    }
                } else if(params.goformId == "DEL_PORT_MAP") {
                    var indexs = params.delete_id.split(';');
                    _.each(indexs, function(item) {
                        simulate["PortMapRules_" + item] = '';
                    });
                } else if(params.goformId == "WIFI_WPS_SET") {
                    this.wps_type = params.wps_mode;
                    this.wpsFlag = "1";
                    this.WscModeOption = "1";
                    setTimeout(function() {
                        this.wpsFlag = "0";
                        this.WscModeOption = "0";
                    }, 15000);
                } else if(params.goformId == "SET_BEARER_PREFERENCE") {
                    this.net_select = params.BearerPreference;
                } else if(params.goformId == "SET_WIFI_SSID1_SETTINGS") {
                    console.log(222222);
                    this.SSID1 = params.ssid;
                    this.HideSSID = params.broadcastSsidEnabled;
                    if(config.PASSWORD_ENCODE){
                        this.WPAPSK1_encode = params.passphrase;
                    }else{
                        this.WPAPSK1 = params.passphrase;
                    }
                    this.AuthMode = params.security_mode;
                    this.MAX_Access_num = params.MAX_Access_num;
					this.NoForwarding = params.NoForwarding;
					this.EncrypType = params.EncrypType;
                    if(this.AuthMode == "OPEN") {
                        //this.EncrypType = "NONE";
						params.security_shared_modethis == "WEP" ? this.EncrypType = "WEP" : this.EncrypType = "NONE";
                    }else if(this.AuthMode =="WPA2PSK"){
                        this.EncrypType = "CCMP";
                    } else if(this.AuthMode == "SHARED"){
						this.EncrypType = "WEP";
					} else{
                        this.EncrypType = "TKIPCCMP";
                    }
                } else if(params.goformId == "SET_WIFI_SSID3_SETTINGS") {
                    this.SSID3 = params.ssid;
                    this.HideSSID3 = params.broadcastSsidEnabled;
                    if(config.PASSWORD_ENCODE){
                        this.WPAPSK3_encode = params.passphrase2;
                    }else{
                        this.WPAPSK3 = params.passphrase2;
                    }
                    this.AuthMode3 = params.security_mode;
                    this.MAX_Access_num3 = params.MAX_Access_num;
                    this.NoForwarding = params.NoForwarding;
                    this.EncrypType3 = params.EncrypType3;
                    if(this.AuthMode == "OPEN") {
                        //this.EncrypType = "NONE";
                        params.security_shared_modethis == "WEP" ? this.EncrypType3= "WEP" : this.EncrypType3 = "NONE";
                    }else if(this.AuthMode3 =="WPA2PSK"){
                        this.EncrypType3 = "CCMP";
                    } else if(this.AuthMode3 == "SHARED"){
                        this.EncrypType3 = "WEP";
                    } else{
                        this.EncrypType3 = "TKIPCCMP";
                    }
                } else if(params.goformId == "SET_WIFI_SSID4_SETTINGS") {
                    this.SSID2 = params.ssid;
                    this.HideSSID2 = params.broadcastSsidEnabled;
                    if(config.PASSWORD_ENCODE){
                        this.WPAPSK2_encode = params.passphrase;
                    }else{
                        this.WPAPSK2 = params.passphrase;
                    }
                    this.AuthMode2 = params.security_mode;
                    this.MAX_Access_num2 = params.MAX_Access_num;
                    this.NoForwarding = params.NoForwarding;
                    this.EncrypType2 = params.EncrypType2;
                    if(this.AuthMode == "OPEN") {
                        //this.EncrypType = "NONE";
                        params.security_shared_modethis == "WEP" ? this.EncrypType2 = "WEP" : this.EncrypType2 = "NONE";
                    }else if(this.AuthMode2 =="WPA2PSK"){
                        this.EncrypType2 = "CCMP";
                    } else if(this.AuthMode2 == "SHARED"){
                        this.EncrypType2 = "WEP";
                    } else{
                        this.EncrypType2 = "TKIPCCMP";
                    }
                } else if(params.goformId == "SET_WIFI_SSID5_SETTINGS") {
                    this.SSID4 = params.ssid;
                    this.HideSSID4 = params.broadcastSsidEnabled;
                    if(config.PASSWORD_ENCODE){
                        this.WPAPSK4_encode = params.passphrase;
                    }else{
                        this.WPAPSK4 = params.passphrase;
                    }
                    this.AuthMode4 = params.security_mode;
                    this.MAX_Access_num4 = params.MAX_Access_num;
                    this.NoForwarding = params.NoForwarding;
                    this.EncrypType4 = params.EncrypType4;
                    if(this.AuthMode == "OPEN") {
                        //this.EncrypType = "NONE";
                        params.security_shared_modethis == "WEP" ? this.EncrypType4 = "WEP" : this.EncrypType4 = "NONE";
                    }else if(this.AuthMode4 =="WPA2PSK"){
                        this.EncrypType4 = "CCMP";
                    } else if(this.AuthMode4 == "SHARED"){
                        this.EncrypType4 = "WEP";
                    } else{
                        this.EncrypType4 = "TKIPCCMP";
                    }
                } else if(params.goformId == "SET_WIFI_SSID2_SETTINGS"){
                    this.m_SSID = params.m_SSID;
                    this.m_HideSSID = params.m_HideSSID;
                    if(config.PASSWORD_ENCODE){
                        this.m_WPAPSK1_encode = params.m_WPAPSK1;
                    }else{
                        this.m_WPAPSK1 = params.m_WPAPSK1;
                    }
                    this.m_AuthMode = params.m_AuthMode;
                    this.m_MAX_Access_num = params.m_MAX_Access_num;
					this.m_NoForwarding = params.m_NoForwarding;
					this.m_EncrypType = params.m_EncrypType;
                    
                } else if(params.goformId == "SET_WIFI_INFO") {
					if(config.WIFI_SWITCH_SUPPORT && typeof params.wifiEnabled != "undefined") {
						this.RadioOff = params.wifiEnabled;
					}
					
                    if (params.m_ssid_enable) {
                        this.m_ssid_enable = params.m_ssid_enable;
                    } else {
                        //WirelessMode,CountryCode,Channel,HT_MCS,MAX_Access_num
                        this.WirelessMode = params.wifiMode;
                        this.CountryCode = params.countryCode;
                        this.Channel = params.selectedChannel;
						if(params.abg_rate){
							this.HT_MCS = params.abg_rate;
						}
						if(params.wifi_11n_cap){
							this.wifi_11n_cap = params.wifi_11n_cap;
						}
                        if(params.MAX_Access_num){
                            this.MAX_Access_num = params.MAX_Access_num;
                        }
                        if(params.m_MAX_Access_num){
                            this.m_MAX_Access_num = params.m_MAX_Access_num;
                        }
						if(params.wifi_band){
							this.wifi_band = params.wifi_band;
						}
                    }
                } else if (params.goformId == "SET_MESSAGE_CENTER"){
                	setSmsSetting(params);
                } else if (params.goformId == "CONNECT_NETWORK"){
                	this.ppp_status = "ppp_connecting";
                	setTimeout(function(){
                        disconnectHotspot();
                		simulate.ppp_status = "ppp_connected";
                	}, (getRandomInt(5)+1) * 1000);
                } else if (params.goformId == "DISCONNECT_NETWORK"){
                	this.ppp_status = "ppp_disconnecting";
                	setTimeout(function(){
                		simulate.ppp_status = "ppp_disconnected";
                	}, (getRandomInt(5)+1) * 1000);
                } else if(params.goformId == "DLNA_SETTINGS") {
                    $.extend(this, params);
                    this.dlna_rescan_end = "1";
                } else if(params.goformId == "DLNA_RESCAN") {
                    this.dlna_rescan_end = "1";
                    this.dlna_scan_state = "0";
                }else if(params.goformId =="UNLOCK_NETWORK"){
                    if(params.unlock_network_code == simulate.unlock_code){
                        simulate.unlock_nck_time = 5;
                        setTimeout(function(){
                            simulate.modem_main_state = 'modem_init_complete';
                        }, 4000);
                        return {result:'success'};
                    }else{
                        simulate.unlock_nck_time = simulate.unlock_nck_time -1;
                        return {result:'failure'};
                    }
                }else if(params.goformId == "WIFI_SPOT_PROFILE_UPDATE"){
                    updateHotspot(params);
                }else if(params.goformId == "WLAN_SET_STA_CON"){
                    connectHotspot(params);
                }else if(params.goformId == "WLAN_SET_STA_DISCON"){
                    disconnectHotspot(params);
                }else if(params.goformId == "OPERATION_MODE"){
					simulate.blc_wan_mode = params.opMode;
                    setOpmsWanMode(params.opMode)
				}else if(params.goformId == "WAN_GATEWAYMODE_PPPOE"){
					simulate.pppoe_dial_mode = params.dial_mode;
					simulate.pppoe_username = params.pppoe_username;
					simulate.pppoe_password = params.pppoe_password;
					if(params.dial_mode == "manual_dial") {
						if(params.action_link == "connect") {
							this.ppp_status = "ppp_connecting";
							setTimeout(function(){
								disconnectHotspot();
								simulate.ppp_status = "ppp_connected";
							}, (getRandomInt(5)+1) * 1000);
						}else {
							this.ppp_status = "ppp_disconnecting";
							setTimeout(function(){
								simulate.ppp_status = "ppp_disconnected";
							}, (getRandomInt(5)+1) * 1000);
						}
					}
					setEthWanMode("PPPOE");
                    //setOpmsWanMode("PPPOE");
				}else if(params.goformId == "WAN_GATEWAYMODE_STATIC"){
					simulate.static_wan_ipaddr = params.static_wan_ipaddr,
					simulate.static_wan_netmask =  params.static_wan_netmask,
					simulate.static_wan_gateway =  params.static_wan_gateway,
					simulate.static_wan_primary_dns =  params.static_wan_primary_dns,
					simulate.static_wan_secondary_dns =  params.static_wan_secondary_dns
					setEthWanMode("STATIC");
                    //setOpmsWanMode("PPPOE");				
				}else if(params.goformId == "WAN_GATEWAYMODE_DHCP"){
					setEthWanMode("DHCP");
                    //setOpmsWanMode("PPPOE");
				}else if(params.goformId == "WAN_GATEWAYMODE_AUTO"){
					simulate.pppoe_username = params.pppoe_username;
					simulate.pppoe_password = params.pppoe_password;
					setEthWanMode("AUTO");
                    //setOpmsWanMode("PPPOE");
				}else if(params.goformId == "SNTP") {
					simulate.syn_done = "";
					simulate.sntp_year = params.time_year;
					simulate.sntp_month = params.time_month;
					simulate.sntp_day = params.time_day;
					simulate.sntp_hour = params.time_hour;
					simulate.sntp_minute = params.time_minute;
					simulate.sntp_time_set_mode = params.manualsettime;
					simulate.sntp_server0 = params.sntp_server1_ip;
					simulate.sntp_server1 = params.sntp_server2_ip;
					simulate.sntp_server2 = params.sntp_server3_ip;
					simulate.sntp_other_server0 = params.sntp_other_server0;
					simulate.sntp_other_server1 = params.sntp_other_server1;
					simulate.sntp_other_server2 = params.sntp_other_server2;
					simulate.sntp_timezone = params.timezone;
					simulate.sntp_timezone_index = params.sntp_timezone_index;
					simulate.sntp_dst_enable = params.DaylightEnabled;
					if(simulate.sntp_time_set_mode == "auto"){
						setTimeout(function(){
							if(sntpAutoFlag) {
								simulate.syn_done = "1";
								sntpAutoFlag = false;
							} else {
								simulate.syn_done = "0";
								sntpAutoFlag = true;
							}
						}, 2000);
					}
				} else if(params.goformId == "URL_FILTER_ADD"){
					if(simulate.websURLFilters == "") {
						simulate.websURLFilters = params.addURLFilter;
					} else {
						simulate.websURLFilters +=  (";" + params.addURLFilter);
					}
				} else if(params.goformId == "URL_FILTER_DELETE"){
					var tempArray = params.url_filter_delete_id.split(";");
					var simulateArray = simulate.websURLFilters.split(";");
					for(var i = (tempArray.length - 2); i >= 0 ; i--){
						simulateArray.splice(tempArray[i], 1);
					}
					simulate.websURLFilters = simulateArray.join(";");
				} else if(params.goformId == "SYSLOG") {
					simulate.syslog_mode =  params.syslog_mode;
					simulate.debug_level = params.syslog_flag == "open" ? "7" : "";
				} else if(params.goformId == "setTR069Config") {
					simulate.tr069_ServerURL = params.serverURL;
					simulate.tr069_ServerUsername = params.serverusername;
					simulate.tr069_ServerPassword = params.serveruserpassword;
					simulate.tr069_ConnectionRequestUname = params.connrequestname;
					simulate.tr069_ConnectionRequestPassword = params.connrequestpassword;
					simulate.tr069_CPEPortNo = params.tr069_CPEPortNo;
				} else if (params.goformId == "SIP_PROC1") {
					simulate.voip_sip_register_server1 = params.voip_sip_register_server;
					simulate.voip_sip_domain1 =  params.voip_sip_domain;
					simulate.voip_sip_realm1 = params.voip_sip_realm;
					simulate.voip_sip_proxy_enable1 = params.voip_sip_proxy_enable;
					simulate.voip_sip_proxy_server1 = params.voip_sip_proxy_server;
					simulate.voip_account_display_account1 = params.voip_account_display_account1;
					simulate.voip_account_auth1 = params.voip_account_auth1;
					simulate.voip_account_password1 = params.voip_account_password1;		
					simulate.voip_user1_register_status = "register_connecting";
				} else if (params.goformId == "SIP_ADV_PROC1") {
                    simulate.voip_sip_t38_enable1 = params.voip_sip_t38_enable;
                    simulate.voip_sip_dtmf_method =  params.voip_sip_dtmf_method;
                    simulate.voip_sip_encoder1 = params.voip_sip_encoder;
                    simulate.voip_sip_vad_enable1 = params.voip_sip_vad_enable1;
                    simulate.voip_sip_cng_enable1 = params.voip_sip_cng_enable1;
                }else if (params.goformId == "SIP_SUPPLEMENTARY1") {
                    simulate.voip_forwarding_model = params.voip_forwarding_mode;
                    simulate.voip_forwarding_uri1 =  params.voip_forwarding_uri;
                    simulate.voip_not_disturb_enable = params.voip_not_disturb_enable;
                    simulate.voip_call_waiting_in_enable = params.voip_call_waiting_in_enable;
                } else if (params.goformId == "ADD_DEVICE"){
                    addChildGroup(params);
                } else if (params.goformId == "DEL_DEVICE"){
                    removeChildGroup(params);
                } else if (params.goformId == "EDIT_HOSTNAME"){
                    editHostName(params);
                } else if (params.goformId == "REMOVE_WHITE_SITE"){
                    removeSiteWhite(params);
                } else if (params.goformId == "ADD_WHITE_SITE"){
                    addSiteWhite(params);
                } else if (params.goformId == "SAVE_TIME_LIMITED"){
                    saveTimeLimited(params);
                } else if (params.goformId == "SAVE_TSW"){
                    saveTsw(params);
                } else if (params.goformId == "SET_NETWORK"){
                    setNetwork(params);
                } else if (params.goformId == "FLOW_CALIBRATION_MANUAL"){
                    trafficCalibration(params);
                } else {
                    $.extend(this, params);
                }

                return {
                    result:'success'
                };
            } else {
                var result = {};
                if (params.cmd == "pbm_data_total" || params.cmd == "pbm_data_info") {
                    result = getPhoneBook(params);
                    return { "pbm_data":result };
                }else if(params.cmd == "pbm_capacity_info"){
                    return getPhoneCapacity(params);
                } else if (params.cmd == "pbm_write_flag") {
                    return {pbm_write_flag:simulate.pbm_write_flag};
                } else if (params.cmd == "pbm_init_flag") {
                    return {pbm_init_flag:simulate.pbm_init_flag};
                } else if (params.cmd == "restore_flag") {
                    result = String(getRandomInt(3));
                    return { "restore_flag":result };
                } else if(params.cmd == "sms_data_total" || params.cmd == 'sms_page_data'){
                	return getAllSmsMessages(params);
                } else if(params.cmd == "ConnectionMode") {
                    return {
                        connectionMode: this.ConnectionMode,
                        autoConnectWhenRoaming: this.roam_setting_option
                    };
                } else if(params.cmd == "sms_cmd_status_info"){
                	if(params.sms_cmd == 1){
                		return {sms_cmd_status_result: "3"};
                	}
                	return {
                		sms_cmd_status_result: "3" //smsStatusInfo()
                	};
                } else if(params.cmd == 'HTTPSHARE_GETCARD_VALUE'){
                	return {sd_card_total_size: getRandomInt(99000), sd_card_avi_space: getRandomInt(10000)};
                } else if(params.cmd == "sms_parameter_info") {
                	return getSmsSetting();
                } else if(params.cmd == 'sms_capacity_info'){
                	return getSmsCapability();
                } else if(params.cmd == 'GetUpgAutoSetting'){
                    return simulate.GetUpgAutoSetting;
                } else if (params.cmd == 'fota_new_version_state') {
                    return {fota_new_version_state: simulate.fota_new_version_state};
                }  else if (params.cmd == 'fota_package_already_download') {
                    return {fota_package_already_download: simulate.fota_package_already_download};
                }  else if (params.cmd == 'update_info') {
                    return simulate.update_info;
                } else if (params.cmd == "pack_size_info") {
                    this.pack_size_info.download_size = simulate.pack_size_info.download_size + 10000;
                    if (this.pack_size_info.download_size >= simulate.pack_size_info.pack_total_size) {
                        this.pack_size_info.download_size = simulate.pack_size_info.pack_total_size;
                        if (this.fota_current_upgrade_state == "upgrading") {
                            this.fota_current_upgrade_state = "upgrade_prepare_install";
                            window.setTimeout(function () {
                                simulate.fota_current_upgrade_state = "ota_update_success";
                                simulate.fota_new_version_state = "0";
                                simulate.upgrade_result = "success";
                            }, 5000)
                        }
                    }
                    return this.pack_size_info;
                } else if (params.cmd == 'current_network'){
                    return getCurrentNetwork();
                }

                if (params.multi_data) {
                    var keys = params.cmd.split(",");
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        if(key == 'blc_wan_mode'){
                            result[keys[i]] = getOpmsWanMode();
                        } else if(key == 'ethwan_mode'){
							result[keys[i]] = getEthWanMode();
						}else {
                            result[keys[i]] = this[keys[i]];
                        }
                    }
                    return result;
                } else {
                	result[params.cmd] = this[params.cmd];
                    return result;
                }
            }
        },
        testEnv: false,
		web_wake_switch: "1",
		web_sleep_switch: "1",
		web_wake_time: "06:00",
		web_sleep_time: "22:00",
        WirelessMode:"4",
        m_ssid_enable:"0",
        broadcastssid:"1",
        CountryCode:"cn",
        Channel:"2",
        HT_MCS:"1", // Rate
        MAX_Access_num:"8",
        wifi_band: 'b',
        wifi_11n_cap : '0',
        AuthMode:"WPAPSKWPA2PSK",
        EncrypType:"TKIPCCMP",
        HideSSID:"0",
		NoForwarding:'1',
        Key1Str1:"12345",
        Key1Type: "1",
        Key2Str1:"12345",
        Key2Type:"1",
        Key3Str1:"12345",
        Key3Type:"1",
        Key4Str1:"12345",
        Key4Type:"1",
        SSID1:"102Z_E6C9C5",
        WPAPSK1_encode:"MTIzNDU2Nzg=",
        WPAPSK2_encode:"MTIzNDU2Nzg=",
        WPAPSK3_encode:"MTIzNDU2Nzg=",
        WPAPSK4_encode:"MTIzNDU2Nzg=",
		m_DefaultKeyID:"0",
        m_SSID:"102B_E6C9C5",
        m_AuthMode:"WPAPSKWPA2PSK",
        m_HideSSID:"0",
		m_NoForwarding: '0',
        m_WPAPSK1_encode:"MTIzNDU2Nzg=",
        m_MAX_Access_num:"4",
        m_EncrypType:"TKIPCCMP",
		m_Key1Str1:"12345",
        m_Key2Str1:"12345",
        m_Key3Str1:"12345",
        m_Key4Str1:"12345",
        Language:'en',
        wifi_coverage: "long_mode",		
		show_qrcode_flag: "1",
        attachedDevices:[],
        station_mac: "",
        signalbar:getRandomInt(5),
        network_type: [ "GSM", "GPRS", "EDGE", "WCDMA", "HSDPA", "HSPA", "HSPA+", "DC-HSPA+", "LTE" ][getRandomInt(8)],
        rssi:"-" + 9 * getRandomInt(5),
        rscp:"-" + 9 * getRandomInt(5),
        lte_rsrp:"-" + 9 * getRandomInt(5),
        network_provider:[ "GLOBE", "中国联通","中国电信"][getRandomInt(2)],
        spn_name_data: '00530050004E',
        spn_b1_flag: '1',
        spn_b2_flag: '1',
        ppp_status:"ppp_connected", // 联网状态
        simcard_roam:"International", //漫游状态 
        roam_setting_option: "off",
        modem_main_state:"modem_init_complete", //sim卡状态：modem_sim_undetected, modem_imsi_waitnck, modem_sim_destroy, modem_init_complete, modem_waitpin, modem_waitpuk
        battery_charging:"0", //"0" ? 'use' : 'charging'
        battery_vol_percent:"30",
        curr_connected_devices:[],
        // modem_main_state, // sim card 状态：
        // modem_init_complete、modem_sim_undetected、modem_waitpin、modem_waitpuk
        // sms_unread_num,sms_received_flag,sts_received_flag,RadioOff,station_num,battery_charging,battery_value,loginfo,simcard_roam,spn_display_flag,plmn_display_flag,spn_name_data,lan_ipaddr
        net_select:"Only_WCDMA",
        m_netselect_contents:'3,China Mobile,46002,1,0;2,China Mobile,46002,6,1;2,China Mobile,46002,7,0;2,China Mobile,46002,7,0;2,China Mobile,46002,7,1',
		rotationFlag:'1',
        realtime_rx_thrpt : 0,
        total_tx_bytes : 0,
        total_rx_bytes : 0,
        total_time : 0,
        monthly_tx_bytes : 0,
        monthly_rx_bytes : 0,
		traffic_alined_delta : 0,
        monthly_time : 0,
        realtime_tx_bytes : 0,
        realtime_rx_bytes : 0,
        realtime_time : 0,
        realtime_tx_thrpt : 0,
        phoneBooks:initPhoneBooks(phonebookSize),
        /*
    	"APN_config,dial_mode,m_profile_name,wan_apn,apn_select,wan_dial,dns_mode,
    	prefer_dns_manual,standby_dns_manual,ppp_auth_mode,ppp_username,ppp_passwd,Current_index",
    	*/
        apn_auto_config: "Auto Mobile1($)1bam.vtr.com($)manual($)*99#($)chap($)user($)pwd($)IP($)manual($)($)auto($)($)||Auto Mobile2($)2bam.vtr.com($)manual($)*99#($)chap($)user($)pwd($)IP($)manual($)($)auto($)($)",
        ipv6_apn_auto_config: "",
        APN_config0: "Modem($)bam.vtr.com($)manual($)*99#($)chap($)user($)pwd($)IP($)manual($)($)auto($)($)",
        APN_config1: "Vodafone GR($)internet.vodafone.gr($)manual($)*99#($)pap($)vtr($)vtr($)IPv4v6($)auto($)($)auto($)($)",
        APN_config2: "ChinaMobile($)internet.ChinaMobile.gr($)manual($)*99#($)pap($)vtr($)vtr($)IPv6($)auto($)($)auto($)($)",
        APN_config3:"",
        APN_config4:"",
        APN_config5:"",
        APN_config6:"",
        APN_config7:"",
        APN_config8:"",
        APN_config9:"",
        APN_config10: "",
        APN_config11: "",
        APN_config12: "",
        APN_config13:"",
        APN_config14:"",
        APN_config15:"",
        APN_config16:"",
        APN_config17:"",
        APN_config18:"",
        APN_config19:"",
        ipv6_APN_config0: "Modem($)($)($)($)($)($)($)($)($)($)($)($)",
        ipv6_APN_config1: "Vodafone GR($)internet.vodafone.gr($)manual($)*99#($)pap($)vtr($)vtr($)IPv4v6($)auto($)($)auto($)($)",
        ipv6_APN_config2: "ChinaMobile($)internet.ChinaMobile.gr($)manual($)*99#($)pap($)vtr($)vtr($)IPv6($)auto($)($)auto($)($)",
        ipv6_APN_config3:"",
        ipv6_APN_config4:"",
        ipv6_APN_config5:"",
        ipv6_APN_config6:"",
        ipv6_APN_config7:"",
        ipv6_APN_config8:"",
        ipv6_APN_config9:"",
        ipv6_APN_config10: "",
        ipv6_APN_config11: "",
        ipv6_APN_config12: "",
        ipv6_APN_config13:"",
        ipv6_APN_config14:"",
        ipv6_APN_config15:"",
        ipv6_APN_config16:"",
        ipv6_APN_config17:"",
        ipv6_APN_config18:"",
        ipv6_APN_config19:"",
        apn_mode: "manual",
        DefaultKeyID:"0",
        WscModeOption:"0",
        action:"",
        apn_index:"0",
        ipv6_apn_index:"0",
        ConnectionMode: "auto_dial",
    	m_profile_name: "Modem",
    	ipv6_m_profile_name: "Modem",
    	wan_apn: "bam.vtr.com",
    	apn_select: "manual",
    	wan_dial: "*99#",
    	dns_mode: "auto",
    	prefer_dns_manual: "",
    	standby_dns_manual: "",
    	ppp_auth_mode: "chap",
    	ppp_username: "user",
    	ppp_passwd: "pwd",
    	ipv6_wan_apn: "",
    	ipv6_apn_select: "",
    	ipv6_wan_dial: "",
    	ipv6_dns_mode: "",
    	ipv6_prefer_dns_manual: "",
    	ipv6_standby_dns_manual: "",
    	ipv6_ppp_auth_mode: "",
    	ipv6_ppp_username: "",
    	ipv6_ppp_passwd: "",
    	Current_index: "0",
    	ipv6_wan_ipaddr: 'FF:FF:FF:FF:FF:FF',
    	wan_ipaddr: '123.55.77.88',
    	ipv6_pdp_type: 'IP',
    	updateAttachedDevices: updateAttachedDevices,
        pbm_capacity_info:{
            pbm_dev_max_record_num:phonebook_device_max,
            pbm_dev_used_record_num:phonebook_device_used,
            pbm_sim_max_record_num:phonebook_sim_max,
            pbm_sim_used_record_num:phonebook_sim_used,
            pbm_sim_type:"", //2G or 3G used to extend pbm
            pbm_sim_max_name_len:22,
            pbm_sim_max_number_len:30
        },
        pbm_write_flag:"0",
        pbm_init_flag:"0",
        loginfo:"no",//不想登录就修改它.no：未登录，ok：已登录
        login_error:"",
        login_lock_time: '300',
        psw_fail_num_str: '5',
        save_login:"1",
        psw_save:"123456",
        puknumber:10,
        pinnumber:3,
        PIN:"1234",
        pin_status:"0",
        PUK:"11111111",
        admin_Password:"admin",
        sms_nv_capability: config.SMS_NV_CAPABILITY,
        sms_nv_capability_used: sms_nv_capability_used,
        sms_received_flag: "0",
        lan_ipaddr: "192.168.0.1",
        subnetMask: "255.255.255.0",
        lan_netmask: "255.255.255.0",
        macAddress: "aa:cc:bb:cc:dd:ee",
        mac_address: "aa:cc:bb:cc:dd:ee",
        dhcpServer: "enable",
        dhcpStart: "192.168.0.100",
        dhcpEnd: "192.168.0.200",
        dhcpLease: "24",
        dhcpLease_hour: "24",
        dhcpEnabled: "1",
        validity: "one_week",
        centerNumber: "13999988888",
        deliveryReport: "0",
        restore_flag : "1",
        wpsFlag: '0',
        authMode: 'OPEN',
        wps_type: 'PBC',
        RadioOff:"1", // 1?enabled?0?disabled
        sysIdleTimeToSleep: '10',
        RemoteManagement: '0',
        WANPingFilter: '0',
        PortForwardEnable: '0',
        PortForwardRules_0: '192.168.0.11,1111,2222,2,astest',
        PortForwardRules_1: '192.168.0.22,3333,4444,2,astest111',
        PortForwardRules_2: '',
        PortForwardRules_3: '',
        PortForwardRules_4: '',
        PortForwardRules_5: '',
        PortForwardRules_6: '',
        PortForwardRules_7: '',
        PortForwardRules_8: '',
        PortForwardRules_9: '',
        mode_set: "http_share_mode",
        sdcard_mode_option: '1',
        sd_card_state: "1",
        HTTP_SHARE_STATUS: "Enabled",
        HTTP_SHARE_CARD_USER: "user",
        HTTP_SHARE_WR_AUTH: "readonly",
        HTTP_SHARE_FILE: "/mmc2",
        IPPortFilterEnable: '0',
        DefaultFirewallPolicy: '0',
        IPPortFilterRules_0: '192.168.0.5,0,1,6,192.168.0.53,0,1,655,1,1,aa,00:1E:90:FF:FF:FF',
        IPPortFilterRules_1: '192.168.0.5,0,1,6,192.168.0.53,0,1,655,1,1,kk,00:1E:90:FF:FF:FF',
        IPPortFilterRules_2: '',
        IPPortFilterRules_3: '',
        IPPortFilterRules_4: '',
        IPPortFilterRules_5: '',
        IPPortFilterRules_6: '',
        IPPortFilterRules_7: '',
        IPPortFilterRules_8: '',
        IPPortFilterRules_9: '',
        IPPortFilterRulesv6_0: '',
        IPPortFilterRulesv6_1: '',
        IPPortFilterRulesv6_2: '',
        IPPortFilterRulesv6_3: '',
        IPPortFilterRulesv6_4: '',
        IPPortFilterRulesv6_5: '',
        IPPortFilterRulesv6_6: '',
        IPPortFilterRulesv6_7: '',
        IPPortFilterRulesv6_8: '',
        IPPortFilterRulesv6_9: '',
        PortMapEnable: '0',
        PortMapRules_0: '192.168.0.11,1111,2222,1,astest',
        PortMapRules_1: '192.168.0.22,3333,4444,1,astest111',
        PortMapRules_2: '',
        PortMapRules_3: '',
        PortMapRules_4: '',
        PortMapRules_5: '',
        PortMapRules_6: '',
        PortMapRules_7: '',
        PortMapRules_8: '',
        PortMapRules_9: '',
        wifiRangeMode: 'short_mode',
        upnpEnabled: '0',
        DMZEnable: '0',
        DMZIPAddress: '192.168.0.1',
		imei : '864589000054888',
		cr_version : 'CR_MF25DV0.0.0B01',
		wa_inner_version : 'CR_MF25DV0.0.0B01',
		hardware_version : 'PCBMF25DV1.0.0',
		sim_spn : '1',
//		rscp : '2',
		ecio : '3',
		lac_code : '4',
		cell_id : '5',
//		rssi : '7',
		LocalDomain: 'm.home',
		sim_iccid: '12345678987654321',
		sms_para_sca : '15800000001',
		sms_para_mem_store : 'native',
		sms_para_status_report : '0',
		sms_para_validity_period : '255',
		sms_unread_num : 0,
		data_volume_limit_switch : '1',
		data_volume_limit_unit : 'data',
		data_volume_limit_size : '100_1',
		data_volume_alert_percent : '80',
        dlna_language: "chinese",
        dlna_name: "12345",
        dlna_share_audio: "on",
        dlna_share_video: "on",
        dlna_share_image: "on",
        dlna_scan_state: "0",
        dlna_rescan_end: "0",
        unlock_nck_time:3,
        unlock_code:"aaaaffff12345678",
        sms_nv_total: 300,
		sms_nv_rev_total: 0,
		sms_nv_send_total: 0,
		sms_nv_draftbox_total: 0,
		sms_sim_rev_total: 0,
		sms_sim_send_total: 0,
		sms_sim_draftbox_total: 0,
        station_list: [{"mac_addr":"00:23:CD:AC:08:7E","hostname":"","ip_addr":"192.168.0.23"},{"mac_addr":"34:E0:CF:E0:B2:99","hostname":"android-26bda3ab2d9a107f","ip_addr":"192.168.0.101"}],
        lan_station_list: [{"mac_addr":"01:23:CD:AC:08:7E","hostname":"","ip_addr":"192.168.0.20"},{"mac_addr":"32:E0:CF:E0:B2:99","hostname":"android-26bda3ab2d9a","ip_addr":"192.168.0.10"}],
	    wifi_sta_connection:1,
        ap_station_mode:"wifi_pref",
        wifi_profile:"0001softbank,1,0,2,0001softbank,OPEN,NONE,0,0;mobilepoint,1,0,3,mobilepoint,OPEN,WEP,696177616b,0;userSaved,0,0,3,userSaved,SHARED,WEP,696177616b,0",
        wifi_profile1:"",
        wifi_profile2:"",
        wifi_profile3:"",
        wifi_profile4:"",
        wifi_profile5:"",
		wifi_profile6:"",
        wifi_profile7:"",
        wifi_profile8:"",
        wifi_profile9:"",
        EX_APLIST:"0,0,du Mobile WiFI_305288,4,6,WPAPSKWPA2PSK,TKIPCCMP;0,0,4G-Gateway-0888,4,6,WPAPSK,CCMP;0,0,life Wi-Fi_ABCD1231231,4,7,WPAPSKWPA2PSK,TKIPCCMP;0,0,uFi_duanruinan,4,8,WPAPSKWPA2PSK,TKIPCCMP;0,0,CPE_666666,4,6,WPAPSKWPA2PSK,TKIPCCMP;0,0,SOFTAP_XL,4,9,OPEN,NONE;0,0,T-Mobile Broadband11,4,6,WPAPSK,TKIPCCMP;0,0,sharaxa,3,11,OPEN,WEP;0,0,T-Mobile Broadband13,0,11,WPAPSK,TKIPCCMP;0,0,Atheros_XSpan_2G,4,6,OPEN,NONE;0,0,duanruinan,4,6,WPAPSKWPA2PSK,TKIPCCMP;0,0,T-Mobile Broadband11,4,1,WPAPSK,TKIPCCMP;0,0,life Wi-Fi_555658,0,1,OPEN,NONE;0,0,ZTE_MF29T_meng01,4,1,WPAPSKWPA2PSK,TKIPCCMP;0,0,AIRTEL_335258,4,3,OPEN,NONE",
        EX_APLIST1:"0,0,life Wi-Fi_ABCDDA,4,1,OPEN,NONE;0,0,ZTE_MF29T_meng01,4,1,WPAPSKWPA2PSK,TKIPCCMP",
        scan_finish:1,
        EX_SSID1:"",
        ex_wifi_status:"",
		sta_ip_status:"",
        EX_wifi_profile:"",
		blc_wan_mode:"PPPOE",//['PPP',  'PPP',  'PPP'][getRandomInt(3)],//PPP, PPPOE,AUTO
		blc_wan_auto_mode:[ 'AUTO_PPPOE', 'AUTO_PPP'][getRandomInt(2)],// AUTO_PPPOE, AUTO_PPP
		ethwan_mode:'AUTO',//['PPPOE', 'DHCP', 'STATIC', 'AUTO'][getRandomInt(4)],//PPPOE, DHCP, STATIC,AUTO
		pppoe_username:"user",
		rj45_state:"dead",
		need_sim_pin:"no",
		rj45_plug:"",
		pppoe_password:"password",
		pppoe_dial_mode:"manual_dial",
		static_wan_ipaddr:"192.168.1.100",
		static_wan_netmask: "255.255.255.0",
		static_wan_gateway: "192.168.1.1",
		static_wan_primary_dns: "6.6.6.6",
		static_wan_secondary_dns: "3.3.3.3",
		sntp_year: "2012",
		sntp_month: "11",
		sntp_day: "21",
		sntp_hour: "1",
		sntp_minute: "22",
		sntp_second: "50",
		sntp_time_set_mode: "auto",
		sntp_server_list1: "192.168.3.1",
		sntp_server_list2: "www.baidu.com",
		sntp_server_list3: "www.it.zte.com",
		sntp_server_list4: "google.com.hk",
		sntp_server_list5: "",
		sntp_server_list6: "",
		sntp_server_list7: "",
		sntp_server_list8: "",
		sntp_server_list9: "",
		sntp_server_list10: "",
		sntp_server0: "www.baidu.com",
		sntp_server1: "www.it.zte.com",
		sntp_server2: "Other",
		sntp_other_server0: "",
		sntp_other_server1: "",
		sntp_other_server2: "2.3.6.5",
		sntp_timezone: "6.5",
		sntp_timezone_index: "",
		sntp_dst_enable: "1",
		syn_done: "",
		websURLFilters: "www.aa.com;www.bb.com;www.cc.com",
		wifi_wds_mode: "0",
		wifi_wds_ssid: "wds",
		wifi_wds_AuthMode: "WPAPSKWPA2PSK",
		wifi_wds_EncrypType: "1",
		wifi_wds_WPAPSK1: "12345678",
		syslog_mode: "sms",
		debug_level: "7",
		tr069_ServerURL: "test069.com",
		tr069_ServerUsername: "Lily",
		tr069_ServerPassword: "0000000",
		tr069_ConnectionRequestUname: "Mary",
		tr069_ConnectionRequestPassword: "5555555",
		tr069_CPEPortNo: "51005",
		tr069_PeriodicInformTime: "2011-02-03T02:05:10",
		voip_sip_outbound_enable: "1",
		voip_sip_outbound_server: "cpe.cn",
		voip_sip_outbound_port: "1055",
		voip_sip_stun_enable: "0",
		voip_sip_stun_server: "rong.com",
		voip_sip_register_time: "2000",
		voip_sip_port: "1033",
		voip_sip_rtp_port_min: "2000",
		voip_sip_rtp_port_max: "6550",
		voip_sip_register_server1: "user.com",
		voip_sip_domain1: "aa.cn",
		voip_sip_realm1: "000",
		voip_sip_proxy_enable1: "1",
		voip_sip_proxy_server1: "bb",
		voip_account_display_account1: "bbbb",
		voip_account_auth1: "aaaaaaa",
		voip_account_password1: "00000000",
		voip_user1_register_status: "register_failed",
        voip_sip_t38_enable1 : "1",
        voip_sip_dtmf_method: "2",
        voip_sip_encoder1: "3",
        voip_sip_vad_enable1: "1",
        voip_sip_cng_enable1: "1",
        voip_forwarding_model: "0",
        voip_forwarding_uri1: "0123456789*#+",
        voip_not_disturb_enable: "1",
        voip_call_waiting_in_enable: "1",
		ACL_mode: '2',
		wifi_mac_black_list:'00:23:33:AC:08:7E;34:E0:44:E0:B2:99;E8:E3:55:AB:86:41',
		wifi_mac_white_list: "",
        wifi_hostname_black_list: '刘涛;季冬;小李',
		imsi: '0000000',
//		rssi: '555',
		static_wan_status: '',
		dhcp_wan_status: '1',
	fota_new_version_state:"1",
	fota_package_already_download:"no",
	update_type:"mifi_fota",//mifi_local
        update_info:{"filesname":"Version_1.0.2"," size":"1254","description":"description of Version_1.0.2","version":"V1.0.2"},
        is_mandatory:false,
        upgrade_result:"",
        fota_current_upgrade_state:"",
        pack_size_info:{"pack_total_size":180000,"download_size":0},
        if_has_select:"none",
        GetUpgAutoSetting:{"UpgMode":"1","UpgIntervalDay":1,"UpgRoamPermission":"0"},
        upg_roam_switch:0,
        dm_last_check_time: '2014-09-02 11:34:36',
        get_user_mac_addr: 'E6:44:37:4F:13:7B1',
        childGroupList: {"devices": [
            {"hostname": "name", "mac": "44:37:E6:4F:13:7B"},
            {"hostname": "name1", "mac": "4F:13:44:37:E6:7B"},
            {"hostname": "name2", "mac": "E6:44:37:4F:13:7B"},
            {"hostname": "name3", "mac": "13:4F:44:37:E6:7B"},
            {"hostname": "name4", "mac": "37:E6:44:4F:13:7B"},
            {"hostname": "name5", "mac": "13:44:37:E6:4F:7B"},
            {"hostname": "name6", "mac": "4F:13:7B:44:37:E6"},
            {"hostname": "name7", "mac": "44:37:E6:4F:13:7B"},
            {"hostname": "name8", "mac": "37:E6:13:4F:44:7B"}
        ]},
        site_white_list: {"siteList":[
            {"id": 1, name:"sina", site:"http://sina.com"},
            {"id": 2, name:"百度", site:"http://www.baidu.com"},
            {"id": 3, name:"QQ", site:"http://www.qq.com"},
            {"id": 4, name:"淘宝", site:"www.taobao.com"}
        ]},
        time_limited: "0+0,8,20;1+9,13;2+10,15,18,22",
        hostNameList:{"devices":[
            {"hostname": "刘涛", "mac": "44:37:E6:4F:13:7B"},
            {"hostname": "季冬", "mac": "4F:13:44:37:E6:7B"},
            {"hostname": "泪海","mac": "E6:44:37:4F:13:7B"}
        ]},
        openEnable: '1',
        closeEnable: '0',
        openTime: '06:30',
        closeTime: '22:00',
        systime_mode: 'sntp',
        m_netselect_result: "manual_success",
		DDNS_Enable:"1",
		DDNS_Mode:"1",
		DDNSProvider:"dyndns.org",
		DDNSAccount:"admin",
		DDNSPassword:"123456",
		DDNS:"",
		DDNS_Hash_Value:""
	};
    var frequency = 2;
	setInterval(function(){
		simulate.signalbar = getRandomInt(5);
		updateBattery();
		updateAttachedDevices();
        simulate.rssi = "-" + getRandomInt(100);
        simulate.rscp = "-" + getRandomInt(100);
        simulate.lte_rsrp = "-" + getRandomInt(100);

        if (simulate.ppp_status == "ppp_disconnected") {
            simulate.total_tx_bytes = simulate.total_tx_bytes?simulate.total_tx_bytes : getRandomInt(10000000);
            simulate.total_rx_bytes = simulate.total_rx_bytes?simulate.total_rx_bytes : getRandomInt(10000000);
            simulate.total_time = simulate.total_time?simulate.total_time : getRandomInt(10000);
            simulate.monthly_tx_bytes = simulate.monthly_tx_bytes?simulate.monthly_tx_bytes : getRandomInt(5000000);
            simulate.monthly_rx_bytes = simulate.monthly_rx_bytes?simulate.monthly_rx_bytes : getRandomInt(10000000);
			simulate.traffic_alined_delta = simulate.traffic_alined_delta?simulate.traffic_alined_delta : getRandomInt(10000000);
            simulate.monthly_time = simulate.monthly_time?simulate.monthly_time : getRandomInt(10000);
            /*simulate.realtime_tx_bytes = 0;
            simulate.realtime_rx_bytes = 0;
            simulate.realtime_time = 0;*/
            simulate.realtime_tx_thrpt = 0;
            simulate.realtime_rx_thrpt = 0;
        } else if (checkConnectedStatus(simulate.ppp_status)) {
        	var up = getRandomInt(2) ? getRandomInt(10000) : 0;
        	var down = getRandomInt(2) ? getRandomInt(100000) : 0;
            simulate.total_tx_bytes += up;
            simulate.total_rx_bytes += down;
            simulate.total_time += frequency;
            simulate.monthly_tx_bytes += up;
            simulate.monthly_rx_bytes += down;
            simulate.monthly_time += frequency;
            simulate.realtime_tx_bytes += up;
            simulate.realtime_rx_bytes += down;
            simulate.realtime_time += frequency;
            simulate.realtime_tx_thrpt = up;
            simulate.realtime_rx_thrpt = down;
        }
        
        if(!simulate.testEnv){
	        if(getRandomInt(5) == 0){ // 提高接收频率可将此值改小，如：2
	        	if(simulate.sms_nv_rev_total + simulate.sms_nv_send_total + simulate.sms_nv_draftbox_total != simulate.sms_nv_total){
	        		simulate.sms_received_flag = "1";
	        		var inner = null;
	        		if(!smsReady){
	        			inner = "inner";
						smsReady = true;
	        		}
	        		var smsArray = smsData.addNewSms(inner);
	        		smsArr.messages.push(smsArray2Object(smsArray));
	        	}
	        }else{
	        	simulate.sms_received_flag = "0";
	        }
	        simulate.sms_unread_num = simulate.sms_nv_rev_total = simulate.sms_nv_send_total = simulate.sms_nv_draftbox_total
	        	= simulate.sms_sim_rev_total = simulate.sms_sim_send_total = simulate.sms_sim_draftbox_total = 0;
	        $.each(smsArr.messages, function(i, n){
				if(n.tag == '1'){
					simulate.sms_unread_num++;
					simulate.sms_nv_rev_total++;
					simulate.sms_sim_rev_total++;
				}
				if(n.tag == '0'){
					simulate.sms_nv_rev_total++;
					simulate.sms_sim_rev_total++;
				}
				if(n.tag == '2' || n.tag == '3'){
					simulate.sms_nv_send_total++;
					simulate.sms_sim_send_total++;
				}
				if(n.tag == '4'){
					simulate.sms_nv_draftbox_total++;
					simulate.sms_sim_draftbox_total++;
				}
	        });
		}		
    }, 1000 * frequency);

    function updateBattery() {
        var volplus = simulate.battery_charging == "1";
        var step = getRandomInt(10);
        var vol = parseInt(simulate.battery_vol_percent);
        if (volplus) {
            if (vol + step <= 100) {
                simulate.battery_vol_percent = vol + step + "";
            } else {
                simulate.battery_charging = "0";
                simulate.battery_vol_percent = vol - step + "";
            }
        } else {
            if (vol - step >= 0) {
                simulate.battery_vol_percent = vol - step + "";
            } else {
                simulate.battery_charging = "1";
                simulate.battery_vol_percent = vol + step + "";
            }
        }
    }

	var devices = [ {
		macAddress : "E8:E3:A5:AB:86:41",
		hostName : "MyHostName1",
		ipAddress : "192.168.0.151",
		timeConnected : 124
	}, {
		macAddress : "E8:E3:A5:AB:86:42",
		hostName : "MyHostName2",
		ipAddress : "192.168.0.152",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:43",
		hostName : "MyHostName3",
		ipAddress : "192.168.0.153",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:44",
		hostName : "MyHostName24",
		ipAddress : "192.168.0.154",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:45",
		hostName : "MyHostName35",
		ipAddress : "192.168.0.155",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:46",
		hostName : "MyHostName26",
		ipAddress : "192.168.0.156",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:47",
		hostName : "MyHostName37",
		ipAddress : "192.168.0.157",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:48",
		hostName : "MyHostName28",
		ipAddress : "192.168.0.158",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:49",
		hostName : "MyHostName39",
		ipAddress : "192.168.0.159",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:50",
		hostName : "MyHostName212",
		ipAddress : "192.168.0.111",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:51",
		hostName : "MyHostName313",
		ipAddress : "192.168.0.112",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:52",
		hostName : "MyHostName214",
		ipAddress : "192.168.0.114",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:53",
		hostName : "MyHostName315",
		ipAddress : "192.168.0.115",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:42",
		hostName : "MyHostName216",
		ipAddress : "192.168.0.116",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:54",
		hostName : "MyHostName317",
		ipAddress : "192.168.0.117",
		timeConnected : 122
	}, {
		macAddress : "E8:E3:A5:AB:86:55",
		hostName : "MyHostName218",
		ipAddress : "192.168.0.118",
		timeConnected : 123
	}, {
		macAddress : "E8:E3:A5:AB:86:56",
		hostName : "MyHostName319",
		ipAddress : "192.168.0.119",
		timeConnected : 122
	}];

    function updateAttachedDevices() {
        if (getRandomInt(3) != 1 && simulate.attachedDevices.length!=0) {
            return;
        }
        var added = [];
        var dvs = [];
        simulate.station_mac = "";
        simulate.station_list = [];
        for (var i = 0; i < devices.length && i < simulate.MAX_Access_num; i++) {
            var n = getRandomInt(devices.length - 1);
            if (_.indexOf(added, n) == -1) {
                added.push(n);
            }
        }
        for (var i = 0; i < added.length; i++) {
            dvs.push(devices[added[i]]);
            var mark = (i + 1 == added.length) ? "" : ";";
            simulate.station_mac += devices[added[i]].macAddress + mark;
            //mac_addr":"00:23:CD:AC:08:7E","hostname"
            simulate.station_list.push({
                mac_addr: devices[added[i]].macAddress,
                hostname: devices[added[i]].hostName,
				ip_addr: devices[added[i]].ipAddress
            });
        }
        simulate.attachedDevices = dvs;
        simulate.curr_connected_devices = dvs;
    }

    function getPhoneBook(para) {
        if (para.mem_store == 3) {
            return  _.filter(simulate.phoneBooks, function (item) {
                return (item.pbm_group == para.pbm_group);
            });
        }else if (para.mem_store == 2) {
            return simulate.phoneBooks;
        } else {
            return  _.filter(simulate.phoneBooks, function (item) {
                return (item.pbm_location == para.mem_store);
            });
        }
    }

    function savePhoneBook(para) {
        if ((para.edit_index == -1 && para.location == 0 ) || (para.add_index_pc == -1 && para.location == 1 )) {
            var maxBook = _.max(simulate.phoneBooks, function (book) {
                return book.pbm_id;
            });
            var newID = maxBook ? maxBook.pbm_id + 1 : 1;

            simulate.phoneBooks.push(
                {
                    pbm_id:newID,
                    pbm_location:para.location,
                    pbm_name:para.name,
                    pbm_number:para.mobilephone_num,
                    pbm_anr:para.homephone_num,
                    pbm_anr1:para.officephone_num,
                    pbm_email:para.email,
                    pbm_group:para.groupchoose
                }
            );
            if (para.location == 1) {
                simulate.pbm_capacity_info.pbm_dev_used_record_num++;
            } else {
                simulate.pbm_capacity_info.pbm_sim_used_record_num++;
            }
        } else {
            for (var i = 0; i < simulate.phoneBooks.length; i++) {
                var n = simulate.phoneBooks[i];
                if ((para.edit_index == n.pbm_id && para.location == 0 ) || (para.add_index_pc == n.pbm_id && para.location == 1 )) {
                    n.pbm_name = para.name;
                    n.pbm_number = para.mobilephone_num;
                    n.pbm_anr = para.homephone_num;
                    n.pbm_anr1 = para.officephone_num;
                    n.pbm_email = para.email;
                    n.pbm_group = para.groupchoose;
                }
            }
        }
    }

    function dealPhoneBookDelete(para) {
        if (para.del_option == "delete_all") {
            deleteAllPhoneBook(para);
        }else if(para.del_option == "delete_all_by_group"){
            deleteAllPhoneBookByGroup(para);
        } else {
            deletePhoneBook(para);
        }
    }

    function deletePhoneBook(para) {
        var indexs = para.delete_id.split(",");

        simulate.phoneBooks = _.filter(simulate.phoneBooks, function (item) {
            return (jQuery.inArray(String(item.pbm_id), indexs) == -1);
        });

        var simCount = 0;
        for (var i = 0; i < simulate.phoneBooks.length; i++) {
            if (simulate.phoneBooks[i].pbm_location == 0) {
                simCount++;
            }
        }
        simulate.pbm_capacity_info.pbm_dev_used_record_num = simulate.phoneBooks.length - simCount;
        simulate.pbm_capacity_info.pbm_sim_used_record_num = simCount;
    }

    function deleteAllPhoneBook(para) {
        if (para.del_all_location == 2) {
            simulate.phoneBooks = [];
            simulate.pbm_capacity_info.pbm_dev_used_record_num = 0;
            simulate.pbm_capacity_info.pbm_sim_used_record_num = 0;
            return;
        }

        simulate.phoneBooks = _.filter(simulate.phoneBooks, function (item) {
            return (item.pbm_location != para.del_all_location);
        });

        if (para.pbm_location == 0) {
            simulate.pbm_capacity_info.pbm_sim_used_record_num = 0;
        } else {
            simulate.pbm_capacity_info.pbm_dev_used_record_num = 0;
        }
    }

    function deleteAllPhoneBookByGroup(para){
        simulate.phoneBooks = _.filter(simulate.phoneBooks, function (item) {
            return (item.pbm_group != para.del_group);
        });

        var simCount = 0;
        for (var i = 0; i < simulate.phoneBooks.length; i++) {
            if (simulate.phoneBooks[i].pbm_location == 0) {
                simCount++;
            }
        }
        simulate.pbm_capacity_info.pbm_dev_used_record_num = simulate.phoneBooks.length - simCount;
        simulate.pbm_capacity_info.pbm_sim_used_record_num = simCount;
    }

	function deleteApn(params){
		simulate["APN_config" + params.index] = '';
		for(var i = params.index + 1; i < 20; i++){
			if(simulate["APN_config" + i] != ''){
				apnMoveUp(i);
			}
		}
	};
	
	function apnMoveUp(index){
		simulate["APN_config" + (index - 1)] = simulate["APN_config" + index];
	}
	
	function parseApnItem(apnStr){
		var apn = {};
		var items = [];
		if(apnStr == ''){
			items = ['','','','','','','','','','','',''];
		}else{
			items = apnStr.split("($)");
		}
		apn.profile_name = items[0];
		apn.wan_apn = items[1];
		apn.apn_select = items[2];
		apn.wan_dial = items[3];
		apn.ppp_auth_mode = items[4];
		apn.ppp_username = items[5];
		apn.ppp_passwd = items[6];
		apn.pdp_type = items[7];
		apn.pdp_select = items[8];
		apn.pdp_addr = items[9];
		apn.dns_mode = items[10];
		apn.prefer_dns_manual = items[11];
		apn.standby_dns_manual = items[12];
		return apn;
	}
	
	function addOrEditApn(params){
		// Modem($)bam.vtr.com($)manual($)*99#($)chap($)user($)pwd($)IP($)manual($)($)auto($)($)
		var apn = [];
		if(params.pdp_type == 'IP'){
			apn.push(params.profile_name);
			apn.push(params.wan_apn);
			apn.push(params.apn_select);
			apn.push(params.wan_dial);
			apn.push(params.ppp_auth_mode);
			apn.push(params.ppp_username);
			apn.push(params.ppp_passwd);
			apn.push(params.pdp_type);
			apn.push(params.pdp_select);
			apn.push(params.pdp_addr);
			apn.push(params.dns_mode);
			apn.push(params.prefer_dns_manual);
			apn.push(params.standby_dns_manual);
			var apnStr = apn.join("($)");
			simulate["APN_config"+params.index] = apnStr;
			simulate["ipv6_APN_config"+params.index] = [params.profile_name,'','','','','','','','','','',''].join("($)");
		} else if(params.pdp_type == 'IPv6'){
			apn.push(params.profile_name);
			apn.push(params.ipv6_wan_apn);
			apn.push(params.apn_select);
			apn.push(params.wan_dial);
			apn.push(params.ipv6_ppp_auth_mode);
			apn.push(params.ipv6_ppp_username);
			apn.push(params.ipv6_ppp_passwd);
			apn.push(params.pdp_type);
			apn.push(params.pdp_select);
			apn.push(params.pdp_addr);
			apn.push(params.ipv6_dns_mode);
			apn.push(params.ipv6_prefer_dns_manual);
			apn.push(params.ipv6_standby_dns_manual);
			var apnStr = apn.join("($)");
			simulate["APN_config"+params.index] = [params.profile_name,'','','','','','','','','','',''].join("($)");
			simulate["ipv6_APN_config"+params.index] = apnStr;
		} else {
			var apn = [];
			apn.push(params.profile_name);
			apn.push(params.wan_apn);
			apn.push(params.apn_select);
			apn.push(params.wan_dial);
			apn.push(params.ppp_auth_mode);
			apn.push(params.ppp_username);
			apn.push(params.ppp_passwd);
			apn.push(params.pdp_type);
			apn.push(params.pdp_select);
			apn.push(params.pdp_addr);
			apn.push(params.dns_mode);
			apn.push(params.prefer_dns_manual);
			apn.push(params.standby_dns_manual);
			var apnStr = apn.join("($)");
			simulate["APN_config"+params.index] = apnStr;
			apn = [];
			apn.push(params.profile_name);
			apn.push(params.ipv6_wan_apn);
			apn.push(params.apn_select);
			apn.push(params.wan_dial);
			apn.push(params.ipv6_ppp_auth_mode);
			apn.push(params.ipv6_ppp_username);
			apn.push(params.ipv6_ppp_passwd);
			apn.push(params.pdp_type);
			apn.push(params.pdp_select);
			apn.push(params.pdp_addr);
			apn.push(params.ipv6_dns_mode);
			apn.push(params.ipv6_prefer_dns_manual);
			apn.push(params.ipv6_standby_dns_manual);
			apnStr = apn.join("($)");
			simulate["ipv6_APN_config"+params.index] = apnStr;
		}
	}
	
	function setDefaultApn(params){
		var apn = parseApnItem(simulate["APN_config"+params.index]);
		var ipv6Apn = parseApnItem(simulate["ipv6_APN_config"+params.index]);
        simulate.apn_index = params.index;
        simulate.ipv6_apn_index = params.index;
        simulate.Current_index = params.index;
		if(params.apn_mode == 'auto'){
			
		}else{
			simulate.apn_mode = "manual";
			simulate.m_profile_name = apn.profile_name;
			simulate.wan_dial = '*99#';
			simulate.apn_select = 'manual';
			simulate.pdp_select = 'auto';
			simulate.pdp_addr = '';
			if(params.pdp_type == "IP"){
				simulate.pdp_type = 'IP';
				simulate.ipv6_pdp_type = '';
				
				simulate.wan_apn = apn.wan_apn;
				simulate.ppp_auth_mode = apn.ppp_auth_mode;
				simulate.ppp_username = apn.ppp_username;
				simulate.ppp_passwd = apn.ppp_passwd;
				simulate.dns_mode = apn.dns_mode;
				simulate.prefer_dns_manual = apn.prefer_dns_manual;
				simulate.standby_dns_manual = apn.standby_dns_manual;
			}else if(params.pdp_type == "IPv6"){
				simulate.pdp_type = '';
				simulate.ipv6_pdp_type = 'IPv6';
				
				simulate.ipv6_wan_apn = ipv6Apn.wan_apn;
				simulate.ipv6_ppp_auth_mode = ipv6Apn.ppp_auth_mode;
				simulate.ipv6_ppp_username = ipv6Apn.ppp_username;
				simulate.ipv6_ppp_passwd = ipv6Apn.ppp_passwd;
				simulate.ipv6_dns_mode = ipv6Apn.dns_mode;
				simulate.ipv6_prefer_dns_manual = ipv6Apn.prefer_dns_manual;
				simulate.ipv6_standby_dns_manual = ipv6Apn.standby_dns_manual;
			}else{//"IPv4v6"
				simulate.pdp_type = 'IPv4v6';
				simulate.ipv6_pdp_type = 'IPv4v6';
				
				simulate.wan_apn = apn.wan_apn;
				simulate.ppp_auth_mode = apn.ppp_auth_mode;
				simulate.ppp_username = apn.ppp_username;
				simulate.ppp_passwd = apn.ppp_passwd;
				simulate.dns_mode = apn.dns_mode;
				simulate.prefer_dns_manual = apn.prefer_dns_manual;
				simulate.standby_dns_manual = apn.standby_dns_manual;

				simulate.ipv6_wan_apn = ipv6Apn.wan_apn;
				simulate.ipv6_ppp_auth_mode = ipv6Apn.ppp_auth_mode;
				simulate.ipv6_ppp_username = ipv6Apn.ppp_username;
				simulate.ipv6_ppp_passwd = ipv6Apn.ppp_passwd;
				simulate.ipv6_dns_mode = ipv6Apn.dns_mode;
				simulate.ipv6_prefer_dns_manual = ipv6Apn.prefer_dns_manual;
				simulate.ipv6_standby_dns_manual = ipv6Apn.standby_dns_manual;
			}
		}
	}

    function initPhoneBooks(n) {
        var groups = ["common","family","friend","colleague"];
        var books = [];
        var simCount = 0;
        for (var i = 0; i < n; i++) {
            var location = getRandomInt(11) % 2 == 0 ? "0" : "1";
            if (simCount >= phonebook_sim_max) {
                location = 1;
            }
            if (location == 0) {
                simCount++;
            }

            var group = null;
            if (location == 1) {
                group = groups[getRandomInt(3)];
            }

            var g = "00" + String((i % 10) + 30);
            var s = "00" + String(parseInt(i / 10) % 100 + 30);
            var b = "00" + String(parseInt(i / 100) % 1000 + 30);

            books.push({
                pbm_id:i + 1,
                pbm_location:location,
                pbm_name:"005A00540045" + b + s + g,
                pbm_number:phoneNumbers[getRandomInt(phoneNumbers.length - 1)],
                pbm_anr:location == 0 ? "" : "028756412" + String(i),
                pbm_anr1:location == 0 ? "" : "02955456" + String(i),
                pbm_email:location == 0 ? "" : "006D" + b + s + g + "0040006D00610069006C002E0063006F006D",
                pbm_group:group
            });
        }
        phonebook_sim_used = simCount;
        phonebook_device_used = n - simCount;
        return books;
    }

    var loginLockTimer = 0;
    function login(params) {
        params.password = Base64.decode(params.password);
        if (simulate.admin_Password == params.password) {
            clearInterval(loginLockTimer);
            simulate.loginfo = "ok";
            simulate.psw_fail_num_str = '5';
            simulate.login_lock_time = '300';
            return {result:'0'};
        } else {
            if(simulate.psw_fail_num_str == '1'){
                simulate.login_lock_time = '300';
                startLoginLockInterval();
            }
            if(simulate.psw_fail_num_str != '0'){
                simulate.psw_fail_num_str = (parseInt(simulate.psw_fail_num_str, 10) - 1) + '';
            }
            return {result:'3'};
        }
    }

    function startLoginLockInterval(){
        loginLockTimer = setInterval(function(){
            if(parseInt(simulate.login_lock_time, 10) <= 0){
                simulate.psw_fail_num_str = '0';
                simulate.login_lock_time = '300';
                clearInterval(loginLockTimer);
            }
            simulate.login_lock_time = parseInt(simulate.login_lock_time, 10) - 1 + "";
        }, 1000);
    }
    /*function login(params) {
        simulate.loginfo = "ok";
        return {result:'0'};
    }*/

    function logout() {
        simulate.loginfo = "no";
        return {result:'success'};
    }

    function validatePUK(params) {
        if (params.PUKNumber == simulate.PUK) {
            simulate.pinnumber = 3;
            simulate.puknumber = 10;
            simulate.PIN = params.PinNumber;
            simulate.modem_main_state = "modem_init_complete";
            return { result:"success" };
        } else {
            simulate.puknumber = simulate.puknumber - 1;
            if (simulate.puknumber <= 0) {
                simulate.modem_main_state = "modem_sim_destroy";
            }
            return { result:"fail" };
        }
    }

    function validatePIN(params) {
        if (params.PinNumber == simulate.PIN) {
            simulate.pinnumber = 3;
            simulate.modem_main_state = "modem_init_complete";
            return { result:"success" };
        } else {
            simulate.pinnumber = simulate.pinnumber - 1;
            simulate.modem_main_state = "modem_waitpin";
            if (simulate.pinnumber <= 0) {
                simulate.modem_main_state = "modem_waitpuk";
            }
            return { result:"fail" };
        }
    }
    
    function getAllSmsMessages(params) {
    	var org = smsData.getConvertedSmsData();
        var tmpResult = {};
        var allSms = [];
        tmpResult.messages = [];
		simulate.sms_unread_num = simulate.sms_nv_rev_total = simulate.sms_nv_send_total = simulate.sms_nv_draftbox_total
    			= simulate.sms_sim_rev_total = simulate.sms_sim_send_total = simulate.sms_sim_draftbox_total = 0;
    	for(var i = 0; i < org.length; i++){
    		/*数据结构
			id: n[0],
			Mem_Store: n[2],
			Tag: n[3],
			Number: n[4],
			Cc_Total: n[7],
			Content: n[14],
			Year: n[17],
			Month: n[18],
			Day: n[19],
			Hour: n[20],
			Minute: n[21],
			Second: n[22]*/
    		var n = org[i];
    		if(n.Tag == '1'){
        		simulate.sms_unread_num++;
        		simulate.sms_nv_rev_total++;
        		simulate.sms_sim_rev_total++;
        	}
			if(n.Tag == '0'){
        		simulate.sms_nv_rev_total++;
        		simulate.sms_sim_rev_total++;
        	}
			if(n.Tag == '2' || n.Tag == '3'){
        		simulate.sms_nv_send_total++;
        		simulate.sms_sim_send_total++;
        	}
			if(n.Tag == '4'){
				simulate.sms_nv_draftbox_total++;
				simulate.sms_sim_draftbox_total++;
			}
            var itemObj = smsArray2Object(n);
			if(params.tags != 10){
				if(n.Tag == params.tags){
                    tmpResult.messages.push(itemObj);
				}
			} else {
                tmpResult.messages.push(itemObj);
			}
            allSms.push(itemObj);
    	}
        tmpResult.messages = tmpResult.messages.reverse();
        smsArr.messages = allSms.reverse();
    	//获取最新的短消?
    	if(params.cmd == 'sms_data_total' && params.data_per_page == 5){
    		var tmp = [];
    		for(var i = 0; i < tmpResult.messages.length && i < params.data_per_page; i++){
    			//if(tmpResult.messages[i].tag == "1"){
    				tmp.push(tmpResult.messages[i]);
    			//}
    		}
    		return {messages: tmp};
    	}
    	/*
    	if(params.cmd == 'sms_data_total' && params.data_per_page == 10){
    		var tmp = [];
    		var count = 0;
    		for(var i = params.page * params.data_per_page; i < smsArr.messages.length && count < params.data_per_page; i++){
				tmp.push(smsArr.messages[i]);
				count++;
    		}
    		return {messages: tmp};
    	}*/

    	//获取全部短消?
		return tmpResult;
	}

    function smsArray2Object(n){
    	var msg = {
			id: n.id,
			number: n.Number,
			tag: n.Tag,
			content: n.Content,
			date : n.Year + "," + n.Month + "," + n.Day + "," + n.Hour + "," + n.Minute + "," + n.Second + ",+8",
			draft_group_id : n.groupId
		};
    	return msg;
    }
    
    function getNewSms(count){
    	var result = [];
    	if(smsArr.messages.length > 0){
    		for(var i = 1; i < smsArr.messages.length; i++){
    			if(smsArr.messages[smsArr.messages.length - i].tag == "1" && i <= count){
    				result.push( smsArr.messages[smsArr.messages.length - i] );
    			}
    		}
    	}
    	return result;
    }
    
    function deleteMessage(params){
    	var ids = params.msg_id.split(";");
    	if(ids && ids.length > 1){
    		simulate.sms_nv_rev_total = simulate.sms_nv_rev_total - (ids.length - 1);
    	}
    	smsArr.messages = $.grep(smsArr.messages, function(n, i){
    		return $.inArray(n.id + "", ids) == -1;
    	});
    	smsData.deleteSms(ids);
    }
    
    function sendSms(params){
    	var newMsg = {
        		id : smsData.getSmsMaxId(),
    			number : params.Number,
    			tag : "2",
    			content : params.MessageBody,
    			date : parseTime(params.sms_time)
        	};
    	smsArr.messages.push(newMsg);
    	smsData.storeSms(newMsg);
    	simulate.sms_nv_send_total++;
    }

	function saveSms(params) {
		$.each(params.SMSNumber.split(';'), function(i, n){
			if(!n) return;
			var newMsg = {
				id : smsData.getSmsMaxId(),
				number : n,
				tag : "4",
				content : params.SMSMessage,
				date : parseTime(params.sms_time),
				groupId : params.draft_group_id
			};
			smsArr.messages.push(newMsg);
			smsData.storeSms(newMsg);
			//simulate.sms_nv_send_total++;
			simulate.sms_nv_draftbox_total++;
		});
	}
    
    function setSmsRead(params){
    	var ids = params.msg_id.split(";");
    	$.map(smsArr.messages, function(n){
    		if($.inArray(n.id + "", ids) != -1){
    			n.tag = "0";
    		}
    	});
    	smsData.setSmsRead(params);
    }
    
    function smsStatusInfo(){  // "1":doing, "2":fail, "3":success
    	var n = getRandomInt(10);
    	var result = "1";
    	if(n == 0){
    		result = "2";
    	}
    	if(n > 0 && n < 8){
    		result = "3";
    	}
    	return result;
    }

    function validatePassword(params) {
        if(config.PASSWORD_ENCODE){
            params.oldPassword = Base64.decode(params.oldPassword);
        }
        if (params.oldPassword == simulate.admin_Password) {
            simulate.admin_Password = params.newPassword;
            return { result:"success" };
        } else {
            return { result:"fail" };
        }
    }

    function enablePin(params) {
        if (!params.NewPinNumber) {
            if (params.OldPinNumber == simulate.PIN) {
                simulate.pin_status = "1";
                simulate.modem_main_state = "modem_waitpin";
                simulate.pinnumber = 3;
                return { result:"success" };
            }
        } else {
            if (params.OldPinNumber == simulate.PIN) {
                simulate.PIN = params.NewPinNumber;
                simulate.pinnumber = 3;
                return { result:"success" };
            }
        }
        simulate.pinnumber = simulate.pinnumber - 1;
        if (simulate.pinnumber <= 0) {
            simulate.modem_main_state = "modem_waitpuk";
        }
        return { result:"fail" };
    }

    function disablePin(params) {
        if (params.OldPinNumber == simulate.PIN) {
            simulate.pin_status = "0";
            simulate.modem_main_state = "modem_init_complete";
            simulate.pinnumber = 3;
            return { result:"success" };
        }
        simulate.pinnumber = simulate.pinnumber - 1;
        if (simulate.pinnumber <= 0) {
            simulate.modem_main_state = "modem_waitpuk";
        }
        return { result:"fail" };
    }

    function setSdCardMode(params){
    	simulate.mode_set = params.mode_set;
     	if(params.mode_set == 'http_share_mode'){
     		simulate.sdcard_mode_option = '1';
     	} else {
     		simulate.sdcard_mode_option = '0';
     	}
    }

    function quickSetup(params) {
        simulate.m_profile_name = params.Profile_Name;
        simulate.apn_mode = params.apn_mode;
        simulate.wan_apn = params.APN_name;
        simulate.ppp_auth_mode = params.ppp_auth_mode;
        simulate.ppp_username = params.ppp_username;
        simulate.ppp_passwd = params.ppp_passwd;
        simulate.SSID1 = params.SSID_name;
        simulate.HideSSID = params.SSID_Broadcast;
        simulate.broadcastssid = params.SSID_Broadcast;
        simulate.AuthMode = params.Encryption_Mode_hid;
        if(config.PASSWORD_ENCODE){
            simulate.WPAPSK1_encode = params.WPA_PreShared_Key;
        }else{
            simulate.WPAPSK1 = params.WPA_PreShared_Key;
        }

        var apnItems = simulate["APN_config" + simulate.apn_index].split("($)");
        apnItems[0] = params.Profile_Name;
        apnItems[1] = params.APN_name;
        apnItems[4] = params.ppp_auth_mode;
        apnItems[5] = params.ppp_username;
        apnItems[6] = params.ppp_passwd;
        simulate["APN_config" + simulate.apn_index] = apnItems.join("($)");
    }

    function quickSetupExtend(params) {
        simulate.pdp_type = params.pdp_type;
        simulate.apn_mode = params.apn_mode;
        simulate.m_profile_name = params.profile_name;
        simulate.wan_apn = params.wan_apn;
        simulate.ppp_auth_mode = params.ppp_auth_mode;
        simulate.ppp_username = params.ppp_username;
        simulate.ppp_passwd = params.ppp_passwd;
        simulate.ipv6_wan_apn = params.ipv6_wan_apn;
        simulate.ipv6_ppp_auth_mode = params.ipv6_ppp_auth_mode;
        simulate.ipv6_ppp_username = params.ipv6_ppp_username;
        simulate.ipv6_ppp_passwd = params.ipv6_ppp_passwd;
        simulate.SSID1 = params.SSID_name;
        simulate.broadcastssid = params.SSID_Broadcast;
        simulate.HideSSID = params.SSID_Broadcast;
        simulate.AuthMode = params.Encryption_Mode_hid;
        //security_shared_mode:params.security_shared_mode,
        if(config.PASSWORD_ENCODE){
            simulate.WPAPSK1_encode = params.WPA_PreShared_Key;
        }else{
            simulate.WPAPSK1 = params.WPA_PreShared_Key;
        }
        //wep_default_key:params.wep_default_key,
        //WPA_ENCRYPTION_hid:params.WPA_ENCRYPTION_hid
        if (params.pdp_type == "IP" || params.pdp_type == "IPv4v6") {
            var apnItems = simulate["APN_config" + simulate.apn_index].split("($)");
            apnItems[0] = params.profile_name;
            apnItems[1] = params.wan_apn;
            apnItems[4] = params.ppp_auth_mode;
            apnItems[5] = params.ppp_username;
            apnItems[6] = params.ppp_passwd;
            simulate["APN_config" + simulate.apn_index] = apnItems.join("($)");
            if (params.pdp_type == "IP") {
                simulate["ipv6_APN_config" + simulate.ipv6_apn_index] = [params.profile_name, '', '', '', '', '', '', '', '', '', '', ''].join("($)");
            }
        }
        if (params.pdp_type == "IPv6" || params.pdp_type == "IPv4v6") {
            var apnItems = simulate["ipv6_APN_config" + simulate.ipv6_apn_index].split("($)");
            apnItems[0] = params.profile_name;
            apnItems[1] = params.ipv6_wan_apn;
            apnItems[4] = params.ipv6_ppp_auth_mode;
            apnItems[5] = params.ipv6_ppp_username;
            apnItems[6] = params.ipv6_ppp_passwd;
            simulate["ipv6_APN_config" + simulate.ipv6_apn_index] = apnItems.join("($)");
            if (params.pdp_type == "IPv6") {
                simulate["APN_config" + simulate.ipv6_apn_index] = [params.profile_name, '', '', '', '', '', '', '', '', '', '', ''].join("($)");
            }
        }
    }

    function getPhoneCapacity(para) {
        return {
            pbm_sim_max_record_num:simulate.pbm_capacity_info.pbm_sim_max_record_num,
            pbm_sim_used_record_num:simulate.pbm_capacity_info.pbm_sim_used_record_num,
            pbm_sim_max_name_len:simulate.pbm_capacity_info.pbm_sim_max_name_len,
            pbm_sim_max_number_len:simulate.pbm_capacity_info.pbm_sim_max_number_len,
            pbm_sim_type:simulate.pbm_capacity_info.pbm_sim_type,
            pbm_dev_max_record_num:simulate.pbm_capacity_info.pbm_dev_max_record_num,
            pbm_dev_used_record_num:simulate.pbm_capacity_info.pbm_dev_used_record_num
        };
    }
    
    var fileList = {
		"result" : {
			"totalRecord" : "125",
			"fileInfo" : [ {
				"fileName" : "dev",
				"attribute" : "document",
				"size" : "0",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊aaaaaaaaaccccccccccccccccccccccccccccccc.db",
				"attribute" : "file",
				"size" : "1",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "shar cccccccccccccccccccccccccccccccccccccc xx dcd sdsds sdsfcdsfd fdsfrdgrge.avi",
				"attribute" : "file",
				"size" : "68719476736",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "发多少公分的哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈.jpg",
				"attribute" : "file",
				"size" : "456879",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "bin.pdf",
				"attribute" : "file",
				"size" : "789450",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "build.xml",
				"attribute" : "file",
				"size" : "423428",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "tmp.rar",
				"attribute" : "file",
				"size" : "1047050",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "document.doc",
				"attribute" : "file",
				"size" : "2342234",
				"lastUpdateTime" : "20120511"
			}, {
				"fileName" : "share.ppt",
				"attribute" : "file",
				"size" : "122540",
				"lastUpdateTime" : "20120510"
			}, {
				"fileName" : "mySheet.xls",
				"attribute" : "file",
				"size" : "2341234",
				"lastUpdateTime" : "20120511"
			} ]
		}
	};
    
    function getFileList(params){
    	var path = params.path_SD_CARD;
    	var index = params.index;
    	return fileList;
    }

    function fileRename(params) {
		var newName = params.NEW_NAME_SD_CARD.substring(params.NEW_NAME_SD_CARD.lastIndexOf("/") + 1,
				params.NEW_NAME_SD_CARD.length);
		var oldName = params.OLD_NAME_SD_CARD.substring(params.OLD_NAME_SD_CARD.lastIndexOf("/") + 1,
				params.OLD_NAME_SD_CARD.length);
		for ( var i = 0; i < fileList.result.fileInfo.length; i++) {
			if (fileList.result.fileInfo[i].fileName == oldName) {
				fileList.result.fileInfo[i].fileName = newName;
				break;
			}
		}
	}

	function deleteFilesAndFolders(params) {
		var names = params.name_SD_CARD.substring(0, params.name_SD_CARD.length - 1).split("*");
		fileList.result.fileInfo = $.grep(fileList.result.fileInfo, function(n, i) {
			return $.inArray(fileList.result.fileInfo[i].fileName, names) == -1;
		});
		fileList.result.totalRecord = fileList.result.fileInfo.length;
	}

	function createFolder(params) {
		var name = params.path_SD_CARD.substring(params.path_SD_CARD.lastIndexOf("/") + 1,
				params.path_SD_CARD.length);
		fileList.result.fileInfo.push({
			"fileName" : name,
			"attribute" : "document",
			"size" : getRandomInt(100000),
			"lastUpdateTime" : "20120510"
		});
		fileList.result.totalRecord = fileList.result.fileInfo.length;
	}

    function transForFilter(proto) {
        var type;
        if ("TCP" == proto)
            type = "1";
        else if ("UDP" == proto)
            type = "2";
        else if ("ICMP" == proto)
            type = "4";
        else if ("None" == proto)
            type = "5";
        else if("TCP&UDP" == proto)
            type = "3";
        return type;
    }

    function transAction(action) {
        if(action == "Drop") {
            return "0";
        }
        else {
            return "1";
        }
    }
    
    function getSmsSetting(){
    	return {
    		sms_para_sca : simulate.sms_para_sca,
    		sms_para_mem_store : simulate.sms_para_mem_store,
    		sms_para_status_report : simulate.sms_para_status_report,
    		sms_para_validity_period : simulate.sms_para_validity_period
    	};
    }
    
    function setSmsSetting(params){
    	switch(params.save_time){
			case "twelve_hours":
				simulate.sms_para_validity_period = "143";
			    break;
			case "one_day":
				simulate.sms_para_validity_period = "167";
				break;
			case "one_week":
				simulate.sms_para_validity_period = "173";
				break;
			case "largest":
				simulate.sms_para_validity_period = "255";
			    break;
			default:
				simulate.sms_para_validity_period = "143";
			    break;
	    }
    	simulate.sms_para_sca = params.MessageCenter;
		simulate.sms_para_mem_store = params.save_location;
		simulate.sms_para_status_report = params.status_save;
    }
    
    function getSmsCapability(){
    	return {
    		sms_nv_total: simulate.sms_nv_total,
    		sms_nv_rev_total: simulate.sms_nv_rev_total,
    		sms_nv_send_total: simulate.sms_nv_send_total,
    		sms_nv_draftbox_total: simulate.sms_nv_draftbox_total,
    		sms_sim_rev_total: simulate.sms_sim_rev_total,
    		sms_sim_send_total: simulate.sms_sim_send_total,
    		sms_sim_draftbox_total: simulate.sms_sim_draftbox_total
    	};
    }

    function updateHotspot(para) {
        simulate.wifi_profile = para.wifi_profile;
        simulate.wifi_profile1 = para.wifi_profile1;
        simulate.wifi_profile2 = para.wifi_profile2;
        simulate.wifi_profile3 = para.wifi_profile3;
        simulate.wifi_profile4 = para.wifi_profile4;
        simulate.wifi_profile5 = para.wifi_profile5;
		simulate.wifi_profile6 = para.wifi_profile6;
		simulate.wifi_profile7 = para.wifi_profile7;
		simulate.wifi_profile8 = para.wifi_profile8;
		simulate.wifi_profile9 = para.wifi_profile9;
    }

    function connectHotspot(para) {
        disconnectHotspot();
        simulate.ex_wifi_status = "connecting";
		simulate.sta_ip_status = "connecting";		
        simulate.EX_SSID1 = para.EX_SSID1;
        simulate.EX_wifi_profile = para.EX_wifi_profile;
        window.setTimeout(function () {
            for (var i = 0; i <= 5; i++) {
                var wifi = "";
                if (i == 0) {
                    wifi = "wifi_profile";
                } else {
                    wifi = "wifi_profile" + i;
                }
                var index = simulate[wifi].indexOf(para.EX_wifi_profile + ",");
                if (index != -1) {
                    var idx = index + para.EX_wifi_profile.length + 3;
                    var list = simulate[wifi];
                    simulate[wifi] = list.substring(0, idx) + "1" + list.substring(idx + 1, list.length);
                    simulate.EX_SSID1 = para.EX_SSID1;
                    simulate.ex_wifi_status = "connect";
					simulate.sta_ip_status = "connect";
                    simulate.EX_wifi_profile = para.EX_wifi_profile;
                    simulate.ppp_status = "ppp_disconnected";
                    break;
                }
            }
        }, 3000);
    }
    function disconnectHotspot(){
        if (!simulate.EX_wifi_profile) return;
        for (var i = 0; i <= 5; i++) {
            var wifi = "";
            if (i == 0) {
                wifi = "wifi_profile";
            } else {
                wifi = "wifi_profile" + i;
            }
            var index = simulate[wifi].indexOf(simulate.EX_wifi_profile + ",");
            if (index != -1) {
                var idx = index + simulate.EX_wifi_profile.length + 3;
                var list = simulate[wifi];
                simulate[wifi] = list.substring(0, idx) + "0" + list.substring(idx + 1, list.length);
                simulate.EX_SSID1 = "";
                simulate.ex_wifi_status = "";
				simulate.sta_ip_status = "";
                simulate.EX_wifi_profile = "";
                break;
            }
        }
    }

    function getOpmsWanMode() {
        var mode = CookieUtil.get('blc_wan_mode');
        if (mode == null || mode == 'undefined') {
            mode = ['PPP', 'PPP', 'PPP'][getRandomInt(3)];
            simulate.blc_wan_mode = mode;
            CookieUtil.set('blc_wan_mode', mode, 30);
        }
        return mode;
    }
	
	function getEthWanMode(){
		var mode = CookieUtil.get('ethwan_mode');
        if (mode == null) {
            mode = 'AUTO'//['AUTO', 'PPPOE', 'STATIC', 'DHCP'][getRandomInt(4)];
            simulate.ethwan_mode = mode;
            CookieUtil.set('ethwan_mode', mode, 30);
        }
        return mode;
	}
	
  function setUpgAutoSetting(params) {
        simulate.GetUpgAutoSetting.UpgMode = params.UpgMode;
        simulate.GetUpgAutoSetting.UpgIntervalDay = params.UpgIntervalDay;
        simulate.GetUpgAutoSetting.UpgRoamPermission = params.UpgRoamPermission;
        simulate.upg_roam_switch = params.UpgRoamPermission;
    }
 function setUpgradeSelectOption(params) {
        simulate.upgrade_result = "";
        simulate.setUpgradeSelectOp = params.select_op;
        if (params.select_op == "check") {
            simulate.fota_new_version_state = "checking";
            var i = getRandomInt(10);
            if (i <= 1) {
                simulate.fota_new_version_state = "0";
            } else {
                var t = getRandomInt(10);
                if(t<5){
                    simulate.fota_new_version_state = "version_has_new_optional_software";
                }else{
                    simulate.fota_new_version_state = "version_has_new_critical_software";
                    simulate.fota_current_upgrade_state = "upgrading";
                }
            }
        } else if (params.select_op == "0" || params.select_op == "2") {
            simulate.fota_new_version_state = "version_idle";
            simulate.fota_current_upgrade_state = "fota_idle";
            simulate.pack_size_info.download_size = 0;
        } else if (params.select_op == "1") {
            simulate.fota_new_version_state = "version_has_new_critical_software";
            simulate.pack_size_info.download_size = simulate.pack_size_info.download_size + 100000;
            simulate.fota_current_upgrade_state = "upgrading";
        }
    }
    function setOpmsWanMode(mode) {
        simulate.blc_wan_mode = mode;
        CookieUtil.set('blc_wan_mode', mode, 30);
		window.location.reload();
    }
	function setEthWanMode(mode) {
        simulate.ethwan_mode = mode;
        CookieUtil.set('ethwan_mode', mode, 30);
		window.location.reload();
    }

    var CookieUtil = {
        set: function (name, value, days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = "; expires=" + date.toGMTString();
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        },
        get: function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },
        remove: function (name) {
            CookieUtil.set(name, "", -1);
        }
    };

    function addChildGroup(params) {
        var device = _.find(simulate.station_list, function(ele){
            return ele.mac_addr == params.mac;
        });
        device && simulate.childGroupList.devices.push({
            hostname: device.hostname,
            mac: device.mac_addr
        });
    }

    function removeChildGroup(params) {
        simulate.childGroupList.devices = _.filter(simulate.childGroupList.devices, function(ele){
            return ele.mac != params.mac
        });
    }

    function editHostName(params) {
        var matched = false;
        simulate.hostNameList.devices = _.map(simulate.hostNameList.devices, function(ele){
            if(ele.mac == params.mac){
                ele.hostname = params.hostname;
                matched = true;
            }
            return ele;
        });
        if(!matched){
            simulate.hostNameList.devices.push({
                hostname: params.hostname,
                mac: params.mac
            })
        }
    }

    function removeSiteWhite(params) {
        simulate.site_white_list.siteList = _.filter(simulate.site_white_list.siteList, function (ele) {
            return _.indexOf(params.ids.split(','), ele.id + "") == -1;
        });
    }

    function addSiteWhite(params){
        simulate.site_white_list.siteList.push({
            id: _.uniqueId("1"),
            name: params.name,
            site: params.site
        });
    }

    function saveTimeLimited(params){
        simulate.time_limited = params.time_limited
    }

    function saveTsw(params){
        simulate.openEnable = params.openEnable;
        simulate.closeEnable = params.closeEnable;
        simulate.openTime = params.openTime;
        simulate.closeTime = params.closeTime;
    }

    function getCurrentNetwork(){
        //'2,China Mobile,46002,2;1,China Mobile,46002,7'
        var networks = simulate.m_netselect_contents.split(';');
        var currentItem = null;
        for(var i = 0; i < networks.length; i++){
            var items = networks[i].split(',');
            if(items[0] == '2'){
                currentItem = items;
                break;
            }
        }
        return {
            strFullName: currentItem[1],//'China Mobile',
            strShortName: currentItem[1],//'China Mobile',
            strNumeric: currentItem[2],//'46002',
            nRat: currentItem[3],//'7',
            strBearer: 'HSUPA'
        };
    }

    function setNetwork(params){
        var networks = simulate.m_netselect_contents.split(';');
        var networkArr = [];
        for (var i = 0; i < networks.length; i++) {
            var items = networks[i].split(',');
            if (items[2] == params.NetworkNumber && items[3] == params.Rat) {
                items[0] = 2;
            } else {
                items[0] = 1;
            }
            networkArr.push(items);
        }
        var contentsArr = [];
        for (var i = 0; i < networkArr.length; i++) {
            contentsArr.push(networkArr[i].join(','));
        }
        simulate.m_netselect_contents = contentsArr.join(';');
        return {result: "success"};
    }

    function trafficCalibration(params){
        if(params.calibration_way == 'time'){
            simulate.monthly_tx_bytes = 1;
            simulate.monthly_rx_bytes = 1;
            simulate.monthly_time = params.time * 3600;
        } else {
            simulate.monthly_tx_bytes = 1;
            simulate.monthly_rx_bytes = params.data * 1024 * 1024;
			simulate.traffic_alined_delta = 1;
            simulate.monthly_time = 1;
        }
    }

	return simulate;
});