/**
 * @module url filter setting
 * @class url filter
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],

    function ($, ko, config, service, _) {

        /**
         * system url filter setting VM
         * @class UrlFilterSettingVM
         */
        function UrlFilterSettingVM() {
            var self = this;
            var info = service.getUrlFilterList_2();
            var columnsTmpl = [
                {columnType: "checkbox", rowText: "index", width: "30%"},
                {headerTextTrans: "url", rowText: "url", width: "70%"}
            ];

            self.rules = ko.observableArray(info.urlFilterRules);
            service.bindCommonData(self);
            service.firewallHide();
            self.gridTemplate = new ko.simpleGrid.viewModel({
                data: self.rules(),
                idName: "index",
                columns: columnsTmpl,
                tmplType: 'list',
                pageSize: 10
            });
            var info2 = service.getFirewallSwitch().firewall_switch;
            self.isHideFirewall = ko.observable(true);
            if(info2 == "0"){
                self.isHideFirewall(false);
            }
            self.clear = function () {
                $("#addURLFilter").val("");
            };

            self.callback = function (data) {
                if (data.result == "success") {
                    self.clear();
                    init(self);
                    successOverlay();
                    $("#urlFilters").translate();
                } else {
                    errorOverlay();
                }
            };
            /**
             * 添加规则
             * @method addRule
             */
            self.addRule = function () {
                if (self.rules().length >= config.urlFilterMax) {
                    showAlert({msg: "url_filter_max", params: config.urlFilterMax});
                    return false;
                }
                var tempArray = [];
                for (var i = 0; i < self.rules().length; i++) {
                    tempArray.push(self.rules()[i].url);
                }
                if ($.inArray($("#addURLFilter").val(), tempArray) != -1) {
                    showAlert("url_repeated");
                    return false;
                }

                showLoading();
                var params = {
                    goformId: "URL_FILTER_ADD_2",
                    addURLFilter: $("#addURLFilter").val(),
                    CSRFToken: self.CSRFToken
                };
                service.addUrlFilterRule_2(params, self.callback);
            };
            /**
             * 删除规则
             * @method deleteRule
             */
            self.deleteRule = function () {
                showConfirm('confirm_data_delete', function () {
                    showLoading();
                    var params = {
                        goformId: "URL_FILTER_DELETE_2",
                        url_filter_delete_id: self.gridTemplate.selectedIds().join(";") + ";",
                        CSRFToken: self.CSRFToken
                    };
                    service.deleteSelectedRules_2(params, self.callback);
                });
            }
        }

        /**
         * 页面初始化
         * @method init
         */
        function init() {
             if(this.init){
                getRightNav(FIREWALL_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
                getTabsNav(FIREWALL_FILTER_URL);
            }
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new UrlFilterSettingVM();
            ko.applyBindings(vm, container[0]);
            $('#urlFilterForm').validate({
                submitHandler: function () {
                    vm.addRule();
                },
                rules: {
                    addURLFilter: 'url_filter_check'
                }
            });

            $("#urlFilterListForm").validate({
                submitHandler: function () {
                    vm.deleteRule();
                }
            });
        }

        return {
            init: init
        };
    });