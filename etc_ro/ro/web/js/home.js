/**
 * home 模块
 * @module home
 * @class home
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore', 'status/statusBar', 'echarts'],
    function (ko, service, $, config, _, statusBar, echarts) {
        var CONNECT_STATUS = {CONNECTED: 1, DISCONNECTED: 2, CONNECTING: 3, DISCONNECTING: 4};
        var CURRENT_MODE = {WIRELESS: 1, CABLE: 2, AUTO: 3};
        var myChart = null;
        var container = $('#container')[0];
        var refreshCount = 0;
        var originalLan = window.language;
        $("#navContainer").show();
        var tz_used_logo_file = service.getAllOnceDatas().logo;
        /**
         * loginViewModel
         * @class loginVM
         */
        function loginVM() {
            /**
             * 是否显示登录按钮
             * @event showLogin
             */
            self.showLogin = function () {
                if (window.location.hash == "#index_status") {
                    return true;
                } else {
                    return false;
                }
            };
        }

        function connectStatus(connectStatus) 
        {
                if (connectStatus.indexOf('_connected') != -1) {
                    return CONNECT_STATUS.CONNECTED;
                } else if (connectStatus.indexOf('_disconnecting') != -1) {
                    return CONNECT_STATUS.DISCONNECTING;
                } else if (connectStatus.indexOf('_connecting') != -1) {
                    return CONNECT_STATUS.CONNECTING;
                } else {
                    return CONNECT_STATUS.DISCONNECTED;
                }
        }
        /**
         * HomeViewMode
         * @class HomeViewMode
         */
        function HomeViewMode() {
            var statusInfo = service.getStatusInfo();
            var self = this;
            var dhcpInfo = service.getAllOnceDatas();
            var dynamicInfo = service.getDynamicInfo();
            /////////////////////////
            service.bindCommonData(self);
            service.homeHide(self);
            if(tz_used_logo_file == "claro.png"){
                $(".h_connect_Class1").hide();
                $(".h_connect_Class2").show();
            }else{
                $(".h_connect_Class1").show();
                $(".h_connect_Class2").hide();
            }
            $("#show_more_infomation").hover(function(){
                $("#elastic_frame").show(0);
            },function(){
                $("#elastic_frame").hide(0);
            })
            $("#elastic_frame").hover(function(){
                $("#elastic_frame").show(0);
            },function(){
                $("#elastic_frame").hide(0);
            })
            self.dhcpStart = ko.observable(dhcpInfo.dhcpStart);
            self.dhcpEnd = ko.observable(dhcpInfo.dhcpEnd);
            self.ipAddress = ko.observable(dhcpInfo.ipAddress);
            var check_cp_status = dhcpInfo.check_cp_status.split(",")[0];
            var sn_status = dhcpInfo.check_cp_status.split(",")[1];
            check_cp_status = check_cp_status == "" ? "null" : check_cp_status;
            sn_status = sn_status == "" ? "null" : sn_status;
            self.check_cp_status = ko.observable(check_cp_status +" / "+ sn_status);
            self.hasSms = config.HAS_SMS;
            self.hasPhonebook = config.HAS_PHONEBOOK;
            self.isSupportSD = config.SD_CARD_SUPPORT;
            self.isCPE = config.PRODUCT_TYPE == 'CPE';
            self.notDataCard = config.PRODUCT_TYPE != 'DATACARD';
            self.hasParentalControl = config.HAS_PARENTAL_CONTROL;
            self.showVideo = ko.observable(true);
            self.showFiveImg = ko.observable(false);
            if(dhcpInfo.add_special_login_page=="1")
            {
                self.showFiveImg(true);
                $("#telcelLogo").show();
                $("#logoBar").addClass('newLand');
                $("#statusBar").addClass("newLandGight");
            }
            else if(dhcpInfo.add_special_login_page=="2")
            {
              
                $(".home-ul-img li").addClass('centerImg');
                self.showFiveImg(true);
                self.showVideo(false);
                
            }
            
            var wifiInfo = service.getAllOnceDatas();
            var wifiAdvance = service.getAllOnceDatas();
            if (config.WIFI_SUPPORT_QR_SWITCH) {
                self.showQRCode = config.WIFI_SUPPORT_QR_CODE && wifiInfo.show_qrcode_flag;
            } else {
                self.showQRCode = config.WIFI_SUPPORT_QR_CODE;
            }
            // self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();

            if (self.hasRj45) {
                var opModeObj = checkCableMode(service.getOpMode().blc_wan_mode);
                self.opCurMode = ko.observable(opModeObj);
                self.isShowHomeConnect = ko.observable(!opModeObj);
                self.showTraffic = ko.observable(config.TRAFFIC_SUPPORT && !opModeObj);
                self.isSupportQuicksetting = ko.observable(config.HAS_QUICK_SETTING && !opModeObj);//wifi APN 是否支持有关
            } else {
                self.isShowHomeConnect = ko.observable(true);
                self.showTraffic = ko.observable(config.TRAFFIC_SUPPORT);
                self.isSupportQuicksetting = ko.observable(config.HAS_QUICK_SETTING);
            }
            if (config.PRODUCT_TYPE == 'DATACARD') {
                $('#home_image').addClass('data-card');
            }

            var info = service.getConnectionInfo();
            self.networkType = ko.observable(homeUtil.getNetworkType(info.networkType));
            self.connectStatus = ko.observable(info.connectStatus);
            self.canConnect = ko.observable(false);


            self.current_Flux = ko.observable(transUnit(0, false));
            self.connected_Time = ko.observable(transSecond2Time(0));
            self.up_Speed = ko.observable(transUnit(0, true));
            self.down_Speed = ko.observable(transUnit(0, true));

            self.cpuUsage = ko.observable(dynamicInfo.tz_cpu_usage);
            self.mem_total = ko.observable(dynamicInfo.mem_total);
            self.mem_free = ko.observable(dynamicInfo.mem_free);
            self.mem_cached = ko.observable(dynamicInfo.mem_cached);
            self.mem_active = ko.observable(dynamicInfo.mem_active);

            self.restart = function () {
                showConfirm("restart_confirm", function () {
                    showLoading("restarting");
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
            };
            //////////////////////////

            self.isLoggedIn = ko.observable(false);
            self.enableFlag = ko.observable(true);

            self.simSerialNumber = ko.observable('');
            self.imei = ko.observable('');
            self.imsi = ko.observable('');
            self.rsrp = ko.observable(' ');
            self.ssid = ko.observable('');
            self.hasWifi = config.HAS_WIFI;
            self.showMultiSsid = ko.observable(config.HAS_MULTI_SSID && wifiInfo.multi_ssid_enable == "1");
            self.trafficAlertEnable = ko.observable(false);
            self.trafficUsed = ko.observable('-');
            self.trafficLimited = ko.observable('-');
            var info = service.getConnectionInfo();
            self.connectStatus = ko.observable(info.connectStatus);
            if(statusInfo.cellid_is_lock == "1"){
                self.cStatus = ko.observable("-1");
            }else{
                self.cStatus = ko.observable(connectStatus(self.connectStatus())); 
            }
            

            self.wireDeviceNum = ko.observable(service.getAttachedCableDevices().attachedDevices.length);
            self.wirelessDeviceNum = ko.observable(statusInfo.wirelessDeviceNum);
            self.selectedChannelBandwidth = ko.observable(wifiAdvance.bandwidth == "0" ? "20MHz" : "20MHz/40MHz");
            self.showOpModeWindow = function () {
                if (self.enableFlag()) {
                    return;
                }
                showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
                });
            };
            self.currentOpMode = ko.observable("0");
            
            addInterval(function () {
                refreshData(self);
            }, 3 * 1000);

            /**
             * 设备信息显示popover初始化和事件绑定
             * @object $('#showDetailInfo')
             */
            var popoverShown = false;
            self.showRefresh = function () {
                if (window.location.hash == "#index_status") {
                    return true;
                } else {
                    return false;
                }
            };
            /**
             * 获取设备信息显示相关信息
             * @method fetchDeviceInfo
             */
            function fetchDeviceInfo() {
                var data = service.getDeviceInfo();
                var info = service.getSystemStatus();
                var statusInfo = service.getStatusInfo();
                self.simSerialNumber(verifyDeviceInfo(data.simSerialNumber));
                // self.imei(verifyDeviceInfo(data.imei));
                // self.imsi(verifyDeviceInfo(data.imsi));
                self.rsrp(info.rsrp == "" ? "-" : info.rsrp);
                self.ssid(verifyDeviceInfo(data.ssid));

                

                self.showMultiSsid(config.HAS_MULTI_SSID && data.multi_ssid_enable == "1");
                return data;
            }

            // fetchDeviceInfo();

            function getLanInfo() {
                return service.getLanInfo();
            }

            /**
             * 连结按钮事件
             * @method connectHandler
             */
            self.connectHandler = function () {
                if(service.getStatusInfo().cellid_is_lock == "1"){
                     return;
                }
                        

                if (checkConnectedStatus(self.connectStatus())) {
                    showLoading('disconnecting');
                    service.disconnect({
                        CSRFToken: self.CSRFToken
                    }, function (data) {
                        if (data.result) {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    });
                } else {
                    if (service.getStatusInfo().roamingStatus) {
                        showConfirm('dial_roaming_connect', function () {
                            self.connect();
                        });

                    } else {
                        self.connect();
                    }
                }

            };

            self.connect = function () {
                var statusInfo = service.getStatusInfo();
                var trafficResult = statusBar.getTrafficResult(statusInfo);
                if (statusInfo.limitVolumeEnable && trafficResult.showConfirm) {
                    var confirmMsg = null;
                    if (trafficResult.usedPercent > 100) {
                        confirmMsg = {msg: 'traffic_beyond_connect_msg'};
                        statusBar.setTrafficAlertPopuped(true);
                    } else {
                        confirmMsg = {msg: 'traffic_limit_connect_msg', params: [trafficResult.limitPercent]};
                        statusBar.setTrafficAlert100Popuped(false);
                    }
                    showConfirm(confirmMsg, function () {
                        homeUtil.doConnect();
                    });
                } else {
                    homeUtil.doConnect();
                }
            };

            service.getSignalStrength({}, function (data) {
                var signalTxt = signalFormat(convertSignal(data));
                $("#fresh_signal_strength").text(signalTxt);
                if (popoverShown) {
                    $("#popoverSignalTxt").text(signalTxt);
                }
            });
            homeUtil.refreshHomeData(self);
            homeUtil.reConnectStatus(self);
            addInterval(function(){
                homeUtil.reConnectStatus(self);
            },1000);
            addInterval(function () {
                service.getSignalStrength({}, function (data) {
                    var signalTxt = signalFormat(convertSignal(data));
                    $("#fresh_signal_strength").text(signalTxt);
                    if (popoverShown) {
                        $("#popoverSignalTxt").text(signalTxt);
                    }
                });
                homeUtil.refreshHomeData(self);
            }, 1000);

            if (self.hasRj45) {
                homeUtil.refreshOpmodeInfo(self);
                addInterval(function () {
                    homeUtil.refreshOpmodeInfo(self);
                }, 1000);
            }

            /**
             * 显示模式设置窗口
             * @method showNetworkSettingsWindow
             */
            self.showNetworkSettingsWindow = function () {
                if (self.hasRj45) {
                    service.getOpMode({}, function (data) {
                        var mode = checkCableMode(data.blc_wan_mode);
                        if (mode) {
                            tosms('#net_setting');
                        } else {
                            tosms('#net_select');
                        }
                    });
                } else {
                    tosms('#dial_setting');
                }
            };
            var data = fetchDeviceInfo();
            var getModifyFirmware = service.getAllOnceDatas();
            var versionData = service.getDeviceVersion();
            var info = service.getSystemStatus();
            var addrInfo = homeUtil.getWanIpAddr(data);
            var withoutSim = info.service_status != "ok";
            var configVersion = service.getConfigVersion().configVersion;
            if(getModifyFirmware.hide_modify_firmware_version == "1"){
                $("#firmware_version").hide();
                $("#firmware_and_hardware").show();
            }else{
                 $("#firmware_version").show();
                $("#firmware_and_hardware").hide();
            }
            self.sn = service.getAllOnceDatas().tz_sn_code;

            self.simSerialNumber = verifyDeviceInfo(data.simSerialNumber);
            self.signal = signalFormat(data.signal);
            self.hasWifi = config.HAS_WIFI;
            self.isCPE = config.PRODUCT_TYPE == 'CPE';
            self.hasRj45 = config.RJ45_SUPPORT;
            self.ssid = verifyDeviceInfo(data.ssid);
            self.max_access_num = verifyDeviceInfo(data.max_access_num);
            self.m_ssid = verifyDeviceInfo(data.m_ssid);
            self.m_max_access_num = verifyDeviceInfo(data.m_max_access_num);
            self.wifi_long_mode = "wifi_des_" + data.wifiRange;
            self.lanDomain = verifyDeviceInfo(data.lanDomain);
            self.ipAddress = verifyDeviceInfo(data.ipAddress);
            self.showMacAddress = config.SHOW_MAC_ADDRESS;
            self.macAddress = verifyDeviceInfo(data.macAddress);
            self.wanIpAddress = addrInfo.wanIpAddress;
            self.wanIpAddress2 = data.apn2_ip == "" ? "— —" : data.apn2_ip;
            self.ipv6WanIpAddress2 = data.apn2_ipv6 == "" ? "— —" : data.apn2_ipv6;
            self.wanIpAddress3 = data.apn3_ip == "" ? "— —" : data.apn3_ip;
            self.ipv6WanIpAddress3 = data.apn3_ipv6 == "" ? "— —" : data.apn3_ipv6;
            self.ipv6WanIpAddress = addrInfo.ipv6WanIpAddress;
            self.sw_version = statusInfo.accountPower == '1' ? versionData.real_device_version : versionData.device_version;
            self.fir_hard_version =  (statusInfo.accountPower == '1' ? versionData.real_device_version : versionData.device_version)+" / "+getModifyFirmware.modify_firmware_version;
            self.hw_version = verifyDeviceInfo(data.hw_version);
            self.config_version = configVersion;
            self.cr_version = data.sw_version;
            self.build_time = versionData.build_time;
            self.wifi_mac = versionData.wifi_mac;
            self.eth0_mac = versionData.eth0_mac;
            self.tdd_calibration = LteCalibrationFormat(versionData.tdd_calibration);
            self.tdd_comprehensive = LteCalibrationFormat(versionData.tdd_comprehensive);
            self.fdd_calibration = LteCalibrationFormat(versionData.fdd_calibration);
            self.fdd_comprehensive = LteCalibrationFormat(versionData.fdd_comprehensive);
            if(statusInfo.cellid_is_lock == "1"){
            self.rsrp = "-";
            self.sinr = "-";
            self.lte_bands = "-";
            self.PhysCellId = "-";
            self.imei = "-";
            self.imsi = "-";
            }else{
            self.rsrp = withoutSim ? "-" : info.rsrp == "" ? "-" : info.rsrp;
            self.sinr = withoutSim ? "-" : Math.round(+(info.sinr));
            self.lte_bands = withoutSim ? "-" : info.lte_band;
            self.PhysCellId = withoutSim ? "-" : info.phy_cell_id == "" ? "-" : info.phy_cell_id;
            self.imei = data.imei;
            self.imsi = data.imsi;
            }
            self.connection_state = info.ppp_status == "" ? "-" : info.ppp_status;
            self.connected_time = transSecond2Time(info.realtime_time);
            self.bandWidth =  "-" ;
            self.ul_earfcn = info.ul_earfcn == "" ? "-" : info.ul_earfcn;
            self.ul_frequency = info.ul_frequency == "" ? "-" : info.ul_frequency;
            self.nv_arfcn = info.nv_arfcn == "" ? "-" : info.nv_arfcn;
            self.dl_frequency = info.dl_frequency == "" ? "-" : info.dl_frequency;
            self.ul_mcs = info.ULMCS == "" ? "-" : info.ULMCS;
            self.dl_mcs = info.mcs == "" ? "-" : info.mcs;
            self.lte_rsrp = info.rsrp == "" ? "-" : info.rsrp;
            self.lte_rsrp1 = info.lte_rsrp1 == "" ? "-" : info.lte_rsrp1;
            self.lte_rsrq = info.rsrq == "" ? "-" : info.rsrq;
            self.lte_rsrq1 = info.lte_rsrq1 == "" ? "-" : info.lte_rsrq1;
            self.CQI = info.cqi == "" ? "-" : info.cqi;
            self.lte_sinr = info.sinr == "" ? "-" : info.sinr;
            self.lte_sinr1 = info.lte_sinr1 == "" ? "-" : info.lte_sinr1;
            self.rssi = info.rssi == "" ? "-" : info.rssi;
            self.lte_rssi1 = info.lte_rssi1 == "" ? "-" : info.lte_rssi1;
            self.CINR0 =  "-";
            self.CINR1 = "-";
            self.C_RNTI = "-";
            self.RRCState = info.RRCState == "" ? "-" : info.RRCState;
            self.EMMState = info.EMMState == "" ? "-" : info.EMMState;
            self.bTransmissionMode = info.bTransmissionMode == "" ? "-" : info.bTransmissionMode;
            self.rank_indicator = "-";
            self.lte_txpower = info.lte_txpower == "" ? "-" : info.lte_txpower;
            self.lte_pci = info.phy_cell_id == "" ? "-" : info.phy_cell_id;
            self.lte_enodebid = info.enode_id == "" ? "-" : info.enode_id;
            self.ECI = info.enode_id +"-"+info.cell_id;
            self.Cell_ID = info.cell_id == "" ? "-" : info.cell_id;
            self.sim_plmn = info.lte_plmn == "" ? "-" : info.lte_plmn;
            self.tac_code = info.tac_code == "" ? "-" : info.tac_code;
            self.lte_ul_throughput = info.lte_ul_throughput == "" ? "-" : info.lte_ul_throughput;
            self.lte_dl_throughput = info.lte_dl_throughput == "" ? "-" : info.lte_dl_throughput;
            if(service.getAllOnceDatas().login_enter_apn == "yes"){
                    self.cell_id_f =  info.tz_lock_current_cellid == "" ? "-" : info.tz_lock_current_cellid;
                }else{
                    if (statusInfo.cellid_is_lock == "1"){
                        self.cell_id_f = "-";
                    }else{
                        self.cell_id_f = withoutSim ? "-" : formatCellId(info.enode_id, info.cell_id);
                    }
                }
        }

        function refreshData(vm) {
            var info = service.getSystemStatus();
            var statusInfo = service.getStatusInfo();
            var data = service.getDeviceInfo();
            var addrInfo = homeUtil.getWanIpAddr(data);
            var withoutSim = info.service_status != "ok";
            vm.sinr = withoutSim ? "-" : Math.round(+(info.sinr));
            vm.rsrp = withoutSim ? "-" : info.rsrp == "" ? "-" : info.rsrp;
            if(statusInfo.cellid_is_lock == "1"){
            vm.imei = "-";
            vm.imsi = "-";
            vm.rsrp = "-";
            vm.sinr = "-";
            vm.cell_id_f = "-"; 
            vm.lte_bands = "-";
            vm.PhysCellId = "-";
            vm.wanIpAddress = "— —";
            vm.wanIpAddress2 = "— —";
            vm.ipv6WanIpAddress2 = "— —";
            vm.wanIpAddress3 = "— —";
            vm.ipv6WanIpAddress3 = "— —";
            vm.ipv6WanIpAddress = "— —";
            }else{
            vm.imei = verifyDeviceInfo(data.imei);
            vm.imsi = verifyDeviceInfo(data.imsi);
            vm.rsrp = withoutSim ? "-" : info.rsrp == "" ? "-" : info.rsrp;
            vm.sinr = withoutSim ? "-" : Math.round(+(info.sinr));
            vm.cell_id_f = withoutSim ? "-" : formatCellId(info.enode_id, info.cell_id);
            vm.lte_bands = withoutSim ? "-" : info.lte_band;
            vm.PhysCellId = withoutSim ? "-" : info.phy_cell_id == "" ? "-" : info.phy_cell_id;
            vm.wanIpAddress = addrInfo.wanIpAddress;
            vm.wanIpAddress2 = data.apn2_ip == "" ? "— —" : data.apn2_ip;
            vm.ipv6WanIpAddress2 = data.apn2_ipv6 == "" ? "— —" : data.apn2_ipv6;
            vm.wanIpAddress3 = data.apn3_ip == "" ? "— —" : data.apn3_ip;
            vm.ipv6WanIpAddress3 = data.apn3_ipv6 == "" ? "— —" : data.apn3_ipv6;
            vm.ipv6WanIpAddress = addrInfo.ipv6WanIpAddress;
            }

            vm.connection_state = info.ppp_status == "" ? "-" : info.ppp_status;
            vm.connected_time = transSecond2Time(info.realtime_time);
            vm.bandWidth =  "-" ;
            vm.ul_earfcn = info.ul_earfcn == "" ? "-" : info.ul_earfcn;
            vm.ul_frequency = info.ul_frequency == "" ? "-" : info.ul_frequency;
            vm.nv_arfcn = info.nv_arfcn == "" ? "-" : info.nv_arfcn;
            vm.dl_frequency = info.dl_frequency == "" ? "-" : info.dl_frequency;
            vm.ul_mcs = info.ULMCS == "" ? "-" : info.ULMCS;
            vm.dl_mcs = info.mcs == "" ? "-" : info.mcs;
            vm.lte_rsrp = info.rsrp == "" ? "-" : info.rsrp;
            vm.lte_rsrp1 = info.lte_rsrp1 == "" ? "-" : info.lte_rsrp1;
            vm.lte_rsrq = info.rsrq == "" ? "-" : info.rsrq;
            vm.lte_rsrq1 = info.lte_rsrq1 == "" ? "-" : info.lte_rsrq1;
            vm.CQI = info.cqi == "" ? "-" : info.cqi;
            vm.lte_sinr = info.sinr == "" ? "-" : info.sinr;
            vm.lte_sinr1 = info.lte_sinr1 == "" ? "-" : info.lte_sinr1;
            vm.rssi = info.rssi == "" ? "-" : info.rssi;
            vm.lte_rssi1 = info.lte_rssi1 == "" ? "-" : info.lte_rssi1;
            vm.CINR0 =  "-";
            vm.CINR1 = "-";
            vm.C_RNTI = "-";
            vm.RRCState = info.RRCState == "" ? "-" : info.RRCState;
            vm.EMMState = info.EMMState == "" ? "-" : info.EMMState;
            vm.bTransmissionMode = info.bTransmissionMode == "" ? "-" : info.bTransmissionMode;
            vm.rank_indicator = "-";
            vm.lte_txpower = info.lte_txpower == "" ? "-" : info.lte_txpower;
            vm.lte_pci = info.phy_cell_id == "" ? "-" : info.phy_cell_id;
            vm.lte_enodebid = info.enode_id == "" ? "-" : info.enode_id;
            vm.ECI = info.enode_id +"-"+info.cell_id;
            vm.Cell_ID = info.cell_id == "" ? "-" : info.cell_id;
            vm.sim_plmn = info.lte_plmn == "" ? "-" : info.lte_plmn;
            vm.tac_code = info.tac_code == "" ? "-" : info.tac_code;
            vm.lte_ul_throughput = info.lte_ul_throughput == "" ? "-" : info.lte_ul_throughput;
            vm.lte_dl_throughput = info.lte_dl_throughput == "" ? "-" : info.lte_dl_throughput;
             if(service.getAllOnceDatas().login_enter_apn == "yes"){
                    vm.cell_id_f = info.tz_lock_current_cellid == "" ? "-" : info.tz_lock_current_cellid;
                }else{
                    if (statusInfo.cellid_is_lock == "1"){
                        vm.cell_id_f = "-";
                    }else{
                        vm.cell_id_f = withoutSim ? "-" : formatCellId(info.enode_id, info.cell_id);
                    }
                }
            ko.applyBindings(vm, $("#col2")[0]);
        }
        

        var getSimStatus = service.getStatusInfo().simStatus;
        if (getSimStatus == "modem_sim_undetected"
            || getSimStatus == "modem_sim_destroy" || getSimStatus == "modem_waitpin"
            || getSimStatus == "modem_waitpuk") {
            self.showNetSetting = ko.observable(false);
        }
        else
            self.showNetSetting = ko.observable(true);

        var homeUtil = {
            initStatus: null,

            initShownStatus: function (data) {
                this.initStatus = {};
                var ipv6Mode = data.ipv6PdpType.toLowerCase().indexOf("v6") > 0;
                if (config.RJ45_SUPPORT) {
                    var mode = checkCableMode(data.blc_wan_mode);
                    if (mode) {
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    } else if (config.IPV6_SUPPORT) {//支持IPV6
                        if (data.pdpType == "IP") {//ipv4
                            this.initStatus.showIpv6WanIpAddr = false;
                            this.initStatus.showIpv4WanIpAddr = true;
                        } else if (ipv6Mode) {//ipv6(&ipv4)
                            if (data.ipv6PdpType == "IPv6") {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = false;
                            } else {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = true;
                            }
                        }
                    } else {//不支持IPV6
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    }
                } else {
                    if (config.IPV6_SUPPORT) {//支持IPV6
                        if (data.pdpType == "IP") {//ipv4
                            this.initStatus.showIpv6WanIpAddr = false;
                            this.initStatus.showIpv4WanIpAddr = true;
                        } else if (ipv6Mode) {//ipv6(&ipv4)
                            if (data.ipv6PdpType == "IPv6") {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = false;
                            } else {
                                this.initStatus.showIpv6WanIpAddr = true;
                                this.initStatus.showIpv4WanIpAddr = true;
                            }
                        }
                    } else {//不支持IPV6
                        this.initStatus.showIpv6WanIpAddr = false;
                        this.initStatus.showIpv4WanIpAddr = true;
                    }
                }
            },
            /**
             * 获取wanIP地址
             * @method getWanIpAddr
             */
            getWanIpAddr: function (data) {
                var addrInfo = {
                    wanIpAddress: '',
                    ipv6WanIpAddress: ''
                };
                addrInfo.wanIpAddress = verifyDeviceInfo(data.wanIpAddress);
                addrInfo.ipv6WanIpAddress = verifyDeviceInfo(data.ipv6WanIpAddress);
                return addrInfo;
            },
            /**
             * 获取modem/apstation连接状态
             * @method getConnectStatus
             */
            getConnectStatus: function (status, wifiStatus) {
                if ((status == "ppp_disconnected" || status == "ppp_connecting" || status == "ppp_disconnecting") && (wifiStatus != "connect")) {
                    return 0;
                } else if (status == "ppp_connected") {
                    return 1;
                } else if (status == "ipv6_connected") {
                    return 2;
                } else if (status == "ipv4_ipv6_connected") {
                    return 3;
                }
                else if (wifiStatus == "connect") {
                    return 4;
                }
            },
            //获取当前实际模式：有线、无线
            getCurrentMode: function (mode) {
                if ("PPP" == mode || "AUTO_PPP" == mode) {
                    return CURRENT_MODE.WIRELESS;
                } else if ("PPPOE" == mode || "AUTO_PPPOE" == mode) {
                    return CURRENT_MODE.CABLE;
                } else {
                    return CURRENT_MODE.WIRELESS;
                }
            },
            cachedAPStationBasic: null,
            cachedConnectionMode: null,
            /**
             * 获取modem是否可以连接状态
             * @method getCanConnectNetWork
             */
            getCanConnectNetWork: function (vm) {
                var status = service.getStatusInfo();
                if (status.simStatus != "modem_init_complete") {
                    return false;
                }
                var networkTypeTmp = status.networkType.toLowerCase();
                if (networkTypeTmp == 'searching') {
                    return false;
                }
                if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
                    networkTypeTmp = 'limited_service';
                }
                if (networkTypeTmp == 'no service') {
                    networkTypeTmp = 'no_service';
                }
                if (networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
                    if (vm.cStatus() != CONNECT_STATUS.CONNECTED) {
                        return false;
                    }
                }

                if (config.AP_STATION_SUPPORT) {
                    if (status.connectWifiStatus == "connect") {
                        if (status.ap_station_mode == "wifi_pref") {
                            return false;
                        }
                    }
                }
                return true;
            },
            doConnect: function () {
                showLoading('connecting');
                service.connect({}, function (data) {
                    if (data.result) {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            },
            /**
             * 更新主界面各个状态值
             * @method refreshHomeData
             */
            refreshHomeData: function (vm) {
                var info = service.getConnectionInfo();
                var info2 = service.getStatusInfo();
                vm.connectStatus(info.connectStatus);
                vm.canConnect(this.getCanConnectNetWork(vm));
                vm.networkType(homeUtil.getNetworkType(info.networkType));
                if (checkConnectedStatus(info.connectStatus)) {
                    vm.current_Flux(transUnit(parseInt(info.data_counter.currentReceived, 10) + parseInt(info.data_counter.currentSent, 10), false));
                    vm.connected_Time(transSecond2Time(info.data_counter.currentConnectedTime));
                    vm.up_Speed(transUnit(info.data_counter.uploadRate, true));
                    vm.down_Speed(transUnit(info.data_counter.downloadRate, true));
                } else {
                    vm.current_Flux(transUnit(0, false));
                    vm.connected_Time(transSecond2Time(0));
                    vm.up_Speed(transUnit(0, true));
                    vm.down_Speed(transUnit(0, true));
                }

                vm.trafficAlertEnable(info.limitVolumeEnable);
                if (info.limitVolumeEnable) {
                    if(info2.cellid_is_lock == "1"){
                        vm.trafficUsed("-");
                        vm.trafficLimited("-");
                    }else{
                        if (info.limitVolumeType == '1') { // Data
                            var used = transUnit(parseInt(info.data_counter.monthlySent, 10) + parseInt(info.data_counter.monthlyReceived, 10), false);
                            var limited = transUnit(info.limitDataMonth, false);
                            vm.trafficUsed(insert_flg(used, ' ', used.length - 2));
                            vm.trafficLimited(insert_flg(limited, ' ', limited.length - 2));
                        } else { // Time
                            vm.trafficUsed(transSecond2Time(info.data_counter.monthlyConnectedTime));
                            vm.trafficLimited(transSecond2Time(info.limitTimeMonth));
                    }
                    }
                    
                }

                if (originalLan != window.language) {
                    originalLan = window.language;
                    refreshCount = 1;
                }

                homeUtil.refreshStationInfo(vm);
                homeUtil.refreshCpuUsage(vm);
            },

            reConnectStatus: function (vm) {
                var info = service.getConnectionInfo();
                var statusInfo = service.getStatusInfo();
               
                 if(statusInfo.cellid_is_lock == "1"){
                        vm.cStatus("-1");
                    }else{
                        vm.cStatus(connectStatus(vm.connectStatus()));
                    }
                 vm.connectStatus(info.connectStatus);
                 

            },
            /**
             * 适配networkType
             * @method getNetworkType
             */
            getNetworkType: function (networkType) {
                var networkTypeTmp = networkType.toLowerCase();
                if (networkTypeTmp == '' || networkTypeTmp == 'limited service') {
                    networkTypeTmp = 'limited_service';
                }
                if (networkTypeTmp == 'no service') {
                    networkTypeTmp = 'no_service';
                }
                if (networkTypeTmp == 'limited_service' || networkTypeTmp == 'no_service') {
                    return $.i18n.prop("network_type_" + networkTypeTmp);
                } else {
                    return networkType;
                }
            },
            /**
             * 更新已连接设备数
             * @method refreshStationInfo
             */
            refreshStationInfo: function (vm) {
                vm.wirelessDeviceNum(service.getStatusInfo().wirelessDeviceNum);
                if (refreshCount % 10 == 2) {
                    service.getAttachedCableDevices({}, function (data) {
                        vm.wireDeviceNum(data.attachedDevices.length);
                    });
                }
            },

            refreshCpuUsage: function (vm) {
                var dynamicInfo = service.getDynamicInfo();
                vm.cpuUsage(dynamicInfo.tz_cpu_usage);
                vm.mem_total(dynamicInfo.mem_total);
                vm.mem_free(dynamicInfo.mem_free);
                vm.mem_cached(dynamicInfo.mem_cached);
                vm.mem_active(dynamicInfo.mem_active);
            },
            /**
             * 更新当前工作模式状态
             * @method refreshOpmodeInfo
             */
            refreshOpmodeInfo: function (vm) {
                var obj = service.getOpMode();
                vm.isLoggedIn(obj.loginfo == "ok");
                var currentMode = checkCableMode(obj.blc_wan_mode);//true为有线模式

                if (vm.opCurMode() && !currentMode) {//有线模式切无线模式，无卡或锁网状态
                    var data = service.getLoginData();
                    var state = data.modem_main_state;
                    if (state == "modem_sim_undetected" || state == "modem_undetected" || state == "modem_sim_destroy" || state == "modem_waitpin" || state == "modem_waitpuk" || state == "modem_imsi_waitnck") {
                        window.location.reload();
                        return;
                    }
                }
                vm.opCurMode(currentMode);

                if (currentMode && obj.ethwan_mode == "DHCP") {
                    vm.enableFlag(false);
                } else if ((!currentMode && obj.ppp_status != "ppp_disconnected") || (currentMode && obj.rj45_state != "idle" && obj.rj45_state != "dead")) {
                    vm.enableFlag(true);
                } else {
                    vm.enableFlag(false);
                }
                var mode = (obj.blc_wan_mode == "AUTO_PPP" || obj.blc_wan_mode == "AUTO_PPPOE") ? "AUTO" : obj.blc_wan_mode;
                var currentOpMode = "";
                switch (mode) {
                    case "AUTO":
                        currentOpMode = "opmode_auto";
                        break;
                    case "PPPOE":
                        currentOpMode = "opmode_cable";
                        break;
                    case "PPP":
                        currentOpMode = "opmode_gateway";
                        break;
                    default:
                        break;
                }
                $("#opmode").attr("data-trans", currentOpMode).text($.i18n.prop(currentOpMode));

                vm.isShowHomeConnect(!currentMode);
                vm.showTraffic(config.TRAFFIC_SUPPORT && !currentMode);
                vm.isSupportQuicksetting(config.HAS_QUICK_SETTING && !currentMode);//APN 是否支持有关
            }
        };

        setCookie("pageForward", "home");

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            refreshCount = 0;
            homeUtil.oldUsedData = null;
            homeUtil.oldAlarmData = null;
            //myChart = echarts.init($("#traffic_graphic")[0]);
            ko.cleanNode(container);
            var vm = new HomeViewMode();
            ko.applyBindings(vm, container);
            ko.applyBindings(new loginVM(), $('#login')[0]);

        }

        return {
            init: init
        };
    });
