/**
 * others 模块
 * @module others:Restart and Reset、Turn Off Device、Fast Boot Settings、SNTP、PIN Management
 * @class others
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
		
		var timeSetModes = _.map(config.sntpTimeSetMode, function(item) {
			return new Option(item.name, item.value);
		});
		
		var timeZones = _.map(config.timeZone, function(item){
			return new Option(item.name, item.value);
		});
		
		var daylightSave = _.map(config.daylightSave, function(item){
			return new Option(item.name, item.value);
		});
		
		var sntpYears = [];
		var sntpMonths = [];
		var sntpDates = []
		var sntpHours = [];
		var sntpMinutes = [];
		
		
		var bigMonth = [1, 3, 5, 7, 8, 10, 12];
		var smallMonth = [4, 6, 9, 11];
		
		function produceArray(start, end, arrName) {
			var item = {};
			for(var i = start; i <= end; i++) {
				item.name = i;
				item.value = i;
				arrName.push(new Option(item.name, item.value));
			}
		}
		
		//生成年、月、时、分的数组
		produceArray(2000, 2020, sntpYears);
		produceArray(1, 12, sntpMonths);
		produceArray(0, 23, sntpHours);
		produceArray(0, 59, sntpMinutes);			
		
        /**
         * othersViewModel
         * @class othersVM
         */
        function othersVM() {
            var self = this;
            self.fastbootSupport = config.FAST_BOOT_SUPPORT;
            self.turnOffSupport = config.TURN_OFF_SUPPORT;
            self.hasUssd = config.HAS_USSD;
            self.SNTPSupport = config.HAS_SNTP;
            self.hasUsb = config.HAS_USB;
		    self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
			self.hasDdns = config.DDNS_SUPPORT;
			self.hasTr069 = config.TR069_SUPPORT;
			
            var inChildGroup = false;
            if (config.HAS_PARENTAL_CONTROL) {
                inChildGroup = service.checkCurrentUserInChildGroup().result;
            }
            self.currentUserInChildGroup = ko.observable(inChildGroup);

            var fastbootInfo = service.getFastbootSetting();
            self.fastbootEnableFlag =  ko.observable(config.RJ45_SUPPORT ? (fastbootInfo.need_sim_pin != "yes" && service.getRj45PlugState().rj45_plug == "wan_lan_off") : fastbootInfo.need_sim_pin != "yes");
            self.fastbootSetting = ko.observable(fastbootInfo.fastbootEnabled);
            /**
             * 快速开关机设置
             * @method saveFastBoot
             */
            self.saveFastBoot = function() {
                showLoading();
                var params = {
                    fastbootEnabled: self.fastbootSetting(),
                    need_hard_reboot: fastbootInfo.need_hard_reboot
                };
                service.setFastbootSetting(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };
			addInterval(function(){
				self.fastbootEnableFlag(config.RJ45_SUPPORT ? (fastbootInfo.need_sim_pin != "yes" && service.getRj45PlugState().rj45_plug == "wan_lan_off") : fastbootInfo.need_sim_pin != "yes");
			}, 1000);

            /**
             * 恢复出厂设置
             * @event restore
             */
            self.restore = function () {
                showConfirm("restore_confirm", function () {
                    showLoading("restoring");
                    service.restoreFactorySettings({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, function (result) {
                        if (isErrorObject(result) && result.errorType == 'no_auth') {
                            errorOverlay();
                        }
                    });
                });
            };
            /**
             * 重启
             * @method restart
             */
            self.restart = function () {
                showConfirm("restart_confirm", function () {
                    showLoading("restarting");
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
            };
            /**
             * 关机
             * @method turnoff
             */
            self.turnoff = function () {
                showConfirm("turnoff_confirm", function () {
                    showLoading("turnoff");
                    service.turnOffDevice({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                });
            };
			//SNTP			
			//触发server校准时间
			service.setSNTPDate({
				goformId: "SNTP_Getdatastatic"
			});
			var self = this;
			var data = 	service.getSntpParams();
			globalTime = new Date(parseInt(data.sntp_year, 10),parseInt(data.sntp_month, 10)-1, parseInt(data.sntp_day, 10), parseInt(data.sntp_hour, 10), parseInt(data.sntp_minute, 10), parseInt(data.sntp_second, 10));

			self.day = ko.observable();
			self.localTime = ko.observable();
			//初始化当前本地时间
			self.updateCurrentTime;
			self.timeSetModes = ko.observableArray(timeSetModes);
			self.isManualSetTime = ko.observable(false);
			self.isAutoSntpTime = ko.observable(false);
			
			self.currentMode = ko.observable(data.sntp_time_set_mode);
			changeSetTimeMode();
			self.changeSetTimeMode = function(){
				changeSetTimeMode();
			};
			self.currentYear = ko.observable(parseInt(data.sntp_year, 10));
			self.currentMonth = ko.observable(parseInt(data.sntp_month, 10));
			self.currentDate = ko.observable(parseInt(data.sntp_day, 10));
			self.currentHour = ko.observable(parseInt(data.sntp_hour, 10));
			self.currentMinute = ko.observable(parseInt(data.sntp_minute, 10));
			
			self.years = ko.observableArray(sntpYears);
			self.months = ko.observableArray(sntpMonths);
			
			
			/*
			当用户选择月份的时候改变日期选择框的选项
			*/
			self.initDateList = function(){
				initDateList();
				self.dates(sntpDates);
			}
			//初始化日期列表
			initDateList();
			self.dates = ko.observableArray(sntpDates);
			self.hours = ko.observableArray(sntpHours);
			self.minutes = ko.observableArray(sntpMinutes);
			
			/*自动SNTP获取时间数据绑定处理*/
			var serverArray = _.map(data.sntp_servers, function(item) {
				return new Option(item.name, item.value)
			});
			self.serverList = ko.observableArray(serverArray);
			self.currentServer0 = ko.observable(data.sntp_server0);
			self.currentServer1 = ko.observable(data.sntp_server1);
			self.currentServer2 = ko.observable(data.sntp_server2);
			self.customServer0 = ko.observable(data.sntp_other_server0);
			self.customServer1 = ko.observable(data.sntp_other_server1);
			self.customServer2 = ko.observable(data.sntp_other_server2);
			self.isOther0 = ko.observable(false);
			self.isOther1 = ko.observable(false);
			self.isOther2 = ko.observable(false);
			initOtherServer();

			self.changeServerSelect = function(){
				initOtherServer();
			}
			
			self.timeZones = ko.observableArray(timeZones);
			self.currentTimeZone = ko.observable(data.sntp_timezone + "_" + data.sntp_timezone_index);
			self.daylightSaves = ko.observableArray(daylightSave);
			self.currentDaylightSave = ko.observable(data.sntp_dst_enable);
			/*更新当前显示时间*/
			self.updateCurrentTime = function() {
			var tmpDay = globalTime.getDay();
				switch(tmpDay){
					case 0:
						self.day($.i18n.prop("sunday"));
						break;
					case 1:
						self.day($.i18n.prop("monday"));
						break;
					case 2:
						self.day($.i18n.prop("tuesday"));
						break;
					case 3:
						self.day($.i18n.prop("wednesday"));
						break;
					case 4:
						self.day($.i18n.prop("thursday"));
						break;
					case 5:
						self.day($.i18n.prop("friday"));
						break;
					case 6:
						self.day($.i18n.prop("saturday"));
						break;
					default:
						break;
				}
				var localCurrentTime = globalTime.getFullYear() + "-" + getTwoDigit(globalTime.getMonth()+1) + "-" + getTwoDigit(globalTime.getDate()) + " " + getTwoDigit(globalTime.getHours()) + ":" + getTwoDigit(globalTime.getMinutes()) + ":" + getTwoDigit(globalTime.getSeconds());
				self.localTime(localCurrentTime);
				globalTime.setTime(globalTime.getTime()+1000);			
			};
            /**
             * SNTP设置
             * @method apply
             */			
			self.apply = function(){
				var tmpArray = [];
				for(var i=0; i< data.sntp_servers.length; i++){
					tmpArray.push(data.sntp_servers[i].value);
				}
				var staInfo = service.getStatusInfo();
				if(!checkAllConnectedStatus(staInfo.connectStatus, staInfo.rj45ConnectStatus, staInfo.connectWifiStatus) && self.currentMode() == "auto"){//if((!checkConnectedStatus(modeData.ppp_status) && modeData.rj45_state != "working" && ) && self.currentMode() == "auto") {
					showAlert("sntp_syn_time_wan_connected");
					return;
				}
				
				var requestParams = {
					goformId: "SNTP",
					manualsettime : self.currentMode(),
					sntp_server1_ip : self.currentServer0(),
					sntp_server2_ip : self.currentServer1(),
					sntp_server3_ip : self.currentServer2(),
					sntp_other_server0 : self.customServer0(),
					sntp_other_server1 : self.customServer1(),
					sntp_other_server2 : self.customServer2(),
					timezone : self.currentTimeZone().split("_")[0],
					sntp_timezone_index : self.currentTimeZone().split("_")[1],
					DaylightEnabled : self.currentDaylightSave(),
					time_year : self.currentYear(),
					time_month : self.currentMonth(),
					time_day : self.currentDate(),
					time_hour : self.currentHour(),
					time_minute : self.currentMinute()
				};
				showLoading("");
				service.setSntpSetting(requestParams, function(data2){
					if(data2) {
					    if(data2.result == "success" && self.currentMode() == "auto"){
							hideLoading();
						}else if(data2.result == "processing" && self.currentMode() == "auto"){
							successOverlay("sntp_processing");
						}else{
							//触发server校准时间
							service.setSNTPDate({
								goformId: "SNTP_Getdatastatic"
							}, function(result){
									var data = 	service.getSntpParams();
									globalTime = new Date(parseInt(data.sntp_year, 10),parseInt(data.sntp_month, 10)-1, parseInt(data.sntp_day, 10), parseInt(data.sntp_hour, 10), parseInt(data.sntp_minute, 10), parseInt(data.sntp_second, 10));
									successOverlay();
							});
						}
					} else {
						errorOverlay();
					}
				});
			}
            /**
             * 时间初始化
             * @method initDateList
             */	
			function initDateList(){
				sntpDates = [];
				if($.inArray(parseInt(self.currentMonth(), 10), bigMonth) != -1) {
					produceArray(1, 31, sntpDates);
				} else if($.inArray(parseInt(self.currentMonth(), 10), smallMonth) != -1) {
					produceArray(1, 30, sntpDates);
				} else if(parseInt(self.currentYear(), 10)%4 == 0) {
					produceArray(1, 29, sntpDates);
				} else {
					produceArray(1, 28, sntpDates);
				}
			}
            /**
             * OtherServer初始化
             * @method initOtherServer
             */				
			function initOtherServer(){
				self.isOther0(self.currentServer0() == "Other");
				self.isOther1(self.currentServer1() == "Other");
				self.isOther2(self.currentServer2() == "Other");
				!self.isOther0() && $("#sntp_server0").find(".error").hide();
				!self.isOther1() && $("#sntp_server1").find(".error").hide();
				!self.isOther2() && $("#sntp_server2").find(".error").hide();
			}
            /**
             * 手动/自动切换响应函数
             * @method changeSetTimeMode
             */				
			function changeSetTimeMode() {
				if(self.currentMode() == "manual") {
					self.isManualSetTime(true);
					self.isAutoSntpTime(false);
				} else {
					self.isManualSetTime(false);
					self.isAutoSntpTime(true);
				}
				return true;
			}
			
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new othersVM();
            ko.applyBindings(vm, $('#container')[0]);
			vm.updateCurrentTime();
		
		addInterval(function(){
			vm.updateCurrentTime();
		}, 1000);
		
		$("#sntpForm").validate({
			submitHandler: function(){
				vm.apply();
			},
			rules: {
				sntp_other_server0 : "sntp_invalid_server_name",
				sntp_other_server1 : "sntp_invalid_server_name",
				sntp_other_server2 : "sntp_invalid_server_name"
			}
		});
        }

        return {
            init:init
        }
    });
