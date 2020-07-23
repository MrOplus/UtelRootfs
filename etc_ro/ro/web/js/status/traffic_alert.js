/**
 * 流量提醒模块
 * @module TrafficAlert
 * @class TrafficAlert
 */
define(['jquery', 'knockout', 'service', 'status/statusBar', 'echarts'], function ($, ko, service, status, echarts) {
    var myChart = null;
    /**
     * 流量图基本配置，具体可查看echarts官方接口文档
     * @object chartOptions
     */	
    var chartOptions = {
        tooltip: {
            formatter: "{b}"
        },
        title: {
            text: '',
            x: 'center',
            y: 'center',
            itemGap: 0,
            textStyle: {
                color: '#FFF',
                fontFamily: '微软雅黑',
                fontSize: 20,
                fontWeight: 'bolder'
            },
            subtextStyle: {
                color: '#FFF',
                fontFamily: '微软雅黑',
                fontSize: 16,
                fontWeight: 'bolder'
            }
        },
        animation: false,
        series: [
            {
                name: '流量控制',
                type: 'pie',
                radius: ['0', '75'],
                itemStyle: {
                    normal: {
                        label: {
                            show: false
                        },
                        labelLine: {
                            show: false
                        }
                    }
                },
                data: [

                ],
                selectedOffset: 3
            }
        ],
        color: ['red', 'red', 'red', 'red', 'red']
    };

    /**
     * 获取流量提醒数据
     * @method getTrafficAlertInfo
     */
    function getTrafficAlertInfo() {
        return service.getTrafficAlertInfo();
    }

    var originalInfo = null;
    var dataUsedModified = false;
    var timeUsedModified = false;

    /**
     * 流量提醒ViewModel
     * @class TrafficVM
     */
    function TrafficVM() {

        dataUsedModified = false;
        timeUsedModified = false;
        var self = this;
        var info = trafficAlertUtil.fetchTrafficAlertInfo();
        self.CSRFToken = service.getToken().token;

        self.action = "main.html?random=" + Math.random();

        self.dataLimitChecked = ko.observable(info.dataLimitChecked == '0' ? '0' : '1');
        self.dataLimitTypeChecked = ko.observable(info.dataLimitTypeChecked == '0' ? '0' : '1');
        self.data_remind_sms_switch = info.data_remind_sms_switch == '0' ? '0' : '1';

        if(info.data_remind_sms_switch == "0"){
            $("#trafficMobileNumber").hide();
            $("#trafficSmsContent").hide();
        }

        self.data_remind_sms_number = ko.observable(info.data_remind_sms_number);
        self.data_remind_sms_content = ko.observable(info.data_remind_sms_content);
        var dataMonth = info.limitDataMonth.split("_");
        self.limitDataMonth = ko.observable(dataMonth[0] || 0);
        self.selectedDataUnit = ko.observable(dataMonth[1] || 1);
        self.alertDataReach = ko.observable(info.alertDataReach || 0);
        self.limitTimeMonth = ko.observable(info.limitTimeMonth || 0);
        self.alertTimeReach = ko.observable(info.alertTimeReach || 0);
		var limitDataMonthTmp = transUnit(self.limitDataMonth() * self.selectedDataUnit() * 1024 * 1024, false);
		var limitDataMonthUnitTmp = limitDataMonthTmp.substring(limitDataMonthTmp.length-2);
		self.limitDataMonth(limitDataMonthTmp.substring(0, limitDataMonthTmp.length-2));
		self.selectedDataUnit(trafficAlertUtil.getUnitValue(limitDataMonthUnitTmp));
		if(info.dataLimitChecked == '1')
        	self.usedDataText = ko.observable(transUnit(parseInt(info.monthlySent, 10) + parseInt(info.monthlyReceived, 10), false));
		else
			self.usedDataText = ko.observable(transUnit(0));
        var dataInfo1 = trafficAlertUtil.getDataInfo(self.usedDataText());
        var d1 = dataInfo1.data;
        var unit1 = dataInfo1.unit;
        self.dataUsed = ko.observable(d1);
        self.selectedDataUsedUnit = ko.observable(trafficAlertUtil.getUnitValue(unit1));
        self.usedDataTextDescData = ko.observable("");
		self.accountPower = service.getStatusInfo().accountPower;
        /**
         * 已用流量描述语
         * @object usedDataTextDesc
         */		
        self.usedDataTextDesc = ko.computed(function () {
            if(isNaN(self.dataUsed())) {
                self.usedDataTextDescData("");
                return $.i18n.prop('traffic_used_text', ' ');
            }
            self.usedDataTextDescData(self.dataUsed() + ' ' + trafficAlertUtil.getUnit(self.selectedDataUsedUnit()));
            return $.i18n.prop('traffic_used_text', self.dataUsed() + trafficAlertUtil.getUnit(self.selectedDataUsedUnit()));
        });
        self.limitDataMonthDescData = ko.observable("");
        /**
         * 套餐流量描述语
         * @object limitDataMonthDesc
         */		
        self.limitDataMonthDesc = ko.computed(function () {
            if(isNaN(self.limitDataMonth())) {
                self.limitDataMonthDescData("");
                return $.i18n.prop('traffic_limit_data_text', ' ');
            }
            self.limitDataMonthDescData(self.limitDataMonth() + ' ' +trafficAlertUtil.getUnit(self.selectedDataUnit()));
            return $.i18n.prop('traffic_limit_data_text', self.limitDataMonth() + trafficAlertUtil.getUnit(self.selectedDataUnit()));
        });
        self.alertDataReachDescData = ko.observable("");
        /**
         * 流量提醒描述语
         * @object alertDataReachDesc
         */		
        self.alertDataReachDesc = ko.computed(function () {
        	var limitData='';
            if(isNaN(self.limitDataMonth() * self.selectedDataUnit() * self.alertDataReach())) {
                self.alertDataReachDescData(self.alertDataReach() + ', ');
                return $.i18n.prop('traffic_alert_reach_text', self.alertDataReach(), ' ');
            }

            var value = transUnit(self.limitDataMonth() * self.selectedDataUnit() * self.alertDataReach() * 1048576 / 100, false);
			limitData = insert_flg(value, ' ',value.length-2);
			self.alertDataReachDescData(self.alertDataReach() + ',' + limitData);
            return $.i18n.prop('traffic_alert_reach_text', self.alertDataReach(), limitData);
        });
        self.leftDataDescData = ko.observable("");
        /**
         * 剩余流量描述语
         * @object leftDataDesc
         */		
        self.leftDataDesc = ko.computed(function () {
        	var leftData='';
            var left = (self.limitDataMonth() * self.selectedDataUnit() - self.dataUsed() * self.selectedDataUsedUnit()) * 1048576;
            if(left < 0) {
                left = 0;
            }

            if(isNaN(left)) {
                self.leftDataDescData('');
                return $.i18n.prop('traffic_data_left_text', ' ');
            }
			
            self.leftDataDescData(transUnit(left, false));
			leftData = insert_flg(self.leftDataDescData(), ' ',self.leftDataDescData().length-2);
			self.leftDataDescData(leftData);
            return $.i18n.prop('traffic_data_left_text', leftData);
        });
        //////////////////////////time
        self.monthlyConnectedTime = ko.observable(transSecond2Time(info.monthlyConnectedTime));
		var timeInfo1 = trafficAlertUtil.getTimeInfo(transTimeUnit(info.monthlyConnectedTime));
        self.usedTime = ko.observable(timeInfo1.data);		
		self.selectedTimeUsedUnit = ko.observable(trafficAlertUtil.getUnitValue(timeInfo1.unit));
		
        self.usedTimeTextDescData  = ko.observable("");
        /**
         * 已用时间描述语
         * @object usedTimeTextDesc
         */		
        self.usedTimeTextDesc = ko.computed(function () {
            self.usedTimeTextDescData(self.monthlyConnectedTime());
            return $.i18n.prop('traffic_used_text', self.monthlyConnectedTime());
        });		
        
		var  timeInfo2 = trafficAlertUtil.getTimeInfo(transTimeUnit(parseFloat(self.limitTimeMonth()) * 3600));
		self.selectedTimeUnit = ko.observable(trafficAlertUtil.getUnitValue(timeInfo2.unit));
		self.limitTimeMonth(timeInfo2.data);
        self.limitTimeMonthDescData = ko.observable("");
		self.limitTimeMonthDescText = ko.observable("traffic_limit_time_h");
        /**
         * 套餐时间描述语
         * @object limitTimeMonthDesc
         */		
        self.limitTimeMonthDesc = ko.computed(function () {
            if(isNaN(self.limitTimeMonth())) {
                self.limitTimeMonthDescData(' ');
				self.limitTimeMonthDescText('traffic_limit_time_h');
                return $.i18n.prop('traffic_limit_time_h', ' ');
            }
            self.limitTimeMonthDescData(self.limitTimeMonth());
			if(self.selectedTimeUnit() == "60"){
				self.limitTimeMonthDescText('traffic_limit_time_m');
				return $.i18n.prop('traffic_limit_time_m', self.limitTimeMonth());
			}else{
				self.limitTimeMonthDescText('traffic_limit_time_h');
				return $.i18n.prop('traffic_limit_time_h', self.limitTimeMonth());
			}		
        });

        self.alertTimeReachDescData = ko.observable("");
        /**
         * 时间提醒描述语
         * @object alertTimeReachDesc
         */		
        self.alertTimeReachDesc = ko.computed(function () {
            if(isNaN(self.limitTimeMonth() * self.alertTimeReach())) {
                self.alertTimeReachDescData(self.alertTimeReach() + ', ');
                return $.i18n.prop('traffic_alert_reach_text', self.alertTimeReach(), ' ');
            }
            var value = transSecond2Time(self.limitTimeMonth() * self.selectedTimeUnit() * self.alertTimeReach() / 100);
            self.alertTimeReachDescData(self.alertTimeReach() + ',' + value);
            return $.i18n.prop('traffic_alert_reach_text', self.alertTimeReach(), value);
        });

        self.leftTimeDescData = ko.observable("");
        /**
         * 剩余时间描述语
         * @object leftTimeDesc
         */		
        self.leftTimeDesc = ko.computed(function () {
            var left = self.limitTimeMonth() * self.selectedTimeUnit() - trafficAlertUtil.getSecondsFromTime(self.monthlyConnectedTime());
            if(left < 0) {
                left = 0;
            }

            if(isNaN(left)) {
                self.leftTimeDescData(' ');
                return $.i18n.prop('traffic_data_left_text', ' ');
            }
            self.leftTimeDescData(transSecond2Time(left));
            return $.i18n.prop('traffic_data_left_text', transSecond2Time(left));
        });

        /**
         * 应用按钮事件
         * @method save
         */
        self.save = function () {
            if (trafficAlertUtil.checkFormEditValid(self) && self.dataLimitChecked() == '1') {
                return false;
            }
            if (self.dataLimitChecked() == '1' && self.dataLimitTypeChecked() == "1" && self.selectedDataUnit() == '1' && self.selectedDataUsedUnit() == '1048576' && !(parseInt(self.dataUsed(), 10) < parseInt('4096', 10)) ) {
                showAlert('traffic_over_note');
				return false;
            }
            var smsPush = $("#trafficSmsPush").attr("checked") == "checked";
            var mobileNumberNull = trim($("#trafficPhoneNumber").val()) == "";
            var smsContentNull = trim($("#trafficTxtSmsContent").val()) == "";

            if( self.dataLimitChecked() && smsPush && ( mobileNumberNull || smsContentNull ) ){
                showAlert("mobile_number_and_sms_content_can_not_be_blank");
                return false;
            }
            showLoading();
            service.setTrafficAlertInfo({
                CSRFToken: self.CSRFToken,
                dataLimitChecked: self.dataLimitChecked(),
                dataLimitTypeChecked: self.dataLimitTypeChecked(),
                limitDataMonth: self.limitDataMonth() + "_" + self.selectedDataUnit(),
                alertDataReach: parseInt(self.alertDataReach(), 10),
                limitTimeMonth: self.selectedTimeUnit() == "60" ? self.limitTimeMonth()/60 : self.limitTimeMonth(),//save by hours
                alertTimeReach: parseInt(self.alertTimeReach(), 10),
                data_remind_sms_switch: self.dataLimitTypeChecked() == '1' ? $("#trafficSmsPush").attr('checked') == "checked" ? "1" : "0" : $("#timeSmsPush").attr('checked') == "checked" ? "1" : "0",
                data_remind_sms_number: self.dataLimitTypeChecked() == '1' ? $("#trafficPhoneNumber").val():$("#timePhoneNumber").val(),
                data_remind_sms_content: self.dataLimitTypeChecked() == '1' ? $("#trafficTxtSmsContent").val() : $("#timeTxtSmsContent").val()
            }, function (data) {
                if (data.result == 'success') {
					if(self.dataLimitChecked() == "0")
					{
						self.dataUsed("0");
					}
					
                    if(self.dataLimitTypeChecked() == "1" && dataUsedModified) {
                        self.saveUsedData();
                    } else if(self.dataLimitTypeChecked() == "0" && timeUsedModified) {
                        self.saveUsedTime();
                    } else {
                        trafficAlertUtil.fetchTrafficAlertInfo();
                        trafficAlertUtil.updateEcharts(self);
                        status.setTrafficAlertPopuped(false);
                        successOverlay();
                    }
                } else {
                    errorOverlay();
                }
            }, function () {
                trafficAlertUtil.updateEcharts(self);
                errorOverlay();
            });
        };
        //////////////////////////////////////////
        self.viewEditUsedData = ko.observable(false);
        /**
         * 已用流量编辑按钮事件
         * @method editUsedDataHandler
         */
        self.editUsedDataHandler = function () {
            trafficAlertUtil.getEle('editUsedData').data('oldValue', self.dataUsed());
            trafficAlertUtil.getEle('selectedDataUsedUnit').data('oldValue', self.selectedDataUsedUnit());
            self.dataUsed(self.dataUsed());
            self.viewEditUsedData(true);
        };

        //save used data when Data Type is data
        self.saveUsedData = function() {
            var val = self.dataUsed() * self.selectedDataUsedUnit();
            service.trafficCalibration({
                way: 'data',
                value: val
            }, function(){
                trafficAlertUtil.fetchTrafficAlertInfo();
                trafficAlertUtil.updateEcharts(self);
                successOverlay();
                self.viewEditUsedData(false);
                status.setTrafficAlertPopuped(false);
                dataUsedModified = false;
            }, function(){
                trafficAlertUtil.fetchTrafficAlertInfo();
                trafficAlertUtil.updateEcharts(self);
                errorOverlay();
            });
        };
        /**
         * 已用流量保存按钮事件
         * @method saveUsedData
         */
        self.editUsedDataSaveHandler = function () {
            if (trafficAlertUtil.getEle('dataUsed').valid()) {
                dataUsedModified = true;
                self.viewEditUsedData(false);
            }
        };
        /**
         * 已用流量取消编辑按钮事件
         * @method editUsedDataCancelHandler
         */
        self.editUsedDataCancelHandler = function () {
            self.dataUsed(trafficAlertUtil.getEle('editUsedData').data('oldValue'));
            self.selectedDataUsedUnit(trafficAlertUtil.getEle('selectedDataUsedUnit').data('oldValue'));
            trafficAlertUtil.getEle('editUsedDataCancel').siblings('label.error').hide();
            self.viewEditUsedData(false);
        };

        self.viewEditTotalData = ko.observable(false);
        /**
         * 套餐流量编辑按钮事件
         * @method editTotalDataHandler
         */
        self.editTotalDataHandler = function () {
            trafficAlertUtil.getEle('editTotalData').data('oldValue', self.limitDataMonth());
            trafficAlertUtil.getEle('selectedDataUnit').data('oldValue', self.selectedDataUnit());
            self.viewEditTotalData(true);
        };

        self.enableSmsPush = function () {
            var $trafficSmsPush = $("#trafficSmsPush").attr('checked');
            var $timeSmsPush = $("#timeSmsPush").attr('checked');
            var $trafficMobileNumber = $("#trafficMobileNumber");
            var $timeMobileNumber = $("#timeMobileNumber");
            var $trafficSmsContent = $("#trafficSmsContent");
            var $timeSmsContent = $("#timeSmsContent");
            if( $trafficSmsPush == 'checked'){
                $trafficMobileNumber.show();
                $trafficSmsContent.show();
            }else{
                $trafficMobileNumber.hide();
                $trafficSmsContent.hide();
            }
            if( $timeSmsPush == 'checked'){
                $timeMobileNumber.show();
                $timeSmsContent.show();
            }else{
                $timeMobileNumber.hide();
                $timeSmsContent.hide();
            }
            return true;
        }
        /**
         * 套餐流量保存编辑按钮事件
         * @method editTotalDataSaveHandler
         */
        self.editTotalDataSaveHandler = function () {
            if (trafficAlertUtil.getEle('limitDataMonth').valid()) {
                self.usedDataText(transUnit(self.limitDataMonth() * self.selectedDataUnit() * 1048576, false));
                self.viewEditTotalData(false);
            }
        };
        /**
         * 套餐流量取消编辑按钮事件
         * @method editTotalDataCancelHandler
         */
        self.editTotalDataCancelHandler = function () {
            self.limitDataMonth(trafficAlertUtil.getEle('editTotalData').data('oldValue'));
            self.selectedDataUnit(trafficAlertUtil.getEle('selectedDataUnit').data('oldValue'));
            self.viewEditTotalData(false);
        };

        self.viewEditAlertData = ko.observable(false);
        /**
         * 流量提醒值编辑按钮事件
         * @method editAlertDataHandler
         */
        self.editAlertDataHandler = function () {
            trafficAlertUtil.getEle('editAlertData').data('oldValue', self.alertDataReach());
            self.viewEditAlertData(true);
        };
        /**
         * 流量提醒值保存编辑按钮事件
         * @method editAlertDataSaveHandler
         */
        self.editAlertDataSaveHandler = function () {
            if (trafficAlertUtil.getEle('alertDataReach').valid()) {
                self.viewEditAlertData(false);
            }
        };
        /**
         * 流量提醒值取消编辑按钮事件
         * @method editAlertDataCancelHandler
         */
        self.editAlertDataCancelHandler = function () {
            self.alertDataReach(trafficAlertUtil.getEle('editAlertData').data('oldValue'));
            self.viewEditAlertData(false);
        };

//save used data when Data Type is time
        self.viewEditUsedTime = ko.observable(false);
        /**
         * 已用时间编辑按钮事件
         * @method editUsedTimeHandler
         */
        self.editUsedTimeHandler = function () {
            trafficAlertUtil.getEle('editUsedTime').data('oldValue', self.usedTime());
            self.viewEditUsedTime(true);
        };

        self.saveUsedTime = function() {
            service.trafficCalibration({
                way: 'time',
                value: self.selectedTimeUsedUnit() == "60" ? parseFloat(self.usedTime())/60 : self.usedTime()
            }, function(){
                trafficAlertUtil.fetchTrafficAlertInfo();
                trafficAlertUtil.updateEcharts(self);
                successOverlay();
                self.monthlyConnectedTime(transSecond2Time(parseFloat(self.usedTime()) * self.selectedTimeUsedUnit()));
                self.viewEditUsedTime(false);
                status.setTrafficAlertPopuped(false);
                timeUsedModified = false;
            }, function(){
                trafficAlertUtil.fetchTrafficAlertInfo();
                trafficAlertUtil.updateEcharts(self);
                errorOverlay();
            });
        };
        /**
         * 已用时间保存编辑按钮事件
         * @method editUsedTimeSaveHandler
         */
        self.editUsedTimeSaveHandler = function () {
            if (trafficAlertUtil.getEle('usedTime').valid()) {
                self.monthlyConnectedTime(transSecond2Time(parseFloat(self.usedTime()) * self.selectedTimeUsedUnit()));
                self.viewEditUsedTime(false);
                timeUsedModified = true;
            }
        };
        /**
         * 已用时间取消编辑按钮事件
         * @method editUsedTimeSaveHandler
         */
        self.editUsedTimeCancelHandler = function () {
            self.usedTime(trafficAlertUtil.getEle('editUsedTime').data('oldValue'));
            self.viewEditUsedTime(false);
        };

        self.viewEditTotalTime = ko.observable(false);
        /**
         * 套餐时间编辑按钮事件
         * @method editTotalTimeHandler
         */
        self.editTotalTimeHandler = function () {
            trafficAlertUtil.getEle('editTotalTime').data('oldValue', self.limitTimeMonth());
            self.viewEditTotalTime(true);
        };
        /**
         * 套餐时间保存编辑按钮事件
         * @method editTotalTimeSaveHandler
         */
        self.editTotalTimeSaveHandler = function () {
            if (trafficAlertUtil.getEle('limitTimeMonth').valid()) {
                self.viewEditTotalTime(false);
            }
        };
        /**
         * 套餐时间取消编辑按钮事件
         * @method editTotalTimeCancelHandler
         */
        self.editTotalTimeCancelHandler = function () {
            self.limitTimeMonth(trafficAlertUtil.getEle('editTotalTime').data('oldValue'));
            self.viewEditTotalTime(false);
        };

        self.viewEditAlertTime = ko.observable(false);
        /**
         * 时间提醒值编辑按钮事件
         * @method editAlertTimeHandler
         */
        self.editAlertTimeHandler = function () {
            trafficAlertUtil.getEle('editAlertTime').data('oldValue', self.alertTimeReach());
            self.viewEditAlertTime(true);
        };
        /**
         * 时间提醒值保存编辑按钮事件
         * @method editAlertTimeSaveHandler
         */
        self.editAlertTimeSaveHandler = function () {
            if (trafficAlertUtil.getEle('alertTimeReach').valid()) {
                self.viewEditAlertTime(false);
            }
        };
        /**
         * 时间提醒值取消编辑按钮事件
         * @method editAlertTimeCancelHandler
         */
        self.editAlertTimeCancelHandler = function () {
            self.alertTimeReach(trafficAlertUtil.getEle('editAlertTime').data('oldValue'));
            self.viewEditAlertTime(false);
        };

        trafficAlertUtil.updateEcharts(self);
    }

    var trafficAlertUtil = {
        cacheEle: {},
        /**
         * 元素获取
         * @method getEle
         */
        getEle: function (id) {
            if (this.cacheEle.hasOwnProperty('id')) {
                return this.cacheEle[id];
            } else {
                this.cacheEle[id] = $("#" + id);
                return this.cacheEle[id];
            }
        },
        /**
         * 流量单位获取
         * @method getUnit
         */
        getUnit: function (val) {
            if (val == '1024') {
                return 'GB';
            } else if (val == '1048576') {
                return 'TB';
            } else {
                return 'MB';
            }
        },
        /**
         * 单位对应值获取
         * @method getUnitValue
         */
        getUnitValue: function (unit) {
            unit = unit.toUpperCase();
            if (unit == 'GB') {
                return '1024';
            } else if (unit == 'TB') {
                return '1048576';
            } else if(unit == 'HOUR'){
				return '3600';
			} else if(unit == 'MINUTE'){
				return '60';
			} else {
                return '1';
            }
        },
        /**
         * 获取流量值和对应单位值
         * @method getDataInfo
         */
        getDataInfo: function (value) {
            return {
                data: /\d+(.\d+)?/.exec(value)[0],
                unit: /[A-Z]{1,2}/.exec(value)[0]
            }
        },
        /**
         * 获取时间值和对应单位值
         * @method getDataInfo
         */
        getTimeInfo: function (value) {
            return {
                data: /\d+(.\d+)?/.exec(value)[0],
                unit: /[a-z]{4,6}/.exec(value)[0]
            }
        },
        /**
         * 获取时间时、分、秒
         * @method getTimeHours
         */
        getTimeHours: function (time) {
            var t = time.split(':');
            return {
                h: parseInt(t[0], 10),
                m: parseInt(t[1], 10),
                s: parseInt(t[2], 10)
            }
        },
        /**
         * 时间换算成S
         * @method getSecondsFromTime
         */
        getSecondsFromTime: function (time) {
            var th = this.getTimeHours(time);
            return th.h * 3600 + th.m * 60 + th.s;
        },
        /**
         * 获取流量管理相关状态值
         * @method fetchTrafficAlertInfo
         */
        fetchTrafficAlertInfo: function(){
            originalInfo = getTrafficAlertInfo();
            return originalInfo;
        },
        /**
         * 检查表单是否可编辑
         * @method checkFormEditValid
         */
        checkFormEditValid: function (vm) {
            var dataPageEditState = vm.dataLimitTypeChecked() == '1' && (vm.viewEditUsedData() || vm.viewEditAlertData() || vm.viewEditTotalData());
            var timePageEditState = false;
            if (dataPageEditState || timePageEditState) {
                $('.border-color-transition:visible').addClass('attention-focus');
                addTimeout(function () {
                    $('.border-color-transition:visible').removeClass('attention-focus');
                }, 1500);
                return true;
            } else {
                var r = false;
                if (vm.dataLimitTypeChecked() == 1) {
                    if (vm.alertDataReach() == '0') {
                        vm.editAlertDataHandler();
                        r = true;
                    }
                    if (vm.limitDataMonth() == '0') {
                        vm.editTotalDataHandler();
                        r = true;
                    }
                } else {
                    if (vm.alertTimeReach() == '0') {
                        vm.editAlertTimeHandler();
                        r = true;
                    }
                    if (vm.limitTimeMonth() == '0') {
                        vm.editTotalTimeHandler();
                        r = true;
                    }
                }
                if (r) {
                    $('.border-color-transition:visible').addClass('attention-focus');
                    addTimeout(function () {
                        $('.border-color-transition:visible').removeClass('attention-focus');
                    }, 1500);
                }
                return r;
            }
        },
        /**
         * 流量图各区域初始值配置
         * @object data
         */
        data: {
            start: {
                value: 50,
                name: '提醒值内未使用',
                itemStyle: {
                    normal: {
                        color: '#D8D8D8'
                    }
                }
            },
            alarm: {
                value: 19.7,
                name: '警戒区',
                itemStyle: {
                    normal: {
                        color: '#8CC916'
                    }
                }
            },
            alert: {
                value: 1,
                name: '提醒值',
                itemStyle: {
                    normal: {
                        color: '#FF5500'
                    }
                }
            },
            free: {
                value: 50,
                name: '未使用',
                itemStyle: {
                    normal: {
                        color: '#D8D8D8'
                    }
                }
            },
            left1: {
                value: 50,
                name: '提醒值内未使用',
                itemStyle: {
                    normal: {
                        color: '#D8D8D8'
                    }
                }
            },
            used: {
                value: 30,
                name: '已使用',
                itemStyle: {
                    normal: {
                        color: '#8CC916'
                    }
                }
            },
            full: {
                value: 30,
                name: '流量超出',
                itemStyle: {
                    normal: {
                        color: '#DF4313'
                    }
                }
            }
        },
        /**
         * 更新流量图各区域数值和提示语配置
         * @method updateEcharts
         */
        updateEcharts: function (vm) {
            var total = 0, used = 0, reach = 0, left = 0, alarm = 0, left1 = 0;
            var startName = $.i18n.prop("echarts_no");
            if(originalInfo.dataLimitChecked == '1'){//if (vm.dataLimitChecked() == '1') { //开启
                chartOptions.series[0].data = [];
                startName = $.i18n.prop("echarts_used");
                if (vm.dataLimitTypeChecked() == '1') { // 数据
                    chartOptions.title.text = "";
                    chartOptions.series[0].data = [];
                    if (vm.limitDataMonth() == 0) {
                        var usedData = trafficAlertUtil.data.used;
                        usedData.value = 1;
                        usedData.name = $.i18n.prop("echarts_used");
                        usedData.selected = false;
                        chartOptions.series[0].data.push(usedData);
                    } else {
                        total = vm.limitDataMonth() * vm.selectedDataUnit() * 1048576;
                        used = parseInt(originalInfo.monthlySent, 10) + parseInt(originalInfo.monthlyReceived, 10);
                        reach = total * vm.alertDataReach() / 100;
                        if (used >= total) {
                            var fullData = trafficAlertUtil.data.full;
                            fullData.value = 100;
                            fullData.name = $.i18n.prop("echarts_full");
                            chartOptions.series[0].data.push(fullData);
                            startName = $.i18n.prop("echarts_full");
                        } else {
                            if (reach > used) { // left, alert, left1, used
                                left1 = reach - used;
                                left = total - reach;
                            } else { // left, alarm, alert, reach
                                alarm = used - reach;
                                left = total - used;
                            }

                            var usedData = trafficAlertUtil.data.used;
                            if (reach - used > 0) {
                                usedData.value = used;
                            } else {
                                usedData.value = reach;
                            }
                            usedData.name = $.i18n.prop("echarts_used");
                            chartOptions.series[0].data.push(usedData);
							
                            if(left1 > 0){
                                var left1Data = trafficAlertUtil.data.left1;
                                left1Data.value = left1;
                                left1Data.name = $.i18n.prop("echarts_left1");
                                chartOptions.series[0].data.push(left1Data);
                            }
							
                            var alertData = trafficAlertUtil.data.alert;
                            alertData.value = total / 200;
                            alertData.name = $.i18n.prop("echarts_alert");
                            chartOptions.series[0].data.push(alertData);
							
                            if(alarm > 0){
                                var alarmData = trafficAlertUtil.data.alarm;
                                alarmData.value = alarm;
                                alarmData.name = $.i18n.prop("echarts_alarm");
                                chartOptions.series[0].data.push(alarmData);
                            }
							
                            var freeData = trafficAlertUtil.data.free;
                            freeData.value = left;
                            freeData.name = $.i18n.prop("echarts_free");
                            chartOptions.series[0].data.push(freeData);
                        }
                    }
                } else { //时间
                    //chartOptions.title.text = vm.limitTimeMonth() + $.i18n.prop('hours');
                    chartOptions.series[0].data = [];
                    if (vm.limitTimeMonth() == 0) {
                        var usedData = trafficAlertUtil.data.used;
                        usedData.value = 1;
                        usedData.selected = false;
                        usedData.name = $.i18n.prop("echarts_used");
                        chartOptions.series[0].data.push(usedData);
                    } else {
                        total = vm.limitTimeMonth() * vm.selectedTimeUnit();
                        used = originalInfo.monthlyConnectedTime;
                        reach = total * vm.alertTimeReach() / 100;
                        if (used >= total) {
                            var fullTime = trafficAlertUtil.data.full;
                            fullTime.value = 100;
                            fullTime.name = $.i18n.prop("echarts_full");
                            chartOptions.series[0].data.push(fullTime);
                            startName = $.i18n.prop("echarts_full");
                        } else {
                            if (reach - used > 0) {
                                left1 = reach - used;
                                left = total - reach;
                            } else {
                                alarm = used - reach;
                                left = total - used;
                            }
							
                            var usedTime = trafficAlertUtil.data.used;
                            if (reach - used > 0) {
                                usedTime.value = used;
                            } else {
                                usedTime.value = reach;
                            }
                            usedTime.name = $.i18n.prop("echarts_used");
                            chartOptions.series[0].data.push(usedTime);
							
                            if(left1 > 0) {
                                var left1Time = trafficAlertUtil.data.left1;
                                left1Time.value = left1;
                                left1Time.name = $.i18n.prop("echarts_left1");
                                chartOptions.series[0].data.push(left1Time);
                            }
							
                            var alertTime = trafficAlertUtil.data.alert;
                            alertTime.value = total / 200;
                            alertTime.name = $.i18n.prop("echarts_alert");
                            chartOptions.series[0].data.push(alertTime);
							
                            if(alarm > 0) {
                                var alarmTime = trafficAlertUtil.data.alarm;
                                alarmTime.value = alarm;
                                alarmTime.name = $.i18n.prop("echarts_alarm");
                                chartOptions.series[0].data.push(alarmTime);
                            }
							
                            var freeTime = trafficAlertUtil.data.free;
                            freeTime.value = left;
                            freeTime.name = $.i18n.prop("echarts_free");
                            chartOptions.series[0].data.push(freeTime);
                        }
                    }
                }
            } else {
                var usedData = trafficAlertUtil.data.used;
                usedData.value = 1;
                usedData.selected = false;
                usedData.name = $.i18n.prop("echarts_no");
                chartOptions.series[0].data = [usedData];
                chartOptions.title.text = '';
            }
            trafficAlertUtil.setEcharts(chartOptions, startName);
        },
        /**
         * 调用Echarts接口进行流量图重绘
         * @method setEcharts
         */
        setEcharts: function (options, startName) {
            var startPart = trafficAlertUtil.data.start;
            startPart.value = 0;
            startPart.selected = false;
            startPart.name = startName;
            var arr = [startPart].concat(options.series[0].data);
            options.series[0].data = arr;
            myChart.setOption(options, true);
            addTimeout(function () {
                myChart.resize();
            }, 1000);
        }
    };

    /**
     * 流量提醒初始化函数
     * @method init
     */
    function init() {
        if(this.init){
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
         service.trafficHide();
        myChart = echarts.init($("#traffic_graphic")[0]);
        window.onresize = myChart.resize;
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new TrafficVM();
        ko.applyBindings(vm, container[0]);
        $('#trafficAlertForm').validate({
            submitHandler: function () {
                vm.save();
            },
            rules: {
                dataUsed: {
					decimalRange : true,
					range : [ 0, 9999 ]
                },
                usedTime: {
					decimalRange : true,
					range : [ 0, 9999 ]
                },
                limitDataMonth: {
					decimalRange : true,
					range : [ 1, 9999 ]
                },
                limitTimeMonth: {
					decimalRange : true,
					range : [ 1, 9999 ]
                },
                alertDataReach: {
                    digits: true,
                    range: [ 1, 100 ]
                },
                alertTimeReach: {
                    digits: true,
                    range: [ 1, 100 ]
                },
                trafficPhoneNumber:{
                    phonenumber_check: true
                }
            },
            errorPlacement: function (error, element) {
                if (element.attr("name") == "limitDataMonth") {
                    error.insertAfter("#editTotalDataDiv");
                } else if (element.attr("name") == "alertDataReach") {
                    error.insertAfter("#editAlertDataDiv");
                } else if (element.attr("name") == "limitTimeMonth") {
                    error.insertAfter("#editTotalTimeDiv");
                } else if (element.attr("name") == "alertTimeReach") {
                    error.insertAfter("#editAlertTimeDiv");
                } else if (element.attr("name") == "dataUsed") {
                    error.insertAfter("#editUsedDataDiv");
                } else if (element.attr("name") == "usedTime") {
                    error.insertAfter("#editUsedTimeDiv");
                } else {
                    error.insertAfter(element);
                }
            }
        });
		
		var originalLan = window.language;
		window.setInterval(function(){			
			if(originalLan != window.language){
				originalLan = window.language;
				trafficAlertUtil.updateEcharts(vm);
			}
        }, 1000);
    }

    return {
        init: init
    };
});