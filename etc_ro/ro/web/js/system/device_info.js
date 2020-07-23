/**
 * 设备状态设置模块
 * @module DeviceInfo
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
	  var CONNECT_STATUS = {CONNECTED: 1, DISCONNECTED: 2, CONNECTING: 3, DISCONNECTING: 4};
	
    /**
     * DDNS设置view model
     * @class DeviceInfoViewModel
     */
	function DeviceInfoViewModel(){
        var self = this;
        var data = service.getDeviceRuninfo();
		
			//add by cwp 0170308 
		self.sw_version = ko.observable(data.sw_version);
		self.hw_version = ko.observable(data.hw_version);
		self.run_time = ko.observable(transSecond2Time_day(data.run_time));
		self.pd_version = ko.observable(data.pd_version);
		self.imei = ko.observable("");
		self.imei(verifyDeviceInfo(data.imei));		
		self.iccid = ko.observable(data.ziccid);
		self.imsi = ko.observable(data.sim_imsi);
		self.device_mac_addr = ko.observable(data.cpe_mac_addr);	
		
		self.FreshParam = function(){
			var data = service.getDeviceRuninfo()
		self.run_time(transSecond2Time_day(data.run_time));;	
		self.connectStatus(data.ppp_status);	
		self.iccid(data.ziccid);;	
		self.imsi(data.sim_imsi);
		};
	}
    /**
     * 初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DeviceInfoViewModel();
		ko.applyBindings(vm, container[0]);
		
		addInterval(function(){
			vm.FreshParam();
			},1000);		
    }
    
    return {
        init: init
    };
});