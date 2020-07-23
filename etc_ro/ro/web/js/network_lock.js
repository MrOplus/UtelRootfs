/**
 * network_lock 模块
 * @module network_lock
 * @class network_lock
 */
define(['knockout', 'service', 'jquery', 'config/config', 'home'], function (ko, service, $, config, home) {

    function lockVM() {
        var self = this;
		var curCableMode = false;
        self.isCPE = config.PRODUCT_TYPE == 'CPE';
        self.hasRj45 = config.RJ45_SUPPORT;
        self.hasSms = config.HAS_SMS;
        self.hasPhonebook = config.HAS_PHONEBOOK;
        self.isSupportSD = config.SD_CARD_SUPPORT;
		self.hasParentalControl = ko.observable(config.HAS_PARENTAL_CONTROL && curCableMode);
        self.deviceInfo = ko.observable([]);
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

        self.supportUnlock = config.NETWORK_UNLOCK_SUPPORT;
        self.unlockCode = ko.observable();

        var info = service.getNetworkUnlockTimes();
        self.times = ko.observable(info.unlock_nck_time);
        /**
         * 解锁
         * @event unlock
         */
        self.unlock = function () {
            showLoading();
            service.unlockNetwork({
                unlock_network_code: self.unlockCode()
            }, function (data) {
                self.unlockCode("");
                if (data && data.result == "success") {
                    successOverlay();
                    if (window.location.hash == "#home") {
                        setTimeout(function () {
                            window.location.reload();
                        }, 500);
                    } else {
                        window.location.hash = "#home";
                    }
                } else {
                    var info = service.getNetworkUnlockTimes();
                    self.times(info.unlock_nck_time);
                    errorOverlay();
                }
            })
        };
        /**
         * 显示工作模式设置窗口
         * @event showOpModeWindow
         */		
        self.showOpModeWindow = function () {
            showSettingWindow("change_mode", "opmode/opmode_popup", "opmode/opmode_popup", 400, 300, function () {
            });
        };
        self.isLoggedIn = ko.observable(false);
        self.enableFlag = ko.observable(false);
        /**
         * 更新工作模式状态
         * @event refreshOpmodeInfo
         */	
		self.refreshOpmodeInfo = function () {
		    var obj = service.getStatusInfo();
		    self.isLoggedIn(obj.isLoggedIn);
			
			if(!curCableMode && checkCableMode(obj.blc_wan_mode)){//如果有线，则重新加载
				window.location.reload();
				return;
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
        /**
         * 定时检查工作模式状态
         */	
		if (self.hasRj45) {
            self.refreshOpmodeInfo();
		    addInterval(function () {
                self.refreshOpmodeInfo();
            }, 1000);
        }
	}	
        /**
         * 页面初始化
         * @event init
         */			
    function init() {
        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new lockVM();
        ko.applyBindings(vm, container);

        $("#frmNetworkLock").validate({
            submitHandler: function () {
                vm.unlock();
            },
            rules: {
                txtLockNumber: "unlock_code_check"
            }
        });
    }

    return {
        init: init
    };
});