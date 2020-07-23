/**
 * station 模块
 * @module station
 * @class station
 */
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service', 'config/menu'], function (_, $, ko, config, service, menu) {

    /**
     * stationViewModel
     * @class stationInfoVM
     */
    function stationInfoVM() {
        var self = this;
        var originalData = {
            ACL_mode: 2,//MAC过滤规则
            user_ip: '',//IP
            macList: '',//MAC列表
            hostnameList: ''//主机名列表
        };
        self.showCableDiv = config.PRODUCT_TYPE == 'CPE' && config.RJ45_SUPPORT;
        self.supportBlock = config.STATION_BLOCK_SUPPORT;
        var pcMenu = menu.findMenu('#parental_control');
        self.showPCLink = pcMenu && pcMenu.length > 0 && config.HAS_PARENTAL_CONTROL;

        self.deviceInfo = ko.observableArray([]);
        self.cableDeviceInfo = ko.observableArray([]);
        self.blackDevices = ko.observableArray([]);
        self.blackDevicesMac = ko.computed(function () {
            return _.map(self.blackDevices(), function (ele) {
                return ele.macAddress;
            });
        });     
        self.showBlackDiv = ko.observable(config.HAS_BLACK_AND_WHITE_FILTER ? (originalData.ACL_mode == '2' ? true : false) : config.STATION_BLOCK_SUPPORT);
        service.bindCommonData(self);
        service.deviceHide(self);
        ko.computed(function () {
            self.deviceInfo();
            self.cableDeviceInfo();
            self.blackDevices();
            $("#station_info_div").translate();
        }).extend({ notify: 'always', throttle: 300 });

        var hostNameList = service.getHostNameList({}).devices;
        /**
         * 获取WiFi已连接设备
         * @method fetchAttachedDevices
         */
        self.fetchAttachedDevices = function (cb) {
            service.getCurrentlyAttachedDevicesInfo({}, function (data) {
                if (editingHostname) {
                    return false;
                }
                self.deviceInfo(_.map(data.attachedDevices, function (ele, idx) {
                    ele.idx = _.uniqueId('wireless_');
                    ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                    ele.inBlackGroup = config.HAS_BLACK_AND_WHITE_FILTER && originalData.ACL_mode != '2' ? false : _.contains(self.blackDevicesMac(), ele.macAddress);
                    ele.type = 1;
                    ele.disableFlag = (config.HAS_BLACK_AND_WHITE_FILTER && originalData.ACL_mode != '2')|| ele.inBlackGroup || editingHostname;
                    return ele;
                }));
                if (_.isFunction(cb)) {
                    cb.apply(this);
                }
            });
        };
        /**
         * 获取RJ45已连接设备
         * @method fetchAttachedCableDevices
         */
        self.fetchAttachedCableDevices = function (cb) {
            service.getAttachedCableDevices({}, function (data) {
                if (editingHostname) {
                    return false;
                }
                self.cableDeviceInfo(_.map(data.attachedDevices, function (ele, idx) {
                    ele.idx = _.uniqueId('cable_');
                    ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                    ele.type = 2;
                    return ele;
                }));
                if (_.isFunction(cb)) {
                    cb.apply(this);
                }
            });
        };
        self.tosmsWithCookie = function(hash) {
                setCookie("pageForward","device_settings");
                tosms(hash);
            };
        /**
         * 获取黑名单列表
         * @method fetchBlacklist
         */
        self.fetchBlacklist = function (cb) {
            service.getMacFilterInfo({}, function (data) {
                originalData.ACL_mode = data.ACL_mode;
                originalData.macList = data.wifi_mac_black_list;
                originalData.hostnameList = data.wifi_hostname_black_list;
                originalData.user_ip = data.user_ip_addr;
                self.showBlackDiv(config.HAS_BLACK_AND_WHITE_FILTER ? (originalData.ACL_mode == '2' ? true : false) : config.STATION_BLOCK_SUPPORT);
                var blackDevices = stationUtil.parseBlackString(data.wifi_mac_black_list, data.wifi_hostname_black_list);
                self.blackDevices(_.map(blackDevices, function (ele, idx) {
                    ele.idx = _.uniqueId('black_');
                    ele.hostName = stationUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                    ele.type = 3;
                    return ele;
                }));
                if (_.isFunction(cb)) {
                    cb.apply(this);
                }
            }, $.noop);
        };
        self.fetchBlacklist();
        self.fetchAttachedDevices();
        if (self.showCableDiv) {
            self.fetchAttachedCableDevices();
        }

        var editingHostname = 0;
        addInterval(function () {
            if (editingHostname == 0) {
                self.fetchAttachedDevices();
            }
        }, 3000);

        if (self.showCableDiv) {
            addInterval(function () {
                if (editingHostname == 0) {
                    self.fetchAttachedCableDevices();
                }
            }, 5000);
        }
        /**
         * WiFi已连接设备列表block按钮事件，加入黑名单
         * @method wirelessBlockHandler
         */
        self.wirelessBlockHandler = function (eleData) {
            if(config.HAS_BLACK_AND_WHITE_FILTER && originalData.ACL_mode != '2'){
                return false;
            }
            if(eleData.ipAddress == originalData.user_ip){
                showAlert('black_yourself_tip');
                return false;
            }
            if(originalData.macList.split(';').length == 10){
                showAlert('black_list_max');
                return false;
            }
            if (originalData.macList.indexOf(eleData.macAddress) != -1) {
                return false;
            }
            if (editingHostname) {
                self.cancelAllEditHostNameHandler();
            }
            showLoading('waiting');
            var newHostnameList = originalData.hostnameList == '' ? eleData.hostName : eleData.hostName + ';' + originalData.hostnameList;
            var newMacList = originalData.macList == '' ? eleData.macAddress : eleData.macAddress + ';' + originalData.macList;
            var params = {
                ACL_mode: '2',
                wifi_hostname_black_list: newHostnameList,
                wifi_mac_black_list: newMacList
            };
            self.updateMacFilterList(params);
        };
        /**
         * 主机名修改按钮点击事件
         * @method editHostNameHandler
         */
        self.editHostNameHandler = function (eleData) {
            editingHostname++;
            $("#hostname_input_" + eleData.idx).val(eleData.hostName);
            stationUtil.dealElement(true, eleData.idx);
            return false;
        };
        /**
         * 保存主机名事件
         * @method editHostNameHandler
         */
        self.saveHostNameHandler = function (eleData) {
            var $input = $("#hostname_input_" + eleData.idx);
            var newHostname = $input.val();
            if (newHostname == '') {
                $(".promptErrorLabel", "#confirm-message-container").text($.i18n.prop("required"));
                var $closestTD = $input.closest('td').addClass('has-error');
                addTimeout(function () {
                    $closestTD.removeClass('has-error');
                }, 5000);
                showAlert('required');
                return false;
            } else if(newHostname.indexOf(" ") == 0 || newHostname.lastIndexOf(" ") == (newHostname.length - 1) || /[\*\$\[&:,;<>'"\\`\]￥]{1,32}/.test(newHostname)) {
                showAlert('device_rename');
                return false;
            }
            showLoading('waiting');
            eleData.hostName = newHostname;
            service.editHostName({
                hostname: eleData.hostName,
                mac: eleData.macAddress
            }, function () {
                editingHostname = 0;
                service.getHostNameList({}, function(data){
                    hostNameList = data.devices;
                    if (eleData.type == 1) {
                        self.fetchAttachedDevices(function () {
                            hideLoading();
                            successOverlay();
                        });
                    } else if (eleData.type == 2) {
                        self.fetchAttachedCableDevices(function () {
                            hideLoading();
                            successOverlay();
                        });
                    } else if (eleData.type == 3) {
                        self.fetchBlacklist(function () {
                            hideLoading();
                            successOverlay();
                        });
                    }
                });
            }, function () {
                errorOverlay();
            });
        };
        /**
         * 取消编辑主机名事件
         * @method cancelEditHostNameHandler
         */
        self.cancelEditHostNameHandler = function (eleData) {
            stationUtil.dealElement(false, eleData.idx);
            editingHostname--;
        };
        self.cancelAllEditHostNameHandler = function () {
            stationUtil.dealElement(false, "all");
            editingHostname = 0;
        };
        /**
         * 从黑名单列表中移除
         * @method blacklistRemoveHandler
         */
        self.blacklistRemoveHandler = function (eleData) {
            if (originalData.macList.indexOf(eleData.macAddress) == -1) {
                return false;
            }
            if (editingHostname) {
                self.cancelAllEditHostNameHandler();
            }
            showLoading('waiting');
            var macArr = [];
            var hostnameArr = [];
            $.each(self.blackDevices(), function (i, n) {
                if (n.macAddress != eleData.macAddress) {
                    macArr.push(n.macAddress);
                    hostnameArr.push(n.hostName);
                }
            });
            var params = {
                ACL_mode: '2', //originalData.ACL_mode
                macFilteringMode: '2',   //originalData.ACL_mode    MTK 平台
                wifi_hostname_black_list: hostnameArr.join(';'),
                wifi_mac_black_list: macArr.join(';')
            };
            self.updateMacFilterList(params);
        };
        /**
         * 从黑名单列表中移除
         * @method blacklistRemoveHandler
         */
        self.updateMacFilterList = function (params) {
            service.setMacFilter(params, function (data) {
                if (data.result == "success") {
                    self.blackDevices([]);
                    self.fetchBlacklist(function () {
                        self.fetchAttachedDevices(function(){
                            successOverlay();
                        });
                    });
                }
            }, function () {
                errorOverlay();
            });
        };
    }

    var stationUtil = {
        dealElement: function (showEdit, idx) {
            if(idx == "all"){
                $("input[id^='hostname_txt_'],a[id^='edit_btn_']").show();
                $("input[id^='hostname_input_'],a[id^='cancel_btn_'],a[id^='save_btn_']").hide();
            }else{
                if (showEdit) {
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).hide();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).show();
                } else {
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).show();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).hide();
                }
            }            
        },
        /**
         * 匹配黑名单列表和主机名
         * @method parseBlackString
         */
        parseBlackString: function (macStr, hostnameStr) {
            if (macStr == "") {
                return [];
            }
            var tempHostName = hostnameStr.split(';');
            var tempMac = macStr.split(';');
            var result = [];
            for (var i = 0; i < tempMac.length; i++) {
                var obj = {};
                obj.hostName = tempHostName[i];
                obj.macAddress = tempMac[i];
                result.push({
                    hostName: tempHostName[i],
                    macAddress: tempMac[i]
                });
            }
            return result;
        },
        /**
         * 根据MAC匹配主机名
         * @method getHostName
         */
        getHostName: function (hostName, mac, hostNameList) {
            var ele = _.find(hostNameList, function (ele) {
                return ele.mac == mac;
            });
            return ele ? ele.hostname : hostName;
        }
    };

    /**
     * 初始化ViewModel
     * @method init
     */
    function init() {
        if(this.init){
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new stationInfoVM();
        ko.applyBindings(vm, container);
    }

    return {
        init: init
    };
});