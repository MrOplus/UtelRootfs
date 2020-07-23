/**
 * Logout 模块
 * @module Logout
 * @class Logout
 */

define(['knockout', 'service', 'jquery', 'config/config', 'underscore'],
    function (ko, service, $, config, _) {

        /**
         * logoutViewModel
         * @class logoutVM
         */
        function logoutVM() {
            var self = this;

            var isLoggedIn = getIsLoggedin();
			var info = service.getStatusInfo();
            self.loggedIn = ko.observable(isLoggedIn);
            /**
             * 是否显示退出按钮
             * @event showLogout
             */
            self.showLogout = function () {
                if (config.HAS_LOGIN == false) {
                    return false;
                } else {
                    return self.loggedIn()
                }
            };
			self.isShowModifyPassword = function () 
			{
                if (info.accountPower == '3') {
                    return true;
                } else {
                    return false;
                }
            };
            /**
             * 退出系统
             * @event logout
             */
            self.logout = function () {
                showConfirm("confirm_logout", function () {
                    manualLogout = true;
                    service.logout({}, function(){
                        window.location = 'main.html';
                    });
                });
            };
        }

        /**
         * 获取是否登录
         * @method getIsLoggedin
         */
        function getIsLoggedin() {
            var loginStatus = service.getLoginStatus();
            return (loginStatus.status == "loggedIn");
        }

        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            ko.applyBindings(new logoutVM(), $('#logout')[0]);
        }

        return {
            init:init
        };
    });
