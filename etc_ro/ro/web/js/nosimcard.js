/**
 * sim 模块
 * @module simVM
 * @class simVM
 */
define(['knockout', 'service', 'jquery', 'config/config', 'home', 'opmode/opmode'], function (ko, service, $, config, home, opmode) {
    function simVM() {
        var self = this;
		var obj = service.getStatusInfo();
		var curCableMode = "PPPOE" == obj.blc_wan_mode || "AUTO_PPPOE" == obj.blc_wan_mode;
        self.hasRj45 = config.RJ45_SUPPORT;
        self.hasSms = config.HAS_SMS;
        self.hasPhonebook = config.HAS_PHONEBOOK;
        self.isSupportSD = config.SD_CARD_SUPPORT;
		self.hasParentalControl = ko.observable(config.HAS_PARENTAL_CONTROL && curCableMode);
        self.pageState = {NO_SIM:0, WAIT_PIN:1, WAIT_PUK:2, PUK_LOCKED:3, LOADING:4};
        if(config.WIFI_SUPPORT_QR_SWITCH){
            var wifiInfo = service.getWifiBasic();
            self.showQRCode = config.WIFI_SUPPORT_QR_CODE && wifiInfo.show_qrcode_flag;
        }else{
            self.showQRCode = config.WIFI_SUPPORT_QR_CODE;
        }
        // self.qrcodeSrc = './img/qrcode_ssid_wifikey.png?_=' + $.now();
        self.isHomePage = ko.observable(false);
        if(window.location.hash=="#home"){
            self.isHomePage(true);
        }

        var info = service.getLoginData();
        self.PIN = ko.observable();
        self.PUK = ko.observable();
        self.newPIN = ko.observable();
        self.confirmPIN = ko.observable();
        self.pinNumber = ko.observable(info.pinnumber);
        self.pukNumber = ko.observable(info.puknumber);
        self.isHidePin = ko.observable(true);
        var auto_simpin_flag = false;
        if(((info.modem_main_state == "modem_waitpuk" || info.pinnumber == 0) && info.puknumber != 0) && info.auto_simpin == "1"){
            self.isHidePin(false);
            auto_simpin_flag = true;
        }
        var state = computePageState(info);
        self.page = ko.observable(state);
        if (state == self.pageState.LOADING) {
            addTimeout(refreshPage, 500);
        }
		self.showOpModeWindow = function () {
            showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
            });
        };
		self.isLoggedIn = ko.observable(false);
        self.enableFlag = ko.observable(false);
        /**
         * 更新当前工作模式状态信息
         * @event refreshOpmodeInfo
         */
		 self.refreshOpmodeInfo = function () {
		    var obj = service.getStatusInfo();
		    self.isLoggedIn(obj.isLoggedIn);
			
			if(!curCableMode && checkCableMode(obj.blc_wan_mode)){//如果有线，则重新加载
				if(self.page() == self.pageState.NO_SIM || self.page() == self.pageState.WAIT_PIN || self.page() == self.pageState.WAIT_PUK || self.page() == self.pageState.PUK_LOCKED){
				    window.location.reload();
				}
			}
			
		    curCableMode = checkCableMode(obj.blc_wan_mode);
			self.hasParentalControl(config.HAS_PARENTAL_CONTROL && curCableMode);
		    if (curCableMode && obj.ethWanMode.toUpperCase() == "DHCP") {
		        self.enableFlag(true);
		    } else if ((!curCableMode && obj.connectStatus != "ppp_disconnected") || (curCableMode && obj.rj45ConnectStatus != "idle" && obj.rj45ConnectStatus != "dead")) {
		        self.enableFlag(false);
		    } else {
		        self.enableFlag(true);
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
		}
		if (self.hasRj45) {
            self.refreshOpmodeInfo();
		    addInterval(function () {
                self.refreshOpmodeInfo();
            }, 1000);		    
		}
		
        /**
         * 验证输入PIN事件处理
         *
         * @event enterPIN
         */
        self.enterPIN = function () {
            showLoading();
            self.page(self.pageState.LOADING);
            var pin = self.PIN();
            service.enterPIN({
                PinNumber:pin
            }, function (data) {
                if (!data.result) {
                    hideLoading();
                    if(self.pinNumber() == 2){
                        showAlert("last_enter_pin", function () {
                        refreshPage();
                        });
                    }
                    else{
                        showAlert("pin_error", function () {
                        refreshPage();
                        });
                    }
                    self.PIN('');
                }
                refreshPage();
                if (self.page() == self.pageState.WAIT_PUK) {
                    hideLoading();
                }
            });
        };
        /**
         * 输入PUK设置新PIN事件处理
         *
         * @event enterPUK
         */
       if(auto_simpin_flag){
             self.enterPUK = function () {
            showLoading();
            self.page(self.pageState.LOADING);
            var params = {};
            params.PUKNumber = self.PUK();
            service.enterOnlyPUK(params, function (data) {
                if (!data.result) {
                    hideLoading();
                    if(self.pukNumber() == 2){
                        showAlert("last_enter_puk", function () {
                        refreshPage();
                        });
                    }
                    else{
                        showAlert("puk_error", function () {
                            refreshPage();
                            if (self.page() == self.pageState.PUK_LOCKED) {
                                hideLoading();
                            }
                        });  
                    }
                    self.PUK('');
                }else{
                    refreshPage();
                    if (self.page() == self.pageState.PUK_LOCKED) {
                        hideLoading();
                    }
                }
            });
        };
       }else{
         self.enterPUK = function () {
            showLoading();
            self.page(self.pageState.LOADING);
            var newPIN = self.newPIN();
            var confirmPIN = self.confirmPIN();
            var params = {};
            params.PinNumber = newPIN;
            params.PUKNumber = self.PUK();
            service.enterPUK(params, function (data) {
                if (!data.result) {
                    hideLoading();
                    if(self.pukNumber() == 2){
                        showAlert("last_enter_puk", function () {
                        refreshPage();
                        });
                    }
                    else{
                        showAlert("puk_error", function () {
                            refreshPage();
                            if (self.page() == self.pageState.PUK_LOCKED) {
                                hideLoading();
                            }
                        });  
                    }
                    self.PUK('');
                    self.newPIN('');
                    self.confirmPIN('');
                }else{
                    refreshPage();
                    if (self.page() == self.pageState.PUK_LOCKED) {
                        hideLoading();
                    }
                }
            });
        };
       }
        /**
         * 刷新页面状态
         *
         * @method refreshPage
         */
        function refreshPage() {
            var data = service.getLoginData();
            var state = computePageState(data);
            if (state == self.pageState.LOADING) {
                addTimeout(refreshPage, 500);
            } else {
                self.page(state);
                self.pinNumber(data.pinnumber);
                self.pukNumber(data.puknumber);
            }
        }

        /**
         * 根据登录状态和SIM卡状态设置页面状态
         * @method computePageState
         */
        function computePageState(data) {
            var state = data.modem_main_state;
            if (state == "modem_sim_undetected" || state == "modem_undetected" || state == "modem_sim_destroy") {
                return self.pageState.NO_SIM;
            } else if ($.inArray(state, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                return self.pageState.LOADING;
            } else if (state == "modem_waitpin") {
                return self.pageState.WAIT_PIN;
            } else if ((state == "modem_waitpuk" || data.pinnumber == 0) && (data.puknumber != 0)) {
                return self.pageState.WAIT_PUK;
            } else if ((data.puknumber == 0 || state == "modem_sim_destroy") && state != "modem_sim_undetected" && state != "modem_undetected") {
                return self.pageState.PUK_LOCKED;
            } else {
                location.reload();
            }
        }


    }

    function init() {
        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new simVM();
        ko.applyBindings(vm, container);

        $('#frmPIN').validate({
            submitHandler:function () {
                vm.enterPIN();
            },
            rules:{
                txtPIN:"pin_check"
            }
        });

        $('#frmPUK').validate({
            submitHandler:function () {
                vm.enterPUK();
            },
            rules:{
                txtNewPIN:"pin_check",
                txtConfirmPIN:{equalToPin:"#txtNewPIN"},
                txtPUK:"puk_check"
            }
        });
    }

    return {
        init:init
    };
});