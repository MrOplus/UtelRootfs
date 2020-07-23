/**
 * @module sleep_mode
 * @class sleep_mode
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

    /**
	 * 获取波特率，9600-921600
	 * @method getBaudRates
	 * @return {Array} baud rate Options
	 */	
	var baudRates = _.map(config.BAUD_RATES, function(item) {
		return new Option(item.name, item.value);
	});

    /**
     * sleepmode VM
     * @class SleepModeVM
     */
	function SleepModeVM() {
        var self = this;
        self.showSleepDiv = config.WIFI_SLEEP_SUPPORT;
		self.hasUssd = config.HAS_USSD;
		self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
		self.hasDdns = config.DDNS_SUPPORT;
		self.hasTr069 = config.TR069_SUPPORT;

        var uartInfo = service.getUartBaudrate();
        self.baudrates = ko.observableArray(baudRates);
        self.selectedRate = ko.observable(uartInfo.uart_baudrate);

        var usbModeInfo = service.getUsbMode();
        self.usbMode = ko.observable(usbModeInfo.usb_mode);

        /**
         * 设置UART波特率
         * @method setUartBaudrate
         */
        self.setUartBaudrate = function() {
            showLoading('waiting');
            var params = {
                uart_baudrate: self.selectedRate()
            };
            service.setUartBaudrate(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                } else {
                    errorOverlay();
                }
            });
        };        

        /**
         * 设置usb主从模式
         * @method setWifiRange
         */
        self.setUsbMode = function() {
            var params = {
                usb_mode: self.usbMode()
            };
            showConfirm("lan_confirm_reopen", function(){
                showLoading('waiting');
                service.setUsbMode(params, function(result) {
                    if (result.result == "success") {
                        successOverlay();
                    } else {
                        errorOverlay();
                    }
                });
            });            
        };  
    }

    /**
     * 初始化
     * @method init
     */
	function init() {
		var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new SleepModeVM();
		ko.applyBindings(vm, container[0]);
        $('#uartBaudrateForm').validate({
            submitHandler : function() {
                vm.setUartBaudrate();
            }
        });

        $('#usbModeForm').validate({
            submitHandler : function() {
                vm.setUsbMode();
            }
        });
	}

	return {
		init : init
	};
});