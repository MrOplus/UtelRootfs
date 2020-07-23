/**
 * @module prot_forward
 * @class prot_forward
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
    var modeFlag;
     var flagger=true;
    var container = $('#container');
    var enableModes = _.map([  {
        name: $.i18n.prop('enabled'),
        value: '1'
    }, {
        name : $.i18n.prop('disabled'),
        value : '0'
    }], function (item) {
        return new Option(item.name, item.value);
    });
	function aclVM() {
        var self = this;
        var aclInfo = service.getAclInfo();
        var sourceIp = {
            lan_http : [],
            lan_icmp : [],
            wan_http : [],
            wan_icmp : []
        };
        locateAclInfo("lan_http", sourceIp, aclInfo);
        locateAclInfo("lan_icmp", sourceIp, aclInfo);
        locateAclInfo("wan_http", sourceIp, aclInfo);
        locateAclInfo("wan_icmp", sourceIp, aclInfo);
        service.bindCommonData(self);
        service.advanceHide();
        self.index = '';
        self.interface = '';
        self.protocol = '';
        self.action = '';
        self.lan_http_ip = sourceIp.lan_http[0] == "" ? "..." : sourceIp.lan_http[0]+"...";
        self.lan_icmp_ip = sourceIp.lan_icmp[0] == "" ? "..." : sourceIp.lan_icmp[0]+"...";
        self.wan_http_ip = sourceIp.wan_http[0] == "" ? "..." : sourceIp.wan_http[0]+"...";
        self.wan_icmp_ip = sourceIp.wan_icmp[0] == "" ? "..." : sourceIp.wan_icmp[0]+"...";
        self.enable1 = sourceIp.lan_http[5] == "1" ? $.i18n.prop('enable') : $.i18n.prop('disable');
        self.enable2 = sourceIp.lan_icmp[5] == "1" ? $.i18n.prop('enable') : $.i18n.prop('disable');
        self.enable3 = sourceIp.wan_http[5] == "1" ? $.i18n.prop('enable') : $.i18n.prop('disable');
        self.enable4 = sourceIp.wan_icmp[5] == "1" ? $.i18n.prop('enable') : $.i18n.prop('disable');

        self.modes = ko.observableArray(enableModes);
        self.source_ip_0 = '';
        self.source_ip_1 = '';
        self.source_ip_2 = '';
        self.source_ip_3 = '';
        self.source_ip_4 = '';
        self.selectedMode = '';
        self.isThreeHide = ko.observable(flagger);
        // 触发模态框
        self.modalTrigger = function( flag ) {
            showEditInfo( flag, this, sourceIp );
            $("#myModal").modal({
                backdrop: "static",
                keyboard: false
            });
        };

        self.closeModal = function() {
            $.modal.close();
        };

        var rules = {
            sourceIp0 : 'ipv4v6_check',
            sourceIp1 : 'ipv4v6_check',
            sourceIp2 : 'ipv4v6_check',
            sourceIp3 : 'ipv4v6_check',
            sourceIp4 : 'ipv4v6_check'
        };

        /**
         * 保存
         * @method save
         */
        self.save = function() {
            if(!checkFormWithoutMsg( $('#aclForm'), rules ) ){
                 return false;
            }
            showLoading();
            service.setAcl(getParams(modeFlag, self), function (data) {
                if (data.result == "success") {
                    var vm = new aclVM();
                    ko.cleanNode(container[0]);
                    ko.applyBindings(vm, container[0]);
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };
    }
    
    function getParams(acl,_this) {
        var params = {};
        var aclPortRule = acl.split('_');
        params.acl_port = aclPortRule[0];
        params.acl_rule = aclPortRule[1];
        params['TZ_ACL_' + acl + '_' + 0] = _this.source_ip_0;
        params['TZ_ACL_' + acl + '_' + 1] = _this.source_ip_1;
        params['TZ_ACL_' + acl + '_' + 2] = _this.source_ip_2;
        params['TZ_ACL_' + acl + '_' + 3] = _this.source_ip_3;
        params['TZ_ACL_' + acl + '_' + 4] = _this.source_ip_4;
        params['TZ_ACL_' + acl + '_' + 5] = _this.selectedMode;

        return params;
    }
    function showEditInfo( info, _this, data ) {
        var aclInfo = service.getAclInfo();
	    switch(info){
            case '1':
                flagger=true;
                _this.index='1';
                _this.interface='LAN';
                _this.protocol='HTTP';
                _this.action=$.i18n.prop('drop');
                _this.source_ip_0 = data.lan_http[0];
                _this.source_ip_1 = data.lan_http[1];
                _this.source_ip_2 = data.lan_http[2];
                _this.source_ip_3 = data.lan_http[3];
                _this.source_ip_4 = data.lan_http[4];
                _this.selectedMode = data.lan_http[5];
                modeFlag = 'LAN_HTTP';
                break;
            case '2':
                flagger=true;
                _this.index='2';
                _this.interface='LAN';
                _this.protocol='ICMP';
                _this.action=$.i18n.prop('drop');
                _this.source_ip_0 = data.lan_icmp[0];
                _this.source_ip_1 = data.lan_icmp[1];
                _this.source_ip_2 = data.lan_icmp[2];
                _this.source_ip_3 = data.lan_icmp[3];
                _this.source_ip_4 = data.lan_icmp[4];
                _this.selectedMode = data.lan_icmp[5];
                modeFlag = 'LAN_ICMP';
                break;
            case '3':
                if(aclInfo.web_set_wan_http == 1){     
                    flagger=true;
                }else{
                    flagger=false;
                }
                _this.index='3';
                _this.interface='WAN';
                _this.protocol='HTTP';
                _this.action=$.i18n.prop('accept_acl');
                _this.source_ip_0 = data.wan_http[0];
                _this.source_ip_1 = data.wan_http[1];
                _this.source_ip_2 = data.wan_http[2];
                _this.source_ip_3 = data.wan_http[3];
                _this.source_ip_4 = data.wan_http[4];
                _this.selectedMode = data.wan_http[5];
                modeFlag = 'WAN_HTTP';
                break;
            case '4':
                flagger=true;
                _this.index='4';
                _this.interface='LAN';
                _this.protocol='ICMP';
                _this.action=$.i18n.prop('accept_acl');
                _this.source_ip_0 = data.wan_icmp[0];
                _this.source_ip_1 = data.wan_icmp[1];
                _this.source_ip_2 = data.wan_icmp[2];
                _this.source_ip_3 = data.wan_icmp[3];
                _this.source_ip_4 = data.wan_icmp[4];
                _this.selectedMode = data.wan_icmp[5];
                modeFlag = 'WAN_ICMP';
                break;
        }
        
        if(flagger==false){
            $(".isThreeHide").hide();
        }else{
            $(".isThreeHide").show();
        }
        ko.applyBindings(_this, $("#editSection")[0]);
    }
    
    function locateAclInfo(interface_protocol, data, sourceData) {
	    for ( var i = 0; i < 6; i++ ){
            data[interface_protocol].push(sourceData[interface_protocol + "_" + i]);
        }
    }

    function init() {
        if(this.init){
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		var vm = new aclVM();
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

	}

	return {
		init : init
	};
});
