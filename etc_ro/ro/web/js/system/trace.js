/**
 * Created by hewq on 18/04/17.
 */
define([ 'jquery', 'knockout', 'config/config', 'service', 'underscore' ],

    function ($, ko, config, service, _) {
        var intervalID = "";
        var port = -1;

        /**
         * othersViewModel
         * @class othersVM
         */
        function traceVM() {
            var self = this;
            service.bindCommonData(self);
            service.systemSettingHide();
            //start trace button click event
            self.startTrace = function() {

                var url = trim( $("#urlOrIp").val() );
                if (url == "") {
                    showAlert("url_not_null");
                    return false;
                }
                if( trim( $("#port").val() == null ? "" : $("#port").val() ) != ""){
                    port = trim( $("#port").val() );
                }

                clickStyle( 'start' );

                service.execNetworkTools({
					pingTimes: '1',
                    url:url,
                    port: port,
                    subcmd: 1
                },function(){
					setTimeout(writePingToPage, 1000 );
                });

            };

            //stop ping button click event
            self.stopTrace = function() {
                service.execNetworkTools({
                    pingTimes: '1',
                    url: '',
                    subcmd: 1
                },function(){
                    setTimeout( function(){
                        $("#traceData")[0].scrollTop = $("#traceData")[0].scrollHeight;
                        clearInterval( intervalID );
                        clickStyle( 'stop' );
                    } , 1000 );
                });

            };

        }

        function clickStyle( btn ){
            var flag = false;
            if( btn == "start"){
                $("#traceData").text("");
                flag = true;
            }

            $("#startTrace").attr("disabled",flag);
            $("#stopTrace").attr("disabled",!flag);
            $("#port").attr("disabled",flag);
            $("#urlOrIp").attr("disabled",flag);

        }
		var countSame = 0;
        //get ping data into page
        function writePingToPage(){
        	var $traceData = $("#traceData");
			countSame = 0;
			$traceData[0].scrollTop = $traceData[0].scrollHeight;
	        $traceData.val( getTextData("/data/trace.html") );
			intervalID = setInterval( function () {
				if( $traceData.val() == getTextData("/data/trace.html"))
				{
					countSame++;
					if(countSame>2)
					{
						clearInterval( intervalID );
                    	clickStyle( 'stop' );
					}
				}
				else
				{
					countSame = 0;
					$traceData[0].scrollTop = $traceData[0].scrollHeight;
	        		$traceData.val( getTextData("/data/trace.html") );
				}
			} , 3000 );
        }
        /**
         * 初始化 ViewModel，并进行绑定
         * @method init
         */
        function init() {
            if(this.init){
                getRightNav(SYSTEM_SETTINGS_COMMON_URL);
                getTabsNav(NETWORK_TOOLS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = new traceVM();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init:init
        }
    });

