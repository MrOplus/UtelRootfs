
define([ 'underscore', 'jquery', 'knockout', 'config/config', 'service', 'lib/jquery/chosen.jquery' ],
/**
 * Sms list
 * @module smslist
 * @class smslist
 */
function(_, $, ko, config, service, chosen) {
	/**
	 * 当前页
	 * @attribute {Integer} currentPage
	 */
	var currentPage = 1;
	/**
	 * 数据是否加载完成
	 * @attribute {Array} ready
	 */
	var ready = false,
    /**
     * 聊天室信息正在加载中
     * @attribute {Boolean} chatRoomInLoading
     */
        chatRoomInLoading = false;
	/**
	 * 快速添加联系人模板
	 * @attribute {Object} addPhonebookTmpl
	 */
	var addPhonebookTmpl = null,
    /**
     * 短消息模板
     * @attribute {Object} smsTableTmpl
     */
        smsTableTmpl = null,
    /**
     * 接收短信模板
     * @attribute {Object} smsOtherTmpl
     */
        smsOtherTmpl = null,
    /**
     * 发送短信模板
     * @attribute {Object} smsMeTmpl
     */
        smsMeTmpl = null,
    /**
     * 群聊草稿
     * @attribute {Array} groupDrafts
     */
        groupDrafts = [],
    /**
     * 短信列表显示群聊草稿
     * @attribute {Array} groupDraftItems
     */
        groupDraftItems = [],
    /**
     * 短信列表显示群聊草稿及其草稿群聊细节
     * @attribute {Object} groupedDraftsObject
     */
        groupedDraftsObject = {},
    /**
     * 短信容量信息
     * @attribute {Object} smsCapability
     */
        smsCapability = {},
    /**
     * 短息是否还有存储空间
     * @attribute {Object} hasCapability
     */
        hasCapability = true;
	/**
	 * 获取全部短消息，并将短信通过回调函数getPhoneBooks，与电话本进行关联
	 *
	 * @method getSMSMessages
	 * @param {getPhoneBooks} callback 回调：获取全部电话本信息getPhoneBooks
	 */
	function getSMSMessages(callback) {
		return service.getSMSMessages({
			page : 0,
			smsCount : 500,
			nMessageStoreType : 1,
			tags : 10,
			orderBy : "order by id desc"
		}, function(data) {
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), data.messages.length);
			config.dbMsgs = data.messages;
			config.listMsgs = groupSms(config.dbMsgs);
			callback();
		}, function() {
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), 0);
			config.dbMsgs = [];
			config.listMsgs = [];
			cleanSmsList();
		});
	}
	var login_Italia_show = service.getAllOnceDatas().add_special_login_page;
	/**
	 * 清楚短信列表内容
	 * @method cleanSmsList
	 */
	cleanSmsList = function(){
		$("#smslist-table").empty();
	};

	/**
	 * 关联后的短消息根据电话号码进行分组
	 *
	 * @method groupSms
	 * @param {Array} messages 短消息数组
	 */
	function groupSms(messages) {
		var peoples = {},
            theSortedPeoples = [];
		config.listMsgs = [];
		groupDrafts = [];
		$.each(messages, function(i, e) {
			if(e.tag == '4' && e.groupId != ''){ // 群聊草稿
				groupDrafts.push(e);
				return;
			}
			e.target = e.number;
			if(parseInt(e.id, 10) > config.smsMaxId) {
				config.smsMaxId = e.id;
			}
			var last8 = getLastNumber(e.number, config.SMS_MATCH_LENGTH);
			if (last8 in peoples) {
				peoples[last8].push(e);
			} else {
				peoples[last8] = [ e ];
                theSortedPeoples.push(e);
			}
		});
        theSortedPeoples = _.sortBy(theSortedPeoples, function(ele){
            return 0 - parseInt(ele.id + "", 10);
        });
        $.each(theSortedPeoples, function(s_i, sp){
            var people = getLastNumber(sp.number, config.SMS_MATCH_LENGTH);
            var newCount = 0;
            var hasDraft = false;
            for (var i = 0; i < peoples[people].length; i++){
                if(peoples[people][i].isNew){
                    newCount++;
                }
                if(peoples[people][i].tag == '4' && peoples[people][i].groupId == ''){ // 单条草稿
                    hasDraft = true;
                }
            }
            config.listMsgs.push({
                id : peoples[people][0].id,
                name : "",
                number : peoples[people][0].number,
                latestId : peoples[people][0].id,
                totalCount : peoples[people].length,
                newCount : newCount,
                latestSms : peoples[people][0].content,
                latestTime : peoples[people][0].time,
                checked : false,
                itemId : getLastNumber(people, config.SMS_MATCH_LENGTH),
                groupId: peoples[people][0].groupId,
                hasDraft : hasDraft
            });
        });
		return config.listMsgs;
	}

	/**
	 * 获取电话本信息，并与短消息关联
	 * @method getPhoneBooks
	 */
	function getPhoneBooks() {
		var books = service.getPhoneBooks({
			page : 0,
			data_per_page : 2000,
			orderBy : "name",
			isAsc : true
		});
		if ($.isArray(books.pbm_data) && books.pbm_data.length > 0) {
			config.phonebook = books.pbm_data;
		}
		dealPhoneBooks();
	}

	/**
	 * 双异步获取设备侧和sim卡侧的短信息，并将其合并
	 * @method dealPhoneBooks
	 */
	function dealPhoneBooks(){
		var select = $("#chosenUserList .chosen-select-deselect");
		select.empty();
		var options = [];
		var tmp = [];
        var pbTmp = [];
		for(var j = 0; j < config.phonebook.length; j++){
			var book = config.phonebook[j];
            var last8Num = getLastNumber(book.pbm_number, config.SMS_MATCH_LENGTH);
			if(last8Num && $.inArray(last8Num, pbTmp) == -1){
				options.push(new Option(book.pbm_name + "/" + book.pbm_number , last8Num, false, true));
                if($.inArray(last8Num, tmp) == -1){
                    tmp.push(last8Num);
                }
                pbTmp.push(last8Num);
            }else{
                for(var i = 0; i < options.length; i++){
                    if(options[i].value == last8Num){
                        options[i].text = book.pbm_name + "/" + book.pbm_number;
                        break;
                    }
                }
			}
		}
		var groupIds = [];
		for(var k = 0; k < groupDrafts.length; k++){ // 将草稿做对象Map封装，供草稿组点击后的草稿分解
			if($.inArray(groupDrafts[k].groupId, groupIds) == -1){
				groupIds.push(groupDrafts[k].groupId);
				var draft = groupDrafts[k];
				groupedDraftsObject[groupDrafts[k].groupId] = [draft];
			} else {
				var draft = groupDrafts[k];
				groupedDraftsObject[groupDrafts[k].groupId].push(draft);
			}
            var itemId = getLastNumber(groupDrafts[k].number, config.SMS_MATCH_LENGTH);
            if($.inArray(itemId, tmp) == -1){
                options.push(new Option(groupDrafts[k].number , itemId));
                tmp.push(itemId);
            }
		}
		for(var g in groupedDraftsObject){ // 处理列表显示的草稿信息
			var drafts = groupedDraftsObject[g];
			var draftItem = drafts[drafts.length - 1];
			draftItem.draftShowName = '';
			draftItem.draftShowNameTitle = '';
			$.each(drafts, function(i, n){
				var showName = getShowNameByNumber(n.number);
				draftItem.draftShowName += (i == 0 ? '' : ';') + showName;
				draftItem.draftShowNameTitle += (i == 0 ? '' : ';') + showName;
			});

            var len = 10;
            if(getEncodeType(draftItem.draftShowName).encodeType == "UNICODE"){
                len = 10;
            }
            draftItem.draftShowName = draftItem.draftShowName.length > len ? draftItem.draftShowName.substring(0, len) + "..." : draftItem.draftShowName;
			draftItem.totalCount = drafts.length;
			draftItem.hasDraft = true;
            draftItem.latestTime = draftItem.time;
			groupDraftItems.push(draftItem);
		}
        for(var i = 0; i < config.listMsgs.length; i++){
            var smsItem = config.listMsgs[i];
            for(var j = config.phonebook.length; j > 0 ; j--){
                var book = config.phonebook[j-1];
                var last8Num = getLastNumber(book.pbm_number, config.SMS_MATCH_LENGTH);
                if (smsItem.itemId == last8Num) {
                    smsItem.name = book.pbm_name;
                    for (var k = 0; k < options.length; k++) {
                        if (last8Num == options[k].value) {
                            options[k].value = getLastNumber(smsItem.number, config.SMS_MATCH_LENGTH);
                            options[k].text = book.pbm_name + '/' + smsItem.number;
                            break;
                        }
                    }
                    break;
                }
			}
			if($.inArray(smsItem.itemId, tmp) == -1){
				options.push(new Option(smsItem.number , getLastNumber(smsItem.number, config.SMS_MATCH_LENGTH)));
				tmp.push(smsItem.itemId);
			}
		}

		var opts = "";
		$.each(options, function(i, e){
			opts += "<option value='"+e.value+"'>"+e.text+"</option>";
		});
		select.append(opts);
		select.chosen({max_selected_options: 5, search_contains: true, width: '740px'});
		showSmsListData();
		showMultiDraftListData();
		//changeShownMsgs();
		ready = true;
	}

	function showSmsListData(){
		if(smsTableTmpl == null){
			smsTableTmpl = $.template("smsTableTmpl", $("#smsTableTmpl"));
		}
		cleanSmsList();
		$.tmpl("smsTableTmpl", {data: config.listMsgs}).translate().appendTo("#smslist-table");

		if(config.HAS_PHONEBOOK){
			$(".sms-add-contact-icon").removeClass("hide");
		}else{
			$(".sms-add-contact-icon").addClass("hide");
		}
	}
	/**
	 * 群组草稿列表显示
	 *
	 * @method showMultiDraftListData
	 */
	 function showMultiDraftListData(){
		if(groupDraftItems.length == 0){
			return false;
		}
		if(smsTableTmpl == null){
			smsTableTmpl = $.template("smsTableTmpl", $("#smsTableTmpl"));
		}
		$.tmpl("smsTableTmpl", {data: groupDraftItems}).translate().prependTo("#smslist-table");
	}

	/**
	 * 页面发生滚动后，改变页面显示的短消息
	 *
	 * @method changeShownMsgs
	 */
	function changeShownMsgs() {
		var shownMsgsTmp = [];
		var range = _.range((currentPage - 1) * 5, currentPage * 5);
		$.each(range, function(i, e) {
			if (config.listMsgs[e]) {
				shownMsgsTmp.push(config.listMsgs[e]);
			}
		});
		//shownMsgsTmp = config.listMsgs;
		currentPage++;

		if(smsTableTmpl == null){
			smsTableTmpl = $.template("smsTableTmpl", $("#smsTableTmpl"));
		}
		$.tmpl("smsTableTmpl", {data: shownMsgsTmp}).translate().appendTo("#smslist-table");

		renderCheckbox();
		if(shownMsgsTmp.length == 0){
			disableBtn($("#smslist-delete-all"));
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), 0);
		}else{
			enableBtn($("#smslist-delete-all"));
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), 1);
		}
		if(currentPage == 2 && window.innerHeight == $("body").height()){
			changeShownMsgs();
		}
		return shownMsgsTmp;
	}

	/**
	 * 将被checked的条目添加到self.checkedItem中，用于在滚动还原checkbox
	 * @event checkboxClickHandler
	 * @param {Integer} id
	 */
	checkboxClickHandler = function(id) {
		checkDeleteBtnStatus();
	};
	

	/**
	 * 获取已选择的条目
	 * @method getSelectedItem
	 * @return {Array}
	 */
	getSelectedItem = function(){
		var selected = [];
		var checkedItem = $("#smslist-table input:checkbox:checked");
		checkedItem.each(function(i, e){
			selected.push($(e).val());
		});
		return selected;
	};

	/**
	 * 删除按钮禁用可用处理
	 * @method checkDeleteBtnStatus
	 */
	checkDeleteBtnStatus = function(){
		var size = getSelectedItem().length;
		if(size == 0){
			disableBtn($("#smslist-delete"));
		} else {
			enableBtn($("#smslist-delete"));
		}
	};

	/**
	 * 刷新短消息列表
	 * @event refreshClickHandler
	 */
	refreshClickHandler = function() {
		$("#smslist-table").empty();
		disableBtn($("#smslist-delete"));
        disableCheckbox($("#smslist-checkAll", "#smsListForm"));
		init();
        renderCheckbox();
	};

	/**
	 * 删除全部短消息
	 * @event deleteAllClickHandler
	 */
	deleteAllClickHandler = function() {
		showConfirm("confirm_data_delete", function() {
            showLoading('deleting');
			service.deleteAllMessages({
				location : "native_inbox"
			}, function(data) {
				cleanSmsList();
                tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), 0);
				successOverlay();
			}, function(error){
				errorOverlay(error.errorText);
			});
		});
	};

	/**
	 * 删除选中的短消息
	 * @event deleteSelectClickHandler
	 */
	deleteSelectClickHandler = function(){
		showConfirm("confirm_sms_delete", function() {
            showLoading('deleting');
			var items = getIdsBySelectedIds();
			service.deleteMessage({
				ids: items.ids
			}, function(data){
				renderAfterDelete(items);
				disableBtn($("#smslist-delete"));
				$("#checkbox-all").removeAttr("checked");
				renderCheckbox();
				successOverlay();
			}, function(error){
				errorOverlay(error.errorText);
			});
		});

		function renderAfterDelete(items){
			var ids = items.ids;
			var nums = [];
			$.each(config.dbMsgs, function(i, e){
				if($.inArray(e.id, items.normalIds) != -1){
					nums.push(e.number);
				}
			});
			nums = _.uniq(nums);
			$.each(nums, function(i, e){
				$("#smslist-item-" + getLastNumber(e, config.SMS_MATCH_LENGTH)).hide().remove();
			});
			$.each(items.groups, function(i, e){
				$("#smslist-item-" + e).hide().remove();
			});
			synchSmsList(nums, ids);
		}

		function getIdsBySelectedIds(){
			var nums = [];
			var resultIds = [];
            var normalIds = [];
			var groups = [];
            var selectedItem = getSelectedItem();
			$.each(selectedItem, function(i, e) {
				var checkbox = $("#checkbox" + e);
				if(checkbox.attr("groupid")){
					groups.push(checkbox.attr("groupid"));
				} else {
					nums.push(getLastNumber(checkbox.attr("number"), config.SMS_MATCH_LENGTH));
				}
			});

			$.each(config.dbMsgs, function(i, e) {
				if ($.inArray(getLastNumber(e.number, config.SMS_MATCH_LENGTH), nums) != -1 && (typeof e.groupId == "undefined" || _.isEmpty(e.groupId+''))) {
					resultIds.push(e.id);
                    normalIds.push(e.id);
				} else if ($.inArray(e.groupId + '', groups) != -1) { //删除草稿组
					resultIds.push(e.id);
				}
			});
            resultIds = _.uniq(resultIds);
			return {ids: resultIds, groups: groups, normalIds: normalIds};
		}
	};

	/**
	 * 新短信按钮点击
	 * @event newMessageClickHandler
	 */
	newMessageClickHandler = function(){
		$("#chosenUser1", "#smsChatRoom").addClass("hide");
		$("#chosenUser", "#smsChatRoom").show();

		cleanChatInput();
        checkSmsCapacityAndAlert();
		$("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
        switchPage('chat');
        gotoBottom();
        clearChatList();
	};

	/**
	 * 返回聊天室列表
	 * @event chatCancelClickHandler
	 */
	chatCancelClickHandler = function(){
		if(config.CONTENT_MODIFIED.modified) {
			var confirmMessage = 'sms_to_save_draft';
			var selectedContact = syncSelectAndChosen($("select#chosenUserSelect"), $('.search-choice', '#chosenUserSelect_chosen'));
			var noContactSelected = !selectedContact || selectedContact.length == 0;
			if(noContactSelected){
				confirmMessage = 'sms_no_recipient';
			}
            if(noContactSelected){
                showConfirm(confirmMessage, {ok: function() {
                    if(!noContactSelected){
                        saveDraftAction({
                            content : $("#chat-input", "#smsChatRoom").val(),
                            numbers :  selectedContact,
                            isFromBack : true
                        });
                    }
                    config.resetContentModifyValue();
                    backToSmsListMainPage();
                }, no: function(){
                    if(noContactSelected){
                        return true;
                    }
                    config.resetContentModifyValue();
                    backToSmsListMainPage();
                }});
            } else {
                saveDraftAction({
                    content : $("#chat-input", "#smsChatRoom").val(),
                    numbers :  selectedContact,
                    isFromBack : true
                });
                config.resetContentModifyValue();
                backToSmsListMainPage();
            }
			return false;
		}
		backToSmsListMainPage();
	};
	
	/**
	 * 跳转页面至SIM卡侧、设置界面
	 * @event toSIMClickHandler
	 */
	toOtherClickHandler = function(href){
		config.CONTENT_MODIFIED.checkChangMethod();	
		if(config.CONTENT_MODIFIED.modified) {
			draftListener();
            if(config.CONTENT_MODIFIED.message == 'sms_to_save_draft'){
                config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                config.resetContentModifyValue();
                window.location.hash = href;
            } else {
                showConfirm(config.CONTENT_MODIFIED.message, {ok: function() {
                    config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                    config.resetContentModifyValue();
                    window.location.hash = href;
                }, no: function(){
                    var result = config.CONTENT_MODIFIED.callback.no(config.CONTENT_MODIFIED.data);
                    if(!result) {
                        window.location.hash = href;
                        config.resetContentModifyValue();
                    }
                }});
            }
            return false;
        }else{
			//window.location.hash = href;
            tosms(href);
		}
	};

	function backToSmsListMainPage(){
		$("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
		config.currentChatObject = null;
        $(".smslist-btns", "#smslist-main").removeClass('smsListFloatButs');
        switchPage('list');
	}

    function switchPage(page){
        if(page == 'chat'){
            $("#smslist-main").hide();
            $("#smsChatRoom").show();
        } else {
            $("#smsChatRoom").hide();
            $("#smslist-main").show();
        }
    }

	var sendSmsErrorTimer = null;
	/**
	 * 添加发送错误消息
	 * @method addSendSmsError
	 */
	addSendSmsError = function(msg){
		if(sendSmsErrorTimer){
			window.clearTimeout(sendSmsErrorTimer);
			sendSmsErrorTimer = null;
		}
		$("#sendSmsErrorLi").text($.i18n.prop(msg));
		sendSmsErrorTimer = addTimeout(function(){
			$("#sendSmsErrorLi").text("");
		}, 5000);
	};

	/**
	 * 发送短消息
	 * @event sendSmsClickHandler
	 */
	sendSmsClickHandler = function(){
		if(!hasCapability){
			showAlert("sms_capacity_is_full_for_send");
			return;
		}
		var inputVal = $("#chat-input", "#smsChatRoom");
		var msgContent = inputVal.val();
		if(msgContent == $.i18n.prop("chat_input_placehoder")){
			inputVal.val("");
			msgContent = "";
		}
        var nums = syncSelectAndChosen($("select#chosenUserSelect"), $('.search-choice', '#chosenUserSelect_chosen'));
        if($.isArray(nums)){
            nums = $.grep(nums, function(n, i){
                return !_.isEmpty(n);
            });
        }
		if(!nums || nums.length == 0){
			addSendSmsError("sms_contact_required");
			return;
		}
        if(nums.length + smsCapability.nvUsed > smsCapability.nvTotal){
            showAlert({msg: "sms_capacity_will_full_just", params: [smsCapability.nvTotal - smsCapability.nvUsed]});
            return;
        }
		if(nums.length == 1){
			config.currentChatObject = getLastNumber(nums[0], config.SMS_MATCH_LENGTH);
			showLoading('sending');
		} else if (nums.length > 1) {
			showLoading("sending", "<button id='sms_cancel_sending' onclick='cancelSending()' class='btn btn-primary'>"
				+ $.i18n.prop("sms_stop_sending")
				+ "</button>");
			config.currentChatObject = null;
		}
		var i = 0;
		var leftNum = nums.length;
		couldSend = true;
        disableBtn($("#btn-send", "#inputpanel"));
		sendSms = function(){
			if(!couldSend){
				hideLoading();
				return;
			}
			var newMsg = {
				id: -1,
				number: nums[i],
				content: msgContent,
				isNew: false
			};

			if(leftNum == 1){
				$("#loading #loading_container").html("");
			}

			leftNum--;
			service.sendSMS({
				number : newMsg.number,
				message : newMsg.content,
				id : -1
			}, function(data){
                var latestMsg = getLatestMessage() || {
                    id: parseInt(config.smsMaxId, 10) + 1,
                    time: transUnixTime($.now()),
                    number: newMsg.number
                };
				config.smsMaxId = latestMsg.id;
				newMsg.id = config.smsMaxId;
				newMsg.time = latestMsg.time;
				newMsg.tag = 2;
				newMsg.hasDraft = false;
				if(nums.length > 1){
					newMsg.targetName = getNameOrNumberByNumber(newMsg.number);
				}
                addSendMessage(newMsg, i+1 != nums.length);
				updateDBMsg(newMsg);
				updateMsgList(newMsg);
                tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
				gotoBottom();
				if(i+1 == nums.length){
					updateChatInputWordLength();
                    enableBtn($("#btn-send", "#inputpanel"));
					hideLoading();
					return;
				}
				i++;
				sendSms();
			}, function(error){
                var latestMsg = getLatestMessage() || {
                    id: parseInt(config.smsMaxId, 10) + 1,
                    time: transUnixTime($.now()),
                    number: newMsg.number
                };
				config.smsMaxId = latestMsg.id;
				newMsg.id = config.smsMaxId;
				newMsg.time = latestMsg.time;
				newMsg.errorText = $.i18n.prop(error.errorText);
				newMsg.tag = 3;
				newMsg.target = newMsg.number;
				newMsg.hasDraft = false;
				if(nums.length > 1){
					newMsg.targetName = getNameOrNumberByNumber(newMsg.number);
				}
				addSendMessage(newMsg, i+1 != nums.length);
				updateDBMsg(newMsg);
				updateMsgList(newMsg);
                tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
				gotoBottom();
				if(i+1 == nums.length){
					updateChatInputWordLength();
                    enableBtn($("#btn-send", "#inputpanel"));
					hideLoading();
					return;
				}
				i++;
				sendSms();
			});
		};
		sendSms();
	};

	var couldSend = true;

	/**
	 * 取消剩余短信发送操作
	 * @method cancelSending
	 */
	cancelSending = function(){
		couldSend = false;
		$("#loading #loading_container").html($.i18n.prop('sms_cancel_sending'));
	};

	/**
	 * 获取最新的选消息
	 * @method getLatestMessage
	 * @return {Object} new message
	 */
	getLatestMessage = function(){
		var data = service.getSMSMessages({
			page : 0,
			smsCount : 5,
			nMessageStoreType : 1,
			tags : 10,
			orderBy : "order by id desc"
		});
		if(data.messages.length > 0){
			for(var i = 0; i < data.messages.length; i++){
				if(data.messages[i].tag == '2' || data.messages[i].tag == '3'){
					return data.messages[i];
				}
			}
			return null;
		} else {
			return null;
		}
	};

	/**
	 * 发送短信后，更新短信数据对象
	 * @method updateDBMsg
	 * @param {Object} msg
	 */
	function updateDBMsg(msg){
		if(config.dbMsgs.length == 0){
			config.dbMsgs = [msg];
		} else {
			for(var j = 0; j < config.dbMsgs.length; j++){
				if(config.dbMsgs[j].id == msg.id){
					config.dbMsgs[j] = msg;
					return;
				} else {
					var newMsg = [msg];
					$.merge(newMsg, config.dbMsgs);
					config.dbMsgs = newMsg;
					return;
				}
			}
		}
	}

	/**
	 * 发送短信后，更新短信列表
	 * @method updateMsgList
	 * @param {Object} msg
	 * @param {String} number 号码不为空做删除处理，为空做增加处理
	 */
	function updateMsgList(msg, number, counter){
		if((!msg || !msg.number) && !number){
			return;
		}
		var itemId = '';
		if(msg && typeof msg.groupId != "undefined" && msg.groupId != ''){
			itemId = msg.groupId;
		} else {
			itemId = getLastNumber((number || msg.number), config.SMS_MATCH_LENGTH);
		}
		var item = $("#smslist-item-" + itemId);
		if(item && item.length > 0){
			var totalCountItem = item.find(".smslist-item-total-count");
			var count = totalCountItem.text();
			count = Number(count.substring(1, count.length - 1));
			if(number){
				if(count == 1 || msg == null){
					item.hide().remove();
					return;
				}else{
					totalCountItem.text("(" + (count - (counter || 1)) + ")");
					item.find(".smslist-item-draft-flag").addClass('hide');
				}
			} else {
				totalCountItem.text("(" + (count + 1) + ")");
				if(msg.tag == '4'){
					item.find(".smslist-item-draft-flag").removeClass('hide');
				}
			}
			item.find(".smslist-item-checkbox p.checkbox").attr("id", msg.id);
			item.find(".smslist-item-checkbox input:checkbox").val(msg.id).attr("id", "checkbox" + msg.id);
            var contentHtml = msg.content;
            if(msg.tag == '4'){
                contentHtml = '<span class="smslist-item-draft-flag colorRed" data-trans="draft"></span>: '+ contentHtml;
            }
			var msgContent = item.find(".smslist-item-msg").html(contentHtml);//.addClass("font-weight-bold");
            msgContent.closest('td').prop('title', msg.content);
			item.find(".smslist-item-repeat span").die().click(function() {
				forwardClickHandler(msg.id);
			});
			item.find("span.clock-time").text(msg.time);
			var tmpItem = item;
			item.hide().remove();
			$("#smslist-table").prepend(tmpItem.show());
		} else {
			if(smsTableTmpl == null){
				smsTableTmpl = $.template("smsTableTmpl", $("#smsTableTmpl"));
			}
			msg.checked = false;
			msg.newCount = 0;
			msg.latestId = msg.id;
			msg.latestSms = msg.content;
			msg.latestTime = msg.time;
			if(msg.groupId == '' || typeof msg.groupId == "undefined"){
				msg.totalCount = 1;
			}
			if(!msg.hasDraft){
				msg.hasDraft = false;
			}
			msg.itemId = itemId;
			msg.name = getNameByNumber(msg.number);
			$.tmpl("smsTableTmpl", {data: [msg]}).translate().prependTo("#smslist-table");
		}
		if(config.HAS_PHONEBOOK){
			$(".sms-add-contact-icon").removeClass("hide");
		}else{
			$(".sms-add-contact-icon").addClass("hide");
		}
        $("#smslist-table").translate();
        renderCheckbox();
	}

	/**
	 * 增加发送内容到聊天室
	 * @method addSendMessage
     * @param {Object} sms JSON
     * @param {Boolean} notCleanChatInput 是否清除输入框内容
	 */
	addSendMessage = function(sms, notCleanChatInput){
		if(smsMeTmpl == null){
			smsMeTmpl = $.template("smsMeTmpl", $("#smsMeTmpl"));
		}
		$.tmpl("smsMeTmpl", sms).appendTo("#chatlist");
        $("#chatlist").translate();
        if(!notCleanChatInput){
            cleanChatInput();
        }
		clearMySmsErrorMessage(sms.id);
	};

	/**
	 * 清楚错误消息，避免翻译问题
	 * @method clearMySmsErrorMessage
	 * @param {Integer} id 短信编号
	 */
	clearMySmsErrorMessage = function(id){
		addTimeout(function(){
			$("div.error", "#talk-item-" + id).text("");
		}, 3000);
	};

	/**
	 * 快速添加联系人overlay是否打开
	 * @attribute {Boolean} isPoped
	 */
	var isPoped = false;

	/**
	 * 关闭快速添加联系人overlay
	 * @method hidePopup
	 */
	hidePopup = function(){
		$(".tagPopup").remove();
		isPoped = false;
	};

	/**
	 * 清空聊天室内容
	 * @method clearChatList
	 */
	clearChatList = function(){
		$("#chatlist").empty();
		updateChatInputWordLength();
	};

	/**
	 * 过滤短消息内容
	 * @method dealContent
	 * @param {String} content 短消息内容
	 */
	dealContent = function(content){
		if(config.HAS_PHONEBOOK){
			return HTMLEncode(content).replace(/(\d{3,})/g, function(word){
                var r = (new Date().getTime() + '').substring(6) + (getRandomInt(1000) + 1000);
				return "<a id='aNumber" + r + "' href='javascript:openPhoneBook(\"" + r + "\", \"" + word + "\")'>" + word + "</a>";
			});
		}else{
			return HTMLEncode(content);
		}

	};

	/**
	 * 打开快速添加联系人overlay
	 * @event openPhoneBook
	 * @param {Integer} id 随机ID
	 * @param {Integer} num 快速添加的号码
	 */
	openPhoneBook = function(id, num){
		var target = null;
		var outContainer = "";
		var itemsContainer = null;
		var isChatRoom = false;
		if(!id){
			target = $("#listNumber" + getLastNumber(num, config.SMS_MATCH_LENGTH));
			outContainer = ".smslist-item";
			itemsContainer = $("#addPhonebookContainer");
		} else {
			target = $("#aNumber" + id);
			outContainer = ".msg_container";
			itemsContainer = $("#chatlist");
			isChatRoom = true;
		}
		if(isPoped){
			hidePopup();
		}
		isPoped = true;
		$("#tagPopup").remove();

		if(addPhonebookTmpl == null){
			addPhonebookTmpl = $.template("addPhonebookTmpl", $("#addPhonebookTmpl"));
		}
		$.tmpl("addPhonebookTmpl", {number: num}).appendTo(itemsContainer);
		var p = target.position();
		var msgContainer = target.closest(outContainer);
		var msgP = msgContainer.position();
		var _left = 0,
			_top = 0;
		if(isChatRoom){
			var containerWidth = itemsContainer.width();
			var containerHeight = itemsContainer.height();
			var pop = $("#innerTagPopup");
			_left = msgP.left + p.left;
			_top = msgP.top + p.top + 20;
			if(pop.width() + _left > containerWidth){
				_left = containerWidth - pop.width() - 20;
			}
			if(containerHeight > 100 && pop.height() + _top > containerHeight){
				_top = containerHeight - pop.height() - 5;
			}
		} else {
			_left = p.left;
			_top = p.top;
		}
		$("#innerTagPopup").css({top: _top + "px", left: _left + "px"});
		$('#quickSaveContactForm').translate().validate({
			submitHandler:function () {
				quickSaveContact(isChatRoom);
			},
			rules:{
				name:"name_check",
				number:"phonenumber_check"
			}
		});
	};

	/**
	 * 快速添加联系人
	 * @event quickSaveContact
	 */
	quickSaveContact = function(){
		var name = $(".tagPopup #innerTagPopup #name").val();
		var number = $(".tagPopup #innerTagPopup #number").val();
		var newContact = {
			index : -1,
			location : 1,
			name : name,
			mobile_phone_number : number,
			home_phone_number : "",
			office_phone_number : "",
			mail : ""
		};
		var device = service.getDevicePhoneBookCapacity();
		if(device.pcPbmUsedCapacity >= device.pcPbmTotalCapacity){
			showAlert("device_full");
			return false;
		}
		showLoading('waiting');
		service.savePhoneBook(newContact, function(data){
			if(data.result == "success"){
				config.phonebook.push({pbm_name: name, pbm_number: number});
			    updateItemShowName(name, number);
			    hidePopup();
			    successOverlay();
			}else{
				errorOverlay();
			}			
		}, function(data){
			errorOverlay();
		});
	};

	function updateItemShowName(name, number){
		var lastNum = getLastNumber(number, config.SMS_MATCH_LENGTH);
		$("span.smslist-item-name2", "#smslist-item-" + lastNum).text(name);
		$("#listNumber" + lastNum).hide();
	}

	/**
	 * 聊天室删除单条消息
	 * @event deleteSingleItemClickHandler
	 */
	deleteSingleItemClickHandler = function(id, resendCallback){
		if(resendCallback){
			deleteTheSingleItem(id);
		} else {
			showConfirm("confirm_sms_delete", function(){
                showLoading('deleting');
				deleteTheSingleItem(id);
			});
		}

		function deleteTheSingleItem(id){
			service.deleteMessage({
				ids: [id]
			}, function(data){
				var target = $(".smslist-item-delete", "#talk-item-" + id).attr("target");
				$("#talk-item-" + id).hide().remove();

				synchSmsList(null, [id]);
				updateMsgList(getPeopleLatestMsg(target), target);
				if(resendCallback){
					resendCallback();
				} else {
					hideLoading();
				}
                tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
			}, function(error){
				if(resendCallback){
					resendCallback();
				} else {
					hideLoading();
				}
			});
		}
	};

	/**
	 * 删除草稿
	 * @method deleteDraftSms
	 * @param ids
	 * @param numbers
	 */
	function deleteDraftSms(ids, numbers){
        stopNavigation();
		service.deleteMessage({
			ids: ids
		}, function(data){
            updateSmsCapabilityStatus(null, function(){
                draftListener();
                restoreNavigation();
            });
			for(var i = 0; i < numbers.length; i++){
				updateMsgList(getPeopleLatestMsg(numbers[i]), numbers[i], ids.length);
			}
            synchSmsList(null, ids);
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
		}, function(error){
            restoreNavigation();
			// Do nothing
		});
	}

	/**
	 * 删除群聊草稿草稿
	 * @method deleteMultiDraftSms
	 * @param ids
	 */
	function deleteMultiDraftSms(ids, groupId){
		service.deleteMessage({
			ids: ids
		}, function(data){
			synchSmsList(null, ids);
			$("#smslist-item-" + groupId).hide().remove();
            checkSmsCapacityAndAlert();
            tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
		}, function(error){
			// Do nothing
		});
	}

	getCurrentChatObject = function(){
		var nums = $("select.chosen-select-deselect").val();
		if(!nums){
			config.currentChatObject = null;
		} else if(nums.length == 1){
			config.currentChatObject = getLastNumber(nums, config.SMS_MATCH_LENGTH);
		} else if (nums.length > 1) {
			config.currentChatObject = null;
		}
		return config.currentChatObject;
	};

	/**
	 * 获取当前聊天对象最新的短消息
	 * @method getPeopleLatestMsg
	 */
	getPeopleLatestMsg = function(number){
		for(var j = 0; j < config.dbMsgs.length; j++){
			if(!config.dbMsgs[j].groupId && getLastNumber(config.dbMsgs[j].number, config.SMS_MATCH_LENGTH) == getLastNumber(number, config.SMS_MATCH_LENGTH)){
				return config.dbMsgs[j];
			}
		}
		return null;
	};

	/**
	 * 重新发送，复制消息到发送框
	 * @event resendClickHandler
	 */
	resendClickHandler = function(id){
		if(!hasCapability){
			showAlert("sms_capacity_is_full_for_send");
			return;
		}
        showLoading('sending');
		$("div.error", "#talk-item-" + id).text($.i18n.prop("sms_resending"));
		var targetNumber = $("div.smslist-item-resend", "#talk-item-" + id).attr("target");
		var content = $("div.J_content", "#talk-item-" + id).text();
		for(var j = 0; j < config.dbMsgs.length; j++){
			if(config.dbMsgs[j].id == id){
				content = config.dbMsgs[j].content;
			}
		}

        disableBtn($("#btn-send", "#inputpanel"));
		var newMsg = {
			id: -1,
			number: targetNumber,
			content: content,
			isNew: false
		};
		service.sendSMS({
			number : newMsg.number,
			message : newMsg.content,
			id : -1
		}, function(data){
            var latestMsg = getLatestMessage() || {
                id: parseInt(config.smsMaxId, 10) + 1,
                time: transUnixTime($.now()),
                number: newMsg.number
            };
			config.smsMaxId = latestMsg.id;
			newMsg.id = config.smsMaxId;
			newMsg.time = latestMsg.time;
			newMsg.tag = 2;
			newMsg.target = latestMsg.number;
			newMsg.targetName = getNameOrNumberByNumber(targetNumber);
			updateDBMsg(newMsg);
			updateMsgList(newMsg);
			deleteSingleItemClickHandler(id, function(){
				addSendMessage(newMsg, true);
                updateChatInputWordLength();
                enableBtn($("#btn-send", "#inputpanel"));
				hideLoading();
				gotoBottom();
			});
		}, function(error){
            var latestMsg = getLatestMessage() || {
                id: parseInt(config.smsMaxId, 10) + 1,
                time: transUnixTime($.now()),
                number: newMsg.number
            };
			config.smsMaxId = latestMsg.id;
			newMsg.id = config.smsMaxId;
			newMsg.time = latestMsg.time;
			newMsg.errorText = $.i18n.prop("sms_resend_fail");
			newMsg.tag = 3;
			newMsg.target = latestMsg.number;
			newMsg.targetName = getNameOrNumberByNumber(targetNumber);
			updateDBMsg(newMsg);
			updateMsgList(newMsg);
			deleteSingleItemClickHandler(id, function(){
				addSendMessage(newMsg, true);
                updateChatInputWordLength();
                enableBtn($("#btn-send", "#inputpanel"));
				hideLoading();
				gotoBottom();
			});
		});
	};

	/**
	 * 滚动到底部
	 * @method gotoBottom
	 */
	gotoBottom = function(){
		$("#chatpanel .clear-container").animate({scrollTop: $("#chatlist").height()});
	};

	/**
	 * 最后一条短消息距离顶部的距离
	 * @attribute lastItemOffsetTop
	 */
	var lastItemOffsetTop = 0;
	/**
	 * 页面是否处于滚动中
	 * @attribute scrolling
	 */
	var scrolling = false;
	/**
	 * 初始化页面状态信息
	 * @method initStatus
	 */
	function initStatus(){
		currentPage = 1;
		config.dbMsgs = [];
		config.listMsgs = null;
		config.smsMaxId = 0;
		config.phonebook = [];
		ready = false;
		shownMsgs = [];
		scrolling = false;
		lastItemOffsetTop = 0;
		groupDrafts = groupDraftItems = [];
		groupedDraftsObject = {};
	}

	function getReadyStatus() {
		showLoading('waiting');
        config.currentChatObject = null;
		var getSMSReady = function () {
			service.getSMSReady({}, function (data) {
				if (data.sms_cmd_status_result == "2") {
                    $("input:button", "#smsListForm .smslist-btns").attr("disabled", "disabled");
					hideLoading();
					showAlert("sms_init_fail");
				} else if (data.sms_cmd_status_result == "1") {
					addTimeout(getSMSReady, 1000);
				} else {
					if(config.HAS_PHONEBOOK){
						getPhoneBookReady();
					}else{
						initSMSList(false);
					}
				}
			});
		};

		var getPhoneBookReady = function () {
			service.getPhoneBookReady({}, function (data) {
				if (data.pbm_init_flag == "6") {
					initSMSList(false);
				} else if (data.pbm_init_flag != "0") {
					addTimeout(getPhoneBookReady, 1000);
				}
				else {
					initSMSList(true);
				}
			});
		};

		var initSMSList = function (isPbmInitOK) {
			initStatus();
			if (isPbmInitOK) {
				getSMSMessages(function(){
					getPhoneBooks();
					hideLoading();
				});
			} else {
				getSMSMessages(function () {
					config.phonebook = [];
					if(!config.HAS_PHONEBOOK){
						dealPhoneBooks();
					}
					hideLoading();
				});
			}
			bindingEvents();
			fixScrollTop();
			window.scrollTo(0, 0);
			initSmsCapability();
		};

		getSMSReady();
	}

	/**
	 * 初始化短信容量状态
	 * @method initSmsCapability
	 */
	function initSmsCapability(){
		var capabilityContainer = $("#smsCapability");
		updateSmsCapabilityStatus(capabilityContainer);
		checkSimStatusForSend();
		addInterval(function(){
			updateSmsCapabilityStatus(capabilityContainer);
			checkSimStatusForSend();
		}, 5000);
	}

	/**
	 * SIM卡未准备好时，禁用发送按钮
	 * @method checkSimStatusForSend
	 */
	function checkSimStatusForSend(){
		var data = service.getStatusInfo();
		if(data.simStatus != 'modem_init_complete'){
			disableBtn($("#btn-send"));
			$("#sendSmsErrorLi").html('<span data-trans="no_sim_card_message">' + $.i18n.prop('no_sim_card_message') + '</span>');
			$("#chatpanel .smslist-item-resend:visible").hide();
		}else{
			enableBtn($("#btn-send"));
			$("#chatpanel .smslist-item-resend:hidden").show();
		}
	}

	/**
	 * 更新短信容量状态
	 * @method updateSmsCapabilityStatus
	 * @param capabilityContainer {Object} 放置容量信息的容器
	 */
	function updateSmsCapabilityStatus(capabilityContainer, callback){
		service.getSmsCapability({}, function(capability){
            if(capabilityContainer != null){
                capabilityContainer.text("(" + (capability.nvUsed > capability.nvTotal ? capability.nvTotal : capability.nvUsed) + "/" + capability.nvTotal + ")");
            }
			hasCapability = capability.nvUsed < capability.nvTotal;
            smsCapability = capability;
            if($.isFunction(callback)){
                callback();
            }
		});
	}

	/**
	 * 初始化页面及VM
	 * @method init
	 */
	function init() {
	    if( this.init ){
            getRightNav( SMS_COMMON_URL );
        }

        getReadyStatus();
	}

	/**
	 * 事件绑定
	 * @method bindingEvents
	 */
	bindingEvents = function(){
		var $win = $(window);
		var $smsListBtns = $("#smslist-main .smslist-btns");
		var offsetTop = $("#mainContainer").offset().top;
		$win.unbind("scroll").scroll(function() {
			if($win.scrollTop() > offsetTop){
				$smsListBtns.addClass("smsListFloatButs marginnone");
			} else {
				$smsListBtns.removeClass("smsListFloatButs marginnone");
			}
			//loadData(); //由于目前数据显示是全显示，不做动态加载，因此暂时注释掉
		});

		$("#smslist-table p.checkbox").die().live("click", function(){
			checkboxClickHandler($(this).attr("id"));
		});

		$("#smslist-checkAll", "#smsListForm").die().live("click", function(){
			checkDeleteBtnStatus();
		});

		$("#chat-input", "#smsChatRoom").die().live("drop", function(){
            $("#inputpanel .chatform").addClass("chatformfocus");
            var $this = $(this);
            $this.removeAttr("data-trans");
            if($this.val() == $.i18n.prop("chat_input_placehoder")){
                $this.val("");
            }
            updateChatInputWordLength();
        }).live("focusin", function(){
                $("#inputpanel .chatform").addClass("chatformfocus");
                var $this = $(this);
                $this.removeAttr("data-trans");
                if($this.val() == $.i18n.prop("chat_input_placehoder")){
                    $this.val("");
                }
                updateChatInputWordLength();
            }).live("focusout", function(){
				$("#inputpanel .chatform").removeClass("chatformfocus");
				var $this = $(this);
				if($this.val() == "" || $this.val() == $.i18n.prop("chat_input_placehoder")){
					$this.val($.i18n.prop("chat_input_placehoder")).attr("data-trans", "chat_input_placehoder");
				}
				updateChatInputWordLength();
			}).live("keyup", function(){
                updateChatInputWordLength();
            }).live("paste", function(){
                window.setTimeout(function () {
                    updateChatInputWordLength();
                }, 0);
            }).live("cut", function(){
                window.setTimeout(function () {
                    updateChatInputWordLength();
                }, 0);
            }).live("drop", function(){
                window.setTimeout(function () {
                    updateChatInputWordLength();
                }, 0);
            }).live("contextmenu", function () {
                return false;
            });		
					
            $("#name").die().live("drop", function(){
                updateNameInputWordLength();
            }).live("focusin", function(){               
                updateNameInputWordLength();
            }).live("focusout", function(){				
                updateNameInputWordLength();
            }).live("keyup", function(){
                updateNameInputWordLength();
            }).live("paste", function(){
                updateNameInputWordLength();
            }).live("cut", function(){
                updateNameInputWordLength();               
            }).live("dragend", function(){
                updateNameInputWordLength();                
            }).live("contextmenu", function () {
                return false;
            });

		$("select.chosen-select-deselect", "#smsChatRoom").die().live('change', function(){
			draftListener();
		});
		$("#searchInput").die().live('blur', function(){
			searchTextBlur();
		}).live('keyup', function(){
			updateSearchValue($("#searchInput").val());
		});
	};
	
	/**
	 * 更新剩余字数
	 * @method updateNameInputWordLength
	 */
	updateNameInputWordLength = function(){
 
		var msgInput = $("#name", "#quickSaveContactForm");
		var msgInputDom = msgInput[0];
		var strValue = msgInput.val();
		var encodeType = getEncodeType(strValue);
		var maxLength = encodeType.encodeType == 'UNICODE' ? 11 : 22;
				
		while (strValue.length + encodeType.extendLen > maxLength) {			
			strValue = strValue.substring(0, strValue.length - 1);
			msgInputDom.value = strValue;
			encodeType = getEncodeType(strValue);
			maxLength = encodeType.encodeType == 'UNICODE' ? 11 : 22;
		}        
	};

	/**
	 * 获取聊天对象的名字和号码
	 * @method getShowNameByNumber
	 * @param {String} num 电话号码
	 */
	getShowNameByNumber = function(num){
		for(var i = config.phonebook.length ; i > 0 ; i--){
			if(getLastNumber(config.phonebook[i-1].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(num, config.SMS_MATCH_LENGTH)){
				return config.phonebook[i-1].pbm_name/* + "/" + num*/;
			}
		}
		return num;
	};

	/**
	 * 获取聊天对象的名字
	 * @method getNameByNumber
	 * @param {String} num 电话号码
	 */
	getNameByNumber = function(num){
		for(var i = config.phonebook.length ; i > 0 ; i--){
			if(getLastNumber(config.phonebook[i-1].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(num, config.SMS_MATCH_LENGTH)){
				return config.phonebook[i-1].pbm_name;
			}
		}
		return "";
	};

	/**
	 * 获取聊天对象的名字,如果没有名字，则显示号码
	 * @method getNameOrNumberByNumber
	 * @param {String} num 电话号码
	 */
	getNameOrNumberByNumber = function(num){
        for(var i = config.phonebook.length ; i > 0; i--){
            if(config.phonebook[i-1].pbm_number == num){
                return config.phonebook[i-1].pbm_name;
            }
        }
        for(var i = config.phonebook.length ; i > 0; i--){
            if(getLastNumber(config.phonebook[i-1].pbm_number, config.SMS_MATCH_LENGTH) == getLastNumber(num, config.SMS_MATCH_LENGTH)){
                return config.phonebook[i-1].pbm_name;
            }
        }
		return num;
	};

	/**
	 * 点击短信列表条目，进入聊天室页面
	 * @event smsItemClickHandler
	 * @param {Integer} num 电话号码
	 */
	smsItemClickHandler = function(num){
        if(chatRoomInLoading){
            return false;
        }
        chatRoomInLoading = true;
		if(smsOtherTmpl == null){
			smsOtherTmpl = $.template("smsOtherTmpl", $("#smsOtherTmpl"));
		}
		if(smsMeTmpl == null){
			smsMeTmpl = $.template("smsMeTmpl", $("#smsMeTmpl"));
		}

		var name = getShowNameByNumber(num);
        $("#chosenUser", "#smsChatRoom").hide();
        $("#chosenUser1", "#smsChatRoom").addClass("hide");

		config.currentChatObject = getLastNumber(num, config.SMS_MATCH_LENGTH);
		setAsRead(num);
		cleanChatInput();
		clearChatList();
        var userSelect = $("select.chosen-select-deselect", "#smsChatRoom");
		var ops = $("option", userSelect);
        var numberExist = false;
		for(var i = 0 ; i < ops.length; i++){
			var n = ops[i];
            if(getLastNumber(n.value, config.SMS_MATCH_LENGTH) == config.currentChatObject){
				num = n.value;
                numberExist = true;
				break;
			}
		}
        if(!numberExist){
            userSelect.append("<option value='" + num + "' selected='selected'>" + num + "</option>");
        }
		$("select.chosen-select-deselect").val(num).trigger("chosen:updated.chosen");
        switchPage('chat');
				config.dbMsgs = _.sortBy(config.dbMsgs, function(e){
					return 0 - e.id;
				});
				var draftIds = [];
                var dbMsgsTmp = [];
                var dbMsgsTmpIds = [];
                var chatHasDraft = false;
				for(var i = config.dbMsgs.length - 1; i >= 0; i--){
                    var e = config.dbMsgs[i];
                    if(_.indexOf(dbMsgsTmpIds, e.id) != -1){
                        continue;
                    }
					if(getLastNumber(e.number, config.SMS_MATCH_LENGTH) == config.currentChatObject && _.isEmpty(e.groupId)){
						e.isNew = false;
						e.errorText = '';
						e.targetName = '';
						if(e.tag == "0" || e.tag == "1"){
							$.tmpl("smsOtherTmpl", e).appendTo("#chatlist");
                            dbMsgsTmpIds.push(e.id);
                            dbMsgsTmp.push(e);
						}else if(e.tag == "2" || e.tag == "3"){
							$.tmpl("smsMeTmpl", e).appendTo("#chatlist");
                            dbMsgsTmpIds.push(e.id);
                            dbMsgsTmp.push(e);
						}else if(e.tag == "4"){
							draftIds.push(e.id);
							$("#chat-input", "#smsChatRoom").val(e.content).removeAttr('data-trans');
                            updateChatInputWordLength();
                            chatHasDraft = true;
						}
					} else {
                        dbMsgsTmpIds.push(e.id);
                        dbMsgsTmp.push(e);
                    }
				}
                $("#chatlist").translate();
                if(chatHasDraft){
                    $("#chosenUser", "#smsChatRoom").show();
                    $("#chosenUser1", "#smsChatRoom").addClass("hide");
                } else {
                    $("#chosenUser", "#smsChatRoom").hide();
                    $("#chosenUser1", "#smsChatRoom").removeClass("hide").html(name);
                }
                config.dbMsgs = dbMsgsTmp.reverse();
				if(draftIds.length > 0){
					deleteDraftSms(draftIds, [num]);
				} else {
                    checkSmsCapacityAndAlert();
                }

				checkSimStatusForSend();
				gotoBottom();
                chatRoomInLoading = false;
	};

    function checkSmsCapacityAndAlert(){
        var capabilityContainer = $("#smsCapability");
        updateSmsCapabilityStatus(capabilityContainer);
        addTimeout(function(){
            if(!hasCapability){
                showAlert("sms_capacity_is_full_for_send");
            }
        }, 2000);
    }

	cleanChatInput = function(){
		$("#chat-input", "#smsChatRoom").val($.i18n.prop("chat_input_placehoder")).attr("data-trans", "chat_input_placehoder");
	};

	/**
	 * 设置为已读
	 * @event setAsRead
	 * @param {Integer} num 电话号码
	 */
	setAsRead = function(num){
		var ids = [];
		$.each(config.dbMsgs, function(i, e) {
			if (getLastNumber(e.number, config.SMS_MATCH_LENGTH) == getLastNumber(num, config.SMS_MATCH_LENGTH) && e.isNew) {
				ids.push(e.id);
				e.isNew = false;
			}
		});
		if(ids.length > 0){
			service.setSmsRead({ids: ids}, function(data){
				if(data.result){
					$("#smslist-item-" + getLastNumber(num, config.SMS_MATCH_LENGTH) +" .smslist-item-new-count").text("").addClass("hide");
					$("#smslist-item-" + getLastNumber(num, config.SMS_MATCH_LENGTH)).removeClass("font-weight-bold");
					$("#smslist-item-" + getLastNumber(num, config.SMS_MATCH_LENGTH) +" td:nth-child(2)").removeClass("font-weight-bold");
				}
				$.each(config.listMsgs, function(i, e) {
					if (e.number == num && e.newCount > 0) {
						e.newCount = 0;
					}
				});
			});
		}
	};

	/**
	 * 转发按钮点击事件
	 * @event forwardClickHandler
	 * @param {String} id SMS短信ID
	 */
	forwardClickHandler = function(id){
        var selectedContact = syncSelectAndChosen($("select#chosenUserSelect"), $('.search-choice', '#chosenUserSelect_chosen'));
        var content = $("#chat-input", "#smsChatRoom").val();
        var hasContent = typeof content != "undefined" && content != '' && content != $.i18n.prop('chat_input_placehoder');
        if(hasContent){
            saveDraftAction({
                content : content,
                numbers :  selectedContact,
                isFromBack : true,
                noLoading :true
            });
        }		
		
        clearChatList();
        config.currentChatObject = null;

        $("#chosenUser1", "#smsChatRoom").addClass("hide");
        $("#chosenUser", "#smsChatRoom").show();
        for(var j = 0; j < config.dbMsgs.length; j++){
            if(config.dbMsgs[j].id == id){
                var theChatInput = $("#chat-input", "#smsChatRoom");
                theChatInput.val(config.dbMsgs[j].content);
                setInsertPos(theChatInput[0], config.dbMsgs[j].content.length);
            }
        }
        updateChatInputWordLength();
        $("select.chosen-select-deselect").val("").trigger("chosen:updated.chosen");
        addTimeout(function(){
            $("#chosen-search-field-input").focus();
        }, 300);
        switchPage('chat');
        gotoBottom();
	};

	/**
	 * 更新剩余字数
	 * @method updateChatInputWordLength
	 */
	updateChatInputWordLength = function(){
        var msgInput = $("#chat-input", "#smsChatRoom");
        var msgInputDom = msgInput[0];
        var strValue = msgInput.val();
        var encodeType = getEncodeType(strValue);
       	var maxLength = encodeType.encodeType == 'UNICODE' ? 670 : 1530;
        if (strValue.length + encodeType.extendLen > maxLength) {
            var scrollTop = msgInputDom.scrollTop;
            var insertPos = getInsertPos(msgInputDom);
            var moreLen = strValue.length + encodeType.extendLen - maxLength;
            var insertPart = strValue.substr(insertPos - moreLen > 0 ? insertPos - moreLen : 0, moreLen);
            var reversed = insertPart.split('').reverse();
            var checkMore = 0;
            var cutNum = 0;
            for (var i = 0; i < reversed.length; i++) {
                if (getEncodeType(reversed[i]).extendLen > 0) {
                    checkMore += 2;
                } else {
                    checkMore++;
                }
                if (checkMore >= moreLen) {
                    cutNum = i + 1;
                    break;
                }
            }
            var iInsertToStartLength = insertPos - cutNum;
            msgInputDom.value = strValue.substr(0, iInsertToStartLength) + strValue.substr(insertPos);
            if(msgInputDom.value.length > maxLength){
                msgInputDom.value = msgInputDom.value.substr(0, maxLength);
            }
            setInsertPos(msgInputDom, iInsertToStartLength);
            msgInputDom.scrollTop = scrollTop;
        }
        var textLength = 0;
        var newValue = $(msgInputDom).val();
        var newEncodeType = {encodeType: 'GSM7_default', extendLen: 0};
        if(newValue != $.i18n.prop('chat_input_placehoder')){
            newEncodeType = getEncodeType(newValue);
        }
        var newMaxLength;
         if(login_Italia_show == "2"){
        		 newMaxLength = newEncodeType.encodeType == 'UNICODE' ? 670 : 160;
        	}else{
        		 newMaxLength = newEncodeType.encodeType == 'UNICODE' ? 670 : 1530;
        	}
        var $inputCount = $("#inputcount", "#inputpanel");
        var $inputItemCount = $("#inputItemCount", "#inputpanel");
        if (newValue.length + newEncodeType.extendLen >= newMaxLength) {
            $inputCount.addClass("colorRed");
            $inputItemCount.addClass("colorRed");
        } else {
            $("#inputcount", "#inputpanel").removeClass("colorRed");
            $("#inputItemCount", "#inputpanel").removeClass("colorRed");
        }
        if("" != newValue && $.i18n.prop('chat_input_placehoder') != newValue){
            textLength = newValue.length + newEncodeType.extendLen;
        }
        $inputCount.html("(" + textLength + "/" + newMaxLength + ")");
        $inputItemCount.html("(" + getSmsCount(newValue) + "/10)");
        draftListener();
	};

	/**
	 * 文档内容监听，判断是否修改过
     * @method draftListener
	 */
	function draftListener(){
		var content = $("#chat-input", "#smsChatRoom").val();
		if(hasCapability){
            var selectedContact = getSelectValFromChosen($('.search-choice', '#chosenUserSelect_chosen'));
			var noContactSelected = !selectedContact || selectedContact.length == 0;
			var hasContent = typeof content != "undefined" && content != '' && content != $.i18n.prop('chat_input_placehoder');

			if(!hasContent){
				config.resetContentModifyValue();
				return;
			}
			if(hasContent && !noContactSelected){
				config.CONTENT_MODIFIED.modified = true;
				config.CONTENT_MODIFIED.message = 'sms_to_save_draft';
				config.CONTENT_MODIFIED.callback.ok = saveDraftAction;
				config.CONTENT_MODIFIED.callback.no = $.noop;
				config.CONTENT_MODIFIED.data = {
					content : $("#chat-input", "#smsChatRoom").val(),
					numbers :  selectedContact
				};
				return;
			}
			if(hasContent && noContactSelected){
				config.CONTENT_MODIFIED.modified = true;
				config.CONTENT_MODIFIED.message = 'sms_no_recipient';
				config.CONTENT_MODIFIED.callback.ok = $.noop;
				config.CONTENT_MODIFIED.callback.no = function(){
					// 返回true，页面保持原状
					return true;
				};//$.noop;
				return;
			}
		} else {
			config.resetContentModifyValue();
		}
	}

	/**
	 * 保存草稿回调动作
	 * @method saveDraftAction
	 * @param data
	 */
	function saveDraftAction(data){
		var datetime = new Date();
		var params = {
			index: -1,
			currentTimeString: getCurrentTimeString(datetime),
			groupId: data.numbers.length > 1 ? datetime.getTime() : '',
			message: data.content,
			numbers: data.numbers
		};
		!data.noLoading && showLoading('waiting');
		service.saveSMS(params, function(){
			if(data.isFromBack){
				getLatestDraftSms(data.numbers);
				!data.noLoading && successOverlay('sms_save_draft_success');
			} else {
				!data.noLoading && successOverlay('sms_save_draft_success');
			}
		}, function(){
			!data.noLoading && errorOverlay("sms_save_draft_failed")
		});

		/**
		 * 获取最新的草稿信息
		 * @method getLatestDraftSms
		 */
		function getLatestDraftSms(numbers){
			service.getSMSMessages({
				page : 0,
				smsCount : 5,
				nMessageStoreType : 1,
				tags : 4,
				orderBy : "order by id desc"
			}, function(data) {
				if(data.messages && data.messages.length > 0){
					var theGroupId = '',
						draftShowName = '',
						draftShowNameTitle = '',
						i = 0,
						drafts = [];
					for(; i < data.messages.length; i++){
						var msg = data.messages[i];
                        for (var k = 0; k < numbers.length; k++) {
                            var num = numbers[k];
                            if(getLastNumber(num, config.SMS_MATCH_LENGTH) == getLastNumber(msg.number, config.SMS_MATCH_LENGTH)){//if (num.indexOf(msg.number) == 0) {
                                msg.number = num;
                            }
                        }
						if(theGroupId != '' && theGroupId != msg.groupId){
							break;
						}
						updateDBMsg(msg);
						if(msg.groupId == ''){ // 单条草稿
							break;
						} else { // 多条草稿
							theGroupId = msg.groupId;
							var showName = getShowNameByNumber(msg.number);
							draftShowName += (i == 0 ? '' : ';') + showName;
							draftShowNameTitle += (i == 0 ? '' : ';') + showName;
						}
						drafts.push(msg);
					}
					if(theGroupId == ''){ // 单条草稿
						var msg = data.messages[0];
						msg.hasDraft = true;
						updateMsgList(msg);
					} else { // 多条草稿
						var msg = data.messages[0];
                        var len = 10;
                        if(getEncodeType(draftShowName).encodeType == "UNICODE"){
                            len = 10;
                        }
						msg.draftShowNameTitle = draftShowNameTitle;
                        msg.draftShowName = draftShowName.length > len ? draftShowName.substring(0, len) + "..." : draftShowName;
						msg.hasDraft = true;
						msg.totalCount = i;
						groupedDraftsObject[theGroupId] = drafts;
						updateMsgList(msg);
					}
                    tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
				}
			}, function() {
				// do nothing
			});
		}
	}

	/**
	 * 点击群聊草稿进入草稿发送页面
	 * 在进入的过程中会先删掉草稿
	 * @method draftSmsItemClickHandler
	 * @param groupId
	 */
	draftSmsItemClickHandler = function(groupId){
        if(chatRoomInLoading){
            return false;
        }
        chatRoomInLoading = true;
		var msgs = groupedDraftsObject[groupId];
		var numbers = [];
		var ids = [];
		for(var i = 0; msgs && i < msgs.length; i++){
			numbers.push(getLastNumber(msgs[i].number, config.SMS_MATCH_LENGTH));
			ids.push(msgs[i].id + '');
		}
		$("#chosenUser", "#smsChatRoom").show();
		$("#chosenUser1", "#smsChatRoom").addClass("hide").html('');
		$("select.chosen-select-deselect").val(numbers).trigger("chosen:updated.chosen");
		$("#chat-input", "#smsChatRoom").val(msgs[0].content);
        updateChatInputWordLength();
        clearChatList();
        switchPage('chat');
		draftListener();
		gotoBottom();
        chatRoomInLoading = false;
		deleteMultiDraftSms(ids, groupId);
	};

	/**
	 * 按列表条目删除短消息
	 * @event deletePhoneMessageClickHandler
	 */
	deletePhoneMessageClickHandler = function(num){
		showConfirm("confirm_sms_delete", function() {
            showLoading('deleting');
			var ids = [];
			$.each(config.dbMsgs, function(i, e){
				if(e.number == num){
					ids.push(e.id);
				}
			});
			service.deleteMessage({
				ids: ids
			}, function(data){
				$("#smslist-item-" + getLastNumber(num, config.SMS_MATCH_LENGTH)).hide().remove();
				synchSmsList([num], ids);
				successOverlay();
                tryToDisableCheckAll($("#smslist-checkAll", "#smsListForm"), $(".smslist-item", "#smslist-table").length);
			}, function(error){
				errorOverlay(error.errorText);
			});
		});
	};

	/**
	 * 同步短信列表数据
	 * @method synchSmsList
	 * @param {Array} nums
	 * @param {Array} ids
	 */
	synchSmsList = function(nums, ids){
		if(nums && nums.length > 0){
			config.listMsgs = $.grep(config.listMsgs, function(n, i){
				return $.inArray(n.number, nums) == -1;
			});
		}
		if(ids && ids.length > 0){
			var dbMsgsTmp = [];
			$.each(config.dbMsgs, function(i, e){
				if($.inArray(e.id, ids) == -1){
					dbMsgsTmp.push(e);
				}
			});
			config.dbMsgs = dbMsgsTmp;
		}
	};

	/**
	 * 确定最后一条短消息距离顶部的距离
	 * @method fixScrollTop
	 */
	function fixScrollTop() {
		var items = $(".smslist-item");
		var lastOne;
		if (items.length > 0) {
			lastOne = items[items.length - 1];
		} else {
			lastOne = items[0];
		}
		lastItemOffsetTop = lastOne ? lastOne.offsetTop : 600;
	}

	/**
	 * 加载数据
	 * @method loadData
	 */
	function loadData() {
		if (ready && !scrolling && lastItemOffsetTop < ($(window).scrollTop() + $(window).height())
			&& $(".smslist-item").length != config.listMsgs.length) {
			scrolling = true;
			addTimeout(function() {
				removeChecked("smslist-checkAll");
				changeShownMsgs();
				fixScrollTop();
				scrolling = false;
			}, 100);
		}
	}

    function stopNavigation() {
        disableBtn($('#btn-back'));
        $('a', '#left').bind("click", function () {
            return false;
        });
        $('a', '#list-nav').bind("click", function () {
            return false;
        });
    }

    function restoreNavigation() {
        enableBtn($('#btn-back'));
        $('a', '#left').unbind("click");
        $('a', '#list-nav').unbind("click");
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
	}
	
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
});
