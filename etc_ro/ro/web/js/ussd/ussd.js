/**
 * setting--device seeting--USSD module
 * 
 * @module ussd
 * @class ussd
 */
define([ 'jquery', 'service', 'knockout','config/config'], function($, service, ko, config) {
	
	var initUSSD=true;
	var timeOutFlag=0;//计时
	var reply_flag=false;//是否已经得到回复
	var USSDLocation = {SEND:0, REPLY:1};
	var callbackTemp;
	var ussd_action=1;//初始化为成功获得返回消息
	var interval=0;

    /**
     * @class USSDInformationViewModel
     * @constructor
     */
	function USSDInformationViewModel() {
		var self = this;
		
		self.hasUpdateCheck = config.HAS_UPDATE_CHECK;
		self.ussd_action=ko.observable(ussd_action);
		self.USSDLocation=ko.observable(USSDLocation.SEND);
		self.hasUsb = config.HAS_USB;
		self.hasUssd = config.HAS_USSD;
		self.USSDReply=ko.observable("");
		self.USSDSend=ko.observable("");
		self.hasDdns = config.DDNS_SUPPORT;
		self.hasTr069 = config.TR069_SUPPORT;
		
		/**
		 * 发送USSD命令
		 * @method sendToNet
		 */
		self.sendToNet = function(){
			timeOutFlag=0;
			window.clearInterval(interval);
            var command = self.USSDSend();
            if (('string' != typeof (command)) || ('' == command)) {
                showAlert("ussd_error_input");
                return;
            }
			
            showLoading('waiting');	
			
            var params = {};
                params.operator = "ussd_send";
                params.strUSSDCommand = command;
                params.sendOrReply = "send";
			
            service.getUSSDResponse(params, function(result, content){
                hideLoading();				
                if(result){
                    resetUSSD();
                    self.USSDLocation(USSDLocation.REPLY);
                    self.ussd_action(content.ussd_action);
                    $("#USSD_Content").val(decodeMessage(content.data, true));
                    reply_flag=false;
                    timeOutFlag=0;
                }else{
                    showAlert(content);
                }
            });
        };
		service.bindCommonData(self);	
		service.advanceHide();
        /**
         * 回复USSD消息
         * @method replyToNet
         */
        self.replyToNet = function(){
            timeOutFlag=0;
            window.clearInterval(interval);
            var command = self.USSDReply();
            if (('string' != typeof (command)) || ('' == command)) {
				showAlert("ussd_error_input");
				return;
            }
			
            showLoading('waiting');	
			
            var params = {};
                params.operator = "ussd_reply";
                params.strUSSDCommand = command;
                params.sendOrReply = "reply";
			
            service.getUSSDResponse(params, function(result, content){
                hideLoading();
                if(result){
                    self.ussd_action(content.ussd_action);
                    $("#USSD_Content").val(decodeMessage(content.data, true));
                    reply_flag=false;
                    resetUSSD();
                    timeOutFlag=0;
                }else{
                    showAlert(content);
                }	
            });
        };
		
		/**
		 * 取消回复USSD消息
		 * @method noReplyCancel
		 */
		self.noReplyCancel = function(){
			timeOutFlag=0;
			reply_flag=true;
			window.clearInterval(interval);
			service.USSDReplyCancel(function(result){
				if(result){
					resetUSSD();
					self.USSDLocation(USSDLocation.SEND);
				}else{
					showAlert("ussd_fail");
				}
			});
		};
		/**
		 * 判断是否响应超时
		 * @method timeOutVerify
		 */
		function timeOutVerify(){
			if(!reply_flag){
				if(timeOutFlag<29){
					timeOutFlag++;
				}else{
					reply_flag=true;
					window.clearInterval(interval);
					showAlert("ussd_operation_timeout");
					self.USSDReply("");
					self.USSDSend("");
					self.USSDLocation(USSDLocation.SEND);
					timeOutFlag=0;
				}
			}else{
				reply_flag=true;
				window.clearInterval(interval);
				timeOutFlag=0;
			}
		};
		
		cancelUSSD = function(){
			service.USSDReplyCancel(function(result){
			});
		};
		
		/**
		 * 重置USSD输入命令
		 * @method resetUSSD
		 */
		resetUSSD = function(){
			self.USSDReply("");
			self.USSDSend("");
		};		
		
		//如果首次进入USSD菜单，先发送USSD取消命令，进行初始化
		if(initUSSD){
			cancelUSSD();
			initUSSD=false;
		}
	}

    /**
     * 初始化
     * @method init
     */
	function init() {
		if(this.init){
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            	 getInnerHeader(INNER_HEADER_COMMON_URL);
            }
		var container = $('#container')[0];
		ko.cleanNode(container);
		var vm = new USSDInformationViewModel();
		ko.applyBindings(vm, container);	
		
	}	
	
	return {
		init : init
	};
});