/**
 * Created by hewq on 18/04/17.
 */
define(['jquery', 'lib/jquery/jQuery.fileinput', 'service', 'knockout', 'config/config', 'status/statusBar'],

    function ($, fileinput, service, ko, config, status) {

        function exportConfigurationModel() {
            var info = service.getStatusInfo();
            var self = this;

            service.bindCommonData(self);
            service.systemSettingHide();
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

            /**
             * 文件上传按钮点击事件
             * @event deleteBtnClickHandler
             */
            fileUploadSubmitClickHandler = function () {
                var fileName = $(".customfile").attr('title');
                if (typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")) {
                    showAlert("sd_no_file_selected");
                    return false;
                } else {
                    //judge size
                    //todo check fileName
                    var fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

                    if (!fileExt.match(/.zip/i) && !fileExt.match(/.rar/i)) {
                        showAlert("error_file_selected");
                        return false;
                    }

                    var fileSize = getFileSize($("#fileField")[0]);
                    if (fileSize / 1024 / 1024 > 1) {  //no more than 55M
                        showAlert("error_file_selected");
                        return false;
                    }
                }

                showLoading('uploading', '<span data-trans="upload_fotaupdate_tip">' + $.i18n.prop('upload_fotaupdate_tip') + '</span>');
                if (!iframeLoadBinded) {
                    bindIframeLoad();
                }

                $("#fileUploadForm").attr("action", "/cgi-bin/config_update/" + fileName);
                $("#fileUploadForm").submit();
            };

            var iframeLoadBinded = false;

            function bindIframeLoad() {
                iframeLoadBinded = true;
                $('#fileUploadIframe').load(function () {
                    var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();

                    var alertShown = false;
                    if (txt.indexOf('success') != -1) {
                        successOverlay("success_info");
                        $("#systemUpgrade").show();
                    } else if (txt.indexOf('failure2') != -1) {
                        showAlert("upload_update_failed2");
                        $("#systemUpgrade").hide();
                    }
                });
            }

            var timerState;

            function getConfigUpdateState() {

                return setInterval(function () {
                    var tz_update_config_state = service.getStatusInfo().tz_update_config_state;
                    if (tz_update_config_state == "0") {
                        window.clearInterval(timerState);
                        if (info.accountPower == '1') {
                            showLoading("restoring");
                            service.restoreFactorySettings({}, function (data) {
                                if (data && data.result == "success") {
                                    successOverlay();
                                } else {
                                    errorOverlay();
                                }
                            }, $.noop);
                        }
                        else {
                            showLoading("restarting");
                            service.restart({}, function (data) {
                                if (data && data.result == "success") {
                                    successOverlay();
                                } else {
                                    errorOverlay();
                                }
                            }, $.noop);
                        }
                    } else if (tz_update_config_state != "none" && tz_update_config_state != "start") {
                        window.clearInterval(timerState);
                        showAlert("error code " + tz_update_config_state);
                    }
                }, 1000);
            }

            self.startConfigUpgrade = function () {
                showConfirm("upgrade_confirm", function () {
                    service.startConfigUpdate({}, function (data) {
                        if (data && data.result == "success") {
                            showLoading('upgrading', '<span data-trans="upgrading_alert">' + $.i18n.prop('upgrading_alert') + '</span>');
                            timerState = getConfigUpdateState();
                        } else {
                            showAlert("upgrade_pack_fix_failed");
                        }
                    });
                });
            }
        }

        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(SYSTEM_SETTING_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = new exportConfigurationModel();
            ko.applyBindings(vm, $('#container')[0]);
            if ($(".customfile").length == 0) {
                $("#fileField").customFileInput();
            }
        }

        return {
            init: init
        }
    });