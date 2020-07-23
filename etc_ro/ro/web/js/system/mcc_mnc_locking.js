/**
 * Created by hewq on 18/04/17.
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],

    function ($, ko, config, service, _) {

        function BandModel() {
            var self = this;
            var info = service.getLockPLMNInfo();

            self.plmnEnable = info.plmn_state == 'yes' ? "enable" : "disable";
            self.plmnlist = ko.observableArray([]);
            service.bindCommonData(self);
            service.advanceHide();
            self.addPLMN = function () {
                if (self.plmnlist().length >= 10) {
                    showInfo({msg: "apn_profile_full", params: [10]});
                    return;
                }
                if (!$("#plmnInfo").val()) {
                    $("#plmnInfo").focus();
                    return;
                }
                if (isNaN($("#plmnInfo").val())) {
                    $("#plmnInfo").focus();
                    return;
                }
                self.plmnlist.push(new newUserPLMN($("#plmnInfo").val(), self.plmnlist().length));
            };

            function newUserPLMN(plmn, idx) {
                var self = this;
                self.plmn = ko.observable(plmn);
                self.idx = idx;
            }

            self.removePLMN = function () {
                self.plmnlist.remove(this);
            };
            self.editPLMNHandler = function (eleData) {
                $("#plmn_input_" + eleData.idx).val(eleData.plmn());
                stationUtil.dealElement(true, eleData.idx);
                return false;
            };
            self.cancelEditPLMNHandler = function (eleData) {
                stationUtil.dealElement(false, eleData.idx);
            };
            self.savePLMNHandler = function (eleData) {
                var $input = $("#plmn_input_" + eleData.idx);
                var newPLMN = $input.val();
                if (!newPLMN) {
                    showAlert('number');
                    $input.focus();
                    return;
                }
                if (isNaN(newPLMN)) {
                    showAlert('digits');
                    $input.focus();
                    return;
                }
                self.plmnlist()[eleData.idx].plmn(newPLMN);
                stationUtil.dealElement(false, eleData.idx);
            };
            var stationUtil = {
                dealElement: function (showEdit, idx) {
                    if (idx == "all") {
                        $("input[id^='plmn_txt_'],a[id^='edit_btn_']").show();
                        $("input[id^='plmn_input_'],a[id^='cancel_btn_'],a[id^='save_btn_']").hide();
                    } else {
                        if (showEdit) {
                            $("#edit_btn_" + idx + ",#plmn_txt_" + idx).hide();
                            $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#plmn_input_" + idx).show();
                        } else {
                            $("#edit_btn_" + idx + ",#plmn_txt_" + idx).show();
                            $("#save_btn_" + idx + ",#cancel_btn_" + idx + ",#plmn_input_" + idx).hide();
                        }
                    }
                }
            };

            self.applyLockPLMN = function () {
                var total = '';
                var notInEditMode = true;
                $.each(self.plmnlist(),
                    function (idx, obj) {
                        if (!$("#plmn_input_" + idx).is(":hidden") && $("#plmn_txt_" + idx).length > 0) {
                            $("#plmn_input_" + idx).focus();
                            notInEditMode = false;
                        }
                        if (0 == idx)
                            total += obj.plmn();
                        else
                            total += ',' + obj.plmn();
                    });
                if (notInEditMode) {
                    var para = {
                        plmnState: self.plmnEnable == 'enable' ? 'yes' : 'no',
                        plmnList: total
                    };
                    showLoading();
                    service.setLockPLMNInfo(para, function (data) {
                        if (data && data.result == "success") {
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
                        }
                        else {
                            errorOverlay();
                        }
                    });
                }
            };

            for (var p in info) {
                if (info[p] != info.plmn_state)
                    self.plmnlist.push(new newUserPLMN(info[p], self.plmnlist().length));
            }
        }

        function init() {
            if(this.init){
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = new BandModel();
            ko.applyBindings(vm, $('#container')[0]);

            $('#mccMncLocking').validate({
                submitHandler: function () {
                },
                rules: {
                    plmnInfo: {
                        digits: true
                    }
                },
                errorPlacement: function (error, element) {
                    if (element.attr("name") == "plmnInfo") {
                        error.appendTo("#editAlertPLMNDiv");
                    }
                }
            });
        }

        return {
            init: init
        }
    });