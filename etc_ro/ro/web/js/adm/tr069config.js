/**
 * tr069 configuration模块
 * @module tr069 config
 * @class tr069 config
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore','lib/jquery/jQuery.fileinput'],

function($, ko, config, service, _, fileinput) {
    var sntpYears = [];
    var sntpMonths = [];
    var sntpDates = []
    var sntpHours = [];
    var sntpMinutes = [];
    var sntpSecond = [];

    var container = $('#container');

    var bigMonth = [1, 3, 5, 7, 8, 10, 12];
    var smallMonth = [4, 6, 9, 11];
    var tr069ParaFromServer = [],
        tr069ParaFromUser = [];

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
    produceArray(0, 59, sntpSecond);

	/**
     * tr069 configuration view model
     * @class tr069ConfigViewModel
     */
	function TR069ConfigViewModel() {
        tr069ParaFromServer = [];
        tr069ParaFromUser = [];
        if ($(".customfile").length == 0) {
            $("#fileField").customFileInput();
        }
		var info = service.getTR069Config();
		var tr069Info = service.getTR069Configuration();
		setInterval(function(){
			var obj = service.getConnectionInfo();
			info.connectStatus = obj.connectStatus;
		}, 1000);
		var self = this;
		var statusInfo = service.getStatusInfo();

		self.CSRFToken = service.getToken().token;

        self.isHide_tr069_items = service.itemFuncMode(itemsFuncList.TR069_HIDE);
        self.tr069Disabled = ko.observable(service.itemFuncMode(itemsFuncList.TR069_EDIT));

        self.SNTPSupport = config.HAS_SNTP;

        self.currentMode= ko.observable(tr069Info.configurationMode);
        self.tr069Enable= ko.observable(tr069Info.tr069Enable == "1");

        tr069ParaFromServer.push(tr069Info.configurationMode);
        tr069ParaFromServer.push(tr069Info.tr069Enable);

        if( tr069Info.configurationMode == "1"){
            self.acsUrl= ko.observable(tr069Info.acsUrl1);
            self.periodicInformInterval= ko.observable(tr069Info.periodicInformInterval1);
            self.acsUsername= ko.observable(tr069Info.acsUsername1);
            self.acsPassword= ko.observable(tr069Info.acsPassword1);
            self.cpeUsername= ko.observable(tr069Info.cpeUsername1);
            self.cpePassword= ko.observable(tr069Info.cpePassword1);
            self.periodicInformEnable= ko.observable(tr069Info.periodicInform1 == "1");
            self.acsAuthEnable= ko.observable(tr069Info.acsAuth1 == "1");
            self.cpeAuthEnable= ko.observable(tr069Info.cpeAuth1 == "1");
            tr069ParaFromServer.push(tr069Info.acsUrl1);
            tr069ParaFromServer.push(tr069Info.acsUsername1);
            tr069ParaFromServer.push(tr069Info.acsPassword1);
            tr069ParaFromServer.push(tr069Info.cpeUsername1);
            tr069ParaFromServer.push(tr069Info.cpePassword1);
            tr069ParaFromServer.push(tr069Info.periodicInform1);
            tr069ParaFromServer.push(tr069Info.acsAuth1);
            tr069ParaFromServer.push(tr069Info.cpeAuth1);
        }else{
            self.acsUrl= ko.observable(tr069Info.acsUrl);
            self.periodicInformInterval= ko.observable(tr069Info.periodicInformInterval);
            self.acsUsername= ko.observable(tr069Info.acsUsername);
            self.acsPassword= ko.observable(tr069Info.acsPassword);
            self.cpeUsername= ko.observable(tr069Info.cpeUsername);
            self.cpePassword= ko.observable(tr069Info.cpePassword);
            self.periodicInformEnable= ko.observable(tr069Info.periodicInform == "1");
            self.acsAuthEnable= ko.observable(tr069Info.acsAuth == "1");
            self.cpeAuthEnable= ko.observable(tr069Info.cpeAuth == "1");
            tr069ParaFromServer.push(tr069Info.acsUrl);
            tr069ParaFromServer.push(tr069Info.acsUsername);
            tr069ParaFromServer.push(tr069Info.acsPassword);
            tr069ParaFromServer.push(tr069Info.cpeUsername);
            tr069ParaFromServer.push(tr069Info.cpePassword);
            tr069ParaFromServer.push(tr069Info.periodicInform);
            tr069ParaFromServer.push(tr069Info.acsAuth);
            tr069ParaFromServer.push(tr069Info.cpeAuth);
        }

        var tr069Mode = service.itemFuncMode(itemsFuncList.TR069_MODE);

        if( tr069Mode ){
            self.mode = ko.observableArray([
                {text: $.i18n.prop("regular_configuration"),value: "0"}
            ]);
        }else{
            self.mode = ko.observableArray([
                {text: $.i18n.prop("regular_configuration"),value: "0"},
                {text: $.i18n.prop("test_configuration"),value: "1"}
            ]);
        }

		self.serverUrl = ko.observable(info.serverUrl);
		self.serverUserName = ko.observable(info.serverUserName);
		self.serverPassword = ko.observable(info.serverPassword);
		var requestUrl = "http://" + info.wanIpAddress + ":" + info.tr069_CPEPortNo;
		self.requestUrl = ko.observable(requestUrl);
		self.requestUserName = ko.observable(info.requestUserName);
		self.requestPassword = ko.observable(info.requestPassword);
        self.informSetting = ko.observable(info.tr069_PeriodicInformEnable);
        self.informInterval = ko.observable(info.tr069_PeriodicInformInterval);
        self.certificateSetting = ko.observable(info.tr069_CertEnable);
        var currentManualSetTime = info.tr069_PeriodicInformTime;
        var currentDay = currentManualSetTime.split("T")[0].split("-");
        var currentTime = currentManualSetTime.split("T")[1] ? currentManualSetTime.split("T")[1].split(":") : "";
        self.currentYear = ko.observable(parseInt(currentDay[0], 10));
        self.currentMonth = ko.observable(parseInt(currentDay[1], 10));
        self.currentDate = ko.observable(parseInt(currentDay[2], 10));
        self.currentHour = ko.observable(parseInt(currentTime[0], 10));
        self.currentMinute = ko.observable(parseInt(currentTime[1], 10));
        self.currentSecond = ko.observable(parseInt(currentTime[2], 10));

        self.years = ko.observableArray(sntpYears);
        self.months = ko.observableArray(sntpMonths);

        service.bindCommonData(self);
        service.advanceHide();
		self.changeMode = function(){
            refreshData(self);
        };

        /*
         当用户选择月份的时候改变日期选择框的选项
         */
        self.initDateList = function(){
            initDateList();
            self.dates(sntpDates);
        };
        //初始化日期列表
        initDateList();
        self.dates = ko.observableArray(sntpDates);
        self.hours = ko.observableArray(sntpHours);
        self.minutes = ko.observableArray(sntpMinutes);
        self.seconds = ko.observableArray(sntpSecond);
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
         * 应用按钮响应函数
         * @method apply
         */
		self.apply = function() {
			if(!checkAllConnectedStatus(info.connectStatus)) {
				showAlert("connect_alert");
				return false;
			}
            var periodTime = trim($("#periodicInformInterval").val());
			if( +periodTime < 30 ){
                $("#periodicInformInterval").addClass('error2');
                return false;
            }
			var restartTr069 = 0;
			if(tr069ParaFromServer[0] != self.currentMode()){
			    restartTr069 = 1;
            }else {
			    tr069ParaFromUser.push(self.currentMode());
			    tr069ParaFromUser.push(self.tr069Enable() == true ? "1" : "0");
                tr069ParaFromUser.push(self.acsUrl());
                tr069ParaFromUser.push(self.acsUsername());
                tr069ParaFromUser.push(self.acsPassword());
                tr069ParaFromUser.push(self.cpeUsername());
                tr069ParaFromUser.push(self.cpePassword());
                tr069ParaFromUser.push(self.periodicInformEnable() == true ? "1" : "0");
                tr069ParaFromUser.push(self.acsAuthEnable() == true ? "1" : "0");
                tr069ParaFromUser.push(self.cpeAuthEnable() == true ? "1" : "0");
                for( var i = 1; i < tr069ParaFromUser.length; i++ ){
                    if( tr069ParaFromUser[i] != tr069ParaFromServer[i] ){
                        restartTr069 = 1;
                        break;
                    }
                }
            }
			service.setTR069Configuration({
				goformId: "setTR069Config",
				configurationMode: self.currentMode(),
				CSRFToken: self.CSRFToken,
				acsUrl: self.acsUrl(),
				periodicInformInterval: self.periodicInformInterval(),
				acsUsername: self.acsUsername(),
				acsPassword: self.acsPassword(),
                cpeUsername: self.cpeUsername(),
                cpePassword: self.cpePassword(),
                tr069Enable: self.tr069Enable() == true ? "1" : "0",
                periodicInform: self.periodicInformEnable() == true ? "1" : "0",
                acsAuth: self.acsAuthEnable() == true ? "1" : "0",
                cpeAuth: self.cpeAuthEnable() == true ? "1" : "0",
                restartTr069: restartTr069
			}, function(data){
				if(data.result == "success") {
					successOverlay();
					init();

				} else {
					errorOverlay();
				}
			});
		}
		
	}

    certificateUploadSubmitClickHandler = function(){
        var fileName = $(".customfile span.customfile-feedback").text();
        if (fileName == $.i18n.prop("no_file_selected")) {
            return false;
        }

        if(fileName != "ca-cert.crt"){
            showAlert("certificate_file_nomatch");
            return false;
        }

        $('#certificateUploadIframe').load(function() {
            var txt = $('#certificateUploadIframe').contents().find("body").html();
            if (txt.toLowerCase().indexOf('success') != -1) {
                successOverlay();
            } else {
                errorOverlay();
            }

            $("#uploadBtn").attr("data-trans", "browse_btn");
            $("#uploadBtn").html($.i18n.prop('browse_btn'));
            $(".customfile span.customfile-feedback").text('');
        });
        document.getElementById('UploadCertificate').submit();
    }

    function refreshData( vm ) {
        var tr069Info = service.getTR069Configuration();
        if($("#selectConfiguration").val() == "0"){
            vm.acsUrl= ko.observable(tr069Info.acsUrl);
            vm.periodicInformInterval= ko.observable(tr069Info.periodicInformInterval);
            vm.acsUsername= ko.observable(tr069Info.acsUsername);
            vm.acsPassword= ko.observable(tr069Info.acsPassword);
            vm.cpeUsername= ko.observable(tr069Info.cpeUsername);
            vm.cpePassword= ko.observable(tr069Info.cpePassword);
            vm.tr069Enable= ko.observable(tr069Info.tr069Enable == "1");
            vm.periodicInformEnable= ko.observable(tr069Info.periodicInform == "1");
            vm.acsAuthEnable= ko.observable(tr069Info.acsAuth == "1");
            vm.cpeAuthEnable= ko.observable(tr069Info.cpeAuth == "1");
        }else{
            vm.acsUrl= ko.observable(tr069Info.acsUrl1);
            vm.periodicInformInterval= ko.observable(tr069Info.periodicInformInterval1);
            vm.acsUsername= ko.observable(tr069Info.acsUsername1);
            vm.acsPassword= ko.observable(tr069Info.acsPassword1);
            vm.cpeUsername= ko.observable(tr069Info.cpeUsername1);
            vm.cpePassword= ko.observable(tr069Info.cpePassword1);
            vm.tr069Enable= ko.observable(tr069Info.tr069Enable == "1");
            vm.periodicInformEnable= ko.observable(tr069Info.periodicInform1 == "1");
            vm.acsAuthEnable= ko.observable(tr069Info.acsAuth1 == "1");
            vm.cpeAuthEnable= ko.observable(tr069Info.cpeAuth1 == "1");
        }

        ko.applyBindings(vm, container[0]);
    }

    /**
     * tr069设置初始化
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		ko.cleanNode(container[0]);
		var vm = new TR069ConfigViewModel();
		ko.applyBindings(vm, container[0]);
		
		$("#tr069Form").validate({
			submitHandler: function(){
				vm.apply();
			},
			rules: {

			}
		});
		$("#periodicInformInterval").on('blur', function () {
		    var timeVal = $(this).val();
            if(trim(timeVal) != ''){
                +timeVal < 30 ? $(this).addClass('error2') : $(this).removeClass('error2');
            }
        });
	}
	
	return {
		init: init
	};
});