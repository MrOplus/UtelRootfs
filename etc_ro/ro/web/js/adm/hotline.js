/**
 * DDNS设置模块
 * @module DDNS
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
    /**
     * DDNS设置view model
     * @class ddnsViewModel
     */
   var  reg =/^[0-9\#\*]*$/;
    function DdnsViewModel(){
        var self = this;
        var info = service.getAllOnceDatas();
         self.port = ko.observable(info.dialog_hotline_str);
         self.save = function() {
            var value = $("#port").val();
            if(!reg.test(value) == true){
                alert("Error of input rule");
                return false;
            }
            showLoading('waiting');
            service.hotlineSettings({
                dialog_hotline_str:self.port()
            }, function(result) {
                if (result.result == "success") {
                     successOverlay();
                } else {
                    errorOverlay();
                }
            });
        }
        self.submitApply = function(){

             self.save();
        }
        service.bindCommonData(self);
        service.volteSettingHide();
        /**
         * 提交
         * @method apply
         */
        self.apply = function() {
            showLoading();
            var params = {};
            params.goformId = "DDNS";
            params.DDNS_Enable = self.currentMode();
            

            service.setDDNSForward(params, function(result) {
                if (result.result == "success") {
                    successOverlay();
                    data = service.getDdnsParams();
                } else {
                    errorOverlay();
                }
            });         
        };   
}
    /**
     * 初始化
     * @method init
     */
    function init() {
        if(this.init){
            getRightNav(VOLTE_SETTINGS_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new DdnsViewModel();
        ko.applyBindings(vm, container[0]);
    
        $("#ddnsForm").validate({
            submitHandler: function(){
                vm.apply();
            },
            rules: {
                port:{
                    port:true
                }    
            }
        });
    }
     
    return {
        init: init
    };
});