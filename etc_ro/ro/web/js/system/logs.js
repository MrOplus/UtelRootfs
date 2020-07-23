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
            startRequest("Informative");
            //start trace button click event
            self.startTraceLogs = function() {

               

                clickStyle( 'start' );

                var logs_leve = $("#ddnsSetMode").val();
                service.LogsNetworkTools({
                    logs_lev: logs_leve
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
        function startRequest(logs_leve){
            service.LogsNetworkTools({
                    logs_lev: logs_leve
                },function(){
                    setTimeout(writePingToPage, 1000 );
            });
        };

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
            $traceData.val( getTextData("/data/logs.html") );
            intervalID = setInterval( function () {
                if( $traceData.val() == getTextData("/data/logs.html"))
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
                    $traceData.val( getTextData("/data/logs.html") );
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

