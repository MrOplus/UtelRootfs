/**
 * @module prot_forward
 * @class prot_forward
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

function($, ko, config, service, _) {
	function RateLimitVM() {
        var self = this;
        var info = getFlowSwitch();
        // var getFlow = service.getFlow();
        var getFlow = service.getFlow();
        var info2 = service.getFirewallSwitch().firewall_switch;
        self.isHideFirewall = ko.observable(true);
        if(info2 == "0"){
            self.isHideFirewall(false);
        }
        self.port_settings = ko.observable(info.tz_traffic_share_switch == "1" ? true : false);
        if(self.port_settings() == false){
            $("#staticIpDiv").hide();
        }
        // self.staticIpHandle = function(enable){
        //     enable == '1' ? $("#staticIpDiv").show() : $("#staticIpDiv").hide();
        //     return true;
        // }
        self.isShowStaticIpDiv =ko.observable(self.port_settings() == "1");
        service.bindCommonData(self);
        service.firewallHide();
        if(self.port_settings() == true){
            var array=[];
        var index = getFlow[0].index;
        var elements = "",checkedTrue="",flowData='',flagTr=false,flagFl=false;
         elements += '<tr class="flowTr"><th class="flowTh">MAC</th><th class="flowTh">IP</th><th class="flowTh" data-trans="all_flow"></th><th class="flowTh" data-trans="flow_setting"></th><th class="flowTh" data-trans="flow_switch"></th><th class="flowTh" data-trans="flow_clear"></th></tr>';
        for(var i=0;i<index;i++){
            array.push(getFlow[i+1]);
            checkedTrue = array[i].status;
            if(checkedTrue==1){
                flagTr ="checked";
              
            }else{
                flagFl ="checked";
            };
            flowData=array[i].volume/1024/1024;
            elements +='<tr class="flowTr">';
            elements +='<td class="mac'+i+'">'+array[i].mac+'</td>';
            elements +='<td class="ip'+i+'">'+array[i].ip+'</td>';
            elements +='<td class="allFlow'+i+'">'+ formatByteArray(array[i].flow)+'</td>';
            elements +='<td><input type="text" maxlength="8" name="flowSet" style="height:24px;width:70px;" class="flowSet'+i+'" value="'+flowData+'">&nbsp; MB</td>';
            elements +='<td class="check'+i+'"><input type="radio" value="1" name="enable'+i+'" class="radio'+i+'"'+flagTr+'><span>ON</span>&nbsp;<input type="radio" value="0" name="enable'+i+'" class="radio'+i+'" '+flagFl+'><span>OFF</span></td>';
            elements +='<td><input type="submit" style="height:24px;" class="clear" id="'+i+'" value="Clear" data-bind="click:function(){clearData('+i+')}"></td>';
            elements +='</tr>';    
        }
        $("table").append(elements);
        }
        self.clearData = function(data){
            showLoading();
            $(".allFlow"+data).text("");
            var params={};
            params.mac = $(".mac"+data).text();
            service.setCleanFlow(params,function(result){
            if (result.result == "success") {
                    setTimeout(function(){
                        successOverlay();
                    },3500);
                } else {
                    errorOverlay();
                }
        })
        }
        var reg = /^[0-9]{0,8}$/;
        var flowSet;
        self.apply = function(){     
           var params={};
           var str1="",flag="";
              for(var i=0;i<array.length;i++){
                if(reg.test($(".flowSet"+i).val()) == false){
                    showAlert("must_input_integers");
                    return false;
                }
                 showLoading();
                 if($(".flowSet"+i).val() == ""){
                    flowSet = 0;
                 }else{
                    flowSet = $(".flowSet"+i).val();
                 }
               flag = $('input[name="enable'+i+'"]:checked').val();
                     str1 += "[";
                     str1 += $(".mac"+i).text();
                     str1 += ",";
                     str1 += flowSet;
                     str1 += ",";
                     str1 += flag;
                     str1 += "]";
              }
              params.str1 =str1;
            service.setFlow(params,function(result){
            if (result.result == "success") {
                   setTimeout(function(){
                        successOverlay();
                    },3500)
                } else {
                    errorOverlay();
                }
        })
        };
        self.click1 = function(){
            showLoading();
            var params = {};
            params.tz_traffic_share_switch = self.port_settings() == true ? "1" : "0";
            params.CSRFToken = self.CSRFToken;
            service.enableFlowSwitch(params, function(result){
                if (result.result == "success") {
                        successOverlay();
                        setTimeout(function(){
                            location.reload();
                        },2000)
                } else {
                    errorOverlay();
                }
            });
        }

    }
    function getFlowSwitch() {
        return service.getAllOnceDatas();
    }
    function formatByteArray(arr) {
        var KB = 1024;
        var MB = 1024*1024;
        var GB = 1024*1024*1024;
        if(arr<KB){
            return arr + " B";
        }else if((arr>=KB)&&(arr<MB)){
            return (arr/KB).toFixed(2) + " KB";
        }else if((arr>=MB)&&(arr<GB)){
             return (arr/MB).toFixed(2) + "MB";
        }else{
            return (arr/GB).toFixed(2) + "GB";
        }
    }
	function init(vm) {
        if(this.init){
            getRightNav(FIREWALL_COMMON_URL);
            getInnerHeader(INNER_HEADER_COMMON_URL);
        }

		vm = new RateLimitVM();
        var container = $('#container');
        ko.cleanNode(container[0]);
		ko.applyBindings(vm, container[0]);

        $('#rateLimitForm').validate({
            submitHandler : function() {
                vm.apply();
            }
        });
	}

	return {
		init : init
	};
});
