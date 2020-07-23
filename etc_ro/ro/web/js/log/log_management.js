/**
 * PINT TEST设置模块
 * @module PING Test
 * @class PING Test
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
/*	var ddnsSetModes = _.map(config.DDNSSetMode, function(item) {
		return new Option(item.name, item.value);
	});

	var ddnsProviderList = _.map(config.DDNSDDP, function(item){
		return new Option(item.name, item.value);
	});

	var ddns_mode_select = _.map(config.ddns_Modeselect, function(item){
		return new Option(item.name, item.value);
	});*/
    /**
     * PING TEST设置view model
     * @class PingTestViewModel
     */
	function LogManagerViewModel(){
        var self = this;
		
/*       self.hasUssd = config.HAS_USSD;
        self.hasUsb = config.HAS_USB;
      self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
        self.hasTr069 = config.TR069_SUPPORT;
		var data = service.getDeviceLog();
		self.device_log_show = ko.observable(data.device_log_info);*/
		self.device_log_show = ko.observable();
		
		self.GetDeviceIogInfo = function(){
			$.ajax({
				url:"/webshow_messages?rd=" + new Date(),
				success:function(data){self.device_log_show(data)}
			});
			
		};
	
		self.deletelog = function(){
			var params = {};
			params.cmd = "delete";
			service.SendDeviceLogCmd(params, function(result) {
				if (result.result == "success") {
					self.device_log_show("");
					successOverlay();
				} else {
					errorOverlay();
				}
			});			
		};	

	
		self.refreshlog = function(){
		var params = {};
			params.cmd = "open";
			service.SendDeviceLogCmd(params, function(result) {
				if (result.result == "success") {
					successOverlay();
					self.GetDeviceIogInfo();
				} else {
					errorOverlay();
				}
			});	
		};	
	
		self.openlog = function(){
		var params = {};
			params.cmd = "open";
			service.SendDeviceLogCmd(params, function(result) {
				if (result.result == "success") {
//				successOverlay();
					self.GetDeviceIogInfo();
					
				} else {
//					errorOverlay();
				}
			});
		};			
		self.openlog();

}


    /**
     * 初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new LogManagerViewModel();
		ko.applyBindings(vm, container[0]);
		
		addInterval(function(){
			vm.openlog();
			},1000);
    }
    
    return {
        init: init
    };
});

