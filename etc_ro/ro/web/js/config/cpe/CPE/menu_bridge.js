define(function() {
    var needLogin = true;
    var menu = [
        //switch port
        {
            hash: '#switch',
            path: 'switch_port',
            level: '',
            parent: '',
            requireLogin:false
        },
        // level 1 menu
        {
            hash:'#login',
            path:'login',
            level:'1',
            requireLogin:false,
            checkSIMStatus:false
        },
        {
            hash:'#home',
            path:'home',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#status',
            path:'status/device_info',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#sms',
            path:'sms/smslist',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#phonebook',
            path:'phonebook/phonebook',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        // level 2 menu
        {
            hash:'#device_setting',
            path:'adm/password',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_all',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_common',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_family',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_friend',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_colleague',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#smslist',
            path:'sms/smslist',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#sim_messages',
            path:'sms/sim_messages',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#sms_setting',
            path:'sms/sms_setting',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        // level 3 menu
        {
            hash:'#wifi_basic',
            path:'wifi/wifi_basic',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#wifi_advance',
            path:'wifi/wifi_advance',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#wps',
            path:'wifi/wps',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#password_management',
            path:'adm/password',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#pin_management',
            path:'adm/pin',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        }
    ];

    return menu;
});
