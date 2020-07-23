/**
 * sim 模块
 * @module simVM
 * @class simVM
 */
define(['knockout', 'service', 'jquery', 'config/config', 'home', 'opmode/opmode'], function (ko, service, $, config, home, opmode) {

    var resultStr = "";
    function simVM() {
        var self = this;
		self.goformid = ko.observable();
        self.goformidResult = ko.observable();
		self.cmd = ko.observable();
        self.cmdParams = ko.observable("");
        self.goformParams = ko.observable("");
        self.get = function(){
            var params = $.extend({
                    cmd:self.cmd()
                }, self.parseParams(self.cmdParams())); 
            if(self.cmd().indexOf(",")>=0){
                params.multi_data = 1;
            }            
            var data = service.getNvValue(params);
            resultStr = "";            
            self.showResult(data);           
        }
        
        self.set = function(){
            var params = $.extend({
                    goformId:self.goformid()
                }, self.parseParams(self.goformParams()));          
            service.setGoform(params, function(data){
                if(data){
                    resultStr = ""; 
                    self.showResult(data);
                }else{
                    errorOverlay();
                }
            });
        }
        
        self.parseParams = function(paramsStr){
            var dataArray = [];
            if(typeof(paramsStr)=="undefined" || paramsStr == ""){
                return dataArray;
            } 
            var paramsArr = paramsStr.split(",");            
            $.each(paramsArr,function(index){
                var strIndex = paramsArr[index].indexOf(":");
                var key = paramsArr[index].substring(0, strIndex);
                var value = paramsArr[index].substring(strIndex+1);
                dataArray[key] = value;
            });
            return dataArray;
        }
        
        self.showResult = function(data){
            resultStr += "<HR>" + "<br>";
            $.each(data, function (i, item) {
                if( typeof(item)=="object" ){
                    self.showResult(item);
                }else{
                    resultStr += i + " : " + item + "<br>";
                }                
            });
            $("#go").html(resultStr); 
        }
    }



    function init() {
        var container = $('#container')[0];
        ko.cleanNode(container);
        var vm = new simVM();
        ko.applyBindings(vm, container);
        
        $("#goformsetForm").validate({
			submitHandler: function(){
				vm.set();
			}
		});
        
        $("#nvgetForm").validate({
			submitHandler: function(){
				vm.get();
			}
		});
        
    }

    return {
        init:init
    };
});