define([ 'jquery','lib/jquery/jQuery.fileinput', 'service', 'knockout', 'config/config', 'status/statusBar'], function ($, fileinput, service, ko, config, status) {

    function OTAUpdateVM() {
        var self = this;
		self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
		self.updateType = ko.observable(service.getUpdateType().update_type);//self.hasNativeUpdate = config.HAS_NATIVE_UPDATE;
        var setting = service.getOTAUpdateSetting();
        self.isDataCard = config.PRODUCT_TYPE == 'DATACARD';
        self.updateMode = ko.observable(setting.updateMode);
        self.updateIntervalDay = ko.observable(setting.updateIntervalDay);
        self.allowRoamingUpdate = ko.observable(setting.allowRoamingUpdate);
        self.lastCheckTime = ko.observable('');
        service.bindCommonData(self);
        service.getOTAlastCheckTime({}, function(data){
            self.lastCheckTime(data.dm_last_check_time);
        });

        self.clickAllowRoamingUpdate = function () {
            var checkbox = $("#chkUpdateRoamPermission:checked");
            if (checkbox && checkbox.length == 0) {
                self.allowRoamingUpdate("1");
            } else {
                self.allowRoamingUpdate("0");
            }
        };
        /**
         * 自动检测设置按钮事件
         * @method apply
         */
        self.apply = function () {
            var para = {
                updateMode: self.updateMode(),
                updateIntervalDay: self.updateIntervalDay(),
                allowRoamingUpdate: self.allowRoamingUpdate()
            };
            showLoading();
            service.setOTAUpdateSetting(para, function (data) {
                if (data && data.result == "success") {
                    setting.allowRoamingUpdate = self.allowRoamingUpdate();
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };
        /**
         * 检测按钮事件
         * @method checkNewVersion
         */
        self.checkNewVersion = function () {
            var s = service.getNewVersionState();
			if(s.fota_package_already_download == "yes"){
				showAlert("fota_package_already_download");
				return;
			}
            if (s.hasNewVersion) {
                status.showOTAAlert();
                return;
            } else {
                if(config.UPGRADE_TYPE=="FOTA"){
                    var runningState = ["version_no_new_software", "version_has_new_critical_software"
                        , "version_has_new_optional_software", "version_start", "version_processing"
                        , "version_roaming", "version_checking", "version_checking_failed"];
                    if ($.inArray(s.fota_new_version_state, runningState) != -1) {
                        showAlert("ota_update_running");
                        return;
                    }
                }
            }
            //OTA开始下载时，会将fota_new_version_state清空，此处判断是否已经在下载过程中
            var info = service.getStatusInfo();
            if (info.current_upgrade_state == "upgrade_prepare_install") {
                showInfo('ota_download_success');
                return;
            }
            if (info.current_upgrade_state == "low_battery") {
                showInfo('ota_low_battery');
                return;
            }
            var upgradingState = ["upgrade_pack_redownload", "connecting_server", "connect_server_success", "upgrading", "accept"];
            if ($.inArray(info.current_upgrade_state, upgradingState) != -1) {
                status.showOTAAlert();
                return;
            }

            if (info.roamingStatus) {
                showConfirm("ota_check_roaming_confirm", function () {
                    checkNewVersion();
                });
            } else {
                checkNewVersion();
            }
            /**
             * 检测是否有新版本
             * @method checkNewVersion
             */
            function checkNewVersion() {
                showLoading("ota_new_version_checking");
                function checkResult() {
                    var r = service.getNewVersionState();
                    if (r.hasNewVersion) {
                        status.showOTAAlert();
                    } else if (r.fota_new_version_state == "0" || r.fota_new_version_state == "version_no_new_software") {
                        showAlert("ota_no_new_version");
                    } else if (r.fota_new_version_state == "version_processing" || r.fota_new_version_state == "in_session") {
                        showAlert("ota_update_running");
                    } else if (r.fota_new_version_state == "version_checking_failed" ) {
                        errorOverlay("ota_check_fail");
                    } else if ( r.fota_new_version_state == "network_unavailable"){
                     	errorOverlay("ota_connect_server_failed");
                    }else {
                        addTimeout(checkResult, 1000);
                    }
                }

                service.setUpgradeSelectOp({selectOp: 'check'}, function (result) {
                    if (result.result == "success") {
                        checkResult();
                    } else {
                        errorOverlay();
                    }
                });
            }
        };
        /**
         * 处理页面元素的可用状态
         * @method fixPageEnable
         */
        self.fixPageEnable = function () {
            var info = service.getStatusInfo();
			var modeData = service.getOpMode();
            if (info.connectWifiStatus == "connect" || checkConnectedStatus(info.connectStatus) || modeData.rj45_state == "working") {
                enableBtn($("#btnCheckNewVersion"));
            } else {
                disableBtn($("#btnCheckNewVersion"));
            }
        };	
	}
    /**
     * 获取文件大小
     * @method getFileSize
     */	
	function getFileSize(obj){
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
		}else{  //对于非IE获得要上传文件的大小			
			try{			
				fileLenth = parseInt(obj.files[0].size);
				}catch (e) {
				fileLenth = 1;  //获取不到取-1
			}
		}
		return fileLenth/1024/1024;
	} 
	
	/**
	 * 文件上传按钮点击事件
	 * @event deleteBtnClickHandler
	 */
	fileUploadSubmitClickHandler = function() {
		var fileName = $(".customfile").attr('title');
        if(typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")){
				showAlert("sd_no_file_selected");
				return false;
		}else {
			//judge size
			//todo check fileName 
			var fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase(); 
			if (!fileExt.match(/.bin/i)) {
					showAlert("error_file_selected");
					return false;  
			}  
			var fileSize = getFileSize($("#fileField")[0]);
			if (fileSize > config.NATIVE_UPDATE_FILE_SIZE){  //no more than 55M
				showAlert("error_file_selected");
				return false;
			}
		}
		showLoading('uploading', '<span data-trans="upload_tip">' + $.i18n.prop('upload_tip') + '</span>');
		if(!iframeLoadBinded){
			bindIframeLoad();
		}
		$("#fileUploadForm").submit();
	};
	
    var iframeLoadBinded = false;
    function bindIframeLoad(){
        iframeLoadBinded = true;
        $('#fileUploadIframe').load(function() {
            var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();
            $("#fileField").closest('.customfile').before('<input id="fileField" name="filename" maxlength="200" type="file" dir="ltr"/>').remove();
            addTimeout(function(){
                $("#fileField").customFileInput();
            }, 0);
            var alertShown = false;
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
        });
    }
    /**
     * 初始化
     * @method init
     */	
    function init() {
        if(this.init){
            getRightNav(SYSTEM_SETTINGS_COMMON_URL);
            getTabsNav(SYSTEM_UPGRADE_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new OTAUpdateVM();
        ko.applyBindings(vm, container);		
		
        if(vm.updateType() == "mifi_fota"){
            vm.fixPageEnable();
            addInterval(function () {            
                vm.fixPageEnable();          
            }, 1000);
		}else{			
	        if ($(".customfile").length == 0) {
			    $("#fileField").customFileInput();
		    }
		}

        $('#frmOTAUpdate').validate({
            submitHandler: function () {
                vm.apply();
            }
        });
    }

    return {
        init: init
    };
});