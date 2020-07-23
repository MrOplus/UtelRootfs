define(function() {
    var config = {
        PRODUCT_TYPE: 'CPE',// 产品类型DATACARD、UFI、CPE。 DOC: 8.2
        WIFI_BANDWIDTH_SUPPORT: true,
        WIFI_BAND_SUPPORT: true,
        MAX_STATION_NUMBER: 8,
        WEBUI_TITLE: '4G CPE',
		HAS_MULTI_SSID: true,//多ssid功能
		HAS_URL:true,// 是否支持URL过滤,
		RJ45_SUPPORT:true,//是否支持rj45
        WIFI_SWITCH_SUPPORT: true,//是否支持wifi开关
		WIFI_SUPPORT_QR_SWITCH: true, //是否支持wifi二维码显示控制。
		WIFI_BANDWIDTH_SUPPORT_40MHZ: true, //频带宽度是否支持40MHZ,reltek芯片支持，博通芯片不支持
        SD_CARD_SUPPORT: false,//是否支持SD卡
		HAS_BLACK_AND_WHITE_FILTER: true, //是否支持黑白名单
		STATION_BLOCK_SUPPORT: true, // 已连接设备是否支持Block功能
		TSW_SUPPORT: true, // 是否支持定时休眠唤醒
		FAST_BOOT_SUPPORT: false, //是否支持快速开机
		WIFI_SLEEP_SUPPORT: false, // 是否支持wifi休眠
		WIFI_WEP_SUPPORT:true,//是否支持wifi WEP加密
		TR069_SUPPORT: true,//TR069
		HAS_PARENTAL_CONTROL: true, // 是否支持家长控制功能,
		NETWORK_UNLOCK_SUPPORT:true,//是否支持解锁
		HAS_BATTERY:false,
		TURN_OFF_SUPPORT: false, //是否支持关机
		AUTO_MODES: [ {
            name: 'Automatic',
            value: 'NETWORK_auto'
        }, {
            name: 'FDD',
            value: 'Only_LTE'
        }, {
            name: '3G Only',
            value: 'TD_W'
        }]
    };

    return config;
});
