/**
 * Sim卡短信列表
 * @module sim_messages
 * @class sim_messages
 */
define(['jquery', 'knockout', 'config/config', 'service' ],
    function($, ko, config, service) {
		var simMsgListTmpl = null;
		/**
		 * 每页记录条数
		 * 现在9x15平台不能够设置每页数据个数，默认为10个。目前此变量不能够修改
		 * @attribute {Integer} perPage
		 */
		var perPage = 200;
		
		/**
		 * 获取短信分页记录
		 * @method getSMSMessages
		 */
        function getSMSMessages() {            
    		return service.getSMSMessages({
    			page : 0,
    			smsCount : perPage,
    			nMessageStoreType : 0,
    			tags : 10,
    			orderBy : "order by id desc"
    		}, function(data) {
                tryToDisableCheckAll($("#simMsgList-checkAll"), data.messages.length);
    			dealPhoneBooks(data.messages);
    		}, function(data) {
				dealPhoneBooks([]);
    		});
    	}
        
        /**
		 * 短信显示联系人名字，并将结果显示在UI
		 * @method dealPhoneBooks
		 * @param {Array} messages 短信息
		 */
        function dealPhoneBooks(messages){
        	$.each(messages, function(j, n){
				n.itemId = getLastNumber(n.number, config.SMS_MATCH_LENGTH);
        		for(var i = 0; i < config.phonebook.length; i++){
        			var person = config.phonebook[i];
        			if(n.itemId == getLastNumber(person.pbm_number, config.SMS_MATCH_LENGTH)){
        				n.name = person.pbm_name;
        				break;
        			}
        		}
        	});
        	renderSimMessageList(messages);
        }

		/**
	     * 清楚短信列表内容
	     * @method cleanSmsList
	     */
	    cleanSimSmsList = function(){
		    $("#simMsgList_container").empty();
	    };
        
        /**
		 * 将短信显示结果显示在UI
		 * @method renderSimMessageList
		 * @param {Array} messages 短信息
		 */
        function renderSimMessageList(messages){
        	if(simMsgListTmpl == null){
        		simMsgListTmpl = $.template("simMsgListTmpl", $("#simMsgListTmpl"));
        	}
			cleanSimSmsList();
        	$("#simMsgList_container").html($.tmpl("simMsgListTmpl", {data: messages}));
			hideLoading();
        }
        
        /**
    	 * 初始化电话本信息
    	 * @method initPhoneBooks
		 * @param {Function} cb 回调函数
    	 */
        function initPhoneBooks(cb) {
            service.getPhoneBooks({
                page : 0,
                data_per_page : 2000,
                orderBy : "name",
                isAsc : true
    		}, function(books){
    			if ($.isArray(books.pbm_data) && books.pbm_data.length > 0) {
    				config.phonebook = books.pbm_data;
    			} else {
    				config.phonebook = [];
    			}
    			cb();
    		}, function(){
                errorOverlay();
            });
        }
        
    	/**
    	 * SmsMessagesVM
    	 * @class SmsMessagesVM
    	 */
        function SmsMessagesVM() {
            var self = this;
            self.selectAll = function(){
                var selectAllStatus = $("#checkbox-all");
                if(selectAllStatus.prop("checked") == false){
                    enableBtn($("#simMsgList-delete"));
                }else if(selectAllStatus.prop("checked") == true){
                    disableBtn($("#simMsgList-delete"));
                }
            };
            self.CSRFToken = service.getToken().token;
            start();
        }

		/**
		 * 短信删除事件处理
		 * @event deleteSmsMsgClickHandler
		 */
		deleteSelectedSimMsgClickHandler = function(){
			var checkbox = $("input[name=msgId]:checked", "#simMsgList_container");
			var msgIds = [];
			for(var i = 0; i < checkbox.length; i++){
				msgIds.push($(checkbox[i]).val());
			}
			if(msgIds.length == 0){
				return false;
			}
			showConfirm("confirm_sms_delete", function() {
                showLoading('deleting');
				service.deleteMessage({
					ids: msgIds
				}, function(data){
					removeChecked("simMsgList-checkAll");
                    disableBtn($("#simMsgList-delete"));
					var idsForDelete = "";
					checkbox.each(function(i, n){
						idsForDelete += ".simMsgList-item-class-" + $(n).val() + ",";
					});
					if(idsForDelete.length > 0){
						$(idsForDelete.substring(0, idsForDelete.length - 1)).hide().remove();
					}
                    tryToDisableCheckAll($("#simMsgList-checkAll"), $(".smslist-item","#simMsgList_container").length);
					successOverlay();
				}, function(error){
					errorOverlay(error.errorText);
				});
				//删除短信后需要刷新列表
				updateSimSmsCapabilityStatus($("#simSmsCapability"));
			});
		};
		/**
		 * 将被checked的条目添加到self.checkedItem中，用于在滚动还原checkbox
		 * @event checkboxClickHandler
		 */
		function checkboxClickHandler() {
			if(getSelectedItemSize() == 0){
				disableBtn($("#simMsgList-delete"));
			} else {
				enableBtn($("#simMsgList-delete"));
			}
		}

		/**
		 * 获取已选择的条目
		 * @method getSelectedItemSize
		 * @return {Array}
		 */
		function getSelectedItemSize(){
			return $("input:checkbox:checked", '#simMsgList_container').length;
		}
        
    	/**
    	 * 模块开始，检查电话本及短信状态并加装页码数据
    	 * @method start
    	 */
        function start(){
            showLoading('waiting');
            var getSMSReady = function () {
                service.getSMSReady({}, function (data) {
                    if (data.sms_cmd_status_result == "2") {
                        hideLoading();
                        showAlert("sms_init_fail");
                    } else if (data.sms_cmd_status_result == "1") {
                        addTimeout(function () {
                            getSMSReady();
                        }, 1000);
                    } else {
                        if (!config.HAS_PHONEBOOK) {
                            initSMSList(config.HAS_PHONEBOOK);
                        } else {
                            getPhoneBookReady();
                        }
                    }
                });
            };

            var getPhoneBookReady = function () {
                service.getPhoneBookReady({}, function (data) {
                    if (data.pbm_init_flag == "6") {
                        initSMSList(false);
                    } else if (data.pbm_init_flag != "0") {
                        addTimeout(function () {
                            getPhoneBookReady();
                        }, 1000);
                    } else {
                        initSMSList(config.HAS_PHONEBOOK);
                    }
                });
            };

            var initSMSList = function (isPbmInitOK) {
                if (isPbmInitOK) {
                    initPhoneBooks(function () {
                        getSMSMessages();
                    });
                } else {
                    config.phonebook = [];
                    getSMSMessages();
                }
            };
            getSMSReady();
            initSimSmsCapability();
        }
		
		/**
		 * 初始化短信容量状态
		 * @method initSimSmsCapability
		 */
		function initSimSmsCapability(){
			var capabilityContainer = $("#simSmsCapability");
			updateSimSmsCapabilityStatus(capabilityContainer);
			addInterval(function(){
				updateSimSmsCapabilityStatus(capabilityContainer);
			}, 5000);
		}
    	
		/**
		 * 更新短信容量状态
		 * @method updateSimSmsCapabilityStatus
		 * @param capabilityContainer {Object} 放置容量信息的容器
		 */
		function updateSimSmsCapabilityStatus(capabilityContainer){
			service.getSmsCapability({}, function(capability){
				if(capabilityContainer != null){
					if((capability.simUsed >=  capability.simTotal) && capability.simTotal != 0)
						capabilityContainer.text("(" + $.i18n.prop("sim_full") + ")");
					//capabilityContainer.text("(" + capability.simUsed + "/" + capability.simTotal + ")");
				}
			});
		}
		
		/**
         * 清除搜索关键字事件
         * @event clearSearchKey
         */
        clearSearchKey = function () {
            updateSearchValue($.i18n.prop("search"));
            $("#searchInput").addClass("ko-grid-search-txt-default").attr("data-trans", "search");
        };
        /**
         * 点击搜索输入框事件
         * @event searchTextClick
         */
        searchTextClick = function () {
            var searchText = $("#searchInput");
            if (searchText.hasClass("ko-grid-search-txt-default")) {
                updateSearchValue("");
		    	searchText.val("");
                searchText.removeClass("ko-grid-search-txt-default").removeAttr("data-trans");
            }
        };
        /**
         * 离开搜索输入框事件
         * @event searchTextBlur
         */
        searchTextBlur = function () {
            var txt = $.trim($("#searchInput").val()).toLowerCase();
            if (txt == "") {
                clearSearchKey();
            }
        };
	
	    updateSearchValue = function (key){
		    if(key == "" || key == $.i18n.prop("search")){
			    return true;
		    }
		    searchTable(key);
	    };
	
	    function searchTable(key) {
            key = $.trim(key);
            var $trs = $('tr', '#smslist-table'),
                trLength = $trs.length;
            if (key == '') {
                $trs.show();
                return false;
            }
            $trs.hide();
            while (trLength) {
                var $tr = $($trs[trLength - 1]),
                    $tds = $('td', $tr),
                    tdLength = $tds.length;
                while (tdLength - 1) {
                    var $td = $($tds[tdLength - 1]);
                    if ($td.text().toLowerCase().indexOf(key.toLowerCase()) != -1) {
                        $tr.show();
                        break;
                    }
                    tdLength--;
                }
                trLength--;
            }

            addTimeout(function () {
                $(":checkbox:checked", "#addPhonebookContainer").removeAttr('checked');
                vm.selectedItemIds([]);
                vm.freshStatus($.now());
                renderCheckbox();
            }, 300);
            return true;
        }
		
    	/**
    	 * 点击短信列表条目
    	 * @event smsItemClickHandler
    	 * @param {Integer} tag 未读状态 id 序号，num 手机号
    	 */
    	simsmsItemClickHandler = function(tag, id, num){
        	if(tag == "1"){
				var ids = [];
				ids.push(id);
				service.setSmsRead({ids: ids}, function(data){
					if(data.result){
						$(".simMsgList-item-class-" + id, "#simMsgTableContainer").removeClass('font-weight-bold');
					}
				});
			}	
    	};
        
    	/**
    	 * 页面事件绑定
    	 * @method initEventBind
    	 */
        function initEventBind(){
        	$(".smslist-item-msg", "#simMsgTableContainer").die().live("click", function(){
        		var $this = $(this).addClass('showFullHeight');
    			$('.smslist-item-msg.showFullHeight', '#simMsgTableContainer').not($this).removeClass('showFullHeight');
        	});
			$("#simMsgList_container p.checkbox, #simMsgListForm #simMsgList-checkAll").die().live("click", function(){
				checkboxClickHandler();
			});
			$("#searchInput").die().live('blur', function(){
			    searchTextBlur();
			}).live('keyup', function(){
			    updateSearchValue($("#searchInput").val());
			});
        }
        
    	/**
    	 * 模块初始化开始
    	 * @method init
    	 */
        function init() {
            getRightNav( SMS_COMMON_URL );

            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new SmsMessagesVM();
            ko.applyBindings(vm, container[0]);
            initEventBind();
        }

        window.smsUtil = {
            changeLocationHandler: function(ele){
                if($(ele).val() == 'sim'){
                    window.location.hash = '#sim_messages';
                } else {
                    window.location.hash = '#sms';
                }
            }
        };

        return {
            init : init
        };
    }
);
