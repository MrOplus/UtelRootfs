/**
 * @module prot_forward
 * @class prot_forward
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	function RateLimitVM() {
        var self = this;
        var info = getRateLimit();

        var columnsTmpl = [
            { columnType:"checkbox", rowText:"index", width:"8%" },
            { headerTextTrans:"ip_address", rowText:"ip_address", width:"23%" },
            { headerTextTrans:"download_speed", rowText:"download_speed", width:"23%" },
            { headerTextTrans:"upload_speed", rowText:"upload_speed", width:"23%" },
            { headerTextTrans:"comment", rowText:"comment", width:"23%" }
        ];

        self.RateLimitEnable = ko.observable(info.RateLimitEnable);
        self.oriRateLimitEnable = ko.observable(info.RateLimitEnable);

        self.ip_address = ko.observable('');
        self.download_speed = ko.observable('');
        self.upload_speed = ko.observable('');
        self.comment = ko.observable('');

        self.rules = ko.observableArray(info.RateLimitRules);
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
            self.ip_address('');
            self.download_speed('');
            self.upload_speed('');
            self.comment('');
        }

        self.enableRateLimit = function() {
            showLoading();
            var params = {};
            params.RateLimitEnable = self.RateLimitEnable();
            params.CSRFToken = self.CSRFToken;
            service.enableRateLimit(params, self.callback);
        };

        /**
         * 保存规则
         * @method save
         */
        self.save = function() {
            if(self.rules().length >= config.RateLimitMax) {
                showAlert({msg: "rules_max", params: config.RateLimitMax});
                return;
            }

            if(self.checkExist()) {
                showAlert("rule_exist");
                return;
            }

            showLoading();
            var params = {};
            params.ip_address = self.ip_address();
            params.download_speed = self.download_speed();
            params.upload_speed = self.upload_speed();
            params.comment = self.comment();
            params.CSRFToken = self.CSRFToken;
            service.setRateLimit(params, self.callback);
        };

        /**
         * 检查新增规则是否已经存在
         * @method checkExist
         */
        self.checkExist = function() {
            var newRule = {
                ip_address: self.ip_address(),
                download_speed: self.download_speed(),
                upload_speed: self.upload_speed(),
            };

            var oldRule;
            var rules = self.rules();
            for(var i = 0; i < rules.length; i++) {
                oldRule = {
                    ip_address: rules[i].ip_address,
                    download_speed: rules[i].download_speed,
                    upload_speed: rules[i].upload_speed,
                };

                if(_.isEqual(newRule, oldRule)) {
                    return true;
                }
            }
            return false;
        };

        self.deleteRateLimitRules = function() {
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
                service.deleteRateLimitRules(params, self.callback);
            });
        };
    }

    function getRateLimit() {
        return service.getRateLimit();
    }

	function init(viewModel) {
        var vm;
        if(viewModel) {
            vm = viewModel;
            var info = getRateLimit();
            vm.RateLimitEnable(info.RateLimitEnable);
            vm.oriRateLimitEnable(info.RateLimitEnable);
            vm.rules(info.RateLimitRules);
			vm.gridTemplate.clearAllChecked();
            vm.gridTemplate.data(info.RateLimitRules);
            refreshTableHeight();
            return;
        }

        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		vm = new RateLimitVM();
        var container = $('#container');
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

        fixTableHeight();
        renderCheckbox();

        $('#rateLimitEnableForm').validate({
            submitHandler : function() {
                vm.enableRateLimit();
            }
        });

        $('#rateLimitListForm').validate({
            submitHandler : function() {
                vm.deleteRateLimitRules();
            }
        });

        $('#rateLimitForm').validate({
            submitHandler : function() {
                vm.save();
            },
            rules: {
                txtIpAddress: {
                    ip_check: true
                },
                txtDownloadSpeed: {
                    digits: true,
                    range: [1, 1000000],
                    speed_check: true
                },
                txtUploadSpeed: {
                    digits: true,
                    range: [1, 1000000],
                    speed_check: true
                },
                txtComment: {
                    comment_check: true
                }
            },
            errorPlacement: function(error, element) {
                if(element.attr("name") == "txtIpAddress") {
                    error.appendTo("#ipErrorDiv");
                }
                else if(element.attr("name") == "txtDownloadSpeed") {
                    error.appendTo("#downloadSpeedRangeErrorDiv");
                }
                else if(element.attr("name") == "txtUploadSpeed") {
                    error.appendTo("#uploadSpeedRangeErrorDiv");
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
