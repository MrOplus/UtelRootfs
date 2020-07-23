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
            service.bindCommonData(self);
            service.systemSettingHide();
            //checkbox 'pingInfinite' click event
            self.clickInfinite = function () {
                if ($("#pingInfinite").attr("checked")) {
                    $("#count").val("");
                    $("#count").attr("disabled", true);
                    return true;
                } else {
                    $("#count").attr("disabled", false);
                    return true;
                }
            };
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
            self.btnStart = function () {

                var pingTimes = parseInt(trim($("#count").val()), 10);
                if ($("#pingInfinite").attr("checked")) {
                    pingTimes = -1;
                } else {
                    if (isNaN(pingTimes)) {
                        showAlert("ping_positive_integer");
                        return false;
                    }
                    if (pingTimes < 1) {
                        showAlert("ping_positive_integer");
                        return false;
                    }
                }

                var url = trim($('#urlOrIp').val());
                if (url == "") {
                    showAlert("url_not_null");
                    return false;
                }
                clickStyle('start');

                service.execNetworkTools({
                    pingTimes: pingTimes,
                    url: url,
                    subcmd: 0
                }, function () {
                    intervalID = setInterval(writePingToPage, 1000);
                });
            };

            //stop ping button click event
            self.btnStop = function () {

                service.execNetworkTools({
                    pingTimes: '0',
                    url: '',
                    subcmd: 0
                }, function () {
                    setTimeout(function () {
                        $("#pingData")[0].scrollTop = $("#pingData")[0].scrollHeight;
                        clearInterval(intervalID);
                        clickStyle('stop');
                    }, 1000);
                });
            };
        }

        function clickStyle(btn) {
            var flag = false;
            if (btn == "start") {
                $("#pingData").text("");
                flag = true;
            }

            $("#start").attr("disabled", flag);
            $("#stop").attr("disabled", !flag);
            $("#count").attr("disabled", flag);
            $("#pingInfinite").attr("disabled", flag);
            $("#urlOrIp").attr("disabled", flag);

            if (btn == 'stop') {
                if ($("#pingInfinite").attr("checked")) {
                    $("#count").attr("disabled", true);
                }
            }
        }

        //get ping data into page
        function writePingToPage() {
            if ($("#pingData").val() != "") {
                if ($("#pingData").val() == getTextData("/data/ping.html")) {
                    timeoutID = setTimeout(function () {
                        if ($("#pingData").val() == getTextData("/data/ping.html")) {
                            clearInterval(intervalID);
                            clickStyle('stop');
                        }
                        timeoutID = "not_time";
                    }, 1000);
                }
            }
            if (timeoutID == "not_time") {
                var $pingData = $("#pingData");
                $pingData[0].scrollTop = $pingData[0].scrollHeight;
                $pingData.val(getTextData("/data/ping.html"));
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

