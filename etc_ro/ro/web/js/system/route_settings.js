/**
 * @module prot_forward
 * @class prot_forward
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],

    function ($, ko, config, service, _) {
        var vm;
        var defaultInterface = '1',
            defaultStatus = '0';
        function staticRouteVM() {
            var self = this;
            var staticRouteArr = [];
            var params = {};
            params.routeMode = "addRoute";

            self.interface = '1';
            self.ipAddress = '';
            self.netmask = '';
            self.gateway = '';
            self.status = "0";

            // 触发模态框
            self.modalTrigger = function () {
                $("#myModal").modal({
                    backdrop: "static",
                    keyboard: false
                });
            };

            self.addRoute = function () {
                $("#ipAddress").val(null);
                $("#netmask").val(null);
                $("#gateway").val(null);

                self.interface = ko.observable('1');
                self.ipAddress = ko.observable(null);
                self.netmask = ko.observable('255.255.255.0');
                self.gateway = ko.observable(null);
                self.status = ko.observable('0');

                var saveRouteForm = $('#saveRouteForm')[0];
                ko.cleanNode(saveRouteForm);
                ko.applyBindings(self, saveRouteForm);

                self.modalTrigger();
            };
            service.advanceHide();
            service.bindCommonData(self);
            self.list = service.getStaticRoute().staticRouteList;
            for (var i = 0; i < self.list.length; i++) {
                staticRouteArr.push(new route(self.list[i]["index"], self.list[i]));
            }
            self.routeList = ko.observableArray([]);
            // self.routeList = ko.observableArray(staticRouteArr);
            self.editSeat = function (n) {
                params.routeMode = "editRoute";
                params.routeIndex = n.index;
                var editViewModal = {};
                var ele = $("td[data-index=" + n.index + "]").siblings();
                editViewModal.interface = ko.observable(ele.eq(0).text() == "WAN" ? "0" : "1");
                editViewModal.ipAddress = ko.observable(ele.eq(1).text());
                editViewModal.netmask = ko.observable(ele.eq(2).text());
                editViewModal.gateway = ko.observable(ele.eq(3).text());
                editViewModal.status = ko.observable(ele.eq(4).text() == "Valid" ? "0" : "1");

                self.interface = ele.eq(0).text() == "WAN" ? "0" : "1";
                self.ipAddress = ele.eq(1).text();
                self.netmask = ele.eq(2).text();
                self.gateway = ele.eq(3).text();
                self.status = ele.eq(4).text() == "Valid" ? "0" : "1";

                editViewModal.closeModal = self.closeModal;
                editViewModal.save = self.save;
                ko.applyBindings(editViewModal, $('#saveRouteForm')[0]);
                self.modalTrigger();
            };
            self.removeSeat = function (n) {
                params.routeMode = "delRoute";
                params.routeIndex = n.index;
                service.setStaticRoute(params, function (data) {
                    if (data.result == "success") {
                        successOverlay();
                        refreshData();
                    } else {
                        errorOverlay();
                    }

                    params.routeMode = "addRoute";
                });
            };

            self.closeModal = function() {
                $.modal.close();
            };

            var rules = {
                ipAddress : 'ip_check',
                netmask : 'netmask_check',
                gateway : 'ip_check'
            };

            /**
             * 保存
             * @method save
             */
            self.save = function () {
                if(!checkFormWithoutMsg( $('#saveRouteForm'), rules ) ){
                    return false;
                }
                showLoading();
                params.interface = $("input[name='interface'][checked='checked']").val() == undefined ? defaultInterface : $("input[name='interface'][checked='checked']").val();
                params.ipAddress = $("#ipAddress").val();
                params.netmask = $("#netmask").val();
                params.gateway = $("#gateway").val();
                params.status = $("input[name='status'][checked='checked']").val() == undefined ? defaultStatus : $("input[name='status'][checked='checked']").val();
                service.setStaticRoute(params, function (data) {
                    if (data.result == "success") {
                        successOverlay();
                        refreshData();
                    } else {
                        errorOverlay();
                    }
                    params.routeMode = "addRoute";
                });
            };

            self.delAll = function () {
                params.routeMode = "delAllRoute";
                service.setStaticRoute(params, function (data) {
                    if (data.result == "success") {
                        successOverlay();
                        $('#myModal').modal('hide');
                        refreshData();
                    } else {
                        errorOverlay();
                    }
                    params.routeMode = "addRoute";
                });
            };
        }

        function route(index, init) {
            var self = this;
            self.index = index;
            self.meal = ko.observable(init);
        }

        function refreshData() {
            var list = service.getStaticRoute().staticRouteList;
            var arr = [];
            for (var i = 0; i < list.length; i++) {
                arr.push(new route(list[i]["index"], list[i]));
            }
            vm.routeList(arr);
            $(".edit-btn").text($.i18n.prop("edit"));
            $(".delete-btn").text($.i18n.prop("delete"));
        }

        function init() {
            if (this.init) {
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            vm = new staticRouteVM();
            var container = $('#container')[0];
            ko.cleanNode(container);
            ko.applyBindings(vm, container);
            refreshData();

            $("input[name='interface']").live('click',function(){
                $("input[name='interface']").removeAttr('checked');
                $(this).attr('checked','checked');
            });

            $("input[name='status']").live('click',function(){
                $("input[name='status']").removeAttr('checked');
                $(this).attr('checked','checked');
            });
        }

        return {
            init: init
        };
    });
