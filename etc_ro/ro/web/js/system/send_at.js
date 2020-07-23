/**
 * Created by hewq on 18/04/17.
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],

    function ($, ko, config, service, _) {
        var intervalID = "";
        var timeoutID = "not_time";
        /**
         * othersViewModel
         * @class othersVM
         */
        function pingVM() {
            var self = this;
            self.hasRj45 = config.RJ45_SUPPORT;
            $("#atData").text("");
            clearInterval(intervalID);
            service.bindCommonData(self);
            service.systemSettingHide();
            //checkbox 'pingInfinite' click event
            // 
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

            //start ping button click event
            self.btnStart2 = function () {
                $("#start").attr("disabled",true);
                setTimeout(function(){
                    $("#start").attr("disabled",false);
                },3000);
                var url = trim($('#urlOrIp').val());
                if (url == "") {
                    showAlert("at_not_null");
                    return false;
                }
                
                // clickStyle('start');

                service.sendAtTools({
                    url: url
                }, function () {
                    intervalID = setInterval(writePingToPage, 1000);
                });
            };
            //stop ping button click event
            self.btnStop = function () {

                service.sendAtTools({
                    url: ''
                }, function () {
                    setTimeout(function () {
                        $("#atData")[0].scrollTop = $("#atData")[0].scrollHeight;
                        clearInterval(intervalID);
                        clickStyle('stop');
                    }, 1000);
                });
            };
        }

        function clickStyle(btn) {
            var flag = false;
            if (btn == "start") {
                $("#atData").text("");
                flag = true;
            }

            $("#start").attr("disabled", flag);
            $("#stop").attr("disabled", !flag);
            $("#count").attr("disabled", flag);
            $("#pingInfinite").attr("disabled", flag);

            if (btn == 'stop') {
                if ($("#pingInfinite").attr("checked")) {
                    $("#count").attr("disabled", true);
                }
            }
        }

        //get ping data into page
        function writePingToPage() {
            if ($("#atData").val() != "") {
                if ($("#atData").val() == getTextData("/data/send_at.html")) {
                    timeoutID = setTimeout(function () {
                        if ($("#atData").val() == getTextData("/data/send_at.html")) {
                            clearInterval(intervalID);
                            // clickStyle('stop');
                        }
                        timeoutID = "not_time";
                    }, 1000);
                }
            }
            if (timeoutID == "not_time") {
                var $atData = $("#atData");
                $atData[0].scrollTop = $atData[0].scrollHeight;
                $atData.val(getTextData("/data/send_at.html"));
            }
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(NETWORK_TOOLS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new pingVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init: init
        }
    });

