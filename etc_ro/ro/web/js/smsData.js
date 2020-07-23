define(function () {
	var phonebookSize = 10 + getRandomInt(30);
    var smsSize = 50 + getRandomInt(30);
	var phones = generatePhoneNumber();
	var startId = getRandomInt(100);
	//tag: inbox（0已读，1未读)，outbox(2发送成功，3发送失败)
	var tags = ["0", "1", "2", "3"];
	/* [ "60", "0;0;0", "nv", [ "1", "1", "3", "5", "5" ][getRandomInt(4)],
		phones[getRandomInt(phonebookSize)], "1", "2", "3", "1;2;3", "3", "5218", "", "2", "0", getRandomMessage(),
		"", "0", "2012", "05", "30", "11", "55", "15", "" ] */
	var smsData = [];
	
	function getRandomMessage(){
		var chars = "abcdefjhigklmnopqrstuvwxyz";
		var maxwords = 100 - getRandomInt(50);
		var msg = "";
        for(var i = 0; i < maxwords; i++){
            var wordLen = 3 + getRandomInt(5);
            var word = '';
            for(var j = 0; j < wordLen; j++){
                word += chars.charAt(getRandomInt(chars.length - 1));
            }
            msg += word + (maxwords / 10 == 0 ? '.' : '') + ' ';
        }
		return encodeMessage(msg);
	}
	
	function generatePhoneNumber(){
    	var nums = [];
    	for(var i = 0; i < phonebookSize; i++){
        	var num = ["135", "137", "138"][getRandomInt(2)] + (100000000 - getRandomInt(100000000));
        	if($.inArray(num, nums) != -1){
        		i--;
        	}else{
        		nums.push(num);
        	}
        }
    	return nums;
    }
	
	function generateOneSms(inner){
		var d = new Date();
		var idx = getRandomInt(phonebookSize - 1);
		var status = inner ? [ "0", "0", "1", "2", "2" ][getRandomInt(4)] : "1";
        var theNumber = !!inner ? phones[idx] : (getRandomInt(1) == 0 ? phones[idx] : getRandomInt(1000000000) + 20000000000 + "");
		var newOne = [startId + smsData.length,"0;0;0","nv",status,theNumber,"1","2","3","1;2;3","3","9632","","2","0",getRandomMessage(),"","0",d.getFullYear().toString().substring(2,4),(d.getMonth() + 1),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),"",''];
		smsData.push(newOne);
		return newOne;
	}

	var smsInited = false;
	function addNewSms(inner){
		if(!smsInited){
			for(var i = 0; i < smsSize; i++){
				generateOneSms(inner);
			}
			smsInited = true;
		}
		return array2Json(generateOneSms(inner));
	}
	
	function storeSms(msg){
		var d = new Date();
		var newOne = [startId + smsData.length,"0;0;0","nv",msg.tag,msg.number,"1","2","3","1;2;3","3","9632","","2","0",msg.content,"","0",d.getFullYear(),(d.getMonth() + 1),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),"", msg.groupId];
		smsData.push(newOne);
		return array2Json(newOne);
	}
	
	function deleteSms(ids){
		smsData = $.grep(smsData, function(n, i){
    		return $.inArray(n[0] + "", ids) == -1;
    	});
	}
	
	function deleteAllSmsData(){
		smsData = [];
		smsInited = true;
	}
	
	function setSmsRead(params){
		var ids = params.msg_id.split(";");
    	$.map(smsData, function(n){
    		if($.inArray(n[0] + "", ids) != -1){
    			n[3] = "0";
    		}
    	});
	}
	
	function getPhoneNumbers(){
		return phones;
	}
	
	function array2Json(n){
		var msg = {
			id: n[0],
			Mem_Store: n[2],
			Tag: n[3],
			Number: n[4],
			Cc_Total: n[7],
			Content: n[14],
			Year: n[17],
			Month: n[18],
			Day: n[19],
			Hour: n[20],
			Minute: n[21],
			Second: n[22],
			groupId: n[24]
		};
		return msg;
	}
	
	//"id","ind","Mem_Store","Tag","Number","Cc_Sms","Cc_Ref","Cc_Total","Cc_Seq","Cc_Num","Cc_Content",
	//"Language","Tp_Dcs","Msg_Ref","Content","sms_date","Sms_Report_Recived",
	//"Year","Month","Day","Hour","Minute","Second","TimeZone"
	function getConvertedSmsData(){
		if(!smsInited && smsData.length == 0){
			for(var i = 0; i < smsSize; i++){
				generateOneSms("inner");
			}
			smsInited = true;
		}
		var messages = [];
		for(var i = 0; i < smsData.length; i++){
			messages.push(array2Json(smsData[i]));
		}
		return messages;
	}
	
	return {
		getConvertedSmsData : getConvertedSmsData,
		getPhoneNumbers : getPhoneNumbers,
		addNewSms : addNewSms,
		storeSms : storeSms,
		getSmsMaxId : function(){return startId + smsData.length},
		deleteSms : deleteSms,
		setSmsRead : setSmsRead, 
		deleteAllSmsData : deleteAllSmsData
	};
});