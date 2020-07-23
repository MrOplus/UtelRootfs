/**
 * wifi advance 模块
 * @module wifi advance
 * @class wifi advance
 */
define(['underscore', 'jquery', 'knockout', 'config/config', 'service', 'jqui'], function(_, $, ko, config, service, jqui) 
{

	function hotsporServerViewModel(){
		var self = this;
		var getHotspotServer = service.getHotspotServer();
		var info = service.getWifiBasic();
		self.hotsporServer = ko.observable(getHotspotServer.hotspot_enable == "1" ? "1" : "0");

		self.hotspotEap = ko.observable(getHotspotServer.hotspot_eap_enable == "1" ? "1" : "0");
		self.radiusIp = ko.observable(getHotspotServer.hotspot_eap_radius_ip);
		self.radiusPort = ko.observable(getHotspotServer.hotspot_eap_radius_port);
		self.radiusPassWd = ko.observable(getHotspotServer.hotspot_eap_radius_secret);
		self.isShowSSIDInfoDiv= ko.observable(false);

		self.hasWlanMacfilter = config.HAS_BLACK_AND_WHITE_FILTER;
		if (config.WIFI_SWITCH_SUPPORT) {
            if (info.wifi_enable == "1") {
                self.isShowSSIDInfoDiv(true);
            } else {
                self.isShowSSIDInfoDiv(false);
            }
        } else {
            self.isShowSSIDInfoDiv(true);//如果不支持软开关，整个SSID信息块显示
        };
        service.bindCommonData(self);
        service.wirelessHide();
		self.saveAct = function(){
			var params ={};
			params.hotsporServer = self.hotsporServer();
			params.hotspotEap = self.hotspotEap();
			params.radiusPort = self.radiusPort();
			params.radiusPassWd = self.radiusPassWd();
			params.radiusIp = self.radiusIp();
			service.setHotspotServer(params,function(data){
				if (data.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
			});
		};
	};


        function init() {
        if(this.init){
            getRightNav(WIRELESS_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new hotsporServerViewModel();
        ko.applyBindings(vm, container[0]);
        $('#hotsporServerssss').validate({
            submitHandler:function () {
                    vm.saveAct();
            },
            rules:{
            	radiusIp: "lanip_check",
                radiusPort:"voip_sip_port_check",
                radiusPassWd:"password_check"
            }
        });
    }

	return {
		init : init
	};
});