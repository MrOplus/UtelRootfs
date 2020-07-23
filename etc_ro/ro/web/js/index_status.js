/**
 * Login 模块
 * @module Login
 * @class Login
 */

define(['jquery', 'knockout', 'config/config', 'service', 'underscore', 'config/menu', "logout"],
    function ($, ko, config, service, _, menu, logout) {
        
        var container = $('#container')[0];
        var pageState = {LOGIN: 0, WAIT_PIN: 1, WAIT_PUK: 2, PUK_LOCKED: 3, LOGGEDIN: 4, LOADING: 5};
        var timer = startLoginStatusInterval();
        var loginLockTimer = 0;
        var getPermissionInfo = service.getAllOnceDatas().tz_account_power;
        var getControlApn = service.getAllOnceDatas().login_enter_apn;
        if (!service.getStatusInfo().isLoggedIn) {
            $("#navContainer").hide(0);
        } else {
            $("#navContainer").show(0);
        }
        if (!service.getAllOnceDatas().isHideLang) {
            $("#language").show(0);
        } else {
            $("#language").hide(0);
        }

        /**
         * 定时检查登录状态
         * @class startLoginStatusInterval
         */
        function startLoginStatusInterval() {
            return setInterval(function () {
                var info = service.getStatusInfo();
                if (!info.isLoggedIn) {
                    gotoLogin();
                    return;
                }
                lastLoginStatus = service.getStatusInfo().isLoggedIn ? "1" : "0";
            }, 1000);
        }

        /**
         * loginViewModel
         * @class loginVM
         */
        function loginVM() {
            var random = "#" + Math.random();
            $("form").each(function () {
                $(this).attr("action", random);
            });
            var self = this;
            var statusInfo = service.getSystemStatus();
            var info2 = service.getStatusInfo();
            var getUnlock = service.getAllOnceDatas();
            self.CSRFToken = service.getToken().token;
            service.bindCommonData(self);
            if(getUnlock.add_special_login_page =="1"){
                $(".hide_login").detach();
                $(".login_logo_img").attr("src","../img/newland.png");  
            }else if(getUnlock.add_special_login_page =="2"){
                $(".hide_login").detach();
                $(".login_logo_img").attr("src","../img/siempre2.png");                      
            }else{
                $(".hide_login2").detach(); 
            }
            
            self.passwordIsNull = function() {
                if(trim($("#txtPwd").val()) == ""){
                    errorOverlay("wifi_password_check");
                }
                return true;

            };

            if((getUnlock.plmn_unlock == "1") && (getUnlock.tz_plmn_is_lock == "1")){
                $("#lockHtml").show();
                $("#themeContainer").hide();
                $("#device_info").hide();
                // $("#lockGoHome").attr("disabled",true);
            }else{
                $("#lockHtml").hide();
                $("#themeContainer").show();
                $("#device_info").show();
            };
            function time_to_sec(s) {
             //计算分钟
            //算法：将秒数除以60，然后下舍入，既得到分钟数
            var h;
            h  =   Math.floor(s/60);
            //计算秒
            //算法：取得秒%60的余数，既得到秒数
            s  =   s%60;
            //将变量转换为字符串
            h    +=    '';
            s    +=    '';
            //如果只有一位数，前面增加一个0
            h  =   (h.length==1)?'0'+h:h;
            s  =   (s.length==1)?'0'+s:s;
            return h+':'+s;
         };
             var unlock_plmn_time,flag=false;
             var tz_unlock_plmn_num_2 = getUnlock.tz_unlock_plmn_num;
             var hours,minutes,seconds;
              if(tz_unlock_plmn_num_2<=0){
                $("#lockCishu").show();
               var timerSetInterval = setInterval(function(){
                      unlock_plmn_time =service.getUnlockPlmn().unlock_plmn_time;
                     $("#showTime").text(time_to_sec(unlock_plmn_time));
                     if(unlock_plmn_time ==0){
                        location.reload();
                     }
                },1000);
            };
             $("#lockText").text($.i18n.prop("lockText")+tz_unlock_plmn_num_2);
            var attempts,starFlag=false,attemptss;
            self.lockApply = function(){  
             var tz_unlock_plmn_num = service.getAllOnceDatas().tz_unlock_plmn_num;                                 
                service.loginLock({
                     lockCode:$("#lockCode").val() 
                 },
                 function(data){
                        if(data.result == "success"){
                                service.getUnlockPlmn();
                                showConfirm("reboot_tips", function () {
                                showLoading("restarting");
                                setTimeout(function(){
                                 location.reload();
                                },40000)
                            service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
                        }else{
                            attempts= tz_unlock_plmn_num - 1;
                            attemptss= tz_unlock_plmn_num - 1;
                             if(attempts<=0){
                                attempts = 0;
                             }
                             if(attemptss == 0){
                                $("#lockCishu").show();
                                    var timerSetInterval = setInterval(function(){
                                          unlock_plmn_time =service.getUnlockPlmn().unlock_plmn_time;
                                         $("#showTime").text(time_to_sec(unlock_plmn_time));
                                         if(unlock_plmn_time<=0){
                                            location.reload();
                                         }
                                    },1000);
                                };
                             
                             $("#lockText").text($.i18n.prop("lockText")+attempts)
                            errorOverlay();
                        }
                        
                    
                 }
             )

            };
            if(service.getAllOnceDatas().add_special_login_page == "4"){
                $("#loginContainer").removeClass("margin-top-50");
                $("#middle_login").show();
                $("#loginContainer").removeClass("margin-bottom-50");
                $("#right_bottom_img").show();
            }else{
                $("#right_bottom_img").hide();
            }
            if(service.getAllOnceDatas().hide_lte_single == 1){
               $(".hide_lte_antenna").detach();
            }

            self.lockGoHome = function(){
               $("#device_info").show();
               $("#lockHtml").hide();
               $("#loginForms").hide();
               $("#themeContainer").show();

            };
            if(getUnlock.is_show_nicolas_web == "yes"){
                $(".id_hide_nicolas").detach();
                $("#sn_nicolas").show();
            }
            self.sn = service.getAllOnceDatas().tz_sn_code;
			self.platformVersion = statusInfo.platform_version;
            self.usimCardStatus = statusInfo.sim_status == "" ? "-" : statusInfo.sim_status;
            self.networkMode = statusInfo.network_type == "" ? "-" : service.getNetworkType(statusInfo.network_type);
            self.wanIPAddress = statusInfo.wan_ip == "" ? "-" : statusInfo.wan_ip;
            // 天线状态
            self.isP21k = (config.VERSION == "p21k") || (config.VERSION == "p21x") || (config.VERSION == "s12") || (config.VERSION == "s10pro");
            self.mainAntenna = statusInfo.main_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            self.auxiliaryAntenna = statusInfo.sub_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            self.isP25 = (config.VERSION =="p25k") || (config.VERSION =="p10x") || (config.VERSION =="p25km");
			self.isP10k = config.VERSION == "p10k";
			self.onlyAntenna = statusInfo.only_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            self.isM60a = config.VERSION == "m60a";
            self.outAntenna = statusInfo.sub_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            //LTE状态参数
            self.serviceStatus = statusInfo.service_status == "" ? "-" : statusInfo.service_status;
            if (statusInfo.service_status != "ok" || info2.cellid_is_lock == "1"){
                self.ipv4DNS = "-";
                self.plmn = "-";
                self.lte_plmn = "-";
                self.physcellid = "-";
                self.rsrq = "-";
                self.rsrp = "-";
                self.sinr = "-";
                self.roaming = "-";
                self.lockBand = "-";
				self.ipv4Status = "disconnected";
                self.mcs = "-";
                self.cqi = "-";
            } else {
                if (statusInfo.dns.indexOf("0.0.0.0") == -1) {
                    self.ipv4DNS = statusInfo.dns == "" ? "-" : statusInfo.dns;
                } else {
                    self.ipv4DNS = statusInfo.dns.replace("0.0.0.0", "-");
                }
                self.plmn = service.getOperatorName(statusInfo.plmn);
                self.lte_plmn = statusInfo.lte_plmn;
                self.physcellid = statusInfo.phy_cell_id == "" ? "-" : statusInfo.phy_cell_id;
                
                self.rsrq = statusInfo.rsrq == "" ? "-" : statusInfo.rsrq;
                self.rsrp = statusInfo.rsrp == "" ? "-" : statusInfo.rsrp;
                self.sinr = statusInfo.sinr == "" ? "-" : Math.round(+(statusInfo.sinr));
                self.roaming = statusInfo.roam == "" ? "-" : statusInfo.roam;
                self.lockBand = statusInfo.lte_band == "" ? "-" : statusInfo.lte_band;
				self.ipv4Status = "connected";
                self.mcs = statusInfo.mcs == "" ? "-" : statusInfo.mcs;
                self.cqi = statusInfo.cqi == "" ? "-" : statusInfo.cqi;       
            }
            if(service.getAllOnceDatas().login_enter_apn == "yes"){
                    self.cellID = statusInfo.cell_id == "" ? "-" : statusInfo.tz_lock_current_cellid;
                }else{
                    if (statusInfo.service_status != "ok" || info2.cellid_is_lock == "1"){
                        self.cellID = "-";
                    }else{
                        self.cellID = statusInfo.cell_id == "" ? "-" : formatCellId(statusInfo.enode_id,statusInfo.cell_id);
                    }
                }
            if (checkConnectedStatus(statusInfo.connectStatus) && statusInfo.limit_switch == '1') {
                //流量统计
                self.uplinkTraffic = statusInfo.uplink_traffic == "" ? "-" : (transUnit(parseInt(statusInfo.uplink_traffic, 10), false));
                self.downlinkTraffic = statusInfo.downlink_traffic == "" ? "-" : (transUnit(parseInt(statusInfo.downlink_traffic, 10), false));
                self.totalTraffic = statusInfo.uplink_traffic == "" ? "-" : (transUnit(parseInt(statusInfo.uplink_traffic, 10) + parseInt(statusInfo.downlink_traffic, 10), false));
                self.uplinkRate = transUnit(statusInfo.uplink_rate, true);
                self.downlinkRate = transUnit(statusInfo.downlink_rate, true);
            }
            else {
                self.uplinkTraffic = '-';
                self.downlinkTraffic = '-';
                self.totalTraffic = '-';
                self.uplinkRate = '-';
                self.downlinkRate = '-';
            }
            if(info2.cellid_is_lock == "1"){
                $("#serviceStatus").html('<span>' + $.i18n.prop("beyond_service") + '</span>');
                $("#usimCardStatus").html('<span>' + $.i18n.prop("beyond_service") + '</span>');
                $("#networkMode").html('<span>' +"-"+ '</span>');
                $("#ipv4Status").html('<span>' + $.i18n.prop("disconnected") + '</span>');
                $("#plmn").html('<span>' + "-" + "/" + "-" + '</span>');
                $("#roaming").html('<span>' + "-" + '</span>');
            }else{
                $("#ipv4Status").html('<span>' + $.i18n.prop(self.ipv4Status) + '</span>');
                if(getUnlock.is_show_nicolas_web == "yes"){
                    $("#plmn").html('<span>' + $.i18n.prop(self.plmn) + '</span>');
                }else{
                    $("#plmn").html('<span>' + $.i18n.prop(self.plmn) + "/" + self.lte_plmn + '</span>');
                }
                $("#roaming").html('<span>' + $.i18n.prop(self.roaming) + '</span>');
                $("#usimCardStatus").html('<span>' + $.i18n.prop(self.usimCardStatus) + '</span>');
                $("#networkMode").html('<span>' + $.i18n.prop(self.networkMode) + '</span>');
                $("#serviceStatus").html('<span>' + $.i18n.prop(self.serviceStatus == 'ok' ? 'normal' : self.serviceStatus) + '</span>');
            }
            self.onlineTime = transSecond2Time(statusInfo.online_time);
            // load data every 3 seconds
            /*addInterval(function () {
                refreshData(self);
            }, 3 * 1000);*/

            /**
             * 是否显示登录按钮
             * @event showLogin
             */
            self.showLogin = function () {
                if(getUnlock.add_special_login_page =="1"){
                    $("#device_info").hide();
                    $("#loginForms").show();
                    $("#loginlink").hide();
                    $("#lockHtml").hide();
                    $("#logoBar").addClass('newLand');
                    $("#statusBar").addClass("newLandGight");
                    // $("#showMexsic").hide();
                    $("#telcelLogoImg").hide();
                    $("#refresh").hide();
                    $("#loginlink").show();
                    $("#refreshStatus").show();
                    var heights = $("#mainContainerPic").height();
                    $("#rightPic").css({height:heights});              
                    $("#txtUsr").focus();
                    $("#telcelLogo").show();
                    return false
                }
            
                if (window.location.hash == "#index_status") {
                    return true;
                } else {
                    return false;
                }
            };
            $("#rightPic").css({height:"790px"});
			self.showRefresh = function () {
                if (window.location.hash == "#index_status") {
                    return true;
                } else {
                    return false;
                }
            };
            self.refreshStatus = function(){
                $("#device_info").show();
                $("#loginForms").hide();
                $("#loginlink").show();
                $("#lockHtml").hide();
                $("#refreshStatus").hide();
            };
            /**
             * 登入系统
             * @event login
             */
            self.login = function () {
                $("#device_info").hide();
                $("#loginForms").show();
                $("#loginlink").hide();
                $("#lockHtml").hide();
                var heights = $("#mainContainerPic").height();
                $("#rightPic").css({height:heights});
                if(getUnlock.add_special_login_page =="0" || getUnlock.add_special_login_page=="" || getUnlock.add_special_login_page=="4")
                {
                    $("#mainContainer").addClass('loginBackgroundBlue');
                    $('#indexContainer').addClass('login-page-bg'); 
           
                }   
                if(getUnlock.add_special_login_page=="1"){
                    $("#refreshStatus").show();
                }             
                $("#txtUsr").focus();
            };
            
    
			self.refresh = function () {
                window.location.reload();
            };

            /**
             * login 事件处理
             * @event login
             */
            self.login2 = function () {
                if (config.LOGIN_SECURITY_SUPPORT && self.accountLocked()) {
                    showAlert("password_error_account_lock_time", function () {
                        setFocus();
                    });
                    return false;
                }
                self.pageState(pageState.LOADING);
                $("#loadingImg").attr("src","img/loading.gif");
                window.clearInterval(timer);
                service.login({
                    password: $("#txtPwd").val(),
                    username: $("#txtUsr").val(),
                    CSRFToken: self.CSRFToken
                }, function (data) {
                    setTimeout(function () {
                        timer = startLoginStatusInterval();
                    }, 1300);
                    if (data.result) {
                        self.pageState(pageState.LOGGEDIN);
                        $("#loadingImg").attr("src","img/loading.gif");
                        if (config.LOGIN_SECURITY_SUPPORT) {
                            self.loginCount(0);
                            self.uiLoginTimer(300);
                            clearInterval(loginLockTimer);
                        }
                        $("#container").empty();
                        var getGuestUserPass = service.getAllOnceDatas();
                        var getControlApn = service.getAllOnceDatas().login_enter_apn
                        var locationHash;
                        if(getPermissionInfo  == "4"){
                            if((getGuestUserPass.tz_change_user =="") || (getGuestUserPass.tz_change_user == null) || (getGuestUserPass.tz_change_password =="") || (getGuestUserPass.tz_change_password == null)){
                                locationHash = "#change_user_password";
                            }else{
                                if(getControlApn == "yes"){
                                    locationHash = "#apn_setting";
                                }else{
                                    locationHash = "#home";
                                }
                            }
                            
                        }else{
                            if(getControlApn == "yes"){
                                locationHash = "#apn_setting";
                            }else   {
                                locationHash = "#home";
                            }
                        }

                        window.location = "?t=" + Math.floor(Math.random() * 10000000) + locationHash;
                        logout.init();
                    } else {
                        self.password("");
                        if (config.LOGIN_SECURITY_SUPPORT) {
                            self.checkLoginData(function () {
                                {
                                    showAlert({
                                        msg: 'user_or_password_error',
                                        params: [config.MAX_LOGIN_COUNT - self.loginCount()]
                                    }, function () {
                                        setFocus();
                                    });
                                }
                            });
                        } else {
                            showAlert("password_error", function () {
                                setFocus();
                            });
                        }
                        self.pageState(pageState.LOGIN);
                        $("#loadingImg").attr("src","img/loading.gif");
                    }
                });
            };

            var data = service.getLoginData();
            var loginStatus = service.getLoginStatus();
            self.username = ko.observable();
            self.password = ko.observable();
            self.PIN = ko.observable();
            self.PUK = ko.observable();
            self.newPIN = ko.observable();
            self.confirmPIN = ko.observable();
            self.pinNumber = ko.observable(data.pinnumber);
            self.pukNumber = ko.observable(data.puknumber);
            self.loginCount = ko.observable(0);
            self.loginSecuritySupport = ko.observable(config.LOGIN_SECURITY_SUPPORT);
            self.leftSeconds = ko.observable(0);
            self.accountLocked = ko.computed(function () {
                return self.loginCount() == config.MAX_LOGIN_COUNT && self.leftSeconds() != '-1';
            });
            self.uiLoginTimer = ko.observable(300);
            self.leftUnlockTime = ko.computed(function () {
                self.leftSeconds();
                var formatted = transSecond2Time(self.uiLoginTimer());
                return formatted.substring(formatted.indexOf(':') + 1, formatted.length);
            });
            self.showEntrance = ko.observable(false);
            self.sharePathInvalid = ko.observable(false);
            if (config.SD_CARD_SUPPORT) {
                service.getSDConfiguration({}, function (data) {
                    self.showEntrance(data.sd_status == "1" && data.share_status == "1" && data.sd_mode == "0");
                    if (self.showEntrance()) {
                        service.checkFileExists({
                            path: data.share_file
                        }, function (data1) {
                            if (data1.status == 'exist' || data1.status == 'processing') {
                                self.sharePathInvalid(false);
                                $("#icon_red").attr('src', 'img/icon_red.png');
                            } else {
                                self.sharePathInvalid(true);
                            }
                        });
                    }
                });
            }

            var state = computePageState(loginStatus, data);
            self.pageState = ko.observable(state);
            if (state == pageState.LOADING) {
                addTimeout(refreshPage, 500);
            }
            setFocus();


            /**
             * 启动倒计时定时器。
             * @method startLoginLockInterval
             */
            self.startLoginLockInterval = function () {
                loginLockTimer = setInterval(function () {
                    service.getLoginData({}, function (data) {
                        if (data.login_lock_time <= 0 || data.psw_fail_num_str == 5) {
                            self.loginCount(0);
                            clearInterval(loginLockTimer);
                        }
                        if (self.leftSeconds() != data.login_lock_time) {
                            self.leftSeconds(data.login_lock_time);
                            self.uiLoginTimer(data.login_lock_time);
                        } else {
                            self.uiLoginTimer(self.uiLoginTimer() > 0 ? self.uiLoginTimer() - 1 : 0);
                        }
                    });
                }, 1000);
            };
            /**
             * 获取登录相关数据
             * @method checkLoginData
             */
            self.checkLoginData = function (cb) {
                service.getLoginData({}, function (r) {
                    var failTimes = parseInt(r.psw_fail_num_str, 10);
                    self.loginCount(config.MAX_LOGIN_COUNT - failTimes);
                    self.leftSeconds(r.login_lock_time);
                    self.uiLoginTimer(r.login_lock_time);
                    if ($.isFunction(cb)) {
                        cb();
                    } else if (self.loginCount() == config.MAX_LOGIN_COUNT) {
                        self.startLoginLockInterval();
                    }
                });
            };

            self.checkLoginData();

            /**
             * 验证输入PIN事件处理
             *
             * @event enterPIN
             */
            self.enterPIN = function () {
                self.pageState(pageState.LOADING);
                $("#loadingImg").attr("src","img/loading.gif");
                var pin = self.PIN();
                service.enterPIN({
                    PinNumber: pin,
                    CSRFToken: self.CSRFToken
                }, function (data) {
                    if (!data.result) {
                        showAlert("pin_error", function () {
                            refreshPage();
                        });
                        self.PIN('');
                    } else {
                        refreshPage();
                    }
                });
            };

            /**
             * 输入PUK设置新PIN事件处理
             *
             * @event enterPUK
             */
            self.enterPUK = function () {
                self.pageState(pageState.LOADING);
                $("#loadingImg").attr("src","img/loading.gif");
                var newPIN = self.newPIN();
                var confirmPIN = self.confirmPIN();
                var params = {};
                params.PinNumber = newPIN;
                params.PUKNumber = self.PUK();
                params.CSRFToken = self.CSRFToken;
                service.enterPUK(params, function (data) {
                    if (!data.result) {
                        showAlert("puk_error", function () {
                            refreshPage();
                        });
                        self.PUK('');
                        self.newPIN('');
                        self.confirmPIN('');
                    } else {
                        refreshPage();
                    }
                });
            };
            /**
             * 刷新页面状态
             *
             * @method refreshPage
             */
            function refreshPage() {
                var data = service.getLoginData();
                var loginStatus = service.getLoginStatus();
                var state = computePageState(loginStatus, data);
                if (state == pageState.LOADING) {
                    addTimeout(refreshPage, 500);
                } else {
                    self.pageState(state);
                    self.pinNumber(data.pinnumber);
                    self.pukNumber(data.puknumber);
                }
                setFocus();
            }

            function setFocus() {
                setTimeout(function () {
                    var txtUsr = $('#txtUsr:visible');
                    var txtPwd = $('#txtPwd:visible');
                    var txtPIN = $('#txtPIN:visible');
                    var txtPUK = $('#txtPUK:visible');

                    if (txtUsr.length > 0) {
                        txtUsr.focus();
                    } else if (txtPwd.length > 0) {
                        txtPwd.focus();
                    } else if (txtPIN.length > 0) {
                        txtPIN.focus();
                    } else if (txtPUK.length > 0) {
                        txtPUK.focus();
                    }
                }, 100);
            }



            /**
             * 根据登录状态和SIM卡状态设置页面状态
             * @method computePageState
             */
            function computePageState(loginStatus, data) {
                //PX-880 先登录再进行PIN验证，由于router设计原因，登录后，PIN验证不在登录页面进行，和数据卡的验证保持一致。
                if (config.LOGIN_THEN_CHECK_PIN) {
                    return checkPinAfterLogin(loginStatus, data);
                } else {
                    return loginAfterCheckPin(loginStatus, data);
                }
            }

            /**
             * 根据登录状态和SIM卡状态返回页面状态
             * @method checkPinAfterLogin
             */
            function checkPinAfterLogin(loginStatus, data) {
                if (loginStatus.status == "loggedIn") {
                    if (state == "modem_waitpin") {
                        return pageState.WAIT_PIN;
                    } else if ((state == "modem_waitpuk" || data.pinnumber == 0) && (data.puknumber != 0)) {
                        return pageState.WAIT_PUK;
                    } else if ((data.puknumber == 0 || state == "modem_sim_destroy")
                        && state != "modem_sim_undetected" && state != "modem_undetected") {
                        return pageState.PUK_LOCKED;
                    } else {
                        return pageState.LOGGEDIN;
                    }
                } else {
                    var state = data.modem_main_state;
                    if ($.inArray(state, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                        return pageState.LOADING;
                    } else {
                        return pageState.LOGIN;
                    }
                }
            }

            /**
             * 根据登录状态和SIM卡状态返回页面状态
             * @method loginAfterCheckPin
             */
            function loginAfterCheckPin(loginStatus, data) {
                if (loginStatus.status == "loggedIn") {
                    return pageState.LOGGEDIN;
                } else {
                    var state = data.modem_main_state;
                    if ($.inArray(state, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                        return pageState.LOADING;
                    } else if (state == "modem_waitpin") {
                        return pageState.WAIT_PIN;
                    } else if ((state == "modem_waitpuk" || parseInt(data.pinnumber) === 0) && (parseInt(data.puknumber) != 0)) {
                        return pageState.WAIT_PUK;
                    } else if ((parseInt(data.puknumber) === 0 || state == "modem_sim_destroy") && state != "modem_sim_undetected" && state != "modem_undetected") {
                        return pageState.PUK_LOCKED;
                    } else {
                        return pageState.LOGIN;
                    }
                }
            }
        }

        function gotoLogin() {
            if (window.location.hash != config.defaultRoute && _.indexOf(config.GUEST_HASH, window.location.hash) == -1) {
                if (!manualLogout && lastLoginStatus == "1") {
                    manualLogout = false;
                    lastLoginStatus = 'UNREAL';
                    showAlert('need_login_again', function () {
                        window.location = "main.html";
                    });
                } else if (lastLoginStatus == 'UNREAL') {
                    //do nothing, only popup need_login_again alert one time
                    return;
                } else {
                    window.location = "main.html";
                }
            }
        }

        /**
         * refresh data
         * @method refreshData
         * */
        function refreshData(vm) {
            var info = service.getSystemStatus();
            var info2 = service.getStatusInfo();
            function countTotalTraffic(uplinkTraffic, downlinkTraffic) {
                var totalTraffic;
                if (uplinkTraffic.indexOf("KB") > 0 && downlinkTraffic.indexOf("KB") > 0) {
                    totalTraffic = parseFloat(uplinkTraffic) + parseFloat(downlinkTraffic);
                    totalTraffic = totalTraffic.toFixed(2) + "KB";
                }
                else if (uplinkTraffic.indexOf("MB") > 0 && downlinkTraffic.indexOf("MB") > 0) {
                    totalTraffic = parseFloat(uplinkTraffic) + parseFloat(downlinkTraffic);
                    totalTraffic = totalTraffic.toFixed(2) + "MB";
                }
                else if (uplinkTraffic.indexOf("GB") > 0 && downlinkTraffic.indexOf("GB") > 0) {
                    totalTraffic = parseFloat(uplinkTraffic) + parseFloat(downlinkTraffic);
                    totalTraffic = totalTraffic.toFixed(2) + "GB";
                }
                else if (uplinkTraffic.indexOf("TB") > 0 && downlinkTraffic.indexOf("TB") > 0) {
                    totalTraffic = parseFloat(uplinkTraffic) + parseFloat(downlinkTraffic);
                    totalTraffic = totalTraffic.toFixed(2) + "TB";
                }
                else {
                    totalTraffic = info.uplink_traffic == "" ? "-" : (transUnit(parseInt(info.uplink_traffic, 10) + parseInt(info.downlink_traffic, 10), false));
                }
                return totalTraffic;

            }
			vm.platformVersion = info.platform_version;
            vm.usimCardStatus = info.sim_status == "" ? "-" : info.sim_status;
            vm.networkMode = info.network_type == "" ? "-" : service.getNetworkType(info.network_type);
            
            //天线状态
            vm.mainAntenna = info.main_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            vm.auxiliaryAntenna = info.sub_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
			vm.onlyAntenna = info.only_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            vm.outAntenna = info.sub_antenna == "1" ? $.i18n.prop("external_antenna") : $.i18n.prop("internal_antenna");
            //LTE状态参数
            vm.serviceStatus = info.service_status == "" ? "-" : info.service_status;
            if (info.service_status != "ok" || info2.cellid_is_lock == "1") {
                vm.plmn = "-";
                vm.lte_plmn = "-";
                vm.ipv4DNS = "-";
                vm.wanIPAddress = "-";
                vm.ipv4Status = "disconnected";
            } else {
                vm.plmn = service.getOperatorName(info.plmn);
                vm.lte_plmn = info.lte_plmn;
                vm.ipv4DNS = info.dns == "" ? "-" : info.dns;
                vm.wanIPAddress = info.wan_ip == "" ? "-" : info.wan_ip;
                vm.ipv4Status = "connected";
            }
            if (info.service_status != "ok" || vm.networkMode =="3G" || info2.cellid_is_lock == "1") {
                vm.physcellid = "-";
                vm.rsrq = "-";
                vm.rsrp = "-";
                vm.sinr = "-";
                vm.roaming = "-";
                vm.lockBand = "-";
                vm.mcs =  "-" ;
                vm.cqi = "-" ;
            } else {
                vm.physcellid = info.phy_cell_id == "" ? "-" : info.phy_cell_id;           
                vm.rsrq = info.rsrq == "" ? "-" : info.rsrq;
                vm.rsrp = info.rsrp == "" ? "-" : info.rsrp;
                vm.sinr = info.sinr == "" ? "-" : Math.round(+(info.sinr));
                vm.roaming = info.roam == "" ? "-" : info.roam;
                vm.lockBand = info.lte_band == "" ? "-" : info.lte_band;
                vm.mcs = info.mcs == "" ? "-" : info.mcs;
                vm.cqi = info.cqi == "" ? "-" : info.cqi;
            }
            if(service.getAllOnceDatas().login_enter_apn == "yes"){
                    vm.cellID = statusInfo.cell_id == "" ? "-" : info.tz_lock_current_cellid;
                }else{
                    if (info.service_status != "ok" || vm.networkMode =="3G" || info2.cellid_is_lock == "1") {
                        vm.cellID = "-";
                    }else{
                        vm.cellID = info.cell_id == "" ? "-" : formatCellId(info.enode_id, info.cell_id);
                    }
                    
                
                }
            if(info2.cellid_is_lock == "1"){
                $("#serviceStatus").html('<span>' + $.i18n.prop("beyond_service") + '</span>');
                $("#usimCardStatus").html('<span>' + $.i18n.prop("beyond_service") + '</span>');
                $("#ipv4Status").html('<span>' + $.i18n.prop("disconnected") + '</span>');
                $("#plmn").html('<span>' + "-" + "/" + "-" + '</span>');
                $("#roaming").html('<span>' + "-" + '</span>');
                $("#networkMode").html('<span>' + "-" + '</span>');
            }else{
                $("#usimCardStatus").html('<span>' + $.i18n.prop(vm.usimCardStatus) + '</span>');
                $("#networkMode").html('<span>' + $.i18n.prop(vm.networkMode) + '</span>');
                $("#ipv4Status").html('<span>' + $.i18n.prop(vm.ipv4Status) + '</span>');
                $("#plmn").html('<span>' + $.i18n.prop(vm.plmn) + "/" + vm.lte_plmn + '</span>');
                $("#roaming").html('<span>' + $.i18n.prop(vm.roaming) + '</span>');
                $("#serviceStatus").html('<span>' + $.i18n.prop(vm.serviceStatus == 'ok' ? 'normal' : vm.serviceStatus) + '</span>');
            }
            if (checkConnectedStatus(info.connectStatus) && info.limit_switch == '1') {
                var uplink = transUnit(parseInt(info.uplink_traffic, 10), false);
                var downlink = transUnit(parseInt(info.downlink_traffic, 10), false);
                var total = countTotalTraffic(uplink, downlink);
                //流量统计
                vm.uplinkTraffic = info.uplink_traffic == "" ? "-" : insert_flg(uplink, ' ', uplink.length - 2);
                vm.downlinkTraffic = info.downlink_traffic == "" ? "-" : insert_flg(downlink, ' ', downlink.length - 2);
                vm.totalTraffic = info.uplink_traffic == "" ? "-" : insert_flg(total, ' ', total.length - 2);
                vm.uplinkRate = transUnit(info.uplink_rate, true);
                vm.downlinkRate = transUnit(info.downlink_rate, true);
            }
            else {
                vm.uplinkTraffic = '-';
                vm.downlinkTraffic = '-';
                vm.totalTraffic = '-';
                vm.uplinkRate = '-';
                vm.downlinkRate = '-';
            }
            vm.onlineTime = transSecond2Time(info.online_time);
            ko.applyBindings(vm, container);
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {

            ko.cleanNode(container);
            var vm = new loginVM();
            ko.applyBindings(vm, container);
            ko.applyBindings(vm, $('#login')[0]);
            ko.applyBindings(vm, $('#refresh')[0]);
			ko.applyBindings(vm, $('#refreshStatus')[0]);

            var info = service.getStatusInfo();
            var locationHash;
            if(getPermissionInfo  == "4"){
                locationHash = "#wifiSwitch";
            }else{
                locationHash = "#home";
            }
            if (info.isLoggedIn) {
                window.location.hash = locationHash;
                return;
            }

            $("#txtPIN").val("");

            $('#frmLogin').validate({
                submitHandler: function () {
                    vm.login2();
                },
                rules: {
                    txtPwd: 'login_password_length_check'
                }
            });
            $('#frmPIN').validate({
                submitHandler: function () {
                    vm.enterPIN();
                },
                rules: {
                    txtPIN: "pin_check"
                }
            });
            $('#frmPUK').validate({
                submitHandler: function () {
                    vm.enterPUK();
                },
                rules: {
                    txtNewPIN: "pin_check",
                    txtConfirmPIN: {equalToPin: "#txtNewPIN"},
                    txtPUK: "puk_check"
                }
            });
        }
        var getNeedSupport = service.getAllOnceDatas();
        var isHide_sms = getNeedSupport.isHidesms;
        var isHide_pb = getNeedSupport.isHidepb;
        var w13_connected = service.getAllOnceDatas().w13_connected;
        ko.applyBindings({"isHide_sms": isHide_sms,"isHide_pb": isHide_pb}, $('#items')[0]);
        var $item_a = $("#items a");
        var menu_count = 7;
        if(isHide_pb == "no")
            menu_count--;
        if(isHide_sms == "no"){
            menu_count--;
            $("#buttom-bubble").hide();
        }
        if(getPermissionInfo != "1"){
            if(w13_connected == "0"){
                menu_count --;
                $(".hide_index_status_wifi").hide();
            }
        }
        


        var menu_width = (931/menu_count)+"px";
        $item_a.css({width:menu_width});  
        return {
            init: init,
            gotoLogin: gotoLogin
        };
    });
