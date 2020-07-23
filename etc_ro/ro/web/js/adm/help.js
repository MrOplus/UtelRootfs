/**
 * PINT TEST设置模块
 * @module PING Test
 * @class PING Test
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
	var ddnsSetModes = _.map(config.DDNSSetMode, function(item) {
		return new Option(item.name, item.value);
	});

	var ddnsProviderList = _.map(config.DDNSDDP, function(item){
		return new Option(item.name, item.value);
	});

	var ddns_mode_select = _.map(config.ddns_Modeselect, function(item){
		return new Option(item.name, item.value);
	});
    /**
     * PING TEST设置view model
     * @class PingTestViewModel
     */
	function HelpViewModel(){
        var self = this;
		
        self.hasUssd = config.HAS_USSD;
        self.hasUsb = config.HAS_USB;
        self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
        self.hasTr069 = config.TR069_SUPPORT;
		
		var data = service.getHelpInfoTxt();
		self.help_txt_info = ko.observable(data.help_txt_info);
//		self.help_txt_info = "使用帮助\n"+"感谢使用LTE-CPE无限路由产品。为了使产品达到最佳的使用状态，请详细阅读本使用说明。\n";		
}
    /**
     * 初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new HelpViewModel();
		ko.applyBindings(vm, container[0]);
    }
    
    return {
        init: init
    };
});

