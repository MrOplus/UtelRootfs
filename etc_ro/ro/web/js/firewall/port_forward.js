/**
 * @module prot_forward
 * @class prot_forward
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    var protocolModes = _.map(config.FORWARD_PROTOCOL_MODES, function(item) {
        return new Option(item.name, item.value);
    });
        /**
         * 列表模板的columns项
         * @event columnsTmpl
         */
    var columnsTmpl = [
        { columnType:"checkbox", rowText:"index", width:"8%" },
        { headerTextTrans:"ip_address", rowText:"ipAddress", width:"23%" },
        { headerTextTrans:"port_range", rowText:"portRange", width:"23%" },
        { headerTextTrans:"protocol", rowText:"protocol", width:"23%" },
        { headerTextTrans:"comment", rowText:"comment", width:"23%" }
    ];

    /**
     * prot_forward VM
     * @class PortForwardVM
     */
	function PortForwardVM() {
        var self = this;
        var info = getPortForward();

        self.portForwardEnable = ko.observable(info.portForwardEnable);
        self.oriPortForwardEnable = ko.observable(info.portForwardEnable);

        self.ipAddress = ko.observable('');
        self.portStart = ko.observable('');
        self.portEnd = ko.observable('');

        self.modes = ko.observableArray(protocolModes);
        self.selectedMode = ko.observable('3');
        self.comment = ko.observable('');

        self.rules = ko.observableArray(info.portForwardRules);
        service.firewallHide();
        service.bindCommonData(self);
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }
        /**
         * 创建列表模板
         * @event gridTemplate
         */
        self.gridTemplate = new ko.simpleGrid.viewModel({
            data:self.rules(),
            idName:"index",
            columns:columnsTmpl,
            tmplType:'list',
            pageSize: 10
        });

        /**
         * 设定,新增,删除回调函数
         * @method callback
         */
        self.callback = function(result) {
            if (result.result == "success") {
                clear();
                init(self);
                successOverlay();
            } else {
                errorOverlay();
            }
        };

        /**
         * 情况添加规则输入
         * @method clear
         */
        function clear() {
            self.ipAddress('');
            self.portStart('');
            self.portEnd('');
            self.selectedMode('TCP&UDP');
            self.comment('');
        }

        /**
         * 设定虚拟服务器
         * @method enableVirtualServer
         */
        self.enableVirtualServer = function() {
            showLoading();
            var params = {};
            params.portForwardEnable = self.portForwardEnable();
            params.CSRFToken = self.CSRFToken;
            service.enableVirtualServer(params, self.callback);
        };

        /**
         * 保存规则
         * @method save
         */
        self.save = function() {
            if(self.rules().length >= config.portForwardMax) {
                showAlert({msg: "rules_max", params: config.portForwardMax});
                return;
            }

            if(self.checkExist()) {
                showAlert("rule_exist");
                return;
            }

            showLoading();
            var params = {};
            params.ipAddress = self.ipAddress();
            params.portStart = self.portStart();
            params.portEnd = self.portEnd();
            params.protocol = self.selectedMode();
            params.comment = self.comment();
            params.CSRFToken = self.CSRFToken;
            service.setPortForward(params, self.callback);
        };

        /**
         * 检查新增规则是否已经存在
         * @method checkExist
         */
        self.checkExist = function() {
            var newRule = {
                ipAddress: self.ipAddress(),
                portRange: self.portStart() + ' - ' + self.portEnd(),
                protocol: transProtocolValue(self.selectedMode())
            };

            var oldRule;
            var rules = self.rules();
            for(var i = 0; i < rules.length; i++) {
                oldRule = {
                    ipAddress: rules[i].ipAddress,
                    portRange: rules[i].portRange,
                    protocol: rules[i].protocol
                };

                if(_.isEqual(newRule, oldRule)) {
                    return true;
                }
            }
            return false;
        };

        /**
         * 删除规则
         * @method deleteForwardRules
         */
        self.deleteForwardRules = function() {
            var ids = self.gridTemplate.selectedIds();
            if(ids.length == 0) {
                showAlert("no_data_selected");
                return;
            }

            showConfirm("confirm_data_delete", function () {
                showLoading('deleting');
                var params = {};
                params.indexs = ids;
                params.CSRFToken = self.CSRFToken;
                service.deleteForwardRules(params, self.callback);
            });
        };
    }

    /**
     * 获取port forward信息
     * @method getPortForward
     */
    function getPortForward() {
        return service.getPortForward();
    }


    /**
     * 初始化port forward view model
     * @method init
     */
	function init(viewModel) {
        var vm;
        if(viewModel) {
            vm = viewModel;
            var info = getPortForward();
            vm.portForwardEnable(info.portForwardEnable);
            vm.oriPortForwardEnable(info.portForwardEnable);
            vm.rules(info.portForwardRules);
			vm.gridTemplate.clearAllChecked();
            vm.gridTemplate.data(info.portForwardRules);
            refreshTableHeight();
            return;
        }

        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        vm = new PortForwardVM();
        var container = $('#container');
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

        fixTableHeight();
        renderCheckbox();

        $('#virtualServerForm').validate({
            submitHandler : function() {
                vm.enableVirtualServer();
            }
        });

        $('#portForwardListForm').validate({
            submitHandler : function() {
                vm.deleteForwardRules();
            }
        });

        $('#portForwardForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtIpAddress: {
                    ip_check: true
                },
                txtPortStart: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtPortEnd"
                },
                txtPortEnd: {
                    digits: true,
                    range: [1, 65535],
                    portCompare: "#txtPortStart"
                },
                txtComment: {
                    comment_check: true
                }
            },
            groups: {
                range: "txtPortStart txtPortEnd"
            },
            errorPlacement: function(error, element) {
                if(element.attr("name") == "txtIpAddress") {
                    error.appendTo("#ipErrorDiv");
                }
                else if(element.attr("name") == "txtPortStart" || element.attr("name") == "txtPortEnd") {
                    error.appendTo("#portRangeErrorDiv");
                }
                else
                    error.insertAfter(element);
            }
        });
	}

	return {
		init : init
	};
});