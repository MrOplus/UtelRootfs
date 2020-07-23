/**
 * HELP模块
 * @module Help Info
 * @class Help Info
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
    /**
     * Help Info view model
     * @class HelpViewModel
     */
	function HelpViewModel(){
        var self = this;		
		var data = service.getHelpInfoTxt();
		self.help_txt_info = ko.observable(data.help_txt_info);
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

