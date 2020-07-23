/**
 * 选网模块
 * @module net_select
 * @class net_select
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	
	var IPv4v6Modes = _.map(config.IPV4V6_MODES, function(item) {
		return new Option(item.name, item.value);
	});	
    /**
     * 选网功能view model
     * @class NetSelectVM
     */
	function NetSelectVM() {
		var self = this;	
		
		self.ipv4v6types = ko.observableArray(IPv4v6Modes);
		
		self.select_ipv4v6_type = ko.observable();
		
		self.isMtuSelect = ko.observable("off");
		self.mtu_value = ko.observable("");
		
		self.selectState = ko.observable();	
		

        /**
         * 自动选网时设置网络模式
         * @method save
         */
		self.save = function() {
			showLoading();
			
			//AutoSelect call SetBearerPreference
			var params = {};
			service.setBearerPreference(params, function(result) {
				if (result.result == "success") {
					successOverlay();
				} else {
					errorOverlay();
				}
			});
		};
		
		
		self.savedns = function(){
			showLoading();
			
			//AutoSelect call setDnsParam
			var params = {};		
			service.setDnsParam(params, function(result) {
				if (result.result == "success") {
					successOverlay();
				} else {
					errorOverlay();
				}
			});			
			
		};
		
		self.setMtuSelect = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#mtusetting:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isMtuSelect("on");
                }else{
                    self.isMtuSelect("off");
                }
            }			
			
		};

        self.checkEnable = function() {
  
        };


		
			
		self.checkEnable();		
	}

    /**
     * 初始化选网功能view model
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new NetSelectVM();
		ko.applyBindings(vm, container[0]);
		
	}

	return {
		init : init
	};
});