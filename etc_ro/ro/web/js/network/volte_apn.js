define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {

function APNViewModel(){
		var self = this;
		var apnSettings = service.getAllOnceDatas();
		self.volteAPN =  ko.observable(apnSettings.tz_volte_apn);
		self.volteUrl =  ko.observable(apnSettings.tz_volte_uri_apn);
        if(apnSettings.tz_volte_status == "1"){
            $("#volteUrl_status").attr('data-trans', "volte_registration");
        }else{
            $("#volteUrl_status").attr('data-trans', "volte_Unregistered");
        }



         service.bindCommonData(self);
         service.volteSettingHide();
           var params = {};
            params.goformId = "SET_VOLTE_STATUS";
            service.setVolteStatus(params, function(data){
        });  

		self.save = function(){
            showLoading();
            service.volteApn({
				volteAPN:self.volteAPN(),
				volteUrl:self.volteUrl()
            }, function (data) {
               successOverlay("success_info");
		            showConfirm("restart_confirm", function () {
                    
                    service.restart({}, function (data) {
                        if (data && data.result == "success") {
                             successOverlay();
                        } else {
                            errorOverlay();
                        }
                    }, $.noop);
               });
            });			
			
		};	

}		




		function init() {
	    if(this.init){
            getRightNav(VOLTE_SETTINGS_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

        var container = $('#container');
		ko.cleanNode(container[0]);
		var vm = new APNViewModel();
		ko.applyBindings(vm, container[0]);

		$('#apn_setting_form').validate({
			submitHandler : function() {
                vm.save();
            }
        });
    }
	return {
		init: init
	};








})

