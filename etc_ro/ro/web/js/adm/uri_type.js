/**
 * DDNS设置模块
 * @module DDNS
 * @class DDNS
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {
    var ddnsSetModes = _.map(config.DDNSSetMode, function(item) {
        return new Option(item.name, item.value);
    });

    
    /**
     * DDNS设置view model
     * @class ddnsViewModel
     */
    function DdnsViewModel(){
        var self = this;
        
        service.bindCommonData(self);
        service.volteSettingHide(); 
        var data = service.getDdnsParams();
        var tz_uri_type= service.getAllOnceDatas();
        self.ddnsSetModes = ko.observableArray(ddnsSetModes);
        self.currentMode = ko.observable(tz_uri_type.tz_uri_type);
        

        /**
         * 提交
         * @method apply
         */
        self.apply = function() {
            showLoading();
            var params = {};
            params.goformId = "URI_TYPE";
            params.tz_uri_type = self.currentMode();
             service.setUriType(params, function(result) {
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
            }
        });
    }
    
    return {
        init: init
    };
});