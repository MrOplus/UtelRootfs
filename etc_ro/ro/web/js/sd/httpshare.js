/**
 * SD卡 HttpShare模块
 * @module HttpShare
 * @class HttpShare
 */
define([ 'jquery', 'underscore','lib/jquery/jQuery.fileinput', 'config/config', 'service', 'knockout' ], function($, _, fileinput, config, service, ko) {
	/**
	 * 每页记录条数
	 * 现在9x15平台不能够设置每页数据个数，默认为10个。目前此变量不能够修改
	 * @attribute {Integer} perPage
	 */
	var perPage = 10;
	/**
	 * 当前页
	 * @attribute {Integer} activePage
	 */
	var activePage = 1;
	/**
	 * 当前目录，默认根目录""
	 * @attribute {String} currentPath
	 */
	var currentPath = "";
	/**
	 * 基目录。感觉此根目录不显示给用户会更友好
	 * @attribute {String} basePath
	 */
	var basePath = config.SD_BASE_PATH;
	/**
	 * 前置路径，发现有的设备会将sd卡数据显示在web目录
	 * @attribute {String} prePath
	 * @example
	 * prePath = "/usr/zte/zte_conf/web";
	 */
	var prePath = "";
	/**
	 * 是否隐藏重命名按钮
	 * @attribute {Boolean} readwrite
	 */
	var readwrite = true;
	/**
	 * 文件列表模板
	 * @attribute {Object} sdFileItemTmpl
	 */
	var sdFileItemTmpl = null,
	/**
	 * 分页模板
	 * @attribute {Object} pagerTmpl
	 */
		pagerTmpl = null,
    /**
     * 配置信息原始状态
     * @attribute {Object} originalStatus
     */
    originalStatus = null;

    var zoneOffsetSeconds = new Date().getTimezoneOffset() * 60;

    var shareFilePath = '';
	
	var sdIsUploading = false;//SD卡是否正在上传文件

	/**
	 * 生成分页数据数组
	 * @method generatePager
	 * @param {Integer} totalSize 总记录数
	 * @param {Integer} perPageNum 每页记录条数
	 * @param {Integer} currentPage 当前页
	 * @return {Array} 分页数据数组
	 */
	function generatePager(totalSize, perPageNum, currentPage) {
        if (totalSize == 0) {
            return [];
        }
        var pagersArr = [];
        var totalPages = getTotalPages(totalSize, perPageNum);
        pagersArr.push({
            pageNum: currentPage - 1,
            isActive: false,
            isPrev: true,
            isNext: false,
            isDot: false
        });
        if (currentPage == 6) {
            pagersArr.push({
                pageNum: 1,
                isActive: false,
                isPrev: false,
                isNext: false,
                isDot: false
            });
        } else if (currentPage > 5) {
            pagersArr.push({
                pageNum: 1,
                isActive: false,
                isPrev: false,
                isNext: false,
                isDot: false
            });
            pagersArr.push({
                pageNum: 0,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: true
            });
        }
        var i;
        var startPage = currentPage - 4 > 0 ? currentPage - 4 : 1;
        var endPage = currentPage + 4;
        for (i = startPage; i <= endPage && i <= totalPages; i++) {
            pagersArr.push({
                pageNum: i,
                isActive: i == currentPage,
                isPrev: false,
                isNext: false,
                isDot: false
            });
        }
        if (currentPage + 5 == totalPages) {
            pagersArr.push({
                pageNum: totalPages,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: false
            });
        } else if (currentPage + 3 <= totalPages && i - 1 != totalPages) {
            pagersArr.push({
                pageNum: 0,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: true
            });
            pagersArr.push({
                pageNum: totalPages,
                isPrev: false,
                isNext: false,
                isActive: false,
                isDot: false
            });
        }
        pagersArr.push({
            pageNum: parseInt(currentPage, 10) + 1,
            isPrev: false,
            isNext: true,
            isActive: false,
            isDot: false
        });
        return pagersArr;
	}

	function getTotalPages(total, perPage){
		var totalPages = Math.floor(total / perPage);
		if (total % perPage != 0) {
			totalPages++;
		}
		return totalPages;
	}

	/**
	 * 整理文件列表数据，并用模板显示
	 * @method showFileSet
	 * @param {Array} files 列表数据
	 */
	function showFileSet(files) {
		var i = 0;
		var shownFiles = $.map(files, function(n) {
			var obj = {
				fileName : HTMLEncode(n.fileName),
				fileType : n.attribute == 'document' ? 'folder' : getFileType(n.fileName),
				fileSize : getDisplayVolume(n.size, false),
				filePath : basePath + getCurrentPath() + "/" + n.fileName,
                lastUpdateTime : transUnixTime((parseInt(n.lastUpdateTime, 10) + zoneOffsetSeconds) * 1000),
				trClass : i % 2 == 0 ? "even" : "",
				readwrite : readwrite
			};
			i++;
			return obj;
		});

		if(sdFileItemTmpl == null){
			sdFileItemTmpl = $.template("sdFileItemTmpl", $("#sdFileItemTmpl"));
		}
		$("#fileList_container").html($.tmpl("sdFileItemTmpl", {data: shownFiles}));
	}

	/**
	 * HttpShareViewModel
	 * 
	 * @class HttpShareViewModel
	 */
	function HttpShareViewModel() {
		var isGuest = false;
		if(window.location.hash == "#httpshare_guest"){
			isGuest = true;
		}
		readwrite = true;
		activePage = 1;
        setCurrentPath('');
		basePath = config.SD_BASE_PATH;
		showLoading('waiting');
		service.getSDConfiguration({}, function(data){
            originalStatus = data;
            shareFilePath = data.share_file;
            if(shareFilePath.charAt(shareFilePath.length - 1) == '/'){//如果路径中有/，则去掉
            	shareFilePath = shareFilePath.substring(0, shareFilePath.length - 1);
            }

			if(data.sd_status == '1' && data.sd_mode == '0'){ //共享
				if(isGuest && data.share_status == '1'){// guest and share
					basePath = shareFilePath;
					if(data.share_auth == '0'){ // readonly
						readwrite = false;
						$("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").hide();
					}else{
                        $("#uploadSection, #delete_file_button, .sd_guest_hide_th", "#httpshare_form").show();
                    }
					$("#go_to_login_button").removeClass("hide");
					$('#sd_menu').hide();
					$('.form-note').hide();
					if ($(".customfile").length == 0) {
						$("#fileField").customFileInput();
					}
					pagerItemClickHandler(1);
				} else if(isGuest && data.share_status == '0'){ // guest not share
					$(".form-body .content", "#httpshare_form").hide().remove();
					$(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
					$(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html($.i18n.prop("note_http_share_cannot_access"));
                    hideLoading();
				} else {
					if ($(".customfile").length == 0) {
						$("#fileField").customFileInput();
					}
					pagerItemClickHandler(1);
				}
			} else { // usb
				$(".form-body .content", "#httpshare_form").hide().remove();
				$(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
				$(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_usb_access").html($.i18n.prop("note_http_share_usb_access"));
                $(".form-note", "#httpshare_form").addClass("margintop10");
				hideLoading();
			}
		}, function(){
            errorOverlay();
            $(".form-body .content", "#httpshare_form").hide().remove();
            $(".form-title", "#httpshare_form").attr("data-trans", "httpshare").html($.i18n.prop("httpshare"));
            $(".form-note", "#httpshare_form").attr("data-trans", "note_http_share_cannot_access").html($.i18n.prop("note_http_share_cannot_access"));
        });
		
		addInterval(function(){
			!sdIsUploading && self.checkSdStatus();
		}, 3000);
		
		/**
		 * T卡热插拔时状态监控，拔插卡重刷界面
		 * @event checkSdStatus
		 */
		self.checkSdStatus = function(){			
			var data = service.getSDConfiguration();
			if(data.sd_status && (data.sd_status != originalStatus.sd_status)){
				if(data.sd_status == '1'){
					window.location.reload();
				}else{
					clearTimer();
					clearValidateMsg();
					init();
				}
			}			
		}
	}
	
	/**
	 * 页码点击事件处理
	 * @event pagerItemClickHandler
	 * @param {Integer} num 页码
	 */
	pagerItemClickHandler = function(num) {
		activePage = num;
		refreshFileList(getCurrentPath(), activePage);
	};

    function checkConfiguration(){
        var data = service.getSDConfiguration();
        if(!_.isEqual(originalStatus, data)){
            showAlert('sd_config_changed_reload', function(){
                init();
            });
            return false;
        }
        return true;
    }

    /**
     * 检查操作路径是否为共享路径，如果是共享路径，给用户提示
     * @param path
     * @param wording
     * @returns {boolean}
     */
    function inSharePath(path, wording) {
        var tmpShareFilePath = shareFilePath + '/';
        var tmpPath = path + '/';
        if (originalStatus.share_status == '1' && shareFilePath != '' && shareFilePath != '/' && tmpShareFilePath.indexOf(tmpPath) != -1) {
            showAlert(wording);
            return true;
        }
        return false;
    }

	/**
	 * 进入文件夹
	 * @method enterFolder
	 * @param {String} name 文件夹名
	 */
	enterFolder = function(name) {
        if(!checkConfiguration()){
            return false;
        }
		var path;
		if (name == "") {
			path = "";
		} else {
			path = getCurrentPath() + '/' + name;
		}
		refreshFileList(path, 1);
        return true;
	};

	/**
	 * 回到上一级目录
	 * @method backFolder
	 */
	backFolder = function() {
        if(!checkConfiguration()){
            return false;
        }
		var path = getCurrentPath().substring(0, getCurrentPath().lastIndexOf("/"));
		refreshFileList(path, 1);
        return true;
	};

	/**
	 * 刷新文件列表
	 * @method refreshFileList
	 * @param {String} path 文件夹名,"/"开头
     * @param {Integer} index 页码
     * @param {Boolean} alertShown alert是否已经显示
	 */
	refreshFileList = function(path, index, alertShown) {
		if(!alertShown){
            showLoading('waiting');
        }
		service.getFileList({
			path : prePath + basePath + path,
			index : index
		}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return;
            }
            setCurrentPath(path);
			$("#sd_path").val(path);
			activePage = index;
			totalSize = data.totalRecord;
			showFileSet(data.details);
			pagination(totalSize); //测试分页时可以将此处totalSize调大
			refreshBtnsStatus();
			updateSdMemorySizes();
            if(!alertShown){
			    hideLoading();
            }
		});
	};

	/**
	 * 更新按钮状态
	 * @method refreshBtnsStatus
	 */
	refreshBtnsStatus = function() {
		if (getCurrentPath() == "") {
			$("#rootBtnLi, #backBtnLi").hide();
		} else {
			$("#rootBtnLi, #backBtnLi").show();
		}
		if (readwrite) {
            $("#createNewFolderLi").hide();
            $("#createNewFolderLi").find(".error").hide();
            $("#newFolderBtnLi").show();
            $("#newFolderName").val('');
            $("#createNewFolderErrorLabel").removeAttr('data-trans').text('');
		} else {
            $("#newFolderBtnLi, #createNewFolderLi").hide().remove();
		}
        checkDeleteBtnStatus();
	};

	/**
	 * 显示新建文件夹按钮点击事件
	 * @event openCreateNewFolderClickHandler
	 */
	openCreateNewFolderClickHandler = function() {
		$("#newFolderBtnLi").hide();
		$("#newFolderName").show();
		$("#createNewFolderLi").show();
	};

	/**
	 * 取消显示新建文件夹按钮点击事件
	 * @event cancelCreateNewFolderClickHandler
	 */
	cancelCreateNewFolderClickHandler = function() {
		$("#createNewFolderLi").hide();
        $("#newFolderName").val('');
		$("#newFolderBtnLi").show();
		$("#createNewFolderLi").find(".error").hide();
	};

	/**
	 * 新建文件夹按钮点击事件
	 * @event createNewFolderClickHandler
	 */
	createNewFolderClickHandler = function() {
        if(!checkConfiguration()){
            return false;
        }
		var newFolderName = $.trim($("#newFolderName").val());
		var newPath = prePath + basePath + getCurrentPath() + "/" + newFolderName;
        showLoading('creating');
		service.checkFileExists({
			path : newPath
		}, function(data1) {
			if (data1.status == "noexist" || data1.status == "processing") {
				service.createFolder({
					path : newPath
				}, function(data) {
					if (isErrorObject(data)) {
						showAlert(data.errorType);
						return false;
					} else {
                        successOverlay();
                        refreshFileList(getCurrentPath(), 1);
                    }
				});
			} else if (data1.status == "no_sdcard") {
                showAlert("no_sdcard", function(){
                    window.location.reload();
                });
			} else if (data1.status == "exist") {
				$("#createNewFolderErrorLabel").attr('data-trans', 'sd_card_share_setting_exist').text($.i18n.prop("sd_card_share_setting_exist"));
				hideLoading();
			}
		}, function(){
            errorOverlay();
        });
        return true;
	};

	/**
	 * 重命名按钮点击事件
	 * @event renameBtnClickHandler
	 * @param {String} oldName 原文件名
	 */
	renameBtnClickHandler = function(oldName) {
        var oldPath = prePath + basePath + getCurrentPath() + "/" + oldName;
        if(inSharePath(oldPath, 'sd_share_path_cant_rename')){
            return false;
        }
		showPrompt("sd_card_folder_name_is_null", function() {
            renamePromptCallback(oldName);
        }, 160, oldName, checkPromptInput);
    };
	
    function renamePromptCallback(oldName){
        if(!checkConfiguration()){
            return false;
        }
        var promptInput = $("div#confirm div.promptDiv input#promptInput");
        var newFolderName = $.trim(promptInput.val());
        var newPath = prePath + basePath + getCurrentPath() + "/" + newFolderName;
        service.checkFileExists({
                path : newPath
            }, function(data1) {
				if (data1.status == "noexist" || data1.status == "processing") {
					hideLoadingButtons();
					var oldPath = prePath + basePath + getCurrentPath() + "/" + oldName;
					service.fileRename({
						oldPath : oldPath,
						newPath : newPath,
						path : prePath + basePath + getCurrentPath()
					}, function(data) {
						if (isErrorObject(data)) {							
							showAlert($.i18n.prop(data.errorType));
							if(data.errorType == "no_exist"){
								var alertShown = true;
								refreshFileList(getCurrentPath(), 1, alertShown);
							} else if(data.errorType == "processing"){
								//
							}							
						} else {
                            refreshFileList(getCurrentPath(), 1);
                            successOverlay();
                        }
                        showLoadingButtons();
						return true;
					});
				} else if (data1.status == "no_sdcard") {
					showAlert("no_sdcard", function(){
                        window.location.reload();
                    });
					return false;
				} else if (data1.status == "exist") {
					$(".promptErrorLabel").text($.i18n.prop("sd_card_share_setting_exist"));
					return false;
				}
                return true;
            }, function(){
                errorOverlay();
        });
        return false;
    }
	
    /**
     * Prompt弹出框INPUT校验函数
     * @event checkPromptInput
     */	
    function checkPromptInput(){
        var promptInput = $("div#confirm div.promptDiv input#promptInput");
        var newFileName = $.trim(promptInput.val());
        var newPath = (prePath + basePath + getCurrentPath() + "/" + newFileName).replace("//", "/");
        var checkResult = checkFileNameAndPath(newFileName, newPath);
        if (1 == checkResult) {
            $(".promptErrorLabel").text($.i18n.prop("sd_upload_rename_null"));//tip filena is null
            return false;
        }else if (2 == checkResult) {
            $(".promptErrorLabel").text($.i18n.prop("sd_card_path_too_long"));
            return false;
        }else if (3 == checkResult) {
            $(".promptErrorLabel").text($.i18n.prop("check_file_path"));
            return false;
        }else{
            $(".promptErrorLabel").text("");
            return true;
        }
        return true;;
    }

    hideLoadingButtons = function () {
        $(".buttons", "#confirm").hide();
    };

    showLoadingButtons = function () {
        $(".buttons", "#confirm").show();
    };

	/**
	 * 删除按钮点击事件
	 * @event deleteBtnClickHandler
	 */
	deleteBtnClickHandler = function() {
        if(!checkConfiguration()){
            return false;
        }
		var files = $("input:checkbox:checked", "#fileList_container");
		var fileNames = "";
		if (!files || files.length == 0) {
			return false;
		}
        var hasSharePath = false;
        $.each(files, function (i, n) {
            var theFile = $(n).val();
            if (inSharePath(prePath + basePath + getCurrentPath() + "/" + theFile, {msg: 'sd_share_path_cant_delete', params: [theFile]})) {
                hasSharePath = true;
                return false;
            }
            return true;
        });
        if (hasSharePath) {
            return false;
        }
		showConfirm("confirm_data_delete", function(){
			$.each(files, function(i, n) {
				fileNames += $(n).val() + "*";
			});
			var thePath = prePath + basePath + getCurrentPath();
			service.deleteFilesAndFolders({
				path : thePath,
				names : fileNames
			}, function(data) {
				if (data.status == "failure") {
					showAlert("delete_folder_failure");
				}
				else if(data.status == "no_sdcard"){
					showAlert("no_sdcard");
				}
				else if(data.status == "processing"){
					showAlert("sd_file_processing_cant_delete");
				}
				else if(data.status == "success"){
					successOverlay();
				}
				refreshFileList(getCurrentPath(), 1);
			}, function(){
                errorOverlay();
            });
		});
        return true;
	};
	
    function getFileSize(obj){
        var isIE = /msie/i.test(navigator.userAgent) && !window.opera; 
        if (isIE) {  //如果是ie
            var objValue = obj.value;
            try {  
                var fso = new ActiveXObject("Scripting.FileSystemObject");  
                fileLenth = parseInt(fso.GetFile(objValue).size);
                } catch (e) {  //('IE内核取不到长度'); 
                fileLenth	= 1;					
            } 
        }else{  //其他
            try{//对于非IE获得要上传文件的大小
                fileLenth = parseInt(obj.files[0].size);
                }catch (e) {
                fileLenth=1;  //获取不到取-1
            }
        }
        return fileLenth;
    } 
	
    /**
	 * 文件上传按钮点击事件
	 * @event deleteBtnClickHandler
	 */
    fileUploadSubmitClickHandler = function(ifReName) {        
        if(ifReName){
            var fileName = $.trim($("div#confirm div.promptDiv input#promptInput").val());
        }else{
            var fileName = $(".customfile").attr('title');
        }
        var newPath = (basePath + getCurrentPath() + "/" + fileName).replace("//", "/");
        var fileSize = getFileSize($("#fileField")[0]);
        if(!checkuploadFileNameAndPath(fileName, newPath, fileSize)){
            return false;
        }		
        doCheckAndUpload(fileName, newPath, fileSize);
    };
		
    function doCheckAndUpload(fileName, newPath, fileSize){
        service.getSdMemorySizes({}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return false;
			}
			if (data.availableMemorySize < fileSize) {
				showAlert("sd_upload_space_not_enough");
				return false;
			}
			$.modal.close();
			showLoading('uploading', '<span data-trans="note_uploading_not_refresh">' + $.i18n.prop('note_uploading_not_refresh') + '</span>');
			service.checkFileExists({
				path : newPath
			}, function(data1) {
				if (data1.status == "noexist") {
					$("#fileUploadForm").attr("action", "/cgi-bin/zte_httpshare/" + URLEncodeComponent(fileName));
					var currentTime = new Date().getTime();
					$("#path_SD_CARD_time").val(transUnixTime(currentTime));
					$("#path_SD_CARD_time_unix").val(Math.round((currentTime - zoneOffsetSeconds * 1000) / 1e3));
					if(!iframeLoadBinded){
						bindIframeLoad();
					}
					sdIsUploading = true;
					$("#fileUploadForm").submit();
				} else if (data1.status == "no_sdcard") {
					showAlert("no_sdcard", function(){
						window.location.reload();
					});
				} else if (data1.status == "processing") {
					showAlert("sd_upload_file_is_downloading");//("system is downloading,try later!");
				}else if (data1.status == "exist") {
					showPrompt("sd_upload_rename",function(){
						fileUploadSubmitClickHandler(true);
					},160, fileName, checkPromptInput, clearUploadInput);
				}
			}, function(){
				errorOverlay();
			});
        		return true;
		});
	}
	
    var iframeLoadBinded = false;
    function bindIframeLoad(){
        iframeLoadBinded = true;
        $('#fileUploadIframe').load(function() {
			sdIsUploading = false;
            var txt = $('#fileUploadIframe').contents().find("body").html().toLowerCase();
            var alertShown = false;
            if (txt.indexOf('success') != -1) {
                successOverlay();
            } else if (txt.indexOf('space_not_enough') != -1) {
                alertShown = true;
                showAlert('sd_upload_space_not_enough');
            } else if (txt.indexOf('data_lost') != -1) {
                alertShown = true;
                showAlert('sd_upload_data_lost');
            } else {
                errorOverlay();
            }

            clearUploadInput();
            refreshFileList(getCurrentPath(), 1, alertShown);
        });
    }

	/**
	 * 清空上传控件
	 * @method clearUploadInput
	 */
    function clearUploadInput(){
        $("#fileField").closest('.customfile').before('<input id="fileField" name="filename" maxlength="200" type="file" dir="ltr"/>').remove();
        addTimeout(function(){
            $("#fileField").customFileInput();
        }, 0);
        $("#uploadBtn", "#uploadSection").attr("data-trans", "browse_btn").html($.i18n.prop('browse_btn'));
        $(".customfile", "#uploadSection").removeAttr("title");
        $(".customfile span.customfile-feedback", "#uploadSection")
            .html('<span data-trans="no_file_selected">'+$.i18n.prop('no_file_selected')+'</span>')
            .attr('class', 'customfile-feedback');
    }
	
	/**
	 * 更新SD卡容量显示数据
	 * @method updateSdMemorySizes
	 */
	updateSdMemorySizes = function() {
		service.getSdMemorySizes({}, function(data) {
			if (isErrorObject(data)) {
				showAlert(data.errorType);
				return false;
			}
			var total = getDisplayVolume(data.totalMemorySize, false);
			var used = getDisplayVolume(data.totalMemorySize - data.availableMemorySize, false);
			$("#sd_volumn_used").text(used);
			$("#sd_volumn_total").text(total);
            return true;
		});
	};

	/**
	 * 翻页
	 * @method pagination
	 */
	pagination = function(fileTotalSize) {
		var pagers = generatePager(fileTotalSize, perPage, parseInt(activePage, 10));
		if(pagerTmpl == null){
			pagerTmpl = $.template("pagerTmpl", $("#pagerTmpl"));
		}
		$(".pager", "#fileListButtonSection").html($.tmpl("pagerTmpl", {data: {pagers : pagers, total : getTotalPages(fileTotalSize, perPage)}}));
		renderCheckbox();
		$(".content", "#httpshare_form").translate();
	};

    /**
     * 文件名和路径检查
     * @method checkFileNameAndPath
     * @param {String} filename 文件名
     * @param {Boolean} path 是否包含路径
     */
    function checkFileNameAndPath(filename, path) {
        if (filename == "" || filename.length > 25) {
            return 1;
        }
        if (path.length >= 200) {
            return 2;
        }
        if (!checkFileNameChars(filename, false)) {
            return 3;
        }
    }

    function checkuploadFileNameAndPath(fileName, newPath, fileSize){
        if(!checkConfiguration()){
            return false;
        }
		
		if (typeof fileName == "undefined" || fileName == '' || fileName == $.i18n.prop("no_file_selected")) {
            showAlert("sd_no_file_selected");
			return false;
		}
		if (newPath.length >= 200) {
			showAlert("sd_card_path_too_long");
			return false;
		}
		
		if (fileSize/1024/1024/1024 > 2){  //no more than 2G
			showAlert("sd_file_size_too_big");
			return false;
		}		
		
		if (fileName.indexOf('*') >= 0){  //no *
			showAlert("sd_file_name_invalid");
			return false;
		}
		return true;
	}
	
	/**
	 * 文件名特殊字符检查
	 * @method checkFileNameChars
	 * @param {String} filename 文件名
	 * @param {Boolean} isIncludePath 是否包含路径
	 */
	function checkFileNameChars(filename, isIncludePath) {
		var invalidASCStr = '+/:*?<>\"\'\\|#&`~';
		if(isIncludePath){
			invalidASCStr = '+:*?<>\"\'\\|#&`~';
		}
		var flag = false;
		var dotFlag = false;
		var reg = /^\.+$/;
		for ( var k = 0; k < filename.length; k++) {
			for ( var j = 0; j < invalidASCStr.length; j++) {
				if (filename.charAt(k) == invalidASCStr.charAt(j)) {
					flag = true;
					break;
				}
			}
			if (reg.test(filename)) {
				dotFlag = true;
			}
			if (flag || dotFlag) {
				return false;
			}
		}
		return true;
	}
	
	/**
	 * 下载文件是检查文件路径是否包含特殊字符
	 * @method checkFilePathForDownload
	 * @param {String} path 文件路径
	 */
	checkFilePathForDownload = function(path){
        if(!checkConfiguration()){
            return false;
        }
		var idx = path.lastIndexOf('/');
		var prePath = path.substring(0, idx+1);
		var name = path.substring(idx+1, path.length);
		if(checkFileNameChars(prePath, true) && checkFileNameChars(name, false)){
			return true;
		}
		showAlert('sd_card_invalid_chars_cant_download');
		return false;
	};
	
	gotoLogin = function(){
		window.location.href="#login";
	};
	/**
	 * 事件绑定
	 * @method bindEvent
	 */
    function bindEvent(){
		$('#createNewFolderForm').validate({
			submitHandler : function() {
				createNewFolderClickHandler();
			},
			rules : {
				newFolderName : {sd_card_path_too_long:true,check_filefold_name: true}
			}
		});
        $("p.checkbox", "#httpshare_form").die().live('click', function () {
            addTimeout(function () {
                checkDeleteBtnStatus();
            }, 100);
        });
        $(".icon-download", "#httpshare_form").die().live("click", function () {
            return checkFilePathForDownload($(this).attr("filelocal"));
        });
        $(".folderTd", "#httpshare_form").die().live("click", function () {
            return enterFolder($(this).attr("filename"));
        });
        $(".fileRename", "#httpshare_form").die().live("click", function () {
            return renameBtnClickHandler($(this).attr("filename"));
        });
        iframeLoadBinded = false;
    }
	/**
	 * 刷新删除按钮状态
	 * @method checkDeleteBtnStatus
	 */
    function checkDeleteBtnStatus(){
        var checkedItem = $("p.checkbox.checkbox_selected", '#fileListSection');
        if(checkedItem.length > 0){
            enableBtn($('#delete_file_button'));
        } else {
            disableBtn($('#delete_file_button'));
        }
    }

    function getCurrentPath(){
        return currentPath;
    }

    function setCurrentPath(path){
        if(path.lastIndexOf("/") == path.length - 1){
            currentPath = path.substring(0, path.length - 1);
        } else {
            currentPath = path;
        }
    }
	/**
	 * 页面初始化
	 * @method init
	 */
	function init() {
		var container = $('#container')[0];
		ko.cleanNode(container);
		var vm = new HttpShareViewModel();
		ko.applyBindings(vm, container);
        bindEvent();
	}

	
    jQuery.validator.addMethod("check_filefold_name", function(value, element, param) {
        var result = checkFileNameChars(value, false);
        return this.optional(element) || result;
    });
	
    jQuery.validator.addMethod("sd_card_path_too_long", function(value, element, param) {
        var newFolderName = $.trim($("#newFolderName").val());
        var newPath = prePath + basePath + getCurrentPath() + "/" + newFolderName;
        var result = true;
        if (newPath.length >= 200) {
            result = false;
        }
        return this.optional(element) || result;
    });
	
	return {
		init : init
	};
});