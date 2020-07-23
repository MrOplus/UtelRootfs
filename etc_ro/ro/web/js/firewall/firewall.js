define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    function FirewallVM() {
        var self = this;
		self.hasUssd = config.HAS_USSD;
		self.hasUsb = config.HAS_USB;
		self.hasUrlFilter = config.HAS_URL;
		self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
		self.hasDdns = config.DDNS_SUPPORT;
		self.hasTr069 = config.TR069_SUPPORT;

		self.homess = function () {
			window.location = "#home"
		};
		self.portfilter = function () {
			window.location = "#port_filter"
		};
		self.portmap = function () {
			window.location = "#port_map"
		};
		self.portforward = function () {
			window.location = "#port_forward"
		};
		self.urlfilter = function () {
			window.location = "##url_filter"
		};
		self.upnp = function () {
			window.location = "#upnp"
		};
		self.dmz = function () {
			window.location = "#dmz"
		};

    }

	function init() {
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new FirewallVM();
        ko.applyBindings(vm, container[0]);
    }

	return {
		init : init
	};
});