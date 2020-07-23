define(['knockout',
    'underscore',
    'jquery'
    , 'service'
    , 'config/config'],
    function (ko, _, $, service, config) {
        var displayMenuWhenLogout = false;
        var menuVM;
        var menu = [];
        config.blc_wan_mode = service.getOpMode().blc_wan_mode;
        if (config.RJ45_SUPPORT) {
            switch(config.blc_wan_mode){
                case "PPPOE":
                case "AUTO_PPPOE":
                    menuResource = "menu_pppoe";
                    break;
                case "PPP":
				case "AUTO_PPP":
                    menuResource = "menu_4ggateway";
                    break;
                default:
                    menuResource = "menu";
                    break;
            }            
        }else{
            menuResource = "menu";
        } 
        require(['config/' + config.DEVICE + '/' + menuResource], function(otherMenu) {
            menu = otherMenu;
            if(config.SD_CARD_SUPPORT) {
                menu = menu.concat([
                    {
                        hash:'#httpshare_guest',
                        path:'sd/httpshare',
                        level:'',
                        requireLogin:false,
                        checkSIMStatus:false
                    },
                    {
                        hash:'#sdcard',
                        path:'sd/sd',
                        level:'',
                        requireLogin:true,
                        checkSIMStatus:false
                    },
                    {
                        hash:'#httpshare',
                        path:'sd/httpshare',
                        level:'',
                        requireLogin:true,
                        checkSIMStatus:false
                    }
                ]);
            }
        });
        var menuResource = "";

        //Menu vm
        function MenuVM() {
            var self = this;

            var isLoggedIn = getIsLoggedin();
            self.loggedIn = ko.observable(isLoggedIn);

            self.showMenu = ko.observable(isLoggedIn || window.location.hash == "#index_status" || displayMenuWhenLogout ||  window.location.hash == "#iran_login" );

            var mainMenu = _.filter(menu, function (item) {
                return (item.level == '1' && ((item.requireLogin && self.loggedIn()) || !item.requireLogin) && item.hash != "#login");
            });

            self.mainMenu = ko.observableArray(mainMenu);
            self.secondMenu = ko.observableArray([]);
            self.curThirdMenu;

            self.getThirdMenu = function (data) {
                self.curThirdMenu = getSubMenu(data);
            };

            self.thirdMenu = function () {
                return self.curThirdMenu;
            };

            self.changeMenu = function (data) {
                var secondMenu = getSubMenu(data);
                if (secondMenu.length == 0) {
                    $("#container").addClass("fixContainerWidth");
                }
                else {
                    $("#container").removeClass("fixContainerWidth");
                }

                self.secondMenu(secondMenu);
                return true;
            };

            function getSubMenu(data) {
                return _.filter(menu, function (item) {
                    return ((item.parent && item.parent == data.hash) && ((item.requireLogin && self.loggedIn()) || !item.requireLogin));
                });
            }
        }

        function refreshMenu() {
            var currentHash = window.location.hash;
            var rootItem = _.find(menu, function (item) {
                return item.hash == currentHash;
            });

            while (rootItem.parent) {
                rootItem = _.find(menu, function (item) {
                    return item.hash == rootItem.parent;
                });
            }
            if (!rootItem.parent) {
                $("#list-nav li").removeClass("active");
                var mid = rootItem.hash.substring(1, rootItem.hash.length);
                $("#list-nav li[mid=" + mid + "]").addClass("active");
            }
            menuVM.changeMenu(rootItem);
        }

        function activeSubMenu() {
            var currentHash = window.location.hash;
            var rootItem = _.find(menu, function (item) {
                return item.hash == currentHash;
            });
            if (rootItem.level == 1) {
                renderSubMenu("two", rootItem);
            }
            if (rootItem.level == 2) {
                renderSubMenu("three", rootItem);
                //forward/backward support
                triggerMenuClick(rootItem.hash, rootItem.level);
            }
            if (rootItem.level == 3) {
                //forward/backward support
                triggerMenuClick(rootItem.parent, rootItem.level);
                $(".menu-three-level").removeClass("active");
                $(".menu-three-level." + rootItem.hash.substring(1)).addClass("active");
            }
        }

        function renderSubMenu(level, baseItem) {
            var levelItem = _.find(menu, function (item) {
                return item.parent == baseItem.hash && item.path == baseItem.path;
            });
            $(".menu-" + level + "-level").removeClass("active");
            if (levelItem) {
                if (level == "two") {
                    renderSubMenu("three", levelItem);
                    //forward/backward support
                    triggerMenuClick(levelItem.hash, level);
                }
                $(".menu-" + level + "-level." + levelItem.hash.substring(1)).addClass("active");
            }
        }

        /**
         * not using live binding for performance consideration
         * @method triggerMenuClick
         * @param {String} hash
         */
        function triggerMenuClick(hash, level) {
            $obj = $(".menu-two-level." + hash.substring(1));
            var levelArr = ['3', 'three', '2', 'two'];
            if (_.indexOf(levelArr, level) != -1 && $obj.hasClass('active')) {
                return;
            }

            $obj.siblings().removeClass('active');
            $obj.addClass('active');

            $obj.siblings().not('.menu-two-level').slideUp();
            $obj.next().has('ul li').slideDown();
        }

        function init() {
            menuVM = new MenuVM();
        }

        function findMenu(hashVal) {
            hashVal = hashVal || window.location.hash;
            var loggedIn = getIsLoggedin();
            return _.filter(menu, function (item) {
                return (hashVal == item.hash && ((item.requireLogin && loggedIn) || !item.requireLogin));
            });
        }

        function rebuild() {
            var loggedIn = getIsLoggedin();
            var mainMenu = _.filter(menu, function (item) {
                return (item.level == '1' && ((item.requireLogin && loggedIn) || !item.requireLogin) && item.hash != "#login");
            });
            menuVM.mainMenu(mainMenu);
            menuVM.loggedIn(loggedIn);

            calcMainMenuWidth(menuVM.mainMenu().length);
            menuVM.showMenu(loggedIn || displayMenuWhenLogout);
            $("#nav").translate();
        }

        function calcMainMenuWidth(mainMenuLength) {
            var mainMenuWidth = 100 / mainMenuLength;
            $('ul#list-nav li').each(function () {
                $(this).css('width', mainMenuWidth + '%');
            });
        }

        function getIsLoggedin() {
            var loginStatus = service.getLoginStatus();
            return (loginStatus.status == "loggedIn");
        }

        /**
         * 判断目录中是否配置了相应的模块路径
         * @method checkIsMenuExist
         * @param {String} path 文件路径
         */
        function checkIsMenuExist(path) {
            for (var i = 0; i < menu.length; i++) {
                if (menu[i].path == path) {
                    return true;
                }
            }
            return false;
        }

        return {
            init:init,
            refreshMenu:refreshMenu,
            findMenu:findMenu,
            activeSubMenu:activeSubMenu,
            rebuild:rebuild,
            checkIsMenuExist:checkIsMenuExist
        };
    });
