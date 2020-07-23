/**
 * 参数配置
 * @module config
 * @class config
 */
define(function() {
	var config = {
        VERSION: "p21k", //设备版本
        IS_TEST: zte_web_ui_is_test, //配置是否是模拟数据
        PRODUCT_TYPE: 'UFI',// 产品类型DATACARD、UFI、CPE。 DOC: 8.2
        HAS_LOGIN:true,//是否有登录页面
        LOGIN_THEN_CHECK_PIN: true, //是否先登录后验证PIN，PUK
        defaultRoute : '#index_status',
        LOGIN_SECURITY_SUPPORT: true, //是否支持登录安全
        MAX_LOGIN_COUNT: 5,//最大登录次数，密码输入错误次数到了以后会账户冻结一定时间
        GUEST_HASH: ['#httpshare_guest'],
        INCLUDE_MOBILE: true,
        DEVICE: 'ufi',//各个型号机配置文件路径
        PASSWORD_ENCODE: true,//登录密码和WIFI密码是否加密
        EMPTY_APN_SUPPORT: false,//是否支持空apn
        FAST_BOOT_SUPPORT: true, //是否支持快速开机
        TURN_OFF_SUPPORT: true, //是否支持关机
        HAS_CASCADE_SMS: true,//是否支持级联短信
        HAS_FOTA: true,//是否支持FOTA
		HAS_UPDATE_CHECK: true,//是否支持升级检测设置
		ISNOW_NOTICE:false,//FOTA是否正在提示有新版本
        HAS_MULTI_SSID: false,//多ssid功能
        HAS_WIFI: true,  //是否包含wifi功能
        HAS_BATTERY: true, //是否有电池
        SHOW_MAC_ADDRESS: false, //是否显示mac地址
        IPV6_SUPPORT: true, //是否支持ipv6
        IPV4V6_SUPPORT: true, //是否支持ipv4v6。 IPV4V6_SUPPORT和IPV4_AND_V6_SUPPORT不可同时为true.单PDP双栈
        IPV4_AND_V6_SUPPORT: false, //是否支持IPv4 & v6。 双PDP双栈
        TRAFFIC_SUPPORT: true, //是否支持流量功能
        CLEAR_DATA_SUPPORT: false, //是否支持流量和时间清空功能
        USE_IPV6_INTERFACE:true,//使用IPV6相关新接口。使用方法，例如使用MF92时，设置为false。
        MAX_STATION_NUMBER: 32, //CPE WIFI最大连接数为32
        NETWORK_UNLOCK_SUPPORT:false,//是否支持解锁
        WIFI_BAND_SUPPORT: false, //是否支持wifi频段设置
        WIFI_BANDWIDTH_SUPPORT: false, //是否支持频带宽度
		WIFI_BANDWIDTH_SUPPORT_40MHZ: false, //频带宽度是否支持40MHZ,reltek芯片支持，博通芯片不支持
        WIFI_SUPPORT_QR_CODE: true, //是否支持wifi二维码显示,新立MDM9x15、MDM9x25、MTK平台uFi项目上，默认支持WiFi二维码。
		WIFI_SUPPORT_QR_SWITCH: false, //是否支持wifi二维码显示控制。
        WIFI_SWITCH_SUPPORT: true, //是否支持wifi开关
        WIFI_SLEEP_SUPPORT: true, // 是否支持wifi休眠
		WIFI_WEP_SUPPORT:false,//是否支持wifi WEP加密
        WIFI_HAS_5G:false,
        SHOW_WIFI_AP_ISOLATED: false, // 是否显示AP隔离
        STATION_BLOCK_SUPPORT: false, // 已连接设备是否支持Block功能
        UPGRADE_TYPE:"FOTA",//取值有"NONE","OTA","FOTA","TWO_PORTION"
        ALREADY_NOTICE:false,//是否已经提醒，有在线升级信息
        HAS_OTA_NEW_VERSION:false,//是否有OTA升级的新版本
        ALREADY_OTA_NOTICE:false,//是否OTA升级提醒过
        AP_STATION_SUPPORT:false,//是否支持AP Station功能
        AP_STATION_LIST_LENGTH:10,
        TSW_SUPPORT: false, // 是否支持定时休眠唤醒
        HAS_PHONEBOOK:true,//是否有电话本功能
        HAS_SMS:true,//是否有短信功能
        SMS_DATABASE_SORT_SUPPORT: true,//短信是否支持DB排序
        SHOW_UN_COMPLETE_CONCAT_SMS: true,//级联短信未接收完是否显示相关级联短信
        SMS_UNREAD_NUM_INCLUDE_SIM: false,//未读短息数量是否包含SIM侧
        SMS_SET_READ_WHEN_COMPLETE: false,//PX-877 聊天过程中，级联短信只有接受完成后才能自动设置为已读
		SMS_MATCH_LENGTH: 8,//短信联系人号码匹配位数，11国内项目，8国际项目
        SD_CARD_SUPPORT: false,//是否支持SD卡
        WEBUI_TITLE: '4G Hostless Modem', //title配置, 具体参考各设备下的配置
        //modem_main_state的临时状态，一般需要界面轮询等待
        TEMPORARY_MODEM_MAIN_STATE:["modem_undetected", "modem_detected", "modem_sim_state", "modem_handover", "modem_imsi_lock", "modem_online", "modem_offline"],
        SHOW_APN_DNS:false,//APN设置页面是否显示DNS，不显示则dnsMode默认设置为auto
        HAS_PARENTAL_CONTROL: false, // 是否支持家长控制功能,
        HAS_USSD:false,// 是否支持USSD功能,
        HAS_URL:false,// 是否支持URL过滤,
        HAS_USB: false, //是否支持UART和串口设置		
        connect_flag: false,
        RJ45_SUPPORT:false,//是否支持rj45
		HAS_QUICK_SETTING:true,//是否支持快速设置
		HAS_SNTP: true, //是否支持时间管理
		HAS_BLACK_AND_WHITE_FILTER: false, //是否支持黑白名单
		HAS_NATIVE_UPDATE: false,//是否支持本地升级，如果支持本地升级则会隐藏FOTA升级功能
		NATIVE_UPDATE_FILE_SIZE: 64,//支持的本地升级文件大小上限,单位为M
		DDNS_SUPPORT: true,//DDNS
		TR069_SUPPORT: false,//TR069
        CONTENT_MODIFIED:{
            modified:false,
            message:'leave_page_info',
            data:{},
            checkChangMethod:function () {
                return false;
            },
            callback:{ok:$.noop, no:function () {
                return true;
            }}//如果no返回true,页面则保持原状
        }, //当前页面内容是否已经修改

        resetContentModifyValue:function () {
            this.CONTENT_MODIFIED.checkChangMethod = function () {
                return false;
            };
            this.CONTENT_MODIFIED.modified = false;
            this.CONTENT_MODIFIED.message = 'leave_page_info';
            this.CONTENT_MODIFIED.callback = {ok:$.noop, no:function () {
                return true;
            }};//如果no返回true,页面则保持原状
            this.CONTENT_MODIFIED.data = {};
        },

        /**
         * 端口转发最大规则数
         * @attribute {Integer} portForwardMax
         */
        portForwardMax: 10,
		/*
		 *URL filter最大规则数
		 *
		*/
		urlFilterMax: 10,
		
        /**
         * 出厂设置默认APN的个数
         * @attribute {Integer} defaultApnSize
         */
        defaultApnSize:1,
        /**
         * 最大APN个数
         * @attribute {Integer} maxApnNumber
         */
        maxApnNumber: 10,
		NETWORK_MODES : [ {
			name : '802.11 b/g/n',
			value : '4'
		}, {
			name : '802.11 n only',
			value : '2'
		}  ],
        NETWORK_MODES_TOZED : [ {
            name : '802.11 b/g/n',
            value : '4'
        }, {
            name : '802.11 n only',
            value : '2'
        }, {
            name : '802.11 b only',
            value : '0'
        }, {
            name : '802.11 g only',
            value : '1'
        }  ],
		NETWORK_MODES_BAND : [ {
			name : '802.11 a only',
			value : '5'
		}, {
			name : '802.11 n only',
			value : '2'
		}, {
			name : '802.11 a/n',
			value : '4'
		} ],
        /**
         * wifi加密模式
         * @attribute  AUTH_MODES AUTH_MODES_WEP AUTH_MODES_ALL
         */		
    	AUTH_MODES : [  {
        	name: 'NO ENCRYPTION',
        	value: 'OPEN'
        }, {
            name : 'WPA2-PSK(AES)',
            value : 'WPA2PSK'
        },{
        	name : 'WPA/WPA2-PSK(TKIP/AES)',
        	value : 'WPAPSKWPA2PSK'
        } ],
		AUTH_MODES_WEP : [  {
        	name: 'NO ENCRYPTION',
        	value: 'OPEN'
        },
        //     {
        //     name : 'SHARED',
        //     value : 'SHARED'
        // },
            {
            name : 'WPA2-PSK(AES)',
            value : 'WPA2PSK'
        },{
        	name : 'WPA/WPA2-PSK(TKIP/AES)',
        	value : 'WPAPSKWPA2PSK'
        } ],
        AUTH_MODES_ALL : [  {
            name: 'NO ENCRYPTION',
            value: 'OPEN'
        }, {
            name : 'SHARED',
            value : 'SHARED'
        }, {
            name : 'WPA-PSK',
            value : 'WPAPSK'
        }, {
            name : 'WPA2-PSK',
            value : 'WPA2PSK'
        }, {
            name : 'WPA-PSK/WPA2-PSK',
            value : 'WPAPSKWPA2PSK'
        }, {
            name : 'EAP-SIM/AKA',
            value : 'EAP-SIM/AKA'
        } ],
        /**
         * 语言
         * @attribute  LANGUAGES
         */	
        LANGUAGES: [ { 
        	name: 'English',
        	value: 'en'
        }, {
            name: 'Español',
            value: 'el'
        },{
            name: '中文',
            value: 'zh-cn'
        },{ 
            name: 'Français',
            value: 'fr'
        },{ 
            name: 'German',
            value: 'ge'
        },{ 
            name: 'Italian',
            value: 'it'
        },{ 
            name: 'Portuguese',
            value: 'po'
        },{ 
            name: 'Danish',
            value: 'da'
        },{ 
            name: 'Norsk',
            value: 'no'
        },{ 
            name: 'Swedish',
            value: 'sw'
        },{ 
            name: 'Hungrian',
            value: 'hu'
        },{ 
            name: 'Polish',
            value: 'poli'
        },{ 
            name: 'Czech',
            value: 'cz'
        },{ 
            name: 'Croatian',
            value: 'cr'
        },{ 
            name: 'Bulgarian',
            value: 'bu'
        },{ 
            name: 'Russian',
            value: 'ru'
        },{ 
            name: 'Ukrainian',
            value: 'uk'
        }  ],
        /**
         * modem联网模式
         * @attribute  AUTO_MODES
         */	        
        AUTO_MODES: [ {
        	name: 'Automatic',
        	value: 'WCDMA_preferred'
        }, {
        	name: '3G Only',
        	value: 'Only_WCDMA'
        }, {
        	name: '2G Only',
        	value: 'Only_GSM'
        } ],
        /**
         * APN鉴权模式
         * @attribute  APN_AUTH_MODES
         */	
		APN_AUTH_MODES : [ {
			name : "NONE",
			value : "none"
		}, {
			name : "CHAP",
			value : "chap"
		}, {
			name : "PAP",
			value : "pap"
		} ],
        /**
         * 短信保存时间
         * @attribute  SMS_VALIDITY
         */
        SMS_VALIDITY: [ {
            name: '12 hours',
            value: 'twelve_hours'
        }, {
            name: 'A day',
            value: 'one_day'
        }, {
            name: 'A week',
            value: 'one_week'
        }, {
            name: 'The longest period',
            value: 'largest'
        }],
        /**
         * 休眠时间
         * @attribute  SLEEP_MODES
         */
        SLEEP_MODES : [ {
            name : "Always on",
            value : "-1"
        }, {
            name : "5 minutes",
            value : "5"
        }, {
            name : "10 minutes",
            value : "10"
        }, {
            name : "20 minutes",
            value : "20"
        }, {
            name : "30 minutes",
            value : "30"
        }, {
            name : "1 hour",
            value : "60"
        }, {
            name : "2 hours",
            value : "120"
        } ],
        /**
         * 端口转发协议
         * @attribute  FORWARD_PROTOCOL_MODES
         */
        FORWARD_PROTOCOL_MODES: [ {
            name : "TCP+UDP",
            value : "TCP&UDP"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }],

        MAP_PROTOCOL_MODES: [ {
            name : "TCP+UDP",
            value : "TCP&UDP"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }],

        FILTER_PROTOCOL_MODES: [ {
            name : "NONE",
            value : "None"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }, {
            name : "ICMP",
            value : "ICMP"
        }],
        /**
         * HTTPSHARE模式
         * @attribute  SD_SHARE_ENABLE
         */
        SD_SHARE_ENABLE: [ {
            name : "Enable",
            value : "1"
        }, {
            name : "Disable",
            value : "0"
        }],

        SD_FILE_TO_SHARE: [ {
            name : "entire_sd_card",
            value : "1"
        }, {
            name : "custom_setting",
            value : "0"
        }],

        SD_ACCESS_TYPE: [ {
            name : "entire_sd_card",
            value : "1"
        }, {
            name : "custom_setting",
            value : "0"
        }],

        DLNA_LANGUAGES: [ {
            name: 'english',
            value: 'english'
        }, {
            name: 'chinese',
            value: 'chinese'
        } ],
		DDNSSetMode :  [{
            name: 'Enable',
            value: '1'
        }, {
            name: 'Disable',
            value: '0'
        }],
        ddns_Modeselect :  [{
            name: 'manual',
            value: 'manual'
        }, {
            name: 'auto',
            value: 'auto'
        }],
        DDNSDDP :  [{
            name: 'dyndns.org',
            value: 'dyndns.org'
        }, {
            name: 'no-ip.com',
            value: 'no-ip.com'
        }],
        
    	/**
    	 * SD 卡根目录
    	 * @attribute {String} SD_BASE_PATH 
    	 */
        SD_BASE_PATH: '/mmc2',

    	/**
    	 * 数据库中全部的短消息
    	 * @attribute {Array} dbMsgs 
    	 */
    	dbMsgs : [],
    	/**
    	 * 经解析关联后的所有短消息
    	 * @attribute {Array} listMsgs 
    	 */
    	listMsgs : [],

    	/**
    	 * 当前聊天对象的手机号
    	 * @attribute {String} currentChatObject 
    	 */
    	currentChatObject: null,
    	/**
    	 * 短消息最大编号
    	 * @attribute {Integer} maxId 
    	 */
    	smsMaxId : 0,
    	/**
    	 *  电话本记录 
    	 * @attribute {Array} phonebook  
    	 * */
    	phonebook : [],
        /**
         *  缓存短信初始化状态
         * @attribute {Boolean} smsIsReady
         * */
        smsIsReady: false,
        /**
         * 国家码所述类型
         * @attribute {JSON} defaultApnSize
         * @example
         * 2412-2462   1
		 * 2467-2472   2
		 * 2312-2372   4
         */
        countryCodeType : {
        	world: 3,
        	mkkc: 3,
        	apld: 7,
        	etsic: 3,
        	fcca: 1
        },
        
        /**
         * 国家码与类型匹配表
         * @attribute {Map} countryCode
         */
        countryCode : {
			world : [ "AL", "DZ", "AR", "AM", "AU", "AT", "AZ", "BH", "BY",
					"BE", "BA", "BR", "BN", "BG", "CL", "CN", "CR", "HR", "CY",
					"CZ", "DK", "EC", "EG", "SV", "EE", "FI", "FR", "F2", "GE",
					"DE", "GR", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IE",
					"IL", "IT", "JM", "JO", "KZ", "KE", "KP", "KR", "KW", "LV",
					"LB", "LI", "LT", "LU", "MO", "MK", "MY", "MT", "MC", "MA",
					"NL", "AN", "NO", "OM", "PK", "PE", "PH", "PL", "PT", "QA",
					"RO", "RU", "SA", "CS", "SG", "SK", "SI", "ZA", "ES", "LK",
					"SE", "CH", "SY", "TH", "TT", "TN", "TR", "UA", "AE", "GB",
                "UY", "VN", "YE", "ZW", "BD"],
			mkkc : [ "JP" ],
			apld : [],
			etsic : [ "BZ", "BO", "NZ", "VE" ],
			fcca : [ "CA", "CO", "DO", "GT", "MX", "PA", "PR", "TW", "US", "UZ" ]
        },
        countryCode_5g: {
            //88 countries of world【36 40 44 48】
            one: {
                codes: [ "AL", "AI", "AW", "AT", "BY", "BM", "BA", "BW", "IO", "BG",
                    "CV", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GF", "PF",
                    "TF", "GI", "DE", "GR", "GP", "GG", "HU", "IS", "IE", "IT",
                    "KE", "LA", "LV", "LS", "LI", "LT", "LU", "MK", "MT", "IM",
                    "MQ", "MR", "MU", "YT", "MC", "ME", "MS", "NL", "AN", "NO",
                    "OM", "PL", "PT", "RE", "RO", "SM", "SN", "RS", "SK", "SI",
                    "ZA", "ES", "SE", "CH", "TC", "UG", "GB", "VG", "WF", "ZM",
                    "AF", "JO", "MA", "EH", "EU", "DZ", "IL", "MX", "PM", "TN",
                    "TR", "JP" ],
                channels: [36, 40, 44, 48]},
            //60 countrys of world【36 40 44 48 149 153 157 161 165】
            two: {
                codes: [ "AS", "AG", "AZ", "BR", "KH", "KY", "CO", "CR", "DM", "DO",
                    "EC", "GH", "GD", "HK", "KZ", "KI", "FM", "MZ", "NA", "NZ",
                    "NI", "NE", "PW", "PE", "PH", "PR", "VC", "TH", "TT", "UY",
                    "ZW", "AU", "BH", "BB", "CA", "CL", "CX", "EG", "SV", "GT",
                    "HT", "IN", "MY", "NF", "PA", "PG", "SG", "US", "VN" ],
                channels: [36, 40, 44, 48, 149, 153, 157, 161, 165]},
            //9 countrys of world【149 153 157 161】
            three: {
                codes: ["CU", "IR", "KR", "SY", "LB", "MW", "MO", "QA"],
                channels: [149, 153, 157, 161]},
            //12 countrys of world【149 153 157 161 165】
            four: {
                codes: [ "BD", "BF", "CN", "HN", "JM", "PK", "PY", "KN", "AR", "TW", "NG" ],
                channels: [149, 153, 157, 161, 165]},
            //1 country of world【36 40 44 48 149 153 157 161】
            five: {
                codes: [ "SA" ],
                channels: [36, 40, 44, 48, 149, 153, 157, 161]}
		}, 

        /**
         * 国家码与语言匹配表
         * @attribute {Map} countries
         */
		countries : {
			NONE : "NONE",
			AL : "SHQIPERI",
			DZ : "الجزائر",
			AR : "ARGENTIA",
			AM : "ՀԱՅԱՍՏԱՆ",
			AU : "AUSTRALIA",
			AT : "ÖSTERREICH",
			AZ : "AZƏRBAYCAN",
            BD: "বাংলাদেশ",
			BH : "البحرين",
			BY : "БЕЛАРУСЬ",
			BE : "BELGIË",
			BA : "БОСНА И ХЕРЦЕГОВИНА",
			BR : "BRASIL",
			BN : "BRUNEI DARUSSALAM",
			BG : "БЪЛГАРИЯ",
			CL : "CHILE",
			CN : "中国",
			CR : "COSTA RICA",
			HR : "HRVATSKA",
			CY : "ΚΎΠΡΟΣ",
			CZ : "ČESKÁ REPUBLIKA",
			DK : "DANMARK",
			EC : "ECUADOR",
			EG : "مصر",
			SV : "EL SALVADOR",
			EE : "EESTI",
			FI : "SUOMI",
			FR : "FRANCE",
			F2 : "FRANCE RESERVES",
			GE : "საქართველო",
			DE : "DEUTSCHLAND",
			GR : "ΕΛΛΆΔΑ",
			HN : "HONDURAS",
			HK : "香港",
			HU : "MAGYARORSZÁG",
			IS : "ÍSLAND",
			IN : "INDIA",
			ID : "INDONESIA",
            IR: "ایران، جمهوری اسلامی",
			IE : "ÉIRE",
			IL : "إسرائيل",
			IT : "ITALIA",
			JM : "JAMAICA",
			JO : "الأردن",
			KZ : "КАЗАХСТАН",
			KE : "KENYA",
			KP : "조선민주주의인민공화국",
			KR : "한국 ROK",
			K3 : "한국 ROC3",
			KW : "الكويت",
			LV : "LATVIJA",
			LB : "لبنان",
			LI : "LIECHTENSTEIN",
			LT : "LIETUVA",
			LU : "LUXEMBOURG",
			MO : "澳門",
			MK : "МАКЕДОНИЈА",
			MY : "MALAYSIA",
			MT : "MALTA",
			MC : "MONACO",
			MA : "المغرب",
			NL : "NEDERLAND",
            AN: "NETHERLANDS ANTILLES",
			NO : "NORGE",
			OM : "سلطنة عمان",
			PK : "PAKISTAN",
			PE : "PERÚ",
			PH : "PHILIPPINES",
			PL : "POLSKA",
			PT : "PORTUGAL",
			QA : "قطر",
			RO : "ROMÂNIA",
            RU: "Российская Федерация",
			SA : "السعودية",
			CS : "Црна Гора",
			SG : "SINGAPORE",
			SK : "SLOVENSKÁ REPUBLIKA",
			SI : "SLOVENIJA",
			ZA : "SOUTH AFRICA",
			ES : "ESPAÑA",
			LK : "SRILANKA",
			SE : "SVERIGE",
			CH : "SCHWEIZ",
            SY: "الجمهورية العربية السورية",
			TH : "ประเทศไทย",
			TT : "TRINIDAD AND TOBAGO",
			TN : "تونس",
			TR : "TÜRKİYE",
			UA : "Україна",
			AE : "الإمارات العربية المتحدة",
			GB : "UNITED KINGDOM",
			UY : "URUGUAY",
			VN : "VIỆT NAM",
			YE : "اليمن",
			ZW : "ZIMBABWE",
			JP : "日本",
			K2 : "한국 ROC2",
			BZ : "BELIZE",
			BO : "BOLIVIA",
			NZ : "NEW ZEALAND",
            VE: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
			CA : "CANADA",
			CO : "COLOMBIA",
			DO : "REPÚBLICA DOMINICANA",
			GT : "GUATEMALA",
			MX : "MEXICO",
			PA : "PANAMÁ",
			PR : "PUERTO RICO",
			TW : "台灣",
			US : "UNITED STATES",
			UZ : "O’zbekiston"
		},
		countries_5g : {
			NONE : "NONE",
			AR : "ARGENTIA",
			AM : "ՀԱՅԱՍՏԱՆ",
			AU : "AUSTRILIA",
			AT : "ÖSTERREICH",
			AZ : "AZƏRBAYCAN",
			BH : "البحرين",
			BY : "БЕЛАРУСЬ",
			BE : "BELGIË",
			BA : "БОСНА И ХЕРЦЕГОВИНА",
			BR : "BRASIL",
			BN : "BRUNEI DARUSSALAM",
			BG : "БЪЛГАРИЯ",
			CL : "CHILE",
			CN : "中国",
			CR : "COSTA RICA",
			HR : "HRVATSKA",
			CY : "ΚΎΠΡΟΣ",
			CZ : "ČESKÁ REPUBLIKA",
			DK : "DANMARK",
			EC : "ECUADOR",
			EG : "مصر",
			SV : "EL SALVADOR",
			EE : "EESTI",
			FI : "SUOMI",
			FR : "FRANCE",
			F2 : "FRANCE RESERVES",
			GE : "საქართველო",
			DE : "DEUTSCHLAND",
			GR : "ΕΛΛΆΔΑ",
			HK : "香港",
			HU : "MAGYARORSZÁG",
			IS : "ÍSLAND",
			IN : "INDIA",
			ID : "INDONESIA",
			IR : "ایران",
			IE : "ÉIRE",
			IL : "إسرائيل",
			IT : "ITALIA",
			JM : "JAMAICA",
			JO : "الأردن",
			KP : "조선민주주의인민공화국",
			KR : "한국 ROK",
			K3 : "한국 ROC3",
			LV : "LATVIJA",
			LI : "LIECHTENSTEIN",
			LT : "LIETUVA",
			LU : "LUXEMBOURG",
			MO : "澳門",
			MY : "MALAYSIA",
			MT : "MALTA",
			MC : "MONACO",
			NL : "NEDERLAND",
			AN : "Netherlands Antilles",
			NO : "NORGE",
			OM : "سلطنة عمان",
			PE : "PERÚ",
			PH : "PHILIPPINES",
			PL : "POLSKA",
			PT : "PORTUGAL",
			SA : "السعودية",
			CS : "Црна Гора",
			SG : "SINGAPORE",
			SK : "SLOVENSKÁ REPUBLIKA",
			SI : "SLOVENIJA",
			ZA : "SOUTH AFRICA",
			ES : "ESPAÑA",
			LK : "SRILANKA",
			SE : "SVERIGE",
			CH : "SCHWEIZ",
			TT : "TRINIDAD AND TOBAGO",
			TN : "تونس",
			TR : "TÜRKİYE",
			GB : "UNITED KINGDOM",
			UY : "URUGUAY",
			JP : "日本",
			K2 : "한국 ROC2",
			BZ : "BELIZE",
			BO : "BOLIVIA",
			NZ : "NEW ZEALAND",
			VE : "VENEZUELA",
			CA : "CANADA",
			CO : "COLOMBIA",
			DO : "REPÚBLICA DOMINICANA",
			GT : "GUATEMALA",
			MX : "MEXICO",
			PA : "PANAMÁ",
			PR : "PUERTO RICO",
			TW : "台灣",
			US : "UNITED STATES",
			UZ : "O’zbekiston"
		},
        /**
         * RJ45连接模式
         * @attribute {Map} pppoeModes
         */
        pppoeModes: [{
			name : "PPPoE",
			value : "PPPOE"
		}, {
			name : "Static",
			value : "STATIC"
		}, {
			name : "DHCP",
			value : "DHCP"
		}, {
			name : "AUTO",
			value : "AUTO"
		}],
        /**
         * SNTP模式
         * @attribute {Map} sntpTimeSetMode
         */
		sntpTimeSetMode : [{
			name: 'manual',
			value: 'manual'
		}, {
			name: 'auto',
			value: 'auto'
		}],
        /**
         * SNTP时区
         * @attribute {Map} timeZone
         */
		timeZone : [{
			name: "(GMT-12:00) Dateline West",
			value: "-12_0"
		}, {
			name: "(GMT-11:00) Midway Islands, Samoa",
			value: "-11_0"
		}, {
			name: "(GMT-10:00) Hawaii",
			value: "-10_0"
		}, {
			name: "(GMT-09:00) Alaska",
			value: "-9_0"
		}, {
			name: "(GMT-08:00) Pacific time (USA and Canada), Tijuana",
			value: "-8_0"
		}, {
			name: "(GMT-07:00) Mountain time (USA and Canada)",
			value: "-7_0"
		}, {
			name: "(GMT-07:00) Arizona",
			value: "-7_1"
		},{
			name: "(GMT-07:00) Chihuahua, La Paz, Mazza Tran",
			value: "-7_2"
		},{
			name: "(GMT-06:00) Saskatchewan",
			value: "-6_0"
		}, {
			name: "(GMT-06:00) Central time (USA and Canada)",
			value: "-6_1"
		}, {
			name: "(GMT-06:00) Central America",
			value: "-6_2"
		}, {
			name: "(GMT-06:00) Guadalajara City, Mexico City, Monterey",
			value: "-6_3"
		}, {
			name: "(GMT-05:00) Bogota, Lima, Quito",
			value: "-5_0"
		}, {
			name: "(GMT-05:00) Eastern time (USA and Canada)",
			value: "-5_1"
		}, {
			name: "(GMT-05:00) Indiana (East)",
			value: "-5_2"
		}, {
			name: "(GMT-04:00) Atlantic time (Canada)",
			value: "-4_0"
		}, {
			name: "(GMT-04:00) Caracas, La Paz",
			value: "-4_1"
		}, {
			name: "(GMT-04:00) Santiago",
			value: "-4_2"
		}, {
			name: "(GMT-03:30) Newfoundland",
			value: "-3.5_0"
		}, {
			name: "(GMT-03:00) Brasilia",
			value: "-3_0"
		}, {
			name: "(GMT-03:00) Buenos Aires, Georgetown",
			value: "-3_1"
		}, {
			name: "(GMT-03:00) Greenland",
			value: "-3_2"
		}, {
			name: "(GMT-02:00) Mid-Atlantic",
			value: "-2_0"
		}, {
			name: "(GMT-01:00) Cape Verde Islands",
			value: "-1_0"
		}, {
			name: "(GMT-01:00) Azores",
			value: "-1_1"
		},{
			name: "(GMT) GMT: Dublin, Edinburgh, London, Lisbon",
			value: "0_0"
		}, {
			name: "(GMT) Casablanca, Monrovia",
			value: "0_1"
		}, {
			name: "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
			value: "1_0"
		}, {
			name: "(GMT+01:00) Belgrad, Bratislava, Budapest, Ljubljana, Prague",
			value: "1_1"
		}, {
			name: "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris",
			value: "1_2"
		}, {
			name: "(GMT+01:00) Sarajevo, Skopje,Warsaw, Zagreb",
			value: "1_3"
		}, {
			name: "(GMT+01:00) Western Central African",
			value: "1_4"
		}, {
			name: "(GMT+02:00) Bucharest",
			value: "2_0"
		}, {
			name: "(GMT+02:00) Pretoria, Harare",
			value: "2_1"
		}, {
			name: "(GMT+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius",
			value: "2_2"
		}, {
			name: "(GMT+02:00) Cairo",
			value: "2_3"
		}, {
			name: "(GMT+02:00) Athens, Beirut, Istanbul, Minsk",
			value: "2_4"
		}, {
			name: "(GMT+02:00) Jerusalem",
			value: "2_5"
		}, {
			name: "(GMT+03:00) Baghdad",
			value: "3_0"
		}, {
			name: "(GMT+03:00) Riyadh, Kuwait",
			value: "3_1"
		}, {
			name: "(GMT+03:00) Moscow, St Petersburg, Volgograd",
			value: "3_2"
		}, {
			name: "(GMT+03:00) Nairobi",
			value: "3_3"
		}, {
			name: "(GMT+03:30) Teheran",
			value: "3.5_0"
		},{
			name: "(GMT+04:00) Abu Zabi, Muscat",
			value: "4_0"
		}, {
			name: "(GMT+04:00) Baku, Tbilisi, Yerevan",
			value: "4_1"
		}, {
			name: "(GMT+04:30) Kabul",
			value: "4.5_0"
		}, {
			name: "(GMT+05:00) Yekaterinburg",
			value: "5_0"
		}, {
			name: "(GMT+05:00) Islamabad, Karachi, Tashkent",
			value: "5_1"
		}, {
			name: "(GMT+05:30) Madras, Calcutta, Mumbai, New Delhi",
			value: "5.5_0"
		}, {
			name: "(GMT+05:45) Kathmandu",
			value: "5.75_0"
		}, {
			name: "(GMT+06:00) Ala Mutu, Novosibirsk",
			value: "6_0"
		}, {
			name: "(GMT+06:00) Dhaka, Astana",
			value: "6_1"
		}, {
			name: "(GMT+06:00) Sri Haya Ed Denny Pla",
			value: "6_2"
		}, {
			name: "(GMT+06:30) Yangon",
			value: "6.5_0"
		}, {
			name: "(GMT+07:00) Krasnoyarsk",
			value: "7_0"
		}, {
			name: "(GMT+07:00) Bangkok, Hanoi, Jakarta",
			value: "7_1"
		}, {
			name: "(GMT+08:00) Beijing, Chongqing, Hongkong Special Administrative Region, Urumqi",
			value: "8_0"
		}, {
			name: "(GMT+08:00) Kuala Lumpur, Singapore",
			value: "8_1"
		}, {
			name: "(GMT+08:00) Perth",
			value: "8_2"
		}, {
			name: "(GMT+08:00) Taipei",
			value: "8_3"
		}, {
			name: "(GMT+08:00) Irkutsk, Ulam Batu",
			value: "8_4"
		}, {
			name: "(GMT+09:00) Osaka, Sapporo, Tokyo",
			value: "9_0"
		}, {
			name: "(GMT+09:00) Seoul",
			value: "9_1"
		}, {
			name: "(GMT+09:00) Yakutsk",
			value: "9_2"
		}, {
			name: "(GMT+09:30) Adelaide",
			value: "9.5_0"
		}, {
			name: "(GMT+09:30) Darwin",
			value: "9.5_1"
		}, {
			name: "(GMT+10:00) Brisbane",
			value: "10_0"
		}, {
			name: "(GMT+10:00) Vladivostok",
			value: "10_1"
		}, {
			name: "(GMT+10:00) Guam, Port Moresby",
			value: "10_2"
		}, {
			name: "(GMT+10:00) Hobart",
			value: "10_3"
		}, {
			name: "(GMT+10:00) Canberra, Melbourne, Sydney",
			value: "10_4"
		}, {
			name: "(GMT+11:00) Magadan, Solomon islands, New Caledonia",
			value: "11_0"
		}, {
			name: "(GMT+12:00) Wellington, Oakland",
			value: "12_0"
		}, {
			name: "(GMT+12:00) Fiji, Kamchatka, Marshall Islands",
			value: "12_1"
		}, {
			name: "(GMT+13:00) Nukualofa",
			value: "13_0"
		}],
		daylightSave : [{
			name: "Disable",
			value: "0"
		}, {
			name: "Enable",
			value: "1"
		}],
		wdsModes : [{
			name: "Disable",
			value: "0"
		}, {
			name: "RootAP Mode",
			value: "1"
		}, {
			name: "Bridge Mode",
			value: "2"
		}, {
			name: "Repeater Mode",
			value: "3"
		}],
        voipSipDtmfMethod : [
            {
                name : 'InBand',
                value : '2'
            },
            {
                name : 'RFC2833',
                value : '3'
            },
            {
                name : 'SIPInfo',
                value : '4'
            }
        ],
        sipEncodeMethod : [
            {
                name : 'G.711 u-Law',
                value : '0'
            },
            {
                name : 'G.711 a-Law',
                value : '1'
            },
            {
                name : 'G.722',
                value : '2'
            },
            {
                name : 'G.729',
                value : '3'
            },
            {
                name : 'G.726-16kps',
                value : '4'
            },
            {
                name : 'G.726-24kps',
                value : '5'
            },
            {
                name : 'G.726-32kps',
                value : '6'
            },
            {
                name : 'G.726-40kps',
                value : '7'
            }
        ],
        FORWARDING_MODES : [
            {
                name : 'Unconditional forwarding',
                value : '1'
            },
            {
                name : 'When busy',
                value : '2'
            },
            {
                name : 'When no answer',
                value : '3'
            },
            {
                name : 'Cancel all forwarding',
                value : '0'
            }
        ],
        BAUD_RATES : [
            {
                name : '9600',
                value : '9600'
            },
            {
                name : '19200',
                value : '19200'
            },
            {
                name : '38400',
                value : '38400'
            },
            {
                name : '57600',
                value : '57600'
            },
            {
                name : '115200',
                value : '115200'
            },
            {
                name : '230400',
                value : '230400'
            },
            {
                name : '460800',
                value : '460800'
            },
            {
                name : '921600',
                value : '921600'
            }
        ]
	};

    require(['config/' + config.DEVICE + '/config'], function(otherConf) {
        $.extend(config, otherConf);
    });

	return config;
});
