define(function() {
    var config = {
		HAS_CASCADE_SMS: true,
        IPV6_SUPPORT: true,
		HAS_FOTA: true,
        WIFI_BAND_SUPPORT: true,
        WIFI_BANDWIDTH_SUPPORT: true,
        AP_STATION_SUPPORT: false,
		WDS_SUPPORT: true,
		WIFI_SWITCH_SUPPORT: true,
		WIFI_HAS_5G: false,
        WEBUI_TITLE: '3G CPE',
		NETWORK_MODES : [ {
			name : '802.11 b/g/n',
			value : '4'
		} ],
		NETWORK_MODES_BAND : [ {
			name : '802.11 a/n',
			value : '4'
		} ],
		sysLogModes : [{
			name : 'ALL',
			value : 'all'
		}, {
			name : 'WAN Connect',
			value : 'wan_connect'
		}, {
			name : 'SMS',
			value : 'sms'
		}, {
			name : 'tr069',
			value : 'tr069'
		}, {
			name : 'WLAN',
			value : 'wlan'
		}, {
			name : 'Router',
			value : 'router'
		}],
        AUTO_MODES: [ {
            name: 'Automatic',
            value: 'NETWORK_auto'
        }, {
            name: '3G Only',
            value: 'Only_WCDMA'
        }, {
            name: '2G Only',
            value: 'Only_GSM'
        }]
    };

    return config;
});
