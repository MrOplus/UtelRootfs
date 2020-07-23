/**
 * @module prot_map
 * @class prot_map
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    var protocolModes = _.map(config.MAP_PROTOCOL_MODES, function(item) {
        return new Option(item.name, item.value);
    });

    var columnsTmpl = [
        { columnType:"checkbox", rowText:"index", width:"8%" },
        { headerTextTrans:"source_port", rowText:"sourcePort", width:"20%" },
        { headerTextTrans:"dest_ip_address", rowText:"destIpAddress", width:"20%" },
        { headerTextTrans:"dest_port", rowText:"destPort", width:"20%" },
        { headerTextTrans:"protocol", rowText:"protocol", width:"12%" },
        { headerTextTrans:"comment", rowText:"comment", width:"20%" }
    ];

    /**
     * prot_map VM
     * @class PortMapVM
     */
	function PortMapVM() {
        var self = this;
        var info = getPortMap();

        self.portMapEnable = ko.observable(info.portMapEnable);
        self.oriPortMapEnable = ko.observable(info.portMapEnable);

        self.sourcePort = ko.observable('');
        self.destIpAddress = ko.observable('');
        self.destPort = ko.observable('');

        self.modes = ko.observableArray(protocolModes);
        self.selectedMode = ko.observable('TCP&UDP');
        self.comment = ko.observable('');

        self.rules = ko.observableArray(info.portMapRules);
        service.bindCommonData(self);
        service.firewallHide();
        self.gridTemplate = new ko.simpleGrid.viewModel({
            data:self.rules(),
            idName:"index",
            columns:columnsTmpl,
            tmplType:'list',
            pageSize: 10
        });
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }

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
            self.sourcePort('');
            self.destIpAddress('');
            self.destPort('');
            self.selectedMode('TCP&UDP');
            self.comment('');
        }

        /**
         * 设定端口映射
         * @method enablePortMap
         */
        self.enablePortMap = function() {
            showLoading();
            var params = {};
            params.portMapEnable = self.portMapEnable();
            params.CSRFToken = self.CSRFToken;
            service.enablePortMap(params, self.callback);
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
            params.portMapEnable = self.portMapEnable();
            params.sourcePort = self.sourcePort();
            params.destIpAddress = self.destIpAddress();
            params.destPort = self.destPort();
            params.protocol = self.selectedMode();
            params.comment = self.comment();
            params.CSRFToken = self.CSRFToken;
            service.setPortMap(params, self.callback);
        };

        /**
         * 检查新增规则是否已经存在
         * @method checkExist
         */
        self.checkExist = function() {
            var newRule = {
                sourcePort: self.sourcePort(),
                destIpAddress: self.destIpAddress(),
                destPort: self.destPort(),
                protocol: transProtocolValue(self.selectedMode())
            };

            var oldRule;
            var rules = self.rules();
            for(var i = 0; i < rules.length; i++) {
                oldRule = {
                    sourcePort: rules[i].sourcePort,
                    destIpAddress: rules[i].destIpAddress,
                    destPort: rules[i].destPort,
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
         * @method deleteMapRules
         */
        self.deleteMapRules = function() {
            var ids = self.gridTemplate.selectedIds();
            if(ids.length == 0) {
                showAlert("no_data_selected");
                return;
            }

            showConfirm("confirm_data_delete", function () {
                showLoading();
                var params = {};
                params.indexs = ids;
                params.CSRFToken = self.CSRFToken;
                service.deleteMapRules(params, self.callback);
            });
        };
    }

    /**
     * 获取port map信息
     * @method getPortMap
     */
    function getPortMap() {
        return service.getPortMap();
    }


    /**
     * 初始化port map view model
     * @method init
     */
	function init(viewModel) {
        var vm;
        if(viewModel) {
            vm = viewModel;
            var info = getPortMap();
            vm.portMapEnable(info.portMapEnable);
            vm.oriPortMapEnable(info.portMapEnable);
            vm.rules(info.portMapRules);
            vm.gridTemplate.clearAllChecked();
            vm.gridTemplate.data(info.portMapRules);
            refreshTableHeight();
            renderCheckbox();
            return;
        }

        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		vm = new PortMapVM();
        var container = $('#container');
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

        fixTableHeight();

        $('#mapBasicForm').validate({
            submitHandler : function() {
                vm.enablePortMap();
            }
        });

        $('#portMapListForm').validate({
            submitHandler : function() {
                vm.deleteMapRules();
            }
        });

        $('#portMapForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtDestIpAddress: {
                    ip_check: true
                },
                txtSourcePort: {
                    digits: true,
                    range_except: [1, 65000]
                },
                txtDestPort: {
                    digits: true,
                    range_except: [1, 65000]
                },
                txtComment: {
                    comment_check: true
                }
            },
            errorPlacement: function(error, element) {
                if(element.attr("name") == "txtDestIpAddress") {
                    error.appendTo("#txtDestIpAddressErrorDiv");
                }
                else if(element.attr("name") == "txtSourcePort") {
                    error.appendTo("#txtSourcePortErrorDiv");
                }
                else if(element.attr("name") == "txtDestPort") {
                    error.appendTo("#txtDestPortErrorDiv");
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