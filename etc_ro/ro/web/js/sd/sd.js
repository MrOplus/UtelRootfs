/**
 * SD卡 模块
 * @module sd
 * @class sd
 */
define([ 'jquery', 'config/config', 'service', 'knockout' ], function($, config, service, ko) {

	/**
	 * 基目录。感觉此根目录不显示给用户会更友好
	 * @attribute {String} basePath
	 */
	var basePath = config.SD_BASE_PATH;

	/**
	 * SDCardViewModel
	 * @class SDCardViewModel
	 */
	function SDCardViewModel() {
		var self = this;
		var data = service.getSDConfiguration();
        self.selectedMode = ko.observable(data.sd_mode);
        self.orignalMode = ko.observable(data.sd_mode);
        self.sdStatus = ko.observable(data.sd_status);
		self.orignalSdStatus = ko.observable(data.sd_status);
        self.sdStatusInfo = ko.observable("sd_card_status_info_" + data.sd_status);
        self.selectedShareEnable = ko.observable(data.share_status);
        self.selectedFileToShare = ko.observable(data.file_to_share);
        self.selectedAccessType = ko.observable(data.share_auth);
        var path = data.share_file.substring(basePath.length);
        self.pathToShare = ko.observable(path);
        self.isInvalidPath = ko.observable(false);
		self.checkEnable = ko.observable(true);

        self.disableApplyBtn = ko.computed(function(){
            return self.selectedMode() == self.orignalMode() && self.selectedMode() == '1';
        });
		
	    addInterval(function(){
			self.checkSimStatus();
		}, 3000);
		
		/**
		 * T卡热插拔时状态监控，拔插卡重刷界面
		 * @event checkSimStatus
		 */
		self.checkSimStatus = function(){
			if(self.checkEnable()){
				var data = service.getSDConfiguration();
			    if(data.sd_status && (data.sd_status != self.orignalSdStatus())){
				    if(data.sd_status != '1'){
						self.sdStatusInfo("sd_card_status_info_" + data.sd_status);
						self.sdStatus(data.sd_status);
		                self.orignalSdStatus(data.sd_status);
						$("#sd_card_status_info").translate();
					}else{
						clearTimer();
					    clearValidateMsg();
					    init();
					}
			    }
			}			
		}
		 

		/**
		 * 文件共享方式radio点击事件
		 * @event modeChangeHandler
		 */
		self.fileToShareClickHandle = function(){
			if(self.selectedFileToShare() == "1"){
				self.pathToShare("/");
			}
			return true;
		};

		/**
		 * 表单submit事件处理
		 * @event save
		 */
		self.save = function(){
			showLoading('waiting');
			self.checkEnable(false);
			if(self.orignalMode() == self.selectedMode()){
				showAlert("setting_no_change");
			} else {
				service.setSdCardMode({
					mode : self.selectedMode()
				}, function(data) {
					if(data.result){
                        self.orignalMode(self.selectedMode());
						if(data.result == "processing"){
							errorOverlay("sd_usb_forbidden");
						}else{								
						    successOverlay();
						}
					} else {
						if (self.selectedMode() == "0") {
							errorOverlay("sd_not_support");
						} else {
						    errorOverlay();
						}
					}
				}, function(error) {
					if (self.selectedMode() == "0") {
						errorOverlay("sd_not_support");
					} else {
					    errorOverlay();
					}
				});
			}
			self.checkEnable(true);
			return true;
		};
		
        /**
         * 检查共享路径是否有效
         * @method checkPathIsValid
         */
        self.checkPathIsValid = ko.computed(function () {
            if (self.orignalMode() == 0 && self.selectedShareEnable() == '1' && self.selectedFileToShare() == '0'
                && self.pathToShare() != '' && self.pathToShare() != '/') {
                service.checkFileExists({
                    "path": basePath + self.pathToShare()
                }, function (data) {
                    if (data.status != "exist") {
                        self.isInvalidPath(true);
                    } else {
                        self.isInvalidPath(false);
                    }
                });
            } else {
                self.isInvalidPath(false);
            }
        });
		
		/**
		 * 保存详细配置信息
		 * @method saveShareDetailConfig
		 */
        self.saveShareDetailConfig = function() {
            showLoading('waiting');
            self.checkEnable(false);			
            var param = {
                share_status : self.selectedShareEnable(),
                share_auth : self.selectedAccessType(),
                share_file : basePath + self.pathToShare()
            };
			
            if (self.selectedShareEnable() == "0") {
                setSdCardSharing(param);
            } else {
                service.checkFileExists({
                    "path" : param.share_file
                }, function(data) {
                    if (data.status != "exist" && data.status != "processing") {
                        errorOverlay("sd_card_share_setting_" + data.status);
                    } else {
                        setSdCardSharing(param);
                    }
                }, function(){
                    errorOverlay();
                });
            }
			
            self.checkEnable(true);
            return true;
		}

		/**
		 * 设置SD卡共享信息
		 * @method setSdCardSharing
		 */
        function setSdCardSharing(param){
			service.setSdCardSharing(param, function(result) {
				if (isErrorObject(result)) {
					if (result.errorType == "no_sdcard") {
						errorOverlay("sd_card_share_setting_no_sdcard");
					} else {
						errorOverlay();
					}
				} else {
					successOverlay();
				}
			});
		}
	}

	/**
	 * 将配置的option项转换成Option数组
	 * @method getOptionArray
	 * @param {Array} configItem [{name: "name1", value: "val1"},{name: "name2", value: "val2"}]
	 */
	function getOptionArray(configItem) {
		var arr = [];
		for ( var i = 0; i < configItem.length; i++) {
			arr.push(new Option(configItem.name, configItem.value));
		}
		return arr;
	}

	function init() {
		var container = $('#container')[0];
		ko.cleanNode(container);
		var vm = new SDCardViewModel();
		ko.applyBindings(vm, container);
		$("#sd_card_status_info").translate();
		$('#sdmode_form').validate({
			submitHandler : function() {
				vm.save();
			}
		});
		$('#httpshare_form').validate({
			submitHandler : function() {
				vm.saveShareDetailConfig();
			},
			rules : {
				path_to_share : "check_file_path"
			}
		});
	}

	return {
		init : init
	};
});