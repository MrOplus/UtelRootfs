/**
 * phoneBoook 模块
 * @module phoneBoook
 * @class phoneBoook
 */

define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore', 'lib/jquery/chosen.jquery'],

    function ($, ko, config, service, _, chosen) {

        var locationValue = {SIM:"0", DEVICE:"1"};
        var pageState = {LIST:0, NEW:1, EDIT:2, VIEW:3, SEND_MSM:4};
        var tz_real_version= service.getRealDeviceVersion().tz_real_version.split("_")[0].toLowerCase();
        /**
         * 存储位置选项
         * @object saveLocationOpts
         */
        var saveLocationOpts = function (hasSIMCard) {
            var opts = [];  
            if(tz_real_version == "m60a"){
                opts.push(new Option($.i18n.prop("device_book"), locationValue.DEVICE));
            }else{
                opts.push(new Option($.i18n.prop("device_book"), locationValue.DEVICE));
            if (hasSIMCard) {
                opts.push(new Option($.i18n.prop("sim_book"), locationValue.SIM));
                }
            }      
            return opts;
        };

        function getCurrentGroup() {
            return $("#selectedFilterGroup").val();
        }
        /**
         * 列表模板对应的Columns
         * @object templateColumns
         */
        var templateColumns = {
            cardColumns:[
                { rowText:"index", display:false},
                { rowText:"name"},
                { rowText:"mobile_phone_number"},
                { rowText:"home_phone_number"}
            ],
            listColumns:[
                { columnType:"checkbox", headerTextTrans:"number", rowText:"index", width:"10%" },
                { headerTextTrans:"name", rowText:"name", width:"25%", sortable:true },
                { columnType:"image", headerTextTrans:"save_location", rowText:"imgLocation", width:"20%", sortable:true},
                { headerTextTrans:"mobile_phone_number", rowText:"mobile_phone_number", width:"30%", sortable:true },
                { headerTextTrans:"group", rowText:"transGroup", width:"15%", sortable:true, needTrans:true}
            ]
        };
        /**
         * 分组选项
         * @object saveLocationOpts
         */
        var groupOpts = function () {
            var opts = [];
            opts.push(new Option($.i18n.prop("common"), "common"));
            opts.push(new Option($.i18n.prop("family"), "family"));
            opts.push(new Option($.i18n.prop("friend"), "friend"));
            opts.push(new Option($.i18n.prop("colleague"), "colleague"));
            return opts;
        };

        var _phoneBookStopSMSSending = false;

        /**
         * phoneBookViewModel
         * @class phoneBookVM
         */
        function phoneBookVM() {
            var self = this;

            self.CSRFToken = service.getToken().token;

            //property for common
            self.pageState = ko.observable(pageState.LIST);
            self.initFail = ko.observable(true);
            self.hasSms = ko.observable(config.HAS_SMS);

            var smsHasCapability = true;
            var smsLeftCount = 0;

            //property for list
            var capacity = {
                simMaxNameLen:0,
                simMaxNumberLen:0,
                IsSimCardFull:true,
                IsDeviceFull:true,
                Used:0,
                Capacity:0,
                Ratio:"(0/0)"
            };
            self.capacity = ko.observable(capacity);
            self.phoneBookCapacity = ko.observable(capacity.Ratio);
            self.books = ko.observableArray();
            /**
             * 列表模板创建
             * @object templateColumns
             */
            self.gridTemplate = new ko.simpleGrid.viewModel({
                tableClass:"table-fixed",
                data:self.books(),
                idName:"index",
                columns:templateColumns.listColumns,
                defaultSortField:"name",
                defaultSortDirection:"ASC",
                pageSize:10,
                tmplType:'list',
                searchColumns:["name", "mobile_phone_number"],
                primaryColumn:"mobile_phone_number",
                showPager:true,
                rowClickHandler:function (dataId) {
                    self.editBooks(dataId, 'view');
                },
                deleteHandler:function (dataId) {
                    self.deleteOneBook(dataId);
                },
                changeTemplateHandler:function () {
                    self.changeTemplate();
                }
            });

            //property for edit or new
            self.locations = ko.observableArray();
            self.originLocation = "";
            self.selectedLocation = ko.observable(locationValue.DEVICE);
            self.locationTrans = ko.observable();
            self.locationTransText = ko.observable();
            self.index = ko.observable(-1);
            self.name = ko.observable("");
            self.nameMaxLength = ko.computed(function () {
                var max = getNameMaxLength();
                var name = self.name().substring(0, max);
                self.name(name);
                return getNameMaxLength();
            });
            function getNameMaxLength() {
                var max = 22;
                if (self.selectedLocation() == locationValue.DEVICE) {
					var encodeType = getEncodeType(self.name());
					if ("UNICODE" == encodeType.encodeType || encodeType.extendLen > 0) {
						max = 11;
					}else{
						max = 22;
					}
                    //max = 22;
                } else {
                    //对"^"需要按照2个字符处理
                    var encodeType = getEncodeType(self.name());
                    if ("UNICODE" == encodeType.encodeType || encodeType.extendLen > 0) {
                        max = (self.capacity().simMaxNameLen / 2) - 1;
                    } else {
                        max = self.capacity().simMaxNameLen;
                    }
                }
                return max;
            }

            self.mobile_phone_number = ko.observable("");
            self.mobileMaxLength = ko.computed(function () {
                var max = getMobileMaxLength();
                var mobileNumber = self.mobile_phone_number().substring(0, max);
                self.mobile_phone_number(mobileNumber);
                return getMobileMaxLength();
            });
            function getMobileMaxLength() {
                var max = 40;
                if (self.selectedLocation() == locationValue.DEVICE) {
                    max = 40;
                } else {
                    max = self.capacity().simMaxNumberLen;
                }
                return max;
            }

            self.home_phone_number = ko.observable("");
            self.office_phone_number = ko.observable("");
            self.mail = ko.observable("");
            self.transEditAreaTitle = ko.dependentObservable(function () {
                var state = self.pageState();
                if (state == pageState.EDIT) {
                    return "edit";
                } else if (state == pageState.NEW) {
                    return "new";
                } else if (state == pageState.VIEW) {
                    return "view";
                }
            });
            var groups = groupOpts();
            self.groups = ko.observableArray(groups);
            self.selectedGroup = ko.observable();
            self.groupTrans = ko.observable();
            self.groupTransText = ko.observable();

            self.selectedFilterGroup = ko.observable('all');
            self.selectedFilterGroupChangeHandler = function(){
                self.selectedFilterGroup($("#selectedFilterGroup").val());
                getPhoneBookReady();
            };

            //property for sendMessage
            self.showErrorInfo = ko.observable(false);
            self.messageContent = ko.observable("");
            self.messageCount = ko.computed(function () {
                var msgInput = $("#txtSmsContent", "#sendMessage");
                var msgInputDom = msgInput[0];
                self.messageContent();
                var strValue = msgInput.val();
                var encodeType = getEncodeType(strValue);
                var maxLength = encodeType.encodeType == 'UNICODE' ? 335 : 1530;
                if (strValue.length + encodeType.extendLen > maxLength) {
                    var scrollTop = msgInputDom.scrollTop;
                    var insertPos = getInsertPos(msgInputDom);
                    var moreLen = strValue.length + encodeType.extendLen - maxLength;
                    var insertPart = strValue.substr(insertPos - moreLen > 0 ? insertPos - moreLen : 0, moreLen);
                    var reversed = insertPart.split('').reverse();
                    var checkMore = 0;
                    var cutNum = 0;
                    for(var i = 0; i < reversed.length; i++){
                        if(getEncodeType(reversed[i]).extendLen > 0){
                            checkMore += 2;
                        } else {
                            checkMore++;
                        }
                        if(checkMore >= moreLen){
                            cutNum = i+1;
                            break;
                        }
                    }
                    var iInsertToStartLength = insertPos - cutNum;

                    self.messageContent(strValue.substr(0, iInsertToStartLength) + strValue.substr(insertPos));
                    if(self.messageContent().length > maxLength){
                        self.messageContent(self.messageContent().substr(0, maxLength));
                    }
                    setInsertPos(msgInputDom, iInsertToStartLength);
                    msgInputDom.scrollTop = scrollTop;
                }
                pbDraftListener();
                var newValue = $(msgInputDom).val();
                var newEncodeType = getEncodeType(newValue);
                var newMaxLength = newEncodeType.encodeType == 'UNICODE' ? 670 : 1530;
                if (newValue.length + newEncodeType.extendLen >= newMaxLength) {
                    $("#msgCount").addClass("colorRed");
                } else {
                    $("#msgCount").removeClass("colorRed");
                }
                return "(" + (newValue.length + newEncodeType.extendLen) + "/" + newMaxLength + ")" + "(" + getSmsCount(newValue) + "/10)";
            });
            /**
             * 返回列表状态事件处理
             * @event clear
             */
            self.clear = function (isNeedInit) {
                if (self.pageState() == pageState.SEND_MSM) {
                    smsPageCheckDraft(clearPhonebookForm, isNeedInit);
                } else {
                    clearPhonebookForm(isNeedInit);
                }
                config.resetContentModifyValue();
            };

			/**
             * 通过按钮返回列表状态事件处理
             * @event clear
             */
            self.btnClear = function (isNeedInit) {
                if (self.pageState() == pageState.SEND_MSM) {
                    smsPageCheckDraft(clearPhonebookForm, isNeedInit);
                    config.resetContentModifyValue();
                } else if((self.pageState() == pageState.NEW || self.pageState() == pageState.EDIT) && (self.preContent.location != self.selectedLocation()
                    || self.preContent.name != self.name()
                    || self.preContent.mobile_phone_number != self.mobile_phone_number()
                    || self.preContent.home_phone_number != self.home_phone_number()
                    || self.preContent.office_phone_number != self.office_phone_number()
                    || self.preContent.mail != self.mail()
                    || self.preContent.group != self.selectedGroup())){
                        showConfirm("leave_page_info", {ok:function () {
                            clearPhonebookForm(isNeedInit);
                            config.resetContentModifyValue();
                        }, no:function () {
                            return false;
                        }});
                }else {
                    clearPhonebookForm(isNeedInit);
                    config.resetContentModifyValue();
                }
            };
			
            function clearPhonebookForm(isNeedInit) {
                $("#frmPhoneBook").hide();
                self.pageState(pageState.LIST);
                self.index(-1);
                self.name("");
                self.mobile_phone_number("");
                self.home_phone_number("");
                self.office_phone_number("");
                self.mail("");
                self.messageContent("");
                if (true == isNeedInit) {
                    refreshPage();
                }
                self.gridTemplate.clearAllChecked();
                clearValidateMsg();
                $("#books ").translate();
                $("#frmPhoneBook").show();
            }

            /**
             * 检查SIM卡状态
             * @event checkHasSIMCard
             * @param {Boolean} showMsg是否提示消息
             */
            self.checkHasSIMCard = function(showMsg) {
                var status = service.getStatusInfo();
                if (status.simStatus != "modem_init_complete") {
                    if (showMsg) {
                        showAlert("sim_removed", function () {
                            self.pageState(pageState.LIST);
                            self.clear(true);
                        });
                    }
                    return false;
                }
                return true;
            };

            /**
             * 保存电话本事件
             * @event save
             */
            self.save = function () {
                var saveBook = function (index) {
                    var isSaveInSIM = (location == locationValue.SIM);
                    if (isSaveInSIM) {
                        if (!self.checkHasSIMCard(true)) {
                            return;
                        }
                    }
                    if (self.pageState() == pageState.NEW || (self.pageState() == pageState.EDIT && location != self.originLocation)) {
                        if (isSaveInSIM) {
                            if (self.capacity().IsSimCardFull) {
                                showAlert("sim_full");
                                return;
                            }
                        } else {
                            if (self.capacity().IsDeviceFull) {
                                showAlert("device_full");
                                return;
                            }
                        }
                    }
                    var name = self.name();
                    var mobile_phone_number = self.mobile_phone_number();
                    if ($.trim(name) == "" || $.trim(mobile_phone_number) == "") {
                        return;
                    }
                    showLoading('saving');
                    var params = {};
                    params.CSRFToken = self.CSRFToken;
                    params.location = location;
                    params.index = index;
                    params.name = name;
                    params.mobile_phone_number = mobile_phone_number;
                    if (!isSaveInSIM) {
                        params.home_phone_number = self.home_phone_number();
                        params.office_phone_number = self.office_phone_number();
                        params.mail = self.mail();
                        params.group = self.selectedGroup();
                    }
					if(self.selectedLocation() != self.originLocation){
						params.delId = self.index();
					}
                    service.savePhoneBook(params, self.callback);
                }
                var location = self.selectedLocation();
                var editIndex = (location == self.originLocation) ? self.index() : -1;
                if (location == locationValue.SIM && self.originLocation == locationValue.DEVICE) {
                    showConfirm("change_device_to_sim_confirm", function () {
                        saveBook(editIndex);
                    });
                } else {
                    saveBook(editIndex);
                }
            };
            /**
             * 打开添加电话本记录页面事件
             * @event openNewPage
             */
            self.openNewPage = function () {
                if (self.pageState() == pageState.SEND_MSM) {
                    pbDraftListener();
                    smsPageCheckDraft(openNewPageAct, false);
                }else if(self.pageState() == pageState.EDIT && (self.preContent.location != self.selectedLocation()
                    || self.preContent.name != self.name()
                    || self.preContent.mobile_phone_number != self.mobile_phone_number()
                    || self.preContent.home_phone_number != self.home_phone_number()
                    || self.preContent.office_phone_number != self.office_phone_number()
                    || self.preContent.mail != self.mail()
                    || self.preContent.group != self.selectedGroup())){
                        showConfirm("leave_page_info", {ok:function () {
                            openNewPageAct(false);
                        }, no:function () {
                            return false;
                        }});
                }else{
                    openNewPageAct(false);
                }
            };
			function openNewPageAct(isNeedInit){				
                self.pageState(pageState.NEW);
                self.selectedLocation(locationValue.DEVICE);
                self.originLocation = "";
                if (self.checkHasSIMCard(false)) {
                    self.locations(saveLocationOpts(true));
                } else {
                    self.locations(saveLocationOpts(false));
                }
                var group = getCurrentGroup();
                if (group != "all") {
                    self.selectedGroup(group);
                }else{
					self.selectedGroup("common");
				}
				self.name("");
                self.mobile_phone_number("");
                self.home_phone_number("");
                self.office_phone_number("");
                self.mail("");
				self.index(-1);
                self.dynamicTranslate();
                preOpenEditPage();
			}
            /**
             * 打开添加电话本记录编辑页面事件
             * @event openPage
             */
            self.openPage = function (option) {
                var index;
                if (self.pageState() == pageState.LIST) {
                    var result = self.checkSelect(option);
                    if (!result.isCorrectData) return;
                    index = result.selectedIds[0];
                } else {
                    index = self.index();
                }
                self.editBooks(index, option);
            };
            /**
             * 打开添加电话本记录查看页面事件
             * @event openViewPage
             */
            self.openViewPage = function () {
                self.openPage("view");
            };
            /**
             * 打开添加电话本记录查看页面事件
             * @event openViewPage
             */
            self.openEditPage = function () {
                self.openPage("edit");
                if ($.browser.mozilla) {
                    $("#txtName, #txtMobile").removeAttr('maxlength');
                }
                preOpenEditPage();
            };
            /**
             * 编辑电话本事件处理
             * @event editBooks
             */
            self.editBooks = function (selectedId, option) {
                if (!selectedId) return;

                if (self.checkHasSIMCard(false)) {
                    self.locations(saveLocationOpts(true));
                } else {
                    self.locations(saveLocationOpts(false));
                }
                var data = self.books();
                for (var i = 0; i < data.length; i++) {
                    var n = data[i];
                    if (n.index == selectedId) {
                        self.index(n.index);
                        self.selectedLocation(n.location);
                        self.originLocation = n.location;
                        var trans = (n.location == locationValue.DEVICE) ? "device" : "sim";
                        self.locationTrans(trans);
                        var transText = $.i18n.prop("trans");
                        self.locationTransText(transText);
                        self.name(n.name);
                        self.mobile_phone_number(n.mobile_phone_number);
                        self.home_phone_number(n.home_phone_number);
                        self.office_phone_number(n.office_phone_number);
                        self.mail(n.mail);
                        self.selectedGroup(n.group);
                        self.groupTrans("group_" + n.group);
                        self.groupTransText($.i18n.prop(self.groupTrans()));
                        if (option == "edit") {
                            self.pageState(pageState.EDIT);
                        } else {
                            self.pageState(pageState.VIEW);
                        }
                        break;
                    }
                }
                self.dynamicTranslate();

                if (self.selectedLocation() == locationValue.SIM) {
                    self.checkHasSIMCard(true)
                }
            };
            /**
             * 翻译编辑区域
             * @event dynamicTranslate
             */
            self.dynamicTranslate = function () {
                $("#container").translate();
            };
            /**
             * 删除一条电话本事件处理(card模式使用)
             * @event deleteOneBook
             */
            self.deleteOneBook = function (index) {
                showConfirm("confirm_pb_delete", function () {
                    showLoading('deleting');
                    var params = {};
                    params.indexs = [String(index)];
                    service.deletePhoneBooks(params, self.callback);
                });
                return false;
            };
            /**
             * 删除一条电话本事件处理
             * @event deleteBook
             */
            self.deleteBook = function () {
                self.deleteOneBook(self.index());
            };
            /**
             * 删除一条或多条电话本事件处理
             * @event deleteBooks
             */
            self.deleteBooks = function () {
                var result = self.checkSelect("delete");
                if (!result.isCorrectData) return;
                showConfirm("confirm_pb_delete", function () {
                    showLoading('deleting');
                    var params = {};
                    params.indexs = result.selectedIds;
                    service.deletePhoneBooks(params, self.callback);
                });
            };
            /**
             * 判断电话本选中
             * @method checkSelect
             * @param pState 当前页面的状态
             * @return {Object}
             */
            self.checkSelect = function (pState) {
                var ids;
                if ("send" == pState) {
                    ids = self.gridTemplate.selectedPrimaryValue();
                } else {
                    ids = self.gridTemplate.selectedIds();
                }

                var isCorrectData = true;
                if (ids.length == 0) {
                    showAlert("no_data_selected");
                    isCorrectData = false;
                } else if ("edit" == pState || "view" == pState) {
                    if (ids.length > 1) {
                        showAlert("too_many_data_selected");
                        isCorrectData = false;
                    }
                } else if ("send" == pState) {
                    if (ids.length > 5) {
                        showAlert("max_send_number");
                        isCorrectData = false;
                    }
                }
                return {selectedIds:ids, isCorrectData:isCorrectData };
            };
            /**
             * 全部删除电话本事件处理
             * @event deleteAllBooks
             */
            self.deleteAllBooks = function () {
                showConfirm("confirm_data_delete", function () {
                    showLoading('deleting');
                    var group = getCurrentGroup();
                    var params = {};
                    if (group == "all") {
                        params.location = 2;
                        service.deleteAllPhoneBooks(params, self.callback);
                    } else {
                        params.location = 3;
                        params.group = group;
                        service.deleteAllPhoneBooksByGroup(params, self.callback);
                    }
                });
            };
            /**
             * 回调函数
             * @method callback
             */
            self.callback = function (data) {
                if (data && data.result == "success") {
                    self.clear(true);
                    $("#books ").translate();
                    renderCheckbox();
                    successOverlay(null, true);
                } else {
                    errorOverlay();
                }
            };
            /**
             * 变换显示方式事件处理
             * @event changeTemplate
             */
            self.changeTemplate = function () {
                if (self.gridTemplate.tmplType == "card") {
                    self.gridTemplate.tmplType = "list";
                    self.gridTemplate.pageSize = 10;
                    self.gridTemplate.columns = templateColumns.listColumns;
                } else {
                    self.gridTemplate.tmplType = "card";
                    self.gridTemplate.pageSize = 10;
                    self.gridTemplate.columns = templateColumns.cardColumns;
                }
                refreshPage();
                $("#books ").translate();
            };
            /**
             * 显示发送短信页面
             * @event openSendMessagePage
             */
            self.openSendMessagePage = function () {
                if(pageState.SEND_MSM == self.pageState()){
                    return;
                }
                if((self.pageState() == pageState.EDIT || pageState.NEW == self.pageState()) && (self.preContent.location != self.selectedLocation()
                    || self.preContent.name != self.name()
                    || self.preContent.mobile_phone_number != self.mobile_phone_number()
                    || self.preContent.home_phone_number != self.home_phone_number()
                    || self.preContent.office_phone_number != self.office_phone_number()
                    || self.preContent.mail != self.mail()
                    || self.preContent.group != self.selectedGroup())){
                    showConfirm("leave_page_info", {ok:function () {
                        openSendMessagePageAct();
                    }, no:function () {
                        return false;
                    }});
                }else{					
                    openSendMessagePageAct();
                }				
            };
			
            function openSendMessagePageAct(){
                if(pageState.NEW == self.pageState()){
                    self.pageState(pageState.SEND_MSM);
                    showAlert("no_data_selected");
                    self.clear();
                    return;
                }
                var selectedNumber = null;
                if (pageState.LIST == self.pageState()) {
                    var result = self.checkSelect("send");
                    if (!result.isCorrectData) return;
                    selectedNumber = result.selectedIds;
                } else {
                    selectedNumber = self.mobile_phone_number();
                }

                var select = $("#chosenUserList .chosen-select-deselect");
                select.empty();
                var options = [];
                var tmp = [];
                for (var j = 0; j < config.phonebook.length; j++) {
                    var book = config.phonebook[j];
                    if ($.inArray(book.pbm_number, tmp) == -1) {
                        options.push(new Option(book.pbm_name + "/" + book.pbm_number, book.pbm_number, false, true));
                        tmp.push(book.pbm_number);
                    }else{
						for(var i = 0; i < options.length; i++){
                            if(options[i].value == book.pbm_number){
                                options[i].text = book.pbm_name + "/" + book.pbm_number;
                                break;
                            }
                        }
					}
                }
                var opts = "";
                $.each(options, function (i, e) {
                    opts += "<option value='" + e.value + "'>" + e.text + "</option>";
                });
                select.append(opts);
                select.chosen({max_selected_options:5, search_contains:true, width: '545px'});
                $("#chosenUserSelect").val(selectedNumber);
                $("#chosenUserSelect").trigger("chosen:updated.chosen");
                config.resetContentModifyValue();
                pbDraftListener();
                self.pageState(pageState.SEND_MSM);
            }

            /**
             * 发送短信
             * @event sendMessage
             */
            self.sendMessage = function(){
                service.getSmsCapability({}, function (capability) {
                    var hasCapability = capability.nvUsed < capability.nvTotal;
                    if (!hasCapability) {
                        showAlert("sms_capacity_is_full_for_send");
                        return false;
                    }
                    var numbers = syncSelectAndChosen($("select#chosenUserSelect"), $('.search-choice', '#chosenUserSelect_chosen'));
                    if (numbers.length + capability.nvUsed > capability.nvTotal) {
                        showAlert({msg: "sms_capacity_will_full_just", params: [capability.nvTotal - capability.nvUsed]});
                        return false;
                    }
                    self.sendMessageAction();
                    return true;
                });
            };

            self.sendMessageAction = function () {
                var numbers = syncSelectAndChosen($("select#chosenUserSelect"), $('.search-choice', '#chosenUserSelect_chosen'));

                if (!numbers || numbers.length == 0) {
                    self.showErrorInfo(true);
                    var timer = addTimeout(function () {
                        self.showErrorInfo(false);
                        window.clearTimeout(timer);
                    }, 5000);
                    return;
                }
                var content = self.messageContent();
                var sentCount = 0;
                var failCount = 0;
                if (numbers.length > 1) {
                    showLoading("sending", "<button id='btnStopSending' onclick='phoneBookStopSMSSending();' class='btn btn-primary'>"
                        + $.i18n.prop("sms_stop_sending")
                        + "</button>");
                } else {
                    showLoading('sending');
                }
                var callback = function (data) {
                    sentCount++;
                    if (sentCount == numbers.length) {
                        $("#chosenUserSelect").val("");
                        self.messageContent("");
                        config.CONTENT_MODIFIED.modified = false;
                        if (failCount == 0) {
                            successOverlay();
                            location.hash = "#smslist";
                        } else {
                            var msg = $.i18n.prop("success_info") + $.i18n.prop("colon") + (sentCount - failCount)
                                + "<br/>" + $.i18n.prop("error_info") + $.i18n.prop("colon") + (failCount);
                            showAlert(msg,function(){
                                location.hash = "#smslist";
                            });
                        }

                    } else {
                        sendSMS();
                    }
                }
                _phoneBookStopSMSSending = false;
                var sendSMS = function () {
                    if (_phoneBookStopSMSSending) {
                        hideLoading();
                        return;
                    }
                    if ((sentCount + 1) == numbers.length) {
                        $("#loading #loading_container").html("");
                    }
                    service.sendSMS({
                        number:numbers[sentCount],
                        message:content,
                        id:-1
                    }, function (data) {
                        callback(data);
                    }, function (data) {
                        failCount++;
                        callback(data);
                    });
                };
                sendSMS();
            };
            /**
             * 清除搜索关键字事件
             * @event clearSearchKey
             */
            self.clearSearchKey = function () {
                self.gridTemplate.searchInitStatus(true);
                self.gridTemplate.searchKey($.i18n.prop("search"));
                $("#ko_grid_search_txt").addClass("ko-grid-search-txt-default").attr("data-trans", "search");
            };
            /**
             * 点击搜索输入框事件
             * @event searchTextClick
             */
            self.searchTextClick = function () {
                var searchText = $("#ko_grid_search_txt");
                if (searchText.hasClass("ko-grid-search-txt-default")) {
                    self.gridTemplate.searchKey("");
                    self.gridTemplate.searchInitStatus(false);
                    searchText.removeClass("ko-grid-search-txt-default").removeAttr("data-trans");
                }
            };
            /**
             * 离开搜索输入框事件
             * @event searchTextBlur
             */
            self.searchTextBlur = function () {
                var txt = $.trim(self.gridTemplate.searchKey()).toLowerCase();
                if (txt == "") {
                    self.clearSearchKey();
                }
            };
            /**
             * 当前表格是否有数据
             * @method hasData
             */
            self.hasData = ko.computed(function () {
                return self.gridTemplate.afterSearchData().length > 0;
            });
            /**
             * 当前表格是否有选中的数据
             * @method hasChecked
             */
            self.hasChecked = ko.computed(function () {
                return self.gridTemplate.checkedCount() > 0;
            });
            /**
             * 是否可以点击发送按钮
             * @method hasData
             */
            self.canSend = ko.computed(function () {
                var checked = self.gridTemplate.checkedCount();
                if (!self.checkHasSIMCard(false)) {
                    return false;
                }
                return (checked > 0 && checked <= 5);
            });

            /**
             * 发送短信时，选择用户变化的监控事件
             * @event hasData
             */
            self.draftListenerEvent = function () {
                pbDraftListener();
            };
            /**
             * 文档内容监听，判断是否修改过
             */
            function pbDraftListener() {
                var smsHasCapability = true;
                if (smsHasCapability) {
                    var content = self.messageContent();
                    var hasContent = false;
                    var numbers = getSelectValFromChosen($('.search-choice', '#chosenUserSelect_chosen'));
                    var noContactSelected = !(numbers && numbers.length > 0);
                    if (typeof content == "undefined" || content == '') {
                        config.resetContentModifyValue();
                        return false;
                    } else {
                        hasContent = true;
                    }
                    if (hasContent && !noContactSelected) {
                        config.CONTENT_MODIFIED.modified = true;
                        config.CONTENT_MODIFIED.message = 'sms_to_save_draft';
                        config.CONTENT_MODIFIED.callback.ok = saveDraftAction;
                        config.CONTENT_MODIFIED.callback.no = $.noop;
                        config.CONTENT_MODIFIED.data = {
                            content:content,
                            numbers:numbers
                        };
                        return false;
                    }
                    if (hasContent && noContactSelected) {
                        config.CONTENT_MODIFIED.modified = true;
                        config.CONTENT_MODIFIED.message = 'sms_no_recipient';
                        config.CONTENT_MODIFIED.callback.ok = $.noop;
                        config.CONTENT_MODIFIED.callback.no = function () {
                            // 返回true，页面保持原状
                            return true;
                        };
                        return false;
                    }
                } else {
                    config.resetContentModifyValue();
                }
            }

            function saveDraftAction(data) {
                var datetime = new Date();
                var params = {
                    index:-1,
                    currentTimeString:getCurrentTimeString(datetime),
                    groupId:data.numbers.length > 1 ? datetime.getTime() : '',
                    message:data.content,
                    numbers:data.numbers
                };
                service.saveSMS(params, function () {
                    successOverlay('sms_save_draft_success');
                }, function () {
                    errorOverlay("sms_save_draft_failed")
                });
            }

            function smsPageCheckDraft(clearCallback, isNeedInit) {
                if (config.CONTENT_MODIFIED.message != 'sms_to_save_draft') {
                    if (config.CONTENT_MODIFIED.modified) {
                        showConfirm(config.CONTENT_MODIFIED.message, {ok:function () {
                            config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                            clearCallback(isNeedInit);
                        }, no:function () {
                            if (config.CONTENT_MODIFIED.message == 'sms_to_save_draft') {
                                clearCallback(isNeedInit);
                            }
                            return false;
                        }});
                        return false;
                    } else {
                        clearCallback(isNeedInit);
                    }
                } else {
                    config.CONTENT_MODIFIED.callback.ok(config.CONTENT_MODIFIED.data);
                    clearCallback(isNeedInit);
                }
            }

            /**
             * 重新获取页面数据并显示
             * @event getPhoneBookReady
             */
            function getPhoneBookReady() {
                service.getPhoneBookReady({}, function (data) {
                    if (data.pbm_init_flag == "6") {
                        self.initFail(true);
                        hideLoading();
                        showAlert("phonebook_init_fail");
                    } else if (data.pbm_init_flag != "0") {
                        addTimeout(getPhoneBookReady, 1000);
                    } else {
                        self.initFail(false);
                        var capacity = getCapacity();
                        self.capacity(capacity);
                        self.phoneBookCapacity(capacity.Ratio);
                        var phoneBooks = getBooks(capacity.Used);
                        self.books(phoneBooks);
                        self.gridTemplate.data(phoneBooks);
                        hideLoading();
                    }
                });
            }

            showLoading('waiting');
            addTimeout(getPhoneBookReady, 200);

            /**
             * 重新获取页面数据并显示
             * @event refreshPage
             */
            function refreshPage() {
                showLoading();
                var capacity = getCapacity();
                self.phoneBookCapacity(capacity.Ratio);
                self.capacity(capacity);
                var books = getBooks(capacity.Used);
                self.books(books);
                self.gridTemplate.data(books);
                hideLoading();
            }

            self.preContent = {};
            /**
             * 保存编辑前的内容
             * @method setPreContent
             */
            function setPreContent() {
                self.preContent.location = self.selectedLocation();
                self.preContent.name = self.name();
                self.preContent.mobile_phone_number = self.mobile_phone_number();
                self.preContent.home_phone_number = self.home_phone_number();
                self.preContent.office_phone_number = self.office_phone_number();
                self.preContent.mail = self.mail();
                self.preContent.group = self.selectedGroup();
            }

            /**
             * 检测数据是否改变
             * @method checkContentChang
             * @return {bool}
             */
            function checkContentChang() {
                var changed = (self.preContent.location != self.selectedLocation()
                    || self.preContent.name != self.name()
                    || self.preContent.mobile_phone_number != self.mobile_phone_number()
                    || self.preContent.home_phone_number != self.home_phone_number()
                    || self.preContent.office_phone_number != self.office_phone_number()
                    || self.preContent.mail != self.mail()
                    || self.preContent.group != self.selectedGroup());
                config.CONTENT_MODIFIED.modified = changed;
            }

            function preOpenEditPage() {
                config.resetContentModifyValue();
                setPreContent();
                config.CONTENT_MODIFIED.checkChangMethod = checkContentChang;
            }
        }

        /**
         * 设置停止发送标志为true
         * @event phoneBookStopSMSSending
         */
        phoneBookStopSMSSending = function () {
            _phoneBookStopSMSSending = true;
            $("#loading #loading_container").html($.i18n.prop("sms_cancel_sending"));
        }

        /**
         * 获取电话本
         * @method getBooks
         * @return {Object}
         */
        function getBooks(capacity) {
            var para = {};
            para.page = 0;
            para.data_per_page = capacity;
            para.orderBy = "name";
            para.isAsc = true;
            var books = [];
            var group = getCurrentGroup();
            if (config.HAS_SMS) {
                books = service.getPhoneBooks(para);
                config.phonebook = books.pbm_data;
                if (group != "all") {
                    books = {"pbm_data":_.filter(books.pbm_data, function (item) {
                        return item.pbm_group == group;
                    })};
                }
            } else {
                if (group != "all") {
                    para.group = group;
                    books = service.getPhoneBooksByGroup(para);
                } else {
                    books = service.getPhoneBooks(para);
                }
            }
            return translateData(books.pbm_data);
        }

        /**
         * 获取电话本容量信息
         * @method getCapacity
         * @return {String}
         */
        function getCapacity() {
            var sim = service.getSIMPhoneBookCapacity();
            var device = service.getDevicePhoneBookCapacity();
            var counter;
            if(tz_real_version == "m60a"){
                counter = (device.pcPbmUsedCapacity) + "/" + (device.pcPbmTotalCapacity);
            }else{
                counter = (sim.simPbmUsedCapacity + device.pcPbmUsedCapacity) + "/" + (sim.simPbmTotalCapacity + device.pcPbmTotalCapacity);
            }
            return  {
                simUsed:sim.simPbmUsedCapacity,
                deviceUsed:device.pcPbmUsedCapacity,
                simCapacity:sim.simPbmTotalCapacity,
                deviceCapacity:device.pcPbmTotalCapacity,
                simMaxNameLen:sim.maxNameLen,
                simMaxNumberLen:sim.maxNumberLen,
                IsSimCardFull:(sim.simPbmUsedCapacity == sim.simPbmTotalCapacity),
                IsDeviceFull:(device.pcPbmUsedCapacity == device.pcPbmTotalCapacity),
                Used:sim.simPbmUsedCapacity + device.pcPbmUsedCapacity,
                Capacity:sim.simPbmTotalCapacity + device.pcPbmTotalCapacity,
                Ratio:counter
            };
        }

        function translateData(books) {
            var ret = [];
            var group = getCurrentGroup();
            var hasFilter = (group != "all");
            if (books) {
                for (var i = 0; i < books.length; i++) {
                    if (hasFilter) {
                        var currentGroup = books[i].pbm_group;
                        if (books[i].pbm_location == locationValue.SIM || currentGroup != group) {
                            continue;
                        }
                    }
                     var temp;
                    if(tz_real_version == "m60a"){
                        if(books[i].pbm_location == "1"){
                            temp = {
                        index:books[i].pbm_id,
                        location:books[i].pbm_location,
                        imgLocation:books[i].pbm_location == locationValue.SIM ? "img/sim.png" : "img/device.png",
                        name:books[i].pbm_name,
                        mobile_phone_number:books[i].pbm_number,
                        home_phone_number:books[i].pbm_anr,
                        office_phone_number:books[i].pbm_anr1,
                        mail:books[i].pbm_email,
                        group:books[i].pbm_group,
                        transGroup:(!books[i].pbm_group) ? "group_null" : "group_" + books[i].pbm_group
                    };
                    ret.push(temp);
                        }
                    }else{
                          temp = {
                        index:books[i].pbm_id,
                        location:books[i].pbm_location,
                        imgLocation:books[i].pbm_location == locationValue.SIM ? "img/sim.png" : "img/device.png",
                        name:books[i].pbm_name,
                        mobile_phone_number:books[i].pbm_number,
                        home_phone_number:books[i].pbm_anr,
                        office_phone_number:books[i].pbm_anr1,
                        mail:books[i].pbm_email,
                        group:books[i].pbm_group,
                        transGroup:(!books[i].pbm_group) ? "group_null" : "group_" + books[i].pbm_group
                    };
                    ret.push(temp);
                    }
                    
                }
            }
            return ret;
        }

        /**
         * 初始化ViewModel并进行绑定
         * @method init
         */
        function init() {
            var container = $('#container');
            ko.cleanNode(container[0]);
            var vm = new phoneBookVM();
            ko.applyBindings(vm, container[0]);
            $("#txtSmsContent").die().live("contextmenu", function () {
                return false;
            });
            $('#frmPhoneBook').validate({
                submitHandler:function () {
                    vm.save();
                },
                rules:{
                    txtMail:"email_check",
                    txtName:"name_check",
                    txtMobile:"phonenumber_check",
                    txtHomeNumber:"phonenumber_check",
                    txtOfficeNumber:"phonenumber_check"
                }
            });

        }

        return {
            init:init
        };
    });