/**
 * 家长控制
 * @module ParentalControlVM
 * @class ParentalControlVM
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var PAGES = {MAIN: 0, MANAGE: 1, RULE: 2};

		var MAX_ITEM = 10;
		var vm = null;
		
        function ParentalControlVM() {
            var self = this;
            var hostNameList = service.getHostNameList({}).devices;
            self.currentPage = ko.observable(PAGES.MAIN);
            self.pages = PAGES;

            self.currentUserInChildGroup = ko.observable(true);

            self.childGroupList = ko.observable([]);
            self.childGroupMac = ko.computed(function(){
                return _.map(self.childGroupList(), function(ele){
                    return ele.mac;
                });
            });
            /**
             * 获取儿童组设备列表
             * @method fetchChildGroupList
             */
            self.fetchChildGroupList = function(cb){
                service.childGroupList({}, function(data){
                    self.currentUserInChildGroup(service.checkCurrentUserInChildGroup(data.devices).result);
                    self.childGroupList([]);
                    _.map(data.devices, function(ele, idx){
                        ele.idx = idx;
                        ele.hostname = pcUtil.getHostName(ele.hostname, ele.mac, hostNameList);
                    });
                    self.childGroupList(data.devices);
                    if(_.isFunction(cb)){
                        cb.apply(this);
                    }
                });
            };
            self.fetchChildGroupList();

            self.attachedDevices = ko.observable([]);
            self.manageHandler = function () {
                self.currentPage(PAGES.MANAGE);
                self.fetchAttachedDevices();
            };
            /**
             * 获取已连接设备列表
             * @method fetchAttachedDevices
             */
            self.fetchAttachedDevices = function(cb){
                self.attachedDevices([]);
                var currentDevices = [];
                var counter = 0;
				/*wifi 已连接设备*/
                service.getCurrentlyAttachedDevicesInfo({}, function (data) {
                    counter++;
                    var devices = _.map(data.attachedDevices, function (ele) {
                        ele.idx = _.uniqueId('wireless_');
                        ele.hostName = pcUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.inChildGroup = _.contains(self.childGroupMac(), ele.macAddress);
                        return ele;
                    });
                    if (counter == 1) {
                        currentDevices = devices;
                    } else {
                        self.attachedDevices(_.flatten([currentDevices, devices]));
                        if (_.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
                /*RJ45 已连接设备*/
                service.getAttachedCableDevices({}, function (data) {
                    counter++;
                    var devices = _.map(data.attachedDevices, function (ele) {
                        ele.idx = _.uniqueId('wireless_');
                        ele.hostName = pcUtil.getHostName(ele.hostName, ele.macAddress, hostNameList);
                        ele.inChildGroup = _.contains(self.childGroupMac(), ele.macAddress);
                        return ele;
                    });
                    if (counter == 1) {
                        currentDevices = devices;
                    } else {
                        self.attachedDevices(_.flatten([currentDevices, devices]));
                        if (_.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
            };

            ko.computed(function () {
                self.attachedDevices();
                self.childGroupList();
                $("#pc_children_group_form").translate();
            }).extend({ notify: 'always', throttle: 300 });
            /**
             * 儿童组设备 标签按钮事件
             * @method backToMainHandler
             */
            self.backToMainHandler = function () {
                 self.currentPage(PAGES.MAIN);
            };
            /**
             * 添加至儿童组
             * @method addChildGroupFun
             */
            function addChildGroupFun(flag,eleData){
                showLoading();
                service.addChildGroup(eleData, function(data){
                    self.fetchChildGroupList(function(){
                        self.fetchAttachedDevices(function(){
                            hideLoading();
                            if(flag){
                                service.logout({}, function(){
                                    window.location = 'main.html';
                                });
                            }
                        });
                    });
                }, function(data){
                    errorOverlay();
                });
            }
            /**
             * 添加按钮事件
             * @method addChildGroupFun
             */
            self.addChildGroupHandler = function(eleData){
                var userMacAddr = service.getCurretnMAC();
                if(userMacAddr == eleData.macAddress){
                    showConfirm("parental_add_self",function(){
                        addChildGroupFun(true,eleData);
                    })
                } else{
                    addChildGroupFun(false,eleData);
                }
            };
            /**
             * 移除按钮事件
             * @method removeChildGroupHandler
             */
            self.removeChildGroupHandler = function(eleData){
                showLoading();
                service.removeChildGroup(eleData, function(data){
                    self.fetchChildGroupList(function(){
                        self.fetchAttachedDevices(function(){
                            hideLoading();
                        });
                    });
                }, function(data){
                    errorOverlay();
                });
            };

            self.dealElement = function(showEdit, idx){
                if(showEdit){
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).hide();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).show();
                }else{
                    $("#edit_btn_" + idx + ",#hostname_txt_" + idx).show();
                    $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#hostname_input_" + idx).hide();
                }
            };
            /**
             * 主机名编辑按钮事件
             * @method editHostNameHandler
             */
            self.editHostNameHandler = function(eleData){
                $("#hostname_input_" + eleData.idx).val(eleData.hostname);
                self.dealElement(true, eleData.idx);
                return false;
            };
            /**
             * 主机名编辑保存按钮事件
             * @method editHostNameHandler
             */
            self.saveHostNameHandler = function(eleData){
                var $input = $("#hostname_input_" + eleData.idx);
                var newHostname = $.trim($input.val());
                if(newHostname == ''){
                    $(".promptErrorLabel", "#confirm-message-container").text($.i18n.prop("required"));
                    var $closestTD = $input.closest('td').addClass('has-error');
                    addTimeout(function(){
                        $closestTD.removeClass('has-error');
                    }, 5000);
                    showAlert('required');
                    return false;
                }else if(newHostname.indexOf(" ") == 0 || newHostname.lastIndexOf(" ") == (newHostname.length - 1) || /[\*\+\$\[&:,;<>'"\\`\]￥]{1,32}/.test(newHostname)) {
                    showAlert('modify_hostname_invalid');
                    return false;
                }
                showLoading();
                eleData.hostname = newHostname;
                service.editHostName(eleData, function(){
                    service.getHostNameList({}, function(hostNameData){
                        hostNameList = hostNameData.devices;
                        self.fetchChildGroupList(function(){
                            hideLoading();
                        });
                        self.fetchAttachedDevices();
                    });
                }, function(){
                    errorOverlay();
                });
            };
            /**
             * 取消编辑主机名按钮事件
             * @method cancelEditHostNameHandler
             */
            self.cancelEditHostNameHandler = function(eleData){
                self.dealElement(false, eleData.idx);
            };

			/////////////////////////////////////////////////////////////////
			self.siteList = ko.observable([]);
            self.selectedIds = ko.observableArray([]);
            self.disableAdd = ko.computed(function(){
                return self.siteList().length == MAX_ITEM;
            });
            /**
             * 获取网站白名单列表
             * @method fetchSiteWhiteList
             */
			self.fetchSiteWhiteList = function (cb) {
                service.getSiteWhiteList({}, function (data) {
                    self.selectedIds([]);
                    self.siteList(data.siteList);
                    _.isFunction(cb) && cb.apply(this);
                }, function () {
                    self.siteList([]);
                    _.isFunction(cb) && cb.apply(this);
                });
            };
			ko.computed(function () {
                self.siteList();
                self.selectedIds();
                setTimeout(function () {
                    renderCheckbox();
                }, 100);
                $("#pc_site_white_list_form").translate();
            });
            /**
             * 网站白名单列表选择框点击事件
             * @method checkboxClickHandler
             */
			self.checkboxClickHandler = function (eleData, evt) {
                addTimeout(function () {
                    self.selectedIds(getSelectedCheckboxValues());
                }, 100);
            };
            /**
             * 网站白名单添加按钮事件
             * @method openAddSitePopoverHandler
             */
			self.openAddSitePopoverHandler = function(){
                var addNewSiteTmpl = $("#addNewSiteTmpl").html();
                popover.open({
                    target: $("#openAddSiteBtn"),
                    html: addNewSiteTmpl,
                    width: "300px",
                    validation: addValidation
                });
            };
            /**
             * 网站白名单移除按钮事件
             * @method removeWhiteSite
             */
            self.removeWhiteSite = function(eleData, evt){
                removeSiteWhiteItem([eleData.id]);
            };
            /**
             * 网站白名单删除按钮事件
             * @method removeWhiteSite
             */
            self.removeSelectedWhiteSite = function(){
                removeSiteWhiteItem(getSelectedCheckboxValues());
            };
            /**
             * 网站白名单删除所有按钮事件
             * @method removeWhiteSite
             */
            self.removeAllWhiteSite = function(){
                removeSiteWhiteItem(getAllCheckboxValues());
            };
            /**
             * 网站白名单删除函数
             * @method removeSiteWhiteItem
             */
			 function removeSiteWhiteItem(ids){
                showConfirm('confirm_data_delete', function(){
                    showLoading();
                    service.removeSiteWhite({ids: ids}, function(data){
                        self.fetchSiteWhiteList(function(){
                            successOverlay();
                        });
                    }, function(data){
                        self.fetchSiteWhiteList(function(){
                            errorOverlay();
                        });
                    });
                });
            }
            /**
             * 网站白名单添加框保存按钮事件
             * @method saveSiteWhite
             */
			 self.saveSiteWhite = function(name, site){
                popover.hide();
                var matched = _.find(self.siteList(), function(one){
                    return one.site == site;
                });
                if(matched){
                    showAlert("pc_link_exist", function(){
                        setTimeout(function(){
                            popover.show();
                        }, 200);
                    });
                    return false;
                }

                showLoading();
                service.saveSiteWhite({
                    name: name,
                    site: site
                }, function(){
                    self.fetchSiteWhiteList(function(){
                        popover.close();
                        successOverlay();
                    });
                }, function(){
                    self.fetchSiteWhiteList(function(){
                        errorOverlay();
                        popover.show();
                    });
                });
            };
			//////////////////////////////////////////////////////////////////
			self.notSave = ko.observable(false);
            /**
             * 获取时间限制信息
             * @method fetchTimeLimited
             */			
			self.fetchTimeLimited = function () {
                service.getTimeLimited({}, function (data) {
                    for (var k in data) {
                        for (var i = 0; i < data[k].length; i++) {
                            var id = 'td_' + k + '_' + data[k][i];
                            $("#" + id).addClass('active');
                        }
                    }
                }, function () {
                });
            };
            /**
             * 上网时间设置保存按钮事件
             * @method saveTimeLimitedHandler
             */	
			self.saveTimeLimitedHandler = function () {
                showLoading();
                var tds = getSelectedTds();
                var timeStr = getSavedData(tds);
                service.saveTimeLimited({time: timeStr}, function () {
                    self.notSave(false);
                    successOverlay();
                }, function () {
                    errorOverlay();
                });
            };
            /**
             * 上网时间设置时间表格事件绑定
             * @method bindEvent
             */	
			 self.bindEvent = function () {
                $("td:not('.col-head')", "#pc_time_limited_tbody").addClass('cursorhand').die().click(function () {
                    self.notSave(true);
                    $(this).toggleClass('active');
                }).hover(function () {
                    var $this = $(this);
                    var w = $this.data('week');
                    var h = $this.data('hour');
                    $("tr:nth-child(" + (w + 1) + ") td:first-child", "#pc_time_limited_tbody").addClass('time_td_hover');
                    $("#col_" + h).addClass('time_td_hover');
                    if ($this.not('.active')) {
                        $this.addClass('time_td_hover');
                    }
                }, function () {
                    var $this = $(this);
                    var w = $this.data('week');
                    var h = $this.data('hour');
                    $("tr:nth-child(" + (w + 1) + ") td:first-child", "#pc_time_limited_tbody").removeClass('time_td_hover');
                    $("#col_" + h).removeClass('time_td_hover');
                    $this.removeClass('time_td_hover');
                });
            };
			
			//////////////////////////////////////////////////////////////////
			var hasBinded = false;
            /**
             * 上网规则标签点击事件
             * @method openRulePage
             */	
			 self.openRulePage = function(){
				if(self.currentPage() == PAGES.RULE){
					return;
				}				
				self.currentPage(PAGES.RULE);
				self.currentUserInChildGroup(service.checkCurrentUserInChildGroup().result);
				initTableData();
				if(!hasBinded){
					if (!self.currentUserInChildGroup()) {
                        self.bindEvent();
                    }
					hasBinded = true;
				}
				showLoading();				
				self.fetchTimeLimited();
				self.fetchSiteWhiteList(function(){
                    hideLoading();
                });				
			}
        }

        var pcUtil = {
            getHostName: function (hostName, mac, hostNameList) {
                var ele = _.find(hostNameList, function (ele) {
                    return ele.mac == mac;
                });
                return ele ? ele.hostname : hostName;
            }
        };
        /**
         * 获取列表中被选中项的value值
         * @method getCheckboxValues
         */	
		function getSelectedCheckboxValues() {
            return getCheckboxValues(true);
        }
		function getAllCheckboxValues() {
            return getCheckboxValues(false);
        }
		function getCheckboxValues(isChecked) {
            var selectedSites = [];
            $(":checkbox" + (isChecked ? ":checked" : ""), "#pb_white_list").each(function (i, n) {
                selectedSites.push(n.value)
            });
            return selectedSites;
        }
        /**
         * 增加网站白名单表单提交函数绑定和校验规则设置
         * @method addValidation
         */			
		function addValidation(){
            $('#whiteSiteAddForm').validate({
                submitHandler: function () {
                    var name = $("#siteName").val();
                    var site = $("#siteLink").val();
                    vm.saveSiteWhite(name, site);
                },
                rules:{
                    siteName : 'siteName_check',
                    siteLink : 'siteLink_check'
                }
            });
        }
        /**
         * 获取时间表格选中的时间
         * @method getSelectedTds
         */			
		function getSelectedTds() {
            var defaultValue = {
                '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': []
            };
            $("td.active", "#pc_time_limited_tbody").each(function (i, n) {
                var $this = $(n);
                var w = $this.data('week');
                var h = $this.data('hour');
                defaultValue[w].push(h);
            });
            return defaultValue;
        }

        function getSavedData(tds) {
            var result = '';
            for (var k in tds) {
                var hours = _.sortBy(tds[k], function (n) {
                    return n;
                });
                if (tds[k].length) {
                    result += k + '+';
                    result += hours.join(',');
                    result += ';'
                }
            }
            return result.substring(0, result.length - 1);
        }
        /**
         * 初始化时间表格
         * @method initTableData
         */	
        function initTableData() {
            $("tr", "#pc_time_limited_tbody").each(function (i, n) {
                var $tr = $(n);
                $("td:not(:first)", $tr).each(function (j, m) {
                    var $td = $(m);
                    var h = convertHour(j);
                    $td.attr({
                        id: 'td_' + i + '_' + h
                    }).data({week: i, hour: h});
                });
            });
			$("td.active", "#pc_time_limited_tbody").removeClass("active");
            $("thead td:not(:first)", "#pc_time_limited_form").each(function (i, n) {
                var h = convertHour(i);
                $(n).attr({id: 'col_' + h});
            });
			vm.notSave(false);
        }

        function convertHour(h) {
            if (h > 16) {
                return h - 17;
            } else {
                return h + 7;
            }
        }
        /**
         * 页面初始化
         * @method init
         */	        
		function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            vm = new ParentalControlVM();
            ko.applyBindings(vm, container[0]);
        }

        return {
            init: init
        };
    });