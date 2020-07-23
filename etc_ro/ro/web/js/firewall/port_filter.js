/**
 * @module prot_filter
 * @class prot_filter
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    var PROTOCOL = {
        ICMP: 'ICMP',
        NONE: 'None'
    };

    var protocolModes = _.map(config.FILTER_PROTOCOL_MODES, function(item) {
        return new Option(item.name, item.value);
    });

    var columnsTmpl = [
        { columnType:"checkbox", rowText:"index", width:"4%" },
        { headerTextTrans:"mac_address", rowText:"macAddress", width:"12%" },
        { headerTextTrans:"ip_type", rowText:"ipType", width:"5%", display: config.IPV6_SUPPORT },
        { headerTextTrans:"source_ip_address", rowText:"sourceIpAddress", width:"12%"},
        { headerTextTrans:"dest_ip_address", rowText:"destIpAddress", width:"12%"},
        { headerTextTrans:"protocol", rowText:"protocol", width:"12%", needTrans: true},
        { headerTextTrans:"source_port_range", rowText:"sourcePortRange", width:"12%" },
        { headerTextTrans:"dest_port_range", rowText:"destPortRange", width:"12%" },
        { headerTextTrans:"port_filter_action", rowText:"action", width:"12%", needTrans: true},
        { headerTextTrans:"comment", rowText:"comment", width:"12%" }
    ];

    /**
     * prot_filter VM
     * @class PortFilterVM
     */
	function PortFilterVM() {
        var self = this;
        var info = getPortFilter();

        self.portFilterEnable = ko.observable(info.portFilterEnable);
        self.oriPortFilterEnable = ko.observable(info.portFilterEnable);
        self.defaultPolicy = ko.observable(info.defaultPolicy);
        self.oriDefaultPolicy = ko.observable(info.defaultPolicy);

        self.portFilterAction = ko.observable('');
        self.macAddress = ko.observable('');
        self.destIpAddress = ko.observable('');
        self.sourceIpAddress = ko.observable('');
        self.sourceIpv6Address = ko.observable('');
        self.destIpv6Address = ko.observable('');
        self.destPortStart = ko.observable('');
        self.destPortEnd = ko.observable('');
        self.sourcePortStart = ko.observable('');
        self.sourcePortEnd = ko.observable('');
        self.modes = ko.observableArray(protocolModes);
        self.selectedMode = ko.observable('5');
        self.comment = ko.observable('');
        self.ipv6Support = ko.observable(config.IPV6_SUPPORT);

        self.ipType = ko.observable('ipv4');

        self.rules = ko.observableArray(info.portFilterRules);
        service.firewallHide();
        service.bindCommonData(self);
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }
        /**
         * default policy change handler
         * @event policyChangeHandler
         */
        self.policyChangeHandler = function() {
            var filterAction = self.defaultPolicy() == "1" ? "Accept" : "Drop";
            self.portFilterAction(filterAction);
            return true;
        };
        /**
         * 创建列表模板
         * @event gridTemplate
         */
        self.gridTemplate = new ko.simpleGrid.viewModel({
            data:self.rules(),
            idName:"index",
            columns:columnsTmpl,
            tmplType:'list',
            pageSize: 20
        });

        /**
         * 设定,新增,删除回调函数
         * @method callback
         */
        self.callback = function(result) {
            if (result.result == "success") {
                self.clear();
                init(self);
                successOverlay();
            } else {
                errorOverlay();
            }
        };

        /**
         * 清空添加规则输入
         * @method clear
         */
        self.clear = function() {
            self.macAddress('');
            self.destIpAddress('');
            self.destIpv6Address('');
            self.sourceIpAddress('');
            self.sourceIpv6Address('');
            self.destPortStart('0');
            self.destPortEnd('0');
            self.sourcePortStart('0');
            self.sourcePortEnd('0');
            self.selectedMode('None');
            self.comment('');
            clearValidateMsg();
        };

        /**
         * 设定过滤基本信息
         * @method enableVirtualServer
         */
        self.setPortFilterBasic = function() {
            showLoading();
            var params = {};
            params.portFilterEnable = self.portFilterEnable();
            params.defaultPolicy = self.defaultPolicy();
            params.CSRFToken = self.CSRFToken;
            service.setPortFilterBasic(params, self.callback);
        };

        /**
         * 保存规则
         * @method save
         */
        self.save = function() {
            self.macAddress(self.macAddress().replace(/\s+/g,''));
            self.destIpv6Address(self.destIpv6Address().replace(/\s+/g, ''));
            self.sourceIpv6Address(self.sourceIpv6Address().replace(/\s+/g, ''));
            self.destIpAddress(self.destIpAddress().replace(/\s+/g, ''));
            self.sourceIpAddress(self.sourceIpAddress().replace(/\s+/g, ''));
            if(self.ipv6Support()) {
                var typeInfo = self.ipType() == "ipv4"? "IPv4" : "IPv6";
                var oldRules = _.filter(self.rules(), function(ruleItem) {
                    return ruleItem.ipType == typeInfo;
                });

                if(oldRules.length >= config.portForwardMax) {
                    showAlert({msg: "rules_max_v4v6", params: [typeInfo, config.portForwardMax]});
                    return;
                }

                if(self.checkExist()) {
                    showAlert({msg: "rule_exist_v4v6", params: typeInfo});
                    return;
                }

            } else {
                if(self.rules().length >= config.portForwardMax) {
                    showAlert({msg: "rules_max", params: config.portForwardMax});
                    return;
                }

                if(self.checkExist()) {
                    showAlert("rule_exist");
                    return;
                }
            }
			showConfirm("confirm_data_effect", function () {
                showLoading();
                var params = {};
                params.macAddress = self.macAddress();

                if(self.ipv6Support() && self.ipType() == 'ipv6') {
                    params.destIpAddress = self.destIpv6Address();
                    params.sourceIpAddress = self.sourceIpv6Address();
                } else {
                    params.destIpAddress = self.destIpAddress();
                    params.sourceIpAddress = self.sourceIpAddress();
                }

                params.destPortStart = self.destPortStart();
                params.destPortEnd = self.destPortEnd();
                params.sourcePortStart = self.sourcePortStart();
                params.sourcePortEnd = self.sourcePortEnd();
                params.action = self.portFilterAction();
                params.protocol = self.selectedMode();
                params.comment = self.comment();
                params.ipType = self.ipType();
                service.setPortFilter(params, self.callback);
			});
        };

        /**
         * 检查新增规则是否已经存在
         * @method checkExist
         */
        self.checkExist = function() {
            self.macAddress(self.macAddress().toUpperCase());
            var newIpType = self.ipType().toUpperCase();
            var newRule = {
                macAddress: self.macAddress(),
                destIpAddress: newIpType == "IPV4"? self.destIpAddress() : self.destIpv6Address(),
                sourceIpAddress: newIpType == "IPV4"? self.sourceIpAddress() : self.sourceIpv6Address(),
                destPortRange: self.destPortStart() == '0'? '' : self.destPortStart() + ' - ' + self.destPortEnd(),
                sourcePortRange: self.sourcePortStart() == '0'? '' : self.sourcePortStart() + ' - ' + self.sourcePortEnd(),
                action: self.portFilterAction() == "Drop" ? "filter_drop" : "filter_accept",
                protocol: transProtocolValue(self.selectedMode()),
                ipType: newIpType
            };

            var oldRule;
            var rules = self.rules();
            for(var i = 0; i < rules.length; i++) {
                oldRule = {
                    macAddress: rules[i].macAddress,
                    destIpAddress: rules[i].destIpAddress,
                    sourceIpAddress: rules[i].sourceIpAddress,
                    destPortRange: rules[i].destPortRange,
                    sourcePortRange: rules[i].sourcePortRange,
                    action: rules[i].action,
                    protocol: rules[i].protocol,
                    ipType: rules[i].ipType.toUpperCase()
                };

                if(_.isEqual(newRule, oldRule)) {
                    return true;
                }
            }
            return false;
        };

        /**
         * 删除规则
         * @method deleteFilterRules
         */
        self.deleteFilterRules = function() {
            var ids = self.gridTemplate.selectedIds();
            if(ids.length == 0) {
                showAlert("no_data_selected");
                return;
            }

            showConfirm("confirm_data_effect", function () {
                showLoading('deleting');
                var params = {};
                params.indexs = ids;
                service.deleteFilterRules(params, self.callback);
            });
        };

        /**
         * 协议变化事件监听
         * @event protocolChangeHandler
         */
        self.protocolChangeHandler = function() {
            if(self.selectedMode() == PROTOCOL.ICMP || self.selectedMode() == PROTOCOL.NONE) {
                self.destPortStart('0');
                self.destPortEnd('0');
                self.sourcePortStart('0');
                self.sourcePortEnd('0');
                clearValidateMsg('#portRangeArea');
            }
            else {
                self.destPortStart('1');
                self.destPortEnd('65535');
                self.sourcePortStart('1');
                self.sourcePortEnd('65535');
            }
            return true;
        };

        /**
         * ip类型变化事件监听
         * @event ipTypeChangeHandler
         */
        self.ipTypeChangeHandler = function() {
            clearValidateMsg();
            return true;
        };

        //init to call
        self.policyChangeHandler();
    }

    /**
     * 获取port filter信息
     * @method getPortFilter
     */
    function getPortFilter() {
        return service.getPortFilter();
    }

    /**
     * 初始化port filter view model
     * @method init
     */
	function init(viewModel) {
        var vm;
        if(viewModel) {
            vm = viewModel;
            var info = getPortFilter();
            vm.portFilterEnable(info.portFilterEnable);
            vm.oriPortFilterEnable(info.portFilterEnable);
            vm.defaultPolicy(info.defaultPolicy);
            vm.oriDefaultPolicy(info.defaultPolicy);
            vm.rules(info.portFilterRules);
            vm.gridTemplate.clearAllChecked();
            vm.gridTemplate.data(info.portFilterRules);
            refreshTableHeight();
            $('#portFilters').find('tbody').translate()
            renderCheckbox();
            $('.notes-content').translate();
            return;
        }

        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        vm = new PortFilterVM();
        var container = $('#container');
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

        fixTableHeight();

        $('#filterBasicForm').validate({
            submitHandler : function() {
                showConfirm("confirm_data_effect", function () {
                    vm.setPortFilterBasic();
                });                
            }
        });

        $('#portFilterListForm').validate({
            submitHandler : function() {
                vm.deleteFilterRules();
            }
        });

        $('#portFilterForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtMacAddress: {
                    filter_optional: true,
                    mac_check: true
                },
                txtDestIpAddress: {
                    ip_check: true
                },
                txtSourceIpAddress: {
                    ip_check: true
                },
                txtSourceIpv6Address: {
                    ipv6: true
                },
                txtDestIpv6Address: {
                    ipv6: true
                },
                txtDestPortStart: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtDestPortEnd"
                },
                txtDestPortEnd: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtDestPortStart"
                },
                txtSourcePortStart: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtSourcePortEnd"
                },
                txtSourcePortEnd: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtSourcePortStart"
                },

                txtComment: {
                    comment_check: true
                }
            },
            groups: {
                destPort: "txtDestPortStart txtDestPortEnd",
                sourcePort: "txtSourcePortStart txtSourcePortEnd"
            },
            errorPlacement: function(error, element) {
                if(element.attr("name") == "txtMacAddress") {
                    error.appendTo("#macErrorDiv");
                }
                else if(element.attr("name") == "txtDestPortStart" || element.attr("name") == "txtDestPortEnd") {
                    error.appendTo("#destPortErrorDiv");
                }
                else if(element.attr("name") == "txtSourcePortStart" || element.attr("name") == "txtSourcePortEnd") {
                    error.appendTo("#sourcePortErrorDiv");
                }
                else
                    error.insertAfter(element);
            }
        });
	}

    $.validator.addMethod("filter_optional", function (value, element, param) {
        var result = _.any(['#txtMacAddress', '#txtDestIpAddress', '#txtSourceIpAddress','#txtSourceIpv6Address','#txtDestIpv6Address'],
            function(item) {
                var tmp = $(item).val().replace(/\s+/g,'');
                return $(item+':visible').length > 0 && tmp != '';
            }
        );

        var portResult = _.any(['#txtDestPortStart', '#txtDestPortEnd', '#txtSourcePortStart', '#txtSourcePortEnd'],
            function(item) {
                return $(item).val() != '0';
            }
        );

        return result || portResult;
    });

	return {
		init : init
	};
});