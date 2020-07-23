/**
 * DDNS设置模块
 * @module DDNS
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
	var ddnsSetModes = _.map(config.DDNSSetMode, function(item) {
		return new Option(item.name, item.value);
	});

	var ddnsProviderList = _.map(config.DDNSDDP, function(item){
		return new Option(item.name, item.value);
	});

	var ddns_mode_select = _.map(config.ddns_Modeselect, function(item){
		return new Option(item.name, item.value);
	});
    /**
     * DDNS设置view model
     * @class ddnsViewModel
     */
	function DdnsViewModel(){
        var self = this;
		
        service.bindCommonData(self);
	    service.advanceHide();   	
        var data = service.getDdnsParams();
        self.ddnsSetModes = ko.observableArray(ddnsSetModes);
        self.ddnsProviderList = ko.observableArray(ddnsProviderList);
        self.ddns_mode_select = ko.observableArray(ddns_mode_select);
        self.currentMode = ko.observable(data.DDNS_Enable);
        self.currentModeselect = ko.observable(data.DDNS_Mode);
        self.currentProviderList = ko.observable("dyndns.org");
        $.each(config.DDNSDDP,function(i,n){
            if(data.DDNSProvider==n.value){
                self.currentProviderList(data.DDNSProvider);
            }
        });
        self.DDNSaccount = ko.observable(data.DDNSAccount);
        self.DDNSpasswd = ko.observable(data.DDNSPassword);
        self.DDNSname = ko.observable(data.DDNS);
        self.DDNS_HashValue = ko.observable(data.DDNS_Hash_Value);
        self.isddnsStatusTrans = ko.observable();
			
        self.isEnableSet = ko.observable();
        self.isHashValue = ko.observable();
        self.isddnsaccount = ko.observable();
        self.isddnspasswd = ko.observable();
        self.isDDNSStatus = ko.observable();
        self.isddnsdomainName = ko.observable();
        self.isNone = ko.observable();
        self.onStates = ko.observable();

        self.showPassword_ddns = ko.observable(false);
        self.showPasswordHandler_ddns = function () {
            $("#ddns_passwd_input").parent().find(".error").hide();
            var checkbox = $("#showPassword_ddns:checked");
            if (checkbox && checkbox.length == 0) {
                self.showPassword_ddns(true);
            } else {
                self.showPassword_ddns(false);
            }
        };
        changeddnsProviderList();
        /**
         * 动态DNS服务器选项切换事件
         * @method changeDdnsProvider
         */		
        self.changeDdnsProvider = function(){
            if(data.DDNSProvider == self.currentProviderList()){
                self.DDNSaccount(data.DDNSAccount);
                self.DDNSpasswd(data.DDNSPassword);
                self.DDNSname(data.DDNS);
            }else{
                self.DDNSaccount("");
                self.DDNSpasswd("");
                self.DDNSname("");
            }
            changeddnsProviderList();
        };
        changeSetDdnsMode();
        self.changeSetDdnsMode = function(){
            changeSetDdnsMode();
        };
        updateScanStatus();

        /**
         * 提交
         * @method apply
         */
        self.apply = function() {
            showLoading();
            var params = {};
            params.goformId = "DDNS";
            params.DDNS_Enable = self.currentMode();
            if(self.currentMode() == "1") {
                params.DDNS_Mode = self.currentModeselect();
				if(self.currentProviderList() == "dyndns.org") {
                    params.DDNSProvider = "dyndns";
                }else if(self.currentProviderList() == "no-ip.com"){
                	params.DDNSProvider = "no-ip";
                }
                //params.DDNSProvider = self.currentProviderList();
                if(self.currentProviderList() != "none") {
                    params.DDNSAccount = self.DDNSaccount();
                    params.DDNSPassword = self.DDNSpasswd();
                    params.DDNS = self.DDNSname();
                }
                if(self.currentProviderList() == "freedns.afraid.org") {
                    params.DDNS_Hash_Value = self.DDNS_HashValue();
                }

            }

            service.setDDNSForward(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                    data = service.getDdnsParams();
                } else {
                    errorOverlay();
                }
            });			
        };
        /**
         * DDNS启用关闭切换事件
         * @method changeSetDdnsMode
         */
    function changeSetDdnsMode() {
        if(self.currentMode() == "1") {
            self.isEnableSet(true);
        } else {
            self.isEnableSet(false);
        }
        return true;
    }

   /**
	 * 实时刷新扫描状态
	 * @method updateScanStatus
	 */

    function updateScanStatus() {
        var trans = "";
        $.getJSON("/goform/goform_get_cmd_process", {
            cmd : "getddns_status",
			isTest : false,
            "_" : new Date().getTime()
        }, function(data) {
        	//console.log(data);
            if (data.getddns_status == "0"|| data.getddns_status == "7" || data.getddns_status == "8") {
                trans = "register successful";
                self.onStates(true);
            }else if(data.getddns_status == "1"){
                trans = "domain invalid";
                self.onStates(true);
            }else if(data.getddns_status == "2"){
                trans = "user or pass";
                self.onStates(true);
            }else if(data.getddns_status == "4"){
                trans = "unknown error";
                self.onStates(true);
            }else if(data.getddns_status == "5"){
                trans = "domain error";
                self.onStates(true);
            }else if(data.getddns_status == "6"){
                trans = "server block";
                self.onStates(true);
            }else if(data.getddns_status == "-1"){
                self.onStates(false);
            }else{
                trans = "registering";
                self.onStates(true);
            }
            self.isddnsStatusTrans($.i18n.prop(trans));	
            addTimeout(updateScanStatus, 2000);
        });
    }

    function changeddnsProviderList() {
        if(self.currentProviderList() == "none"){
                self.isddnsaccount(false);
                self.isddnspasswd(false);
                self.isddnsdomainName(false);
                self.isHashValue(false);
                self.isDDNSStatus(false);		
        } else{
                self.isddnsaccount(true);
                self.isddnspasswd(true);
                self.isddnsdomainName(true);
                self.isHashValue(true);
                self.isDDNSStatus(true);
        }
        if(self.currentProviderList() == "freedns.afraid.org"){
                self.isHashValue(true);
        } else {
                self.isHashValue(false);
        }
        return true;
    }
}
    /**
     * 初始化
     * @method init
     */
	function init() {
		if(this.init){
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DdnsViewModel();
		ko.applyBindings(vm, container[0]);
	
		$("#ddnsForm").validate({
			submitHandler: function(){
				vm.apply();
			},
            rules: {
				ddns_passwd_input:"password_check",
				DDNS_Hash_Value:"ddns_hashvalue_check",
                ddns_passwd_inputshow:"password_check"
            },errorPlacement:function (error, element) {
                var id = element.attr("id");
                if (id == "ddns_passwd_input" ) {
                    error.insertAfter("#lblShowPassword");
                } else if (id == "ddns_passwd_inputshow" ){
                    error.insertAfter("#lblShowPassword");
                }else {
                    error.insertAfter(element);
                }
            }
        });
    }
    
    return {
        init: init
    };
});