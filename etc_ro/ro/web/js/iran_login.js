define(['jquery', 'knockout', 'config/config', 'service', 'underscore', 'config/menu', "logout"],
    function ($, ko, config, service, _, menu, logout) {
        var container = $('#container')[0];

        function loginVM(){
            var self= this;
            $("#langLogoBar").hide();
            $("#language").hide();
            $("#topContainer").hide();
            self.login = function(){
                if(trim($("#iran_name").val()) == ""){
                    alert("رنام حساب نمیتواند خالی باشد");
                    return false;
                }
                 if(trim($("#iran_password").val()) == ""){
                    alert("رمز عبور نمی تواند خالی باشد");
                    return false;
                }
                  service.login({
                    password: $("#iran_password").val(),
                    username: $("#iran_name").val(),
                    CSRFToken: self.CSRFToken
                }, function (data) {
                    if(data.result){
                        window.location = "?t=" + Math.floor(Math.random() * 10000000) + "#home";
                        logout.init();
                    }else{
                        alert("رمز عبور نمی تواند خالی باشد");
                    }
                });
                
            }




        };

    	function init(){
            ko.cleanNode(container);
            var vm = new loginVM();
            ko.applyBindings(vm, container);
             
    	}

    	return {
            init: init
        };
    });