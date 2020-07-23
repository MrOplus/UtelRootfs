/**
 * 密码管理 模块
 * @module password
 * @class password
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {

        /**
         * password ViewModel
         * @class passwordModel
         */
        function passwordModel() {
            var self = this;
            self.currentPassword = ko.observable();
			self.newUsername = ko.observable();
            self.newPassword = ko.observable();
            self.confirmPassword = ko.observable();
            /**
             * 修改密码
             * @event changePassword
             */
            self.changePassword = function () {
                var para = {
                    oldPassword:self.currentPassword(),
					newUsername:self.newUsername(),
                    newPassword:self.newPassword()
                };
                showLoading();
                service.changePassword(para, function (data) {
                    self.cancel();
                    if (data && data.result == true) {
                        successOverlay();
                    } else {
                    	if (data && data.errorType == "usernameExist") {
                            hideLoading();
                            showAlert("new_username_exist",function(){
                                $("#txtNewUsername").focus();
                            });
                        }
                        else if (data && data.errorType == "badPassword") {
                            hideLoading();
                            showAlert("current_password_error",function(){
                                $("#txtCurrentPassword").focus();
                            });
                        } else {
                            errorOverlay();
                        }
                    }
                });
            };
            /**
             * 清除输入的密码
             * @event cancel
             */
            self.cancel = function () {
                self.currentPassword("");
				self.newUsername("");
                self.newPassword("");
                self.confirmPassword("");
            };

        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            var vm = new passwordModel();
            ko.applyBindings(vm, $('#container')[0]);

            $('#frmPassword').validate({
                submitHandler:function () {
                    vm.changePassword();
                },
                rules:{
                    txtCurrentPassword:"password_check",
                    txtNewPassword:"password_check",
                    txtConfirmPassword:{ equalToPassword:"#txtNewPassword"}
                }
            });

        }

        return {
            init:init
        }
    });
