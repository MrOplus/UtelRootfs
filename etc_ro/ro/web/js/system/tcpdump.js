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
            service.systemSettingHide();
            self.tcpdump = ko.observable("");
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
		fileUploadSubmitClickHandlerBackup = function() {
			var fileName = $(".customfile").attr('title');
		    if(typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")){
					showAlert("sd_no_file_selected");
					return false;
			}else {
				//judge size
				//todo check fileName 
				var fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase(); 
				//console.log("fileExt  = "+fileExt);
				if (!fileExt.match("tcpdump")) {
						showAlert("error_file_selected");
						return false;  
				}
				
				var fileSize = getFileSize($("#fileField")[0]);
				if (fileSize/1024/1024 > 10){  //no more than 55M
					showAlert("error_file_selected");
					return false;
				}
			}
			
			showLoading('uploading', '<span data-trans="upload_fotaupdate_tip">' + $.i18n.prop('upload_fotaupdate_tip') + '</span>');
			//showLoading('uploading', '<span data-trans="note_uploading_not_refresh">' + $.i18n.prop('note_uploading_not_refresh') + '</span>');
			$("#fileUploadForm").attr("action", "/cgi-bin/export_tcpdump/" + fileName);

			$("#fileUploadForm").submit();
			if(!iframeLoadBinded){
				bindIframeLoad();
			}
			
			
		};
		
		var iframeLoadBinded = false;
		
		 self.btnStart = function(){
		 	if($("#port_tcpdump").val().length <= "0"){
		 		showAlert("ping_input_the_interface");
		 		return false;
		 	}
		 	var params={};
		 	params.tz_tcpdump = $("#port_tcpdump").val();
		 	params.number = 1;
		 	service.tz_tcpdump(params,function(result){
		 		$("#stop").attr("disabled",false);
		 		$("#start").attr("disabled",true);
		 	});
		 }
		 self.btnStop = function(){
		 	var params={};
		 	params.tz_tcpdump = $("#port_tcpdump").val();
		 	params.number = 0;
		 	service.tz_tcpdump(params,function(result){
		 		$("#stop").attr("disabled",true);
		 		$("#start").attr("disabled",false);
		 		if(result.tz_tcpdump == "success"){
		 			$("#downloadURL").show();
		 			$('#downloadURL').attr('href',result.path);
		 		}else{
		 			showAlert("error_info");
		 		}

		 	});
		 }

		function bindIframeLoad(){
		    iframeLoadBinded = true;
		    $('#fileUploadIframe').load(function() {
		        var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();
		        var alertShown = false;
		        if (txt.indexOf('success') != -1) {
		        	$("#startAndStop").show();
					successOverlay();
		        } else  {
		           errorOverlay();
		        }

		    });
		}
		
		self.tcpdump_export = function() {
            service.tcpdump_export({}, function (data) {
                if (data.tz_export_diagnosis == "success") {
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
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(NETWORK_TOOLS_COMMON_URL);
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

