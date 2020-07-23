/**
 * APN Setting 模块
 * @module apn_setting
 * @class apn_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

	function getAuthModes(){
		return _.map(config.APN_AUTH_MODES, function(item){
			return new Option(item.name, item.value);
		});
	}
	/**
	 * APNViewModel
	 * @class APNViewModel
	 */
	function APNViewModel(){
		var getControlApn = service.getAllOnceDatas();
		var self = this;
		var apnSettings = service.getMultiAPN();
		self.CSRFToken = service.getToken().token;
		self.filterApn = ko.observable(apnSettings.tz_apn3_enable);
		self.defApn = ko.observable(apnSettings.apn3_profile_name);//当前APN
		self.selectedPdpType = ko.observable(apnSettings.apn3_type);
		self.apn = ko.observable(apnSettings.apn3_wan);
		self.username = ko.observable(apnSettings.apn3_username);
		self.password = ko.observable(apnSettings.apn3_passwd);
		self.selectedAuthentication = ko.observable(apnSettings.apn3_auth_mode);
		self.isConnectStatus = ko.observable(!isConnectedNetWork());
		self.profileName = ko.observable(apnSettings.apn3_profile_name);
		self.authModes = ko.observableArray(getAuthModes());
		service.bindCommonData(self);
		service.connectedHide();
		self.apnEdit = ko.observable(false);
		if(getControlApn.control_apn_edit == "no"){
			self.apnEdit(true);
		}
        if(apnSettings.tz_apn3_enable == 0){
        	$("#apn_form_container").hide()
        }else{
        	$("#apn_form_container").show();
        }
        self.filterApncheck = function(enable){
            enable == '1' ? $("#apn_form_container").show() : $("#apn_form_container").hide();
            return true;
        }
        self.pdpTypes = ko.observableArray(getPdpTypes());
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



         self.saveAct = function(){
				showLoading();	
				var params = {
                profileName: self.profileName(),
				pdpType: self.selectedPdpType(),
                wanApn: self.apn(),
                authMode: self.selectedAuthentication(),
                username: self.username(),
                filterApn: self.filterApn(),
                password: self.password()
                };
                service.addOrEditApn3(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
		};
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
	function isConnectedNetWork(){
		var info = service.getConnectionInfo();
		return checkConnectedStatus(info.connectStatus);
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
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new APNViewModel();
		ko.applyBindings(vm, container[0]);

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