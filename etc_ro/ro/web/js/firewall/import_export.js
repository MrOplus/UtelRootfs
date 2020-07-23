/**
 * @module sleep_mode ：包括WiFi休眠、WiFi覆盖范围、WiFi定时休眠唤醒上功能
 * @class sleep_mode
 */
define([ 'jquery','lib/jquery/jQuery.fileinput', 'service', 'knockout', 'config/config', 'status/statusBar'], 
	function ($, fileinput, service, ko, config, status) {

        /**
         * ImportExport VM
         * @class ImportExportVM
         */
        function ImportExportVM() {
            var self = this;
            service.bindCommonData(self);
            service.firewallHide();
            var info2 = service.getFirewallSwitch().firewall_switch;
	        self.isHideFirewall = ko.observable(true);
	        if(info2 == "0"){
	            self.isHideFirewall(false);
	        }
		/**
		 * 获取文件大小
		 * @method getFileSize
		 */	
		function getFileSize(obj){
			var fileLenth = 0;
			var isIE = /msie/i.test(navigator.userAgent) && !window.opera; 
			if (isIE) {  //如果是ie
				var objValue = obj.value;
				try {  
					var fso = new ActiveXObject("Scripting.FileSystemObject");  
					fileLenth = parseInt(fso.GetFile(objValue).size);
					} catch (e) {  
					fileLenth = 1;					
				} 
			}else{  //对于非IE获得要上传文件的大小			
				try{			
					fileLenth = parseInt(obj.files[0].size);
					}catch (e) {
					fileLenth = 1;  //获取不到取-1
				}
			}
			return fileLenth;//1024/1024;
		}
		/**
		 * 文件上传按钮点击事件
		 * @event deleteBtnClickHandler
		 */
		fileUploadSubmitClickHandler = function() {
			var fileName = $(".customfile").attr('title');
		    if(typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")){
					showAlert("sd_no_file_selected");
					return false;
			}else {
				//judge size
				//todo check fileName 
				var fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase(); 

				//console.log("fileExt  = "+fileExt);
				if (!fileExt.match(/.zip/i) && !fileExt.match(/.gz/i)) {
						showAlert("error_file_selected");
						return false;  
				}
				
				var fileSize = getFileSize($("#fileField")[0]);
				if (fileSize/1024/1024 > config.NATIVE_UPDATE_FILE_SIZE){  //no more than 55M
					showAlert("error_file_selected");
					return false;
				}
			}
			
			showLoading('uploading', '<span data-trans="upload_fotaupdate_tip">' + $.i18n.prop('upload_fotaupdate_tip') + '</span>');
			//showLoading('uploading', '<span data-trans="note_uploading_not_refresh">' + $.i18n.prop('note_uploading_not_refresh') + '</span>');
			if(!iframeLoadBinded){
				bindIframeLoad();
			}
			
			$("#fileUploadForm").attr("action", "/cgi-bin/fw_update/" + fileName);

			$("#fileUploadForm").submit();
		};
		
		var iframeLoadBinded = false;
		
		function bindIframeLoad(){
		    iframeLoadBinded = true;
		    $('#fileUploadIframe').load(function() {
		        var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();

		        var alertShown = false;
		        if (txt.indexOf('success') != -1) {
		            showLoading("restarting");
		        } else if (txt.indexOf('failure5') != -1) {
		            showAlert("upload_update_failed0");	
		        }

		    });
		}
		
		self.backupFirewall = function() {
            service.backupFirewall({}, function (data) {
                if (data && data.tz_save_iptables == "success") {
                    $('#downloadURL').show();
					$('#downloadURL').attr('href',data.path);
                } else {
                    showAlert("error_info");
                }
           	});
		}
     }
		
        function init() {
            if(this.init){
                getRightNav(FIREWALL_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new ImportExportVM();
            ko.applyBindings(vm, container[0]);

			if ($(".customfile").length == 0) {
			    $("#fileField").customFileInput();
		    }
        }

        return {
            init : init
        };
    });/**
 * Created by hewq on 17/04/17.
 */
