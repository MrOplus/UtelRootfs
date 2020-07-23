/**
 * @module sleep_mode ：包括WiFi休眠、WiFi覆盖范围、WiFi定时休眠唤醒上功能
 * @class sleep_mode
 */
define(['jquery', 'lib/jquery/jQuery.fileinput', 'service', 'knockout', 'config/config', 'status/statusBar'],
    function ($, fileinput, service, ko, config, status) {

        var sleepModes = _.map(config.SLEEP_MODES, function (item) {
            return new Option(item.name, item.value);
        });

        /**
         * sleepmode VM
         * @class SleepModeVM
         */
        function SleepModeVM() {
            var self = this;
            var info = getSleepMode();
            self.isCPE = config.PRODUCT_TYPE == 'CPE';
            self.showTSWDiv = config.TSW_SUPPORT;
            self.showSleepDiv = config.WIFI_SLEEP_SUPPORT;
            self.hasUpdateCheck = config.HAS_UPDATE_CHECK;

            service.bindCommonData(self);
            service.systemSettingHide();
            self.modes = ko.observableArray(sleepModes);
            self.selectedMode = ko.observable(info.sleepMode);

            var wifiRangeInfo = getWifiRange();

            self.wifiRangeMode = ko.observable(wifiRangeInfo.wifiRangeMode);

            /**
             * 设置wifi休眠模式
             * @method setSleepMode
             */
            self.setSleepMode = function () {
                showLoading('waiting');
                service.getWpsInfo({}, function (info) {
                    if (info.radioFlag == '0') {
                        showAlert('wps_wifi_off');
                    } else if (info.wpsFlag == '1') {
                        showAlert('wps_on_info');
                    } else {
                        self.setSleepModeAct();
                    }
                });
            };

            self.setSleepModeAct = function () {
                var params = {};
                params.sleepMode = self.selectedMode();
                service.setSleepMode(params, function (result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };

            /**
             * 设置wifi覆盖范围
             * @method setWifiRange
             */
            self.setWifiRange = function () {
                service.getWpsInfo({}, function (info) {
                    if (info.radioFlag == '0') {
                        showAlert('wps_wifi_off');
                    } else if (info.wpsFlag == '1') {
                        showAlert('wps_on_info');
                    } else {
                        showConfirm('wifi_sleep_confirm', function () {
                            showLoading('waiting');
                            self.setWifiRangeAct();
                        });

                    }
                });
            };

            self.setWifiRangeAct = function () {
                var params = {};
                params.wifiRangeMode = self.wifiRangeMode();
                service.setWifiRange(params, function (result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            };

            var tsw = service.getTsw();
            self.openEnable = ko.observable(tsw.openEnable == "" ? '0' : tsw.openEnable);
            self.openH = ko.observable(tsw.openH);
            self.openM = ko.observable(tsw.openM);
            self.closeH = ko.observable(tsw.closeH);
            self.closeM = ko.observable(tsw.closeM);

            self.showNetworkSettingsWindow = function () {
                if (self.hasRj45) {
                    service.getOpMode({}, function (data) {
                        var mode = checkCableMode(data.blc_wan_mode);
                        if (mode) {
                            tosms('#net_setting');
                        } else {
                            tosms('#net_select');
                        }
                    });
                } else {
                    tosms('#dial_setting');
                }
            };
            /**
             * 设置wifi定时休眠唤醒
             * @method saveTsw
             */
            self.saveTsw = function () {
                if (self.openEnable() == '1') {
                    if (Math.abs((self.openH() * 60 + parseInt(self.openM(), 10)) - (self.closeH() * 60 + parseInt(self.closeM(), 10))) < 10) {
                        showAlert('tsw_time_interval_alert');
                        return false;
                    }
                    showLoading('waiting');
                    service.saveTsw({
                        openEnable: self.openEnable(),
                        closeEnable: self.openEnable(),
                        openTime: leftInsert(self.openH(), 2, '0') + ':' + leftInsert(self.openM(), 2, '0'),
                        closeTime: leftInsert(self.closeH(), 2, '0') + ':' + leftInsert(self.closeM(), 2, '0')
                    }, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                } else {
                    showLoading('waiting');
                    service.saveTsw({
                        openEnable: self.openEnable(),
                        closeEnable: self.openEnable()
                    }, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                }
            };
        }

        /**
         * 获取文件大小
         * @method getFileSize
         */
        function getFileSize(obj) {
            var fileLenth = 0;
            var isIE = /msie/i.test(navigator.userAgent) && !window.opera;
            if (isIE) {  //如果是ie
                var objValue = obj.value;
                try {
                    var fso = new ActiveXObject("Scripting.FileSystemObject");
                    fileLenth = parseInt(fso.GetFile(objValue).size);
                } catch (e) {
                    fileLenth = 1;
                }
            } else {  //对于非IE获得要上传文件的大小
                try {
                    fileLenth = parseInt(obj.files[0].size);
                } catch (e) {
                    fileLenth = 1;  //获取不到取-1
                }
            }
            return fileLenth;//1024/1024;
        }

        var timerState;
        function getSystemUpgradeState() {
            return setInterval(function () {
                var tz_upgrade_state = service.getStatusInfo().tz_upgrade_state;
                if (tz_upgrade_state == "success") {
                    window.clearInterval(timerState);
                    showLoading("restarting");
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                            successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
                    //showAlert("upgrade_pack_fix_success");
                } else if (tz_upgrade_state == "error") {
                    window.clearInterval(timerState);
                    showAlert("upgrade_pack_fix_failed");
                }else if(tz_upgrade_state == "cp_version_error"){
                     window.clearInterval(timerState);
                    showAlert("cp_version_error");
                }
            }, 1000);
        }

        self.startSystemUpgrade = function () {
            showConfirm("upgrade_confirm", function () {
                service.startSystemUpgrade({}, function (data) {
                    if (data && data.result == "success") {
                        showLoading('upgrading', '<span data-trans="upgrading_alert">' + $.i18n.prop('upgrading_alert') + '</span>');
                        timerState = getSystemUpgradeState();
                    } else {
                        showAlert("upgrade_pack_fix_failed");
                    }
                });
            });
        };
        /**
         * 文件上传按钮点击事件
         * @event deleteBtnClickHandler
         */
        function IsStringInChars(checkstr, formatstr) {
            var i_str;
            for (i_str = 0; i_str < checkstr.length; i_str++) {
                if (formatstr.indexOf(checkstr.charAt(i_str)) < 0)
                    return false;
            }

            return true;
        }
        var fileExt;
        fileUploadSubmitClickHandler = function () {
            var versionData = service.getDeviceVersion().real_device_version;
            var fileName = $(".customfile").attr('title');
            var accountPower = service.getStatusInfo().accountPower == '1';

            if (typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")) {
                showAlert("sd_no_file_selected");
                return false;
            } else {
                //judge size
                //todo check fileName
                fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

                if (!fileExt.match(/.zip/i) && !fileExt.match(/.rar/i) && !fileExt.match(/.bin/i) && !accountPower) {
                    showAlert("error_file_selected");
                    return false;
                }

                var fileSize = getFileSize($("#fileField")[0]);
                if ((fileSize / 1024 / 1024 > 30) || (fileSize / 1024 / 1024 < 1)){  //no more than M
                    showAlert("error_file_selected");
                    return false;
                }
            }
            
            // 系统升级
            if(accountPower){
                if(fileExt.match(/.bin/i))
                {
                    // 模块升级
                    $("#fileUploadForm").attr("action", "/cgi-bin/zte_upload/upload.cgi");
                }
                else
                {
                    $("#fileUploadForm").attr("action", "/cgi-bin/sys_update/" + fileName);
                }
            }
            else if((fileExt.match(/.zip/i) || fileExt.match(/.rar/i))){
                var canUpdateDesc = !service.itemFuncMode(itemsFuncList.SYSTEM_UPDATE);
                    var moduleType = fileName.substring(0, fileName.indexOf('_')).toLowerCase();
                    var fdStart = versionData.substring(0, versionData.indexOf('_')).toLowerCase();

					if(("p21k" == fdStart) && ("p21" == moduleType))
					{
						
					}
					else if (fdStart != moduleType)
					{
                    	showAlert("error_file_selected");
                    	return false;
                    }
					
                    if (!canUpdateDesc) {
                    var newVer = fileName.substring(fileName.lastIndexOf("_") + 1, fileName.length - fileExt.length);

                    if (!IsStringInChars(newVer, '0123456789.')) {
                        showAlert("error_file_selected");
                        return false;
                    }
                    var oldVer = versionData.substring(4, versionData.length);
                    var nnV = newVer.split(".");
                    if (nnV.length > 3) {
                        showAlert("error_file_selected");
                        return false;
                    }
                    var ooV = oldVer.split(".");
                    var count = nnV.length < ooV.length ? nnV.length : ooV.length;
                    var index;
                    for (index = 0; index < count; index++) {
                        var p1 = parseInt(nnV[index]);
                        var p2 = parseInt(ooV[index]);

                        if (nnV[index].length > 10 || p2 > p1) {
                            showAlert("high_upgrade_file");
                            return false;
                        }
                        else if (p1 > p2) {
                            break;
                        }
                    }
                }
                $("#fileUploadForm").attr("action", "/cgi-bin/sys_update/" + fileName);
            }
            else if(fileExt.match(/.bin/i)){
                // 模块升级
                $("#fileUploadForm").attr("action", "/cgi-bin/zte_upload/upload.cgi");
            }

            showLoading('uploading', '<span data-trans="upload_fotaupdate_tip">' + $.i18n.prop('upload_fotaupdate_tip') + '</span>');
            if (!iframeLoadBinded) {
                bindIframeLoad();
            }

            $("#fileUploadForm").submit();
        };

        var iframeLoadBinded = false;

        function bindIframeLoad() {
            iframeLoadBinded = true;
            $('#fileUploadIframe').load(function () {
                var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();

                // 模块升级
                var alertShown;
                if(fileExt.match(/.bin/i)){
                    $("#fileField").closest('.customfile').before('<input id="fileField" name="filename" maxlength="200" type="file" dir="ltr"/>').remove();
                    addTimeout(function(){
                        $("#fileField").customFileInput();
                    }, 0);
                    alertShown = false;

                    if (txt.indexOf('success') != -1) {
                        showAlert("upload_update_success");
                    } else if (txt.indexOf('failure0') != -1) {
                        showAlert("upload_update_failed0");
                    } else if (txt.indexOf('failure1') != -1) {
                        showAlert("upload_update_failed1");
                    } else if (txt.indexOf('failure2') != -1) {
                        showAlert("upload_update_failed2");
                    } else if (txt.indexOf('failure3') != -1) {
                        showAlert("upload_update_failed3");
                    } else if (txt.indexOf('failure4') != -1) {
                        showAlert("upload_update_failed4");
                    }
                    $("#uploadBtn", "#uploadSection").attr("data-trans", "browse_btn").html($.i18n.prop('browse_btn'));
                    $(".customfile", "#uploadSection").removeAttr("title");
                    $(".customfile span.customfile-feedback", "#uploadSection")
                        .html('<span data-trans="no_file_selected">'+$.i18n.prop('no_file_selected')+'</span>')
                        .attr('class', 'customfile-feedback');
                    $("#systemUpgrade").hide();
                }
                // 系统升级
                if(fileExt.match(/.zip/i) || fileExt.match(/.rar/i)){
                    if (txt.indexOf('success') != -1) {
                        successOverlay('upload_fotaupdate_success');
                        $("#systemUpgrade").show();
                    } else if (txt.indexOf('failure0') != -1) {
                        showAlert("upload_update_failed0");
                    } else if (txt.indexOf('failure1') != -1) {
                        showAlert("upload_update_failed1");
                    } else if (txt.indexOf('failure2') != -1) {
                        showAlert("upload_update_failed2");
                    } else if (txt.indexOf('failure3') != -1) {
                        showAlert("upload_update_failed3");
                    } else if (txt.indexOf('failure4') != -1) {
                        showAlert("upload_update_failed4");
                    }
                }
            });
        }

        /**
         * 获取wifi覆盖范围信息
         * @method getWifiRange
         */
        function getWifiRange() {
            return service.getWifiRange();
        }

        /**
         * 获取wifi休眠模式
         * @method getSleepInfo
         */
        function getSleepMode() {
            return service.getSleepMode();
        }

        /**
         * 初始化sleep mode view model
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(SYSTEM_UPGRADE_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SleepModeVM();
            ko.applyBindings(vm, container[0]);
            $('#sleepModeForm').validate({
                submitHandler: function () {
                    vm.setSleepMode();
                }
            });

            $('#wifiRangeForm').validate({
                submitHandler: function () {
                    vm.setWifiRange();
                }
            });

            $('#frmTsw').validate({
                submitHandler: function () {
                    vm.saveTsw();
                },
                errorPlacement: function (error, element) {
                    if (element.attr("name") == "openH" || element.attr("name") == "openM") {
                        $("#openErrorDiv").html(error);
                    } else if (element.attr("name") == "closeH" || element.attr("name") == "closeM") {
                        $("#closeErrorDiv").html(error);
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
            if ($(".customfile").length == 0) {
                $("#fileField").customFileInput();
            }
        }

        return {
            init: init
        };
    });