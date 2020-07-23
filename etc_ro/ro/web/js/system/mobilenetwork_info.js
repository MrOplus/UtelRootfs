/**
 * 设备状态设置模块
 * @module Mobile Network Info
 * @class network
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
    /**
     * 网络状态信息view model
     * @class NetworkInfoViewModel
     */
	function NetworkInfoViewModel(){
        var self = this;
		
        var data = service.getNetworkStatue();	
		self.network_provider = ko.observable(data.network_provider);
		self.network_type = ko.observable(data.network_type);
		self.ModemStatue = ko.observable(data.ModemStatue);
		self.DailStatue = ko.observable(data.ppp_status);
		self.CurrentBand = ko.observable(data.nv_band);	

		self.CurrentBandwidth = ko.observable(data.CurrentBandwidth);
		self.CurrentAfrcn = ko.observable(data.nv_arfcn);
	
		self.EnodebID = ko.observable(data.nv_enodebid);
		self.CellID = ko.observable(data.nv_cellid);
		
		var globle_enodeb_id = data.nv_globecellid + "/" + data.nv_enodebid;
		self.GlobleID = ko.observable(globle_enodeb_id);		
	
		self.PhycellID = ko.observable(data.nv_pci);
		self.RSRP = ko.observable(data.nv_rsrp);	
		
		self.RSRQ = ko.observable(data.nv_rsrq);
		self.SINR = ko.observable(data.lte_sinr);
		self.RSSI = ko.observable(data.nv_rsrq);


		self.FreshParam = function(){
			var data = service.getNetworkStatue()
			self.network_provider(data.network_provider);
			self.network_type(data.network_type);
			self.ModemStatue(data.ModemStatue);
			self.DailStatue = ko.observable(data.ppp_status);
			self.CurrentBand(data.nv_band);	


			self.CurrentBandwidth = ko.observable(data.CurrentBandwidth);
			self.CurrentAfrcn(data.nv_arfcn);
			
			var globle_enodeb_id = data.nv_globecellid + "/" + data.nv_enodebid;
			self.GlobleID = ko.observable(globle_enodeb_id);					
			
			self.EnodebID = ko.observable(data.nv_enodebid);
			self.CellID = ko.observable(data.nv_cellid);			
			self.PhycellID(data.nv_pci);
			self.RSRP(data.nv_rsrp);	
			
			self.RSRQ(data.nv_rsrq);
			self.SINR(data.lte_sinr);
			self.RSSI(data.nv_rsrq);			
			};
}
    /**
     * 初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new NetworkInfoViewModel();
		ko.applyBindings(vm, container[0]);
		
		addInterval(function(){
			vm.FreshParam();
			},1000);		
    }
    
    return {
        init: init
    };
});
