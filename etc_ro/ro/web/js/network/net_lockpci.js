/**
 * 联网设置模块
 * @module dial_setting
 * @class dial_setting
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
     * 联网设置view model
     * @class DialVM
     */
	function DialVM() {
		var mode = service.getlockcellinfo();

		var afrcn_cellid = mode.nv_arfcn+ "/" + mode.nv_pci;
		var self = this;
		//add by cwp at 20170311
		self.current_network_pci = ko.observable(afrcn_cellid);
		
		self.isEnableflag = ko.observable(true);

		self.isAllowPciLock = ko.observable(mode.actionlte);	
		self.locked_pci_info = ko.observable(mode.cellParaIdlte);
		self.locked_arfrcn_info = ko.observable(mode.uarfcnlte);

		self.user_input_arfrcn = ko.observable("");
		self.user_input_pci_info = ko.observable("");
		service.bindCommonData(self);
		service.advanceHide();
		self.hasTr069 = config.TR069_SUPPORT;
		if(self.isAllowPciLock() == "0")
		{
			self.locked_pci_info = ko.observable("---");
			self.locked_arfrcn_info = ko.observable("---");
			self.celllockstatue = ko.observable("UnLocked");
		}
		else
		{
			self.locked_arfrcn_info = ko.observable(mode.uarfcnlte);
			self.locked_pci_info = ko.observable(mode.cellParaIdlte);
			self.celllockstatue = ko.observable("Locked");
		}

		var timerState;
		
		function getCellLockState() {
            return setInterval(function () {
                var CellLockSet = service.getlockcellinfo().CellLockSet;
				//console.log("CellLockSet:"+CellLockSet);
                if (CellLockSet == "CellSuccess") {
                    window.clearInterval(timerState);
                    if(self.isAllowPciLock() == "1"){
						self.celllockstatue("Locked");
						self.locked_pci_info(self.user_input_pci_info());
						self.locked_arfrcn_info (self.user_input_arfrcn());
					}
					else{
						self.celllockstatue("UnLocked");
						self.locked_pci_info("--");
						self.locked_arfrcn_info("--");
					}
                	showConfirm("confirm_data_effect", function () {
		                showLoading("restarting");
	            		service.restart({}, function (data) {
	                		if (data && data.result == "success") {
	                    		successOverlay();
	                		} else {
	                    		errorOverlay();
	                		}
	            		}, $.noop);
		            });
                } else if (CellLockSet == "CellFail") {
                    window.clearInterval(timerState);
                    errorOverlay();
                }
            }, 2000);
        }
		
		self.savepciconfig = function(){
			showLoading();
            service.setlockcellcfg({
				actionlte:self.isAllowPciLock(),
				uarfcnlte:self.user_input_arfrcn(),
				cellParaIdlte:self.user_input_pci_info(),

            }, function (result) {
                if (result.result == "success") {
					showLoading("waiting");
					timerState = getCellLockState();
                } else {
                    errorOverlay();
                }
				self.user_input_arfrcn("");
				self.user_input_pci_info("");
            });			
			
		};	
	}

    /**
     * 联网设置初始化
     * @method init
     */
	function init() {
	    if(this.init){
            getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new DialVM();
		ko.applyBindings(vm, container[0]);

		$('#lock_cell_form').validate({
			submitHandler : function() {
                vm.savepciconfig();
            },
            rules:{
                user_input_arfrcn: {
                    range: [1, 65535],
                    digits: true
                },
                user_input_pci: {
                    range: [1, 65535],
                    digits: true
                }
            }
        });
    }
	return {
		init: init
	};
});
