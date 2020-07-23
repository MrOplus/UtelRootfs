
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],
function($, ko, config, service, _) {

    function DdnsViewModel(){

        $("#iframe").append('<iframe frameborder="0" width="98%" height="98%" src="https://mymascomdiy.mascom.bw"></iframe>');
        service.bindCommonData(self);   
        service.advanceHide();
     }
    
    function init() {
        if(this.init){
           getRightNav(ADVANCE_SETTINGS_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }
        var container = $('#container');
        ko.cleanNode(container[0]);
        var vm = new DdnsViewModel();
         ko.applyBindings(vm, container[0]);
    }
     
    return {
        init: init
    };
});