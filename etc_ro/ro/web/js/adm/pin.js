/**
 * PIN管理模块
 * @module pin
 * @class pin
 */

define([ 'jquery', 'knockout', 'config/config', 'service'],

    function ($, ko, config, service) {
        var pageState = {common:0, requirePin:1, modifyPin:2, requirePuk:3, destroyed:4};
        var pinStatus = {enable:"1", disable:"0"};
        var tz_used_logo_file = service.getOnceData().tz_used_logo_file; 
        var auto_simpin;
        /**
         * pinViewModel
         * @class pinModel
         */
        function pinModel() {
            var self = this;
            var data = service.getPinData();
            auto_simpin = data.auto_simpin;
            self.isDataCard = config.PRODUCT_TYPE == 'DATACARD';
            self.originPinStatus = ko.observable(data.pin_status);
            self.pinStatus = ko.observable(data.pin_status == "" ? "0" : data.pin_status);
            self.showPinChange = ko.observable(data.pin_status == "1");
            // self.pageCurrentPin = ko.observable(data.pin_status);
            self.pinNumber = ko.observable(data.pinnumber);
            self.pukNumber = ko.observable(data.puknumber);
            self.currentPin = ko.observable();
            self.newPin = ko.observable();
            self.confirmPin = ko.observable();
            self.puk = ko.observable();
            self.pageState = ko.observable();
            service.bindCommonData(self);
            service.advanceHide();
            //请求操作后成功标志位
            self.optSuccess = true;
            /**
             * 确定按钮事件处理，包括修改PIN，根据PUK设置PIN，设置PIN的使能状态
             * @event changePin
             */
            self.changePin = function () {
                if (self.isConnectedNetWork()) {
                    showAlert("cannot_operate_when_connected");
                    return;
                }

                if (self.pageState() == pageState.common) {
                    return;
                }

                var para = {
                    oldPin:self.currentPin(),
                    newPin:self.newPin(),
                    CSRFToken: self.CSRFToken
                };
                showLoading();

                if (self.pageState() == pageState.modifyPin) {
                    service.changePin(para, self.callback);
                } else if (self.pageState() == pageState.requirePuk) {
                    para = {
                        PinNumber:self.newPin(),
                        PUKNumber:self.puk(),
                        CSRFToken: self.CSRFToken
                    };
                    service.enterPUK(para, self.callback);
                } else {
                    if (self.pinStatus() == pinStatus.enable) {
                        service.enablePin(para, self.callback);
                    } else {
                        service.disablePin(para, self.callback);
                    }
                }
            };
            /**
             * 回调函数
             * @method callback
             */
            self.callback = function (data) {
                if (data && data.result == true) {
                    self.optSuccess = true;
                    successOverlay();
                } else {
                    self.optSuccess = false;
                    //最后一次时要弹框提示
                    if(self.pinNumber() == 2){
                      showAlert("last_enter_pin");    
                    }
                    else if(self.pukNumber() == 2){
                      showAlert("last_enter_puk");    
                    }
                    else{
                        if(tz_used_logo_file == "claro.png"){
                            showAlert("pin_error_2");
                            pingFlag = false;
                        }else{
                           errorOverlay();  
                        }      
                    }   
                }
                init(self);
                var vm2 = new pinModel();
                ko.applyBindings(vm2, $('#btnModifyPin')[0]);
            };
            /**
             * 进入PIN修改状态事件处理
             * @event displayModifyPinPage
             */
            var pingFlag = true;
            self.displayModifyPinPage = function () {
                if (self.isConnectedNetWork()) {
                    showAlert("cannot_operate_when_connected");
                    return;
                }
                pingFlag = false;
                self.pinStatus(self.originPinStatus());
                self.pageState(pageState.modifyPin);
                self.clear();
            };
            /**
             * 取消事件处理
             * @event cancel
             */       
            self.cancel = function () {
                self.pageState(pageState.common);
                self.pinStatus(self.originPinStatus());
                self.clear();
            };
            /**
             * 清除页面输入和检测消息
             * @event clear
             */
            self.clear = function () {
                if(tz_used_logo_file != "claro.png"){
                    self.currentPin("");
                    self.newPin("");
                    self.confirmPin("");
                    self.puk("");
                }
                clearValidateMsg();
            };
            if(service.getPinData().pin_status == "1"){
                $('#pageCurrentPin').show(); 
            }else{
                $('#pageCurrentPin').hide(); 
            }   

            $("#pinEnable").on('click',function(){
                $('#pageCurrentPin').show(); 
            });
            $("#pinDisable").on('click',function(){
                if(service.getPinData().pin_status == "1"){
                $('#pageCurrentPin').show();  
            }else{
                 $('#pageCurrentPin').hide(); 
            }
            })
            $("#btnPinApply").on('click',function(){
                if(tz_used_logo_file == "claro.png"){
                    if(pingFlag == false){
                        if(self.newPin().length < "4" || self.newPin().length >"8" || self.currentPin().length < "4"){
                        showAlert("pin_check");
                        return false;
                     }
                    }else{
                      if(service.getPinData().pin_status == "1"){
                    if($("#pinEnable").attr('checked')){
                        showAlert("pin_enable");
                    }
                }else{
                    if($("#pinDisable").attr('checked')){
                        showAlert("pin_disable");
                    }
                }
                    }          
                            
                }else{
                    if(service.getPinData().pin_status == "1"){
                    if($("#pinEnable").attr('checked')){
                        showAlert("pin_enable");
                    }
                }else{
                    if($("#pinDisable").attr('checked')){
                        showAlert("pin_disable");
                    }
                }
                }
                
                
            })
            /**
             * PIN使能改变时事件处理
             * @method pinStatusChangeEvent
             */
            self.pinStatusChangeEvent = ko.dependentObservable(function () {
                if (self.pinStatus() == self.originPinStatus()) {
                    self.pageState(pageState.common);
                } else {
                    self.pageState(pageState.requirePin);
                }
                self.clear();
            }, this);
            /**
             * 根据数据，设置当前的页面状态
             * @method computePageState
             */
            self.computePageState = function (data) {
                if (data.pinnumber > 0) {
                    if(data.modem_main_state == "modem_autopin"){
                        self.pageState(pageState.destroyed);
                    }else if (self.optSuccess) { //操作成功页面回到初始状态，操作失败并且pinnumber>0,页面不跳转
                        self.cancel();
                    } else {
                        self.clear();
                    }
                    
                    
                } else {
                    self.clear();
                    if (data.puknumber > 0) {
                        self.pageState(pageState.requirePuk);
                    } else {
                        self.pageState(pageState.destroyed);
                    }
                }
            };
            self.computePageState(data);

            /**
             * 是否已联网
             * @method isConnectedNetWork
             */
            self.isConnectedNetWork = function () {
                //var info = service.getConnectionInfo();
                //return checkConnectedStatus(info.connectStatus);
                return false;
            }

            /**
             * 处理页面元素的可用状态
             * @method fixPageEnable
             */
            self.fixPageEnable = function () {
                if (self.isConnectedNetWork()) {
                    $('#frmPin :input').each(function () {
                        enableBtn($(this));
                    });
                    clearValidateMsg();
                } else {
                    $('#frmPin :input').each(function () {
                        if (this.id == "txtPin" || this.id == "btnPinApply") {
                            if (self.pageState() == pageState.common) {
                                enableBtn($(this));
                                return;
                            }
                        }
                        if (this.id == "btnModifyPin") {
                            if (self.originPinStatus() != pinStatus.enable) {
                                enableBtn($(this));
                                return;
                            }
                        }
                        if (this.id == "pinEnable" || this.id == "pinDisable") {
                            if (self.pageState() == pageState.modifyPin) {
                                enableBtn($(this));
                                return;
                            }
                        }
                        enableBtn($(this));
                    });

                }
            }
        }

        /**
         * 初始化ViewModel并进行绑定
         * @method init
         */    
        function init(oldVM) {
            if(this.init){
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = oldVM;
            if (vm) {
                var data = service.getPinData();
                vm.originPinStatus(data.pin_status == "" ? "0" : data.pin_status);
                vm.pinNumber(data.pinnumber);
                vm.pukNumber(data.puknumber);
                vm.computePageState(data);
            } else {
                vm = new pinModel();
                addInterval(function () {
                    vm.fixPageEnable();
                }, 1000);
            }
            ko.applyBindings(vm, $('#container')[0]);
            vm.fixPageEnable();
            var txtPinCheck;
            if(auto_simpin == "2"){
                txtPinCheck = "pin_check_2";
            }else{
                txtPinCheck = "pin_check";
            }
            $('#frmPin').validate({
                submitHandler:function () {
                    vm.changePin();
                },
                rules:{
                    txtPuk:"puk_check",
                    txtPin:txtPinCheck,
                    txtNewPin:txtPinCheck,
                    txtConfirmPin:{equalToPin:"#txtNewPin"}
                }
            });

        }

        return {
            init:init
        }
    });
