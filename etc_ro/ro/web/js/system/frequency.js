/**
 * Created by hewq on 18/04/17.
 */
define(['jquery', 'knockout', 'config/config', 'service', 'underscore'],

    function ($, ko, config, service, _) {

    	var band_width = 8;
    	
        function BandModel() {
            var info = service.getLockBandInfo();
            var statusInfo = service.getStatusInfo();
            
            var self = this;
            self.band3 = info.band_state == 'yes' && info.band3 == '1';
            self.band28 = ko.observable(info.band_state == 'yes' && info.band28 == '1');
            self.band41 = ko.observable(info.band_state == 'yes' && info.band41 == '1');
            self.bandEnable = info.band_state == 'yes' ? "enable" : "disable";
            self.showSetBands = info.band_state == 'yes';
            self.showEnable = statusInfo.accountPower == "1" || service.itemFuncMode(itemsFuncList.FREQUENCY_HIDE);
            service.bindCommonData(self);
            service.advanceHide();
            service.frequencyHide();
			appendBands();
			appendWcdmaBands();
			appendTdsBands();
			appendGsmBands();
            
            if (info.band_state == 'yes') {
                $(".showSetBands").show();
            } else {
                $(".showSetBands").hide();
            }
            self.clickEnable = function () {
                $(".showSetBands").show();
                return true;
            };
            self.clickDisable = function () {
                $(".showSetBands").hide();
                return true;
            };
            self.setBands = function () {
                $("#setBandsApply").attr('disabled', true);
                var tim = 6;
                var timer = setInterval(function(){
                    tim --;
                    $("#setBandsApply").val(tim+"s");
                    if(tim<=1){            
                        clearInterval(timer);
                    }
                    
                },1000);
                var pingStatus = service.getPinData().pin_status;
                var bandSelected = false;
                var adminPermission = service.getStatusInfo().accountPower == "2";
                $(".bandItems").each(function () {
                    if ($(this).attr("checked") == "checked") {
                        bandSelected = true;
                    }
                });
                /*if (!bandSelected && adminPermission) {
                    showInfo("select_at_least_one_band");
                } else */{
                    service.setLockBandInfo({
                        band_state: self.bandEnable == "enable" ? "yes" : "no",
                        band_list: getBandList(),
                        wcdma_list: getWcdmaList(),
                        tds_list: getTdsList(),
                        zeact: getZeact()
                    }, function (data) {
                        setTimeout(function(){
                            $("#setBandsApply").attr('disabled', false);
                            $("#setBandsApply").val($.i18n.prop("apply"));
                        },5000);
                        if(pingStatus == 1){
                            showConfirm("restart_confirm", function () {
                                showLoading("restarting");
                                service.restart({}, function (data) {
                                    if (data && data.result == "success") {
                                        successOverlay();
                                    } else {
                                        errorOverlay();
                                    }
                                }, $.noop);
                            });
                        }else{
                        if (data.result != undefined && data.result == '0') {
                            showInfo("tz_lock_band_str");
                        }  
                        }
                        
                    });
                }
            };
        }
        function appendBands() {
            var bandList = service.getLockBandInfo();
            var element;
            var m = 0;
            
            for (var p in bandList) {
                if (p == "band_state") continue;
                element = '<div class="col-xs-3">' +
                    '<input type="checkbox" class="bandItems" id="' +
                    p + '" data-bind="checked: ' +
                    ( bandList[p] == 1 ) + ', enable: '+(bandList[p] != 2 && bandList[p] != 3)+'" />' +
                    '<label class="'+(bandList[p]==3?"colorRed":"bandClass")+'">' +
                    p + '</label>' +
                    '</div>';
                $("#bandList").append(element);
				
                m = parseInt(p.substring("band".length));
                m = Math.ceil(m/8);
                if(m > band_width)
                	band_width = m;
            }
        };
        function appendWcdmaBands() {
            var tz_display_3G_band_list = service.getAllOnceDatas().tz_display_3G_band_list;
            var show3Glist=[],coordinate;
            if(service.getPermissionInfo().tz_account_power == "1"){
                tz_display_3G_band_list = "";
            }
            var bins3G = parseInt(tz_display_3G_band_list,16).toString(2);
            var list3G = bins3G.split("").reverse();
            for(var i=0;i<list3G.length;i++){
                if(list3G[i] == "1"){
                    coordinate = i+1;
                    show3Glist.push(coordinate);
                }
            }
            var bandCheck = service.getAllOnceDatas().tz_lock_wcdma_band;
            var bandList = service.getAllOnceDatas().tz_wcdma_bands;
            if((bandList == null) || (bandList == "") || (bandList == undefined) || (bandList == "0,0,0")){
                $(".bandWcdmaList").hide();
                return false;
            }
             var element,twoArr=[],maxNum = 0;
            if(bandList.indexOf(",") >0){
            var data = bandList.split(",");
            var check = bandCheck.split(",");
            var elementText,isChecked,numSum=0;
            var dateStr1,numbers1, sum1 = 0,poww1,dataReverse1,band5Band6;
           for(var i=0;i<data.length;i++){
                numbers1=parseInt(data[i]);
                poww1 = Math.pow(2,i*8);
                numbers1 = numbers1 * poww1; 
                sum1 = sum1 + numbers1;
           }
            dateStr1 = sum1.toString(2);
            dataReverse1 =dateStr1.split("").reverse().join("");
            var dateStr2,numbers2, sum2 = 0,poww2,dataReverse2;
           for(var i=0;i<check.length;i++){

                numbers2=parseInt(check[i]);
                poww2 = Math.pow(2,8*i);
                numbers2 = numbers2 * poww2; 
                sum2 = sum2 + numbers2;
           }
            dateStr2 = sum2.toString(2);
            dataReverse2 =dateStr2.split("").reverse().join("");
            element = "";
            for(var i=0;i<dataReverse1.length;i++){
                if(dataReverse2[i] == 0 || dataReverse2[i] == undefined || dataReverse2[i] == ""){
                    isChecked = false;
                }else{
                    isChecked = true;
                }
                if(tz_display_3G_band_list.length>0){
                    for(var n=0;n<show3Glist.length;n++){
                    if(dataReverse1[i] ==1){
                        numSum = i+1; 
                        if(numSum ==5){
                            band5Band6=4;
                        }else if(numSum == 6){
                            band5Band6=5;
                        }else if(numSum == 4){
                            band5Band6=6;
                        }else{
                            band5Band6 = numSum;
                        };
                    if(band5Band6 == show3Glist[n]){
                        element+='<span class="col-xs-3">'; 
                        element+='<input class="bandData" type="checkbox" id="'+"band"+numSum+'" data-bind="checked:'+isChecked+'">'; 
                        element+='band';  
                       if(i==5)
                            element+= 5;
                        else if(i==4)
                            element+= 4;
                        else if(i==3)
                            element+= 6;
                        else
                            element+= i+1;
                        element+='</span>';
                    }
                    
                }
                }
            }else{
                    if(dataReverse1[i] ==1){
                        numSum = i+1;

                        element+='<span class="col-xs-3">'; 
                        element+='<input class="bandData" type="checkbox" id="'+"band"+numSum+'" data-bind="checked:'+isChecked+'">'; 
                        element+='band';  
                        if(i==5)
                            element+= 5;
                        else if(i==4)
                            element+= 4;
                        else if(i==3)
                            element+= 6;
                        else
                            element+= i+1;
                        element+='</span>';                
                }
                
            }
                
                
            }
           
                $("#bandWcdmaList").append(element);
                return dataReverse2;
           }
                
        }

        function appendTdsBands() {
            var tz_display_3G_band_list = service.getAllOnceDatas().tz_display_3G_band_list;
            var show3Glist=[],coordinate;
            if(service.getPermissionInfo().tz_account_power == "1"){
                tz_display_3G_band_list = "";
            }
            var bins3G = parseInt(tz_display_3G_band_list,16).toString(2);
            var list3G = bins3G.split("").reverse();
            for(var i=0;i<list3G.length;i++){
                if(list3G[i] == "1"){
                    coordinate = i+1;
                    show3Glist.push(coordinate);
                }
            }
            var bandList = service.getAllOnceDatas().tz_tds_bands;
            var bandCheck = service.getAllOnceDatas().tz_lock_tds_band;
            if((bandList == null) || (bandList == "") || (bandList == undefined) || (bandList == "0,0")){
                $(".bandTdsList").hide();
                return false;
            }

              var element,twoArr=[],maxNum = 0;
            if(bandList.indexOf(",") >0){
            var data = bandList.split(",");
            var check = bandCheck.split(",");
            var elementText,isChecked,numSum=0;
            var dateStr1,numbers1, sum1 = 0,poww1,dataReverse1;
           for(var i=0;i<data.length;i++){
                numbers1=parseInt(data[i]);
                poww1 = Math.pow(2,i*8);
                numbers1 = numbers1 * poww1; 
                sum1 = sum1 + numbers1;
           }
            dateStr1 = sum1.toString(2);
            dataReverse1 =dateStr1.split("").reverse().join("");
            var dateStr2,numbers2, sum2 = 0,poww2,dataReverse2;
           for(var i=0;i<check.length;i++){
                numbers2=parseInt(check[i]);
                poww2 = Math.pow(2,i*8);
                numbers2 = numbers2 * poww2; 
                sum2 = sum2 + numbers2;
           }
            dateStr2 = sum2.toString(2);
            dataReverse2 =dateStr2.split("").reverse().join("");
            element = "";
            for(var i=0;i<dataReverse1.length;i++){
                if(dataReverse2[i] == 0 || dataReverse2[i] == undefined || dataReverse2[i] == ""){

                    isChecked = false;
                }else{
                    isChecked = true;
                }
                if(tz_display_3G_band_list.length>0){
                    for(var n=0;n<show3Glist.length;n++){
                    if(dataReverse1[i] ==1){
                    if(show3Glist[n] ==(i+34)){
                        numSum = i+1;
                        element+='<span class="col-xs-3">'; 
                        element+='<input class="setTds" type="checkbox" id="'+"setTds"+numSum+'" data-bind="checked:'+isChecked+'">'; 
                        element+='band';
                        element+= i+34;
                        element+='</span>';
                    
                   }
                }
            }
                }else{
                    if(dataReverse1[i] ==1){
                        numSum = i+1;
                        element+='<span class="col-xs-3">'; 
                        element+='<input class="setTds" type="checkbox" id="'+"setTds"+numSum+'" data-bind="checked:'+isChecked+'">'; 
                        element+='band';
                        element+= i+34;
                        element+='</span>';
                    
                }
                }
                
            }
           
                $("#bandTdsList").append(element);
           }
        };
        var gsmArr=["GSM900","GSM P900","GSM E900","GSM R900" ];
        var gsmArrAll=["GSM450","GSM480","GSM750","GSM850","","","GSM1800","GSM1900"];
        function appendGsmBands() {
             var bandList = service.getAllOnceDatas().tz_gsm_bands;
                if((bandList == null) || (bandList == "") || (bandList == undefined) || (bandList == 0)){
                $(".bandGsmList").hide();
                return false;
                }
            var element,twoArr=[],maxNum = 0;
          
            var elementText;
            var dateStr,numbers, sum = 0,poww,dataReverse;
                numbers=parseInt(bandList);
                
               maxNum= numbers.toString(2);
           var gsmText,gsmHtml;
            dateStr = sum.toString(2);
            dataReverse =maxNum.split("").reverse().join("");
            element = "";

            if(dataReverse[5]){
                if((dataReverse[4] == 0) && (dataReverse[5] == 0)){
                    gsmText = "";
                }else if((dataReverse[4] == 0) && (dataReverse[5] == 1)){
                    gsmText = gsmArr[1];
                     element+='<span class="col-xs-3">' + gsmText + '</span>';
                }else if((dataReverse[4] == 1) && (dataReverse[5] == 0)){
                    gsmText = gsmArr[2];
                     element+='<span class="col-xs-3">' + gsmText + '</span>';
                }else if((dataReverse[4] == 1) && (dataReverse[5] == 1)){
                    gsmText = gsmArr[3];
                     element+='<span class="col-xs-3">' + gsmText + '</span>';
                }
               
            }    
            
            for(var i=0;i<dataReverse.length;i++){
                if((i==4) || (i==5)){
                   
                }else{
                    if(dataReverse[i] ==1){ 
                    element+='<span class="col-xs-3">'; 
                    element+=gsmArrAll[i];
                    element+='</span>';
                }
                }
                
            }
            
           
                $("#bandGsmList").append(element);
           
            
        }
        function lockBands() {
            var lockBandsBit = createBandsBit(band_width*8);
            var bit;

            $(".bandItems").each(function () {
                if ($(this).attr("checked") == "checked") {
                    bit = this.id.substring(4);
                    lockBandsBit = replaceBit(lockBandsBit, lockBandsBit.length - +bit);
                }
            });
            return lockBandsBit;
        }
        function lockWcdma() {
            var lockBandsBit = createBandsBit(24);
            var bit;

            $(".bandData").each(function () {
                if ($(this).attr("checked") == "checked") {
                    bit = this.id.substring(4);
                    lockBandsBit = replaceBit(lockBandsBit, lockBandsBit.length - +bit);
                }
            });
            return lockBandsBit;
        }
        function lockTds() {
            var lockBandsBit = createBandsBit(16);
            var bit;

            $(".setTds").each(function () {
                if ($(this).attr("checked") == "checked") {
                    bit = this.id.substring(6);
                    lockBandsBit = replaceBit(lockBandsBit, lockBandsBit.length - +bit);
                }
            });
            return lockBandsBit;
        }

        function getBandList() {
            return formatLockBands(lockBands());
        }
        function getWcdmaList() {
            return formatWcdmaTds(lockWcdma());
        }
         function getTdsList() {
            return formatWcdmaTds(lockTds());
        }
        function getZeact() {
            var zeact = 0;
            var fdd;
            var tdd;
            var bandList = lockBands();
            fdd = bandList.substring(bandList.length - 25);
            tdd = bandList.substring(bandList.length - 43, bandList.length - 32);
            if (fdd.indexOf("1") != -1) {
                zeact = 1;

                if (tdd.indexOf("1") != -1) {
                    zeact = 2;
                }
            }
            return zeact;
        }

        function formatLockBands(lockBandsBit) {
            var lockBandsArr = [];
            var arrLength;
            arrLength = lockBandsBit.length / 8;
            for (var i = 0; i < arrLength; i++) {
                lockBandsArr[i] = parseInt(lockBandsBit.substr(i * 8, 8), 2);
            }
            return lockBandsArr.reverse().join(",");
        }
        function formatWcdmaTds(lockBandsBit) {
            var lockBandsArr = [];
            var arrLength;
            arrLength = lockBandsBit.length / 8;
            for (var i = 0; i < arrLength; i++) {
                lockBandsArr[i] = parseInt(lockBandsBit.substr(i * 8, 8), 2);
            }
            return lockBandsArr.reverse().join(",");
        }
        function createBandsBit(bitNum) {
            var bandsBit = "";
            for (var i = 0; i < bitNum; i++) {
                bandsBit += "0";
            }
            return bandsBit;
        }

        function replaceBit(str, bit) {
            var sFrontPart = str.substring(0, +bit);
            var sTailPart = str.substring(+bit + 1);
            return sFrontPart + "1" + sTailPart;
        }

        function init() {
            if(this.init){
                getRightNav(ADVANCE_SETTINGS_COMMON_URL);
                getInnerHeader(INNER_HEADER_COMMON_URL);
            }

            var vm = new BandModel();
            ko.applyBindings(vm, $('#container')[0]);
        }

        return {
            init: init
        }
    });