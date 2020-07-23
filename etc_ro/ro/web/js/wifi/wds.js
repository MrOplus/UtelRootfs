/**
 * wds 模块
 * @module wds
 * @class wds
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {
		var wdsModes = _.map(config.wdsModes, function(item) {
			return new Option(item.name, item.value);
		});
		
		 var securityModes = _.map(config.AUTH_MODES, function (item) {
				return new Option(item.name, item.value);
		 });
	
        /**
         * wdsVM
         * @class wdsVM
         */
        function wdsVM() {
			var info = service.getWdsInfo();
            var self = this;
			self.wdsModes = ko.observableArray(wdsModes);
			self.currentMode = ko.observable(info.currentMode);
			self.showDivForSSID = ko.observable();
			isShowDivForSSID();
			self.changeWdsMode = function(){
				isShowDivForSSID();
			}
			self.wdsSSID = ko.observable(info.wdsSSID);
			self.modes = ko.observable(securityModes);
			self.selectedMode = ko.observable(info.wdsAuthMode);
			self.passPhrase = ko.observable(info.wdsWPAPSK1);
			
			function setWDS() {
				var params = {
					goformId : "WIFI_WDS_SET",
					wifi_wds_mode : self.currentMode(),
					wifi_wds_ssid : self.wdsSSID(),
					wifi_wds_AuthMode : self.selectedMode(),
					wifi_wds_EncrypType : "NONE",
					wifi_wds_WPAPSK1 : self.passPhrase()
				};
				service.setWDS(params, function(data){
					if(data.result == "success") {
						successOverlay();
					} else {
						errorOverlay();
					}
				});
			}
		    /**
		     * 设置WDS
	    	 * @method apply
	         */		
			self.apply = function(){
				var status = service.getWpsInfo();
				if (status.wpsFlag == '1') {
                    showAlert('wps_on_info');
                    return true;
                }
				if(self.currentMode() != "0") {
					showConfirm("enable_wds_confirm", function(){
						setWDS();
					});
				} else {
					setWDS();
				}
			}
			
			function isShowDivForSSID() {
				if(self.currentMode() == "0") {
					self.showDivForSSID(false);
				} else {
					self.showDivForSSID(true);
				}
			}
		}        

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
			var container = $("#container");
			ko.cleanNode(container[0]);
			var vm = new wdsVM();
            ko.applyBindings(vm, container[0]);
			
			$("#wdsForm").validate({
				submitHandler : function(){
					vm.apply();
				},
				rules : {
					repeater_ssid:'ssid',
                    pass:'wifi_password_check'
				}
			});
        }

        return {
            init:init
        };
    });
