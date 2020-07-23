/**
 * 联网设置模块
 * @module dial_setting
 * @class dial_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * 联网设置view model
     * @class DialVM
     */
	function DialVM() {
		var mode = service.getlockbandinfo();
		var self = this;
		
		//add by cwp at 20170311
		self.isBand1Select = ko.observable(mode.band1);
		self.isBand3Select = ko.observable(mode.band3);
		self.isBand5Select = ko.observable(mode.band5);
		self.isBand7Select = ko.observable(mode.band7);
		self.isBand8Select = ko.observable(mode.band8);
		self.isBand20Select = ko.observable(mode.band20);		
		self.isBand38Select = ko.observable(mode.band38);
		self.isBand39Select = ko.observable(mode.band39);
		self.isBand40Select = ko.observable(mode.band40);
		self.isBand41Select = ko.observable(mode.band41);

		self.setBand1Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand1Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand1Select("on");
                }else{
                    self.isBand1Select("off");
                }
            }			
		};
		self.setBand3Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand3Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand3Select("on");
                }else{
                    self.isBand3Select("off");
                }
            }			
		};		
		self.setBand5Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand5Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand5Select("on");
                }else{
                    self.isBand5Select("off");
                }
            }			
		};	
		self.setBand7Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand7Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand7Select("on");
                }else{
                    self.isBand7Select("off");
                }
            }			
		};	
		self.setBand8Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand8Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand8Select("on");
                }else{
                    self.isBand8Select("off");
                }
            }			
		};	
		self.setBand20Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand20Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand20Select("on");
                }else{
                    self.isBand20Select("off");
                }
            }			
		};			
		self.setBand38Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand38Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand38Select("on");
                }else{
                    self.isBand38Select("off");
                }
            }			
		};			
		self.setBand39Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand39Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand39Select("on");
                }else{
                    self.isBand39Select("off");
                }
            }			
		};			
		self.setBand40Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand40Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand40Select("on");
                }else{
                    self.isBand40Select("off");
                }
            }			
		};			
		self.setBand41Select = function(){
            if(!$("#roamBtn").hasClass("disable")){
                var checkbox = $("#isBand41Select:checked");
                if(checkbox && checkbox.length == 0 ){
                    self.isBand41Select("on");
                }else{
                    self.isBand41Select("off");
                }
            }			
		};			
		self.savebandconfig = function(){
            showLoading();
			
            service.setlockbandcfg({
                band1: self.isBand1Select(),
				band3: self.isBand3Select(),
				band5: self.isBand5Select(),
				band7: self.isBand7Select(),
				band8: self.isBand8Select(),
				band20: self.isBand20Select(),
				band38: self.isBand38Select(),
				band39: self.isBand39Select(),
				band40: self.isBand40Select(),
				band41: self.isBand41Select(),
            }, function (result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });			
			
		};
// cwp add end 		
	

        var checkbox = $(".checkboxToggle");
        self.checkEnable = function() {
            var status = service.getStatusInfo();

            if (checkConnectedStatus(status.connectStatus) || status.connectStatus == "ppp_connecting") {
                self.enableFlag(false);
                disableCheckbox(checkbox);
            }
            else {
                self.enableFlag(true);
                enableCheckbox(checkbox);
            }
        };

	}

    /**
     * 联网设置初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DialVM();
		ko.applyBindings(vm, container[0]);
 //       addInterval( vm.checkEnable, 1000);
	}
	
	return {
		init: init
	};
});