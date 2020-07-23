/**
 * 选网模块
 * @module net_select
 * @class net_select
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	
    var info = getNetSelectInfo();
    for(var i =0;i<config.AUTO_MODES.length;i++){
        if(config.AUTO_MODES[i].name == "2G Only"){
            if('1' == info.tz_close_gms){
                config.AUTO_MODES.splice(i,1);
            }
        }
    }
	var selectModes = _.map(config.AUTO_MODES, function(item) {
		return new Option(item.name, item.value);
	});
	
    /**
     * 选网功能view model
     * @class NetSelectVM
     */
	function NetSelectVM() {
        var random = "#" + Math.random();
        $("#netSelectForm").attr("action",random);
		var self = this;
        self.types = ko.observableArray(selectModes);
		self.selectedType = ko.observable();
		self.selectMode = ko.observable();
		self.networkList = ko.observableArray([]);
		self.selectNetwork = ko.observable('');

		service.bindCommonData(self);
        service.connectedHide(self);
        self.networkStatus = function(data) {
            return $.i18n.prop(getNetworkStatus(data.nState));
        };

        self.networkStatusId = function(data) {
            return getNetworkStatus(data.nState);
        };

		self.networkText = function(data) {
			return data.strNumeric;
		};

        self.operatorName = function(data) {
            return data.strShortName;
        };

        self.networkType = function(data) {
            var result = getNetworkType(data.nRat);
            if(result == "auto")
                result = $.i18n.prop("auto");
            return result;
        };
		
        self.subnetworkType = function(data) {
            var result = getSubNetworkType(data.nRat, data.SubAct); 
            return result;
        };

        self.networkTypeId = function(data) {
            return getNetworkType(data.nRat);
        };
		
        self.subnetTypeId = function(data) {
            return getSubNetworkType(data.nRat, data.SubAct); 
        };

		self.networkValue = function(data) {
			var result = [];
			result.push(data.strNumeric);//strNumeric
			result.push(data.nRat);//nRat
			result.push(data.SubAct);
			return result.join(',');
		};

        /**
         * 自动选网时设置网络模式
         * @method save
         */
		self.save = function() {
            if(getNetSelectInfo().ppp_status == "ppp_connected")
            {
                showAlert("please_disconnected");
                return false;
            }
			showLoading();	
			//AutoSelect call SetBearerPreference
			var params = {};
			params.strBearerPreference = self.selectedType();
			service.setBearerPreference(params, function(result) {
				if (result.result == "success") {
                    self.networkList([]);
					successOverlay();
				} else {
					errorOverlay();
				}
			});
		};

        /**
         * 手动搜网
         * @method search
         */
		self.search = function() {
			showLoading('searching_net');
			service.scanForNetwork(function(result, networkList) {
				hideLoading();
				if (result) {
					self.networkList(networkList);
                    for (var i = 0; i < networkList.length; i++) {
                        var n = networkList[i];
                        if (n.nState == '2') {
                            self.selectNetwork(n.strNumeric + ',' + n.nRat + ',' + n.SubAct);
                            return;
                        }
                    }
				} else {
					self.networkList([]);
				}
			});
		};

        /**
         * 注册选择的网络
         * @method register
         */
		self.register = function() {
			showLoading('registering_net');
			var networkToSet = self.selectNetwork().split(',');
			service.setNetwork(networkToSet[0], parseInt(networkToSet[1]), parseInt(networkToSet[2]), function(result) {
				if (result) {
					self.networkList([]);
					var autoType = service.getNetSelectInfo();
					self.selectedType(autoType.net_select);
					successOverlay();
				} else {
					errorOverlay();
				}
			});
		};

        // self.checkEnable = function() {
        //     var status = service.getStatusInfo();
        //     if (checkConnectedStatus(status.connectStatus) || status.connectStatus == "ppp_connecting") {
        //         self.enableFlag(false);
        //     }
        //     else {
        //         self.enableFlag(true);
        //     }
        // };

		//init data
		// self.checkEnable();
        
		if ("manual_select" == info.net_select_mode || "manual_select" == info.m_netselect_save){
			self.selectMode("manual_select");
		}
		else {
			self.selectMode("auto_select");
		}
        self.selectedType(service.getNetSelectInfo().net_select);

	}


    /**
     * 获取网络选择信息
     * @method getNetSelectInfo
     */
	function getNetSelectInfo() {
		return service.getNetSelectInfo();
	}

    /**
     * 搜网结果中的状态转换为对应的语言项
     * @method getNetworkStatus
     * @param {String} status
     * @return {String}
     */
	function getNetworkStatus(status) {
		if ("0" == status){		
			return "unknown";
		}else if ("1" == status){
			return "available";
		}else if ("2" == status){
			return "current";
		}else if ("3" == status){
			return "forbidden";
		}
	}

    /**
     * 网络类型转换
     * @method getNetworkType
     * @param {String} type
     * @return {String}
     */
	function getNetworkType(type)
	{
	    if("0" == type) {
			return "2G";
		}else if ("2" == type){
			return "3G";
		}else if("7" == type){
            return "4G";
        }else{
			return "auto";
		}
	}
	
    /**
     * 子网络类型转换
     * @method getSubNetworkType
     * @param {String} type
     * @return {String}
     */
    function getSubNetworkType(type, subtype)
    {
        var type_3g = [2, 4, 5, 6, 8];
        if ("0" == subtype){
            if($.inArray(type, type_3g) != -1){
                subtype = "TD-SCDMA";
            }else if("7" == type){
                subtype = "TD-LTE";
            }else{
                subtype = "TDD";
            }
        }else if ("1" == subtype){
            if($.inArray(type, type_3g) != -1){
                subtype = "WCDMA";
            }else if("7" == type){
                subtype = "FDD-LTE";
            }else{
                subtype = "FDD";
            }
        }else{
            subtype = "";
        }
        return subtype;
    }

    /**
     * 初始化选网功能view model
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(CONNECTION_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new NetSelectVM();
		ko.applyBindings(vm, container[0]);
	}

	return {
		init : init
	};
});
