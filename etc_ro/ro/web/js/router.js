/**
 * @module router
 * @class router
 */
define([
    'config/menu',
    'jquery',
    'config/config',
    'service',
    'underscore'],
function(menu, $, config, service,_) {
	var currentHash = '';
	var container = $('#container');
    var getPermissionInfo = service.getAllOnceDatas().tz_account_power;
    var getGuestUserPass = service.getAllOnceDatas();
    var getControlApn = service.getAllOnceDatas().login_enter_apn;
    /**
     * 默认入口页面为#home, 定时检查hash状态
     * @method init
     */
	function init() {
		checkSimCardStatus();   
            var locationHash;
            if(getPermissionInfo  == "4"){
                if((getGuestUserPass.tz_change_user =="") || (getGuestUserPass.tz_change_user == null) || (getGuestUserPass.tz_change_password =="") || (getGuestUserPass.tz_change_password == null)){
                    locationHash = "#change_user_password";
                }else{
                    locationHash = "#home";
                }
                
            }else{
                locationHash = "#home";
            }
		window.location.hash = window.location.hash || locationHash;
        //if support onhashchange then use. If ie8 in ie7 mode, it doesn't trigger onhashchange.
        if(('onhashchange' in window) && ((typeof document.documentMode==='undefined') || document.documentMode==8)) {
            window.onhashchange = hashCheck;
            hashCheck();
        } else {
            setInterval(hashCheck, 200);
        }

        //如果修改了页面内容, 离开时给出提示
        $("a[href^='#']").die('click').live('click', function() {
            var $this = $(this);
            config.CONTENT_MODIFIED.checkChangMethod();
            return checkFormContentModify($this.attr('href'));
        });
	}
	
    /**
     * 离开界面时检查是否有内容修改，如果有则提示
     * @method checkFormContentModify
     */
    checkFormContentModify = function(href){
        if(config.CONTENT_MODIFIED.modified && window.location.hash != href) {
            if(config.CONTENT_MODIFIED.message == 'sms_to_save_draft'){
                config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                config.resetContentModifyValue();
                window.location.hash = href;
            } else {
                showConfirm(config.CONTENT_MODIFIED.message, {ok: function() {
                    config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                    config.resetContentModifyValue();
                    window.location.hash = href;
                }, no: function(){
                    var result = config.CONTENT_MODIFIED.callback.no(config.CONTENT_MODIFIED.data);
                    if(!result) {
                        window.location.hash = href;
                        config.resetContentModifyValue();
                    }
                }});
            }
            return false;
        } else {
            return true;
        }
    };

    /**
     * 定时查看SIM卡的状态，若当前SIM卡状态不为就绪状态且未显示
     * nosimcard页面，则显示nosimcard页面
     * 以避免不关闭webui，重新插拔设备后，不再判断SIM卡状态的问题
     * @method checkSimCardStatus
     */
    function checkSimCardStatus(){
        setInterval(function(){
            var data = service.getStatusInfo();
            var match = menu.findMenu();
            if(match.length == 0){
                return false;
            }
            var requirePinHash = ["phonebook/phonebook", "sms/smslist"];
            var isRequirePin = ($.inArray(match[0].path, requirePinHash) != -1);
            if (match[0].checkSIMStatus === true) {
                var simstatus = data.simStatus == "modem_sim_undetected"
                    || data.simStatus == "modem_sim_destroy" || data.simStatus == "modem_waitpin"
                    || data.simStatus == "modem_waitpuk";
                var netlockstatus = data.simStatus == "modem_imsi_waitnck";
                if (data.isLoggedIn && (
                        ($('#div-nosimcard')[0] == undefined && simstatus)
                        || ($('#div-network-lock')[0] == undefined && netlockstatus)
                    ||(($('#div-nosimcard')[0] != undefined || $('#div-network-lock')[0] != undefined)&&data.simStatus == "modem_init_complete"))
                    ) {
                    //fixedLoadResources(match[0], data.simStatus, isRequirePin);
                }
            }
        }, 1000);
    }

	/**
	 * 检查登录页面背景
	 * @method checkLoginPageBg
	 */
	function checkLoginPageBg(){
        var h = window.location.hash;
        if (_.indexOf(config.GUEST_HASH, h) != -1) {
            $("#themeContainer").attr("style","margin-top:-36px;");
        }else{
           
                 $("#themeContainer").attr("style","margin-top:0px;");       
        }

		if(window.location.hash == '#login'){
			$("#mainContainer").addClass('loginBackgroundBlue');
            $('#loginlink').hide();
            $('#backlink').show();
            $('#backlink').attr('href', '');
            
		} else {
			var mainContainer = $("#mainContainer");
             $('#backlink').hide();
			if(mainContainer.hasClass('loginBackgroundBlue')){
				$("#container").css({margin: 0});
				mainContainer.removeClass('loginBackgroundBlue').height('auto');
			}
		}
	}

    /**
     * 比对hash状态, 如果变化则根据新的hash匹配菜单配置,
     * 匹配不上时跳转到home页面, 匹配上时记录hash值并动态加载
     * 对应的资源文件
     * @method hashCheck
     */
    function hashCheck() {
		if(window.location.hash != currentHash) {
            var token = service.getToken().token;
            var random = service.getRandom().random;
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
                    }else{
                        locationHash = "#home";
                    }
            }
            var isIndex = window.location.hash == "#index_status";
            var isIran = window.location.hash == "#iran_login";
            var isHome = window.location.hash == locationHash;
            var isInfo = window.location.hash == "#info";
            var canGo = (random != token);
            if(isIndex || isIran){
                $("#navContainer").detach();
            }
            if( isIndex || isHome || isInfo || canGo ||isIran){
                //设置random和token为相同值
                service.setToken({
                    token: random
                });

                forward();
            }else{
                var hash = "#" + service.getHash().hash;
                window.location.hash = currentHash == "" ? hash : currentHash;
                forward();
            }
		}
	}
	function forward(){
        //解决登陆后后退问题, 登陆用户访问非登录用户时页面不跳转
        var info = service.getStatusInfo();
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
                }else{
                    locationHash = "#home";
                }
        }
        if (window.location.hash == config.defaultRoute || _.indexOf(config.GUEST_HASH, window.location.hash) != -1 || window.location.hash=="#iran_login") {
            if (info.isLoggedIn) {
                window.location.hash = currentHash == "" ? locationHash : currentHash;
                return;
            }
        }
        var match = menu.findMenu();
        if(match.length == 0) {
            var href = window.location.href;
            if( href.indexOf("info") > 0 ){
                config.defaultRoute = "#info";
            }
            if(getGuestUserPass.add_special_login_page == "3" || getGuestUserPass.add_special_login_page == "5"){
                window.location.hash = "#iran_login"; 
            }else{
               window.location.hash = config.defaultRoute; 
            }        
        } else {
            //登录时检查工作模式，有线模式下且主界面需要检查SIM卡状态则重新加载,无线模式且主界面不需要检查SIM卡状态则重新加载
            if(getControlApn == "yes"){
                    if(config.RJ45_SUPPORT && window.location.hash == "#apn_setting"){
                if((match[0].checkSIMStatus && checkCableMode(info.blc_wan_mode)) || (!match[0].checkSIMStatus && !checkCableMode(info.blc_wan_mode))){
                    window.location.reload();
                    return;
                }
            }
            }else{
                if(config.RJ45_SUPPORT && window.location.hash == "#home"){
                if((match[0].checkSIMStatus && checkCableMode(info.blc_wan_mode)) || (!match[0].checkSIMStatus && !checkCableMode(info.blc_wan_mode))){
                    window.location.reload();
                    return;
                }
            }
            }
            //TODO: 二级菜单与对应三级菜单第一项互相切换时不重新加载数据, 与下面的TODO: click the same menu 实现方式互斥
            var oldMenu = menu.findMenu(currentHash);
            currentHash = match[0].hash;
            if(currentHash == "#login") {
                $('#indexContainer').addClass('login-page-bg');
                menu.rebuild();
                if(getGuestUserPass.add_special_login_page == "3" || getGuestUserPass.add_special_login_page == "5"){
                     window.location = "#iran_login";
                }else{
                    window.location = "#index_status";
                }
                
            } else {
                $('#indexContainer').removeClass('login-page-bg');
            }

            if(oldMenu.length != 0 && match[0].path == oldMenu[0].path && match[0].level != oldMenu[0].level && match[0].level != '1' && oldMenu[0].level != '1') {
                return;
            }

            checkLoginPageBg();
            var requirePinHash = ["phonebook/phonebook", "sms/smslist"];
            var isRequirePin = ($.inArray(match[0].path, requirePinHash) != -1);
            if (match[0].checkSIMStatus === true || isRequirePin) {
                //simStatus is undefined when refreshing page
                if (info.simStatus == undefined) {
                    showLoading('waiting');
                    function checkSIM() {
                        var data = service.getStatusInfo();
                        if (data.simStatus == undefined || $.inArray(data.simStatus, config.TEMPORARY_MODEM_MAIN_STATE) != -1) {
                            addTimeout(checkSIM, 500);
                        } else {
                            fixedLoadResources(match[0], data.simStatus, isRequirePin);
                            hideLoading();
                        }
                    }
                    checkSIM();
                } else {
                    fixedLoadResources(match[0], info.simStatus, isRequirePin);
                }
            } else {
                loadResources(match[0]);
            }
        }
    }

    function fixedLoadResources(menuItem, simStatus, isRequirePin) {
        var item = {};
        $.extend(item, menuItem);
        //没有SIM卡时，针对home页面不做处理。
        //网络被锁时，home页面显示解锁页面
        /*if (simStatus == "modem_sim_undetected" || simStatus == "modem_sim_destroy") {
            if (!isRequirePin) {
                item.path = "nosimcard";
            }
        } else */if (simStatus == "modem_waitpin" || simStatus == "modem_waitpuk") {
            item.path = "nosimcard";
        } else if (simStatus == "modem_imsi_waitnck") {
            item.path = "network_lock";
        }
        //load tmpl and controller js
        loadResources(item);
    }

    //TODO: prevent first menu click cover the second menu content, need test with device
    //var loadInterrupt;
    /**
     * 根据菜单配置item加载对应的资源
     * @method loadResources
     * @param {Object} item 菜单对象
     */
    function loadResources(item) {
        var pId = item.path.replace(/\//g, '_');
        var $body = $('body').removeClass();
        if (pId != 'login' && pId != 'home') {
            $body.addClass('beautiful_bg page_' + pId);
        } else {
            $body.addClass('page_' + pId);
        }
        clearTimer();
        hideLoading();
        var tmplPath = 'text!tmpl/' + item.path + '.html';
        //TODO: prevent first menu click cover the second menu content, need test with device
        require([tmplPath, item.path], function (tmpl, viewModel) {
            container.stop(true, true);
            container.hide();
            container.html(tmpl);
            if(viewModel != undefined){
                viewModel.init();
            }
            //support backward/forward
            menu.refreshMenu();
            $('#container').translate();
            menu.activeSubMenu();

            $("form").attr("autocomplete", "off");
            container.fadeIn();
		});
	}

	return {
		init: init
	};
});