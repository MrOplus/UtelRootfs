/**
 * @module language
 * @class language
 */
define(['knockout',
        'service',
        'jquery',
        'config/config',
        'underscore'],
function(ko, service, $, config, _) {

    /**
     * 根据语言项加载语言资源并翻译页面上的body部分
     * @method setLocalization
     * @param {String} locale 语言项:zh-cn
     */
    function setLocalization(locale){
        window.CURRENT_LANGUAGE = locale;
        $("body").attr('lang', locale);
        $.i18n.properties({
            name:'Messages',
            path:'i18n/',
            mode:'map',
            cache: true,
            language:locale,
            callback: function() {
                jQuery.validator.messages = $.i18n.map;
                $('body').translate();
            }
        });
    }
    
	window.language = null;
	
    /**
     * LanguageVM
     * @class LanguageVM
     */
    function LanguageVM() {
        var self = this;
        var currentLan = getLanguage();
        var languages,set_need_language_Array;

        var set_need_language = service.getAllOnceDatas().set_need_language;
        if(set_need_language.length > 0){
             set_need_language_Array = set_need_language.split(",");
             var current_show_language_array=[];
           for(var i=0;i<set_need_language_Array.length;i++){
            for(var j=0;j<config.LANGUAGES.length;j++){
                if(set_need_language_Array[i]==config.LANGUAGES[j].value){
                  current_show_language_array.push(config.LANGUAGES[j]);
                }
            }
         }
         languages = _.map(current_show_language_array, function(item) {
             return new Option(item.name,item.value);
            });
        }else{
            languages = _.map(config.LANGUAGES, function(item) {
             return new Option(item.name,item.value);
            });
        } 
        
        document.title = config.WEBUI_TITLE;
        if($('#webui_title')[0]) {
            $('#webui_title').html(config.WEBUI_TITLE);
        }
        self.languages = ko.observableArray(languages);
        self.currentLan = ko.observable(currentLan.Language);
		window.language = self.currentLan();
        if(self.currentLan() == "ge"){
            $(".germanFont").addClass('germanFonts');
        }
        service.bindCommonData(self);
        /**
         * 语言切换事件处理
         * @event langChangeHandler
         */
        self.langChangeHandler = function(data, event) {
            clearValidateMsg();

            service.setLanguage({Language: self.currentLan()}, function() {
                setLocalization(self.currentLan());
				window.language = self.currentLan();
                location.reload();
                if(self.currentLan() == "ge"){
                 $(".germanFont").addClass('germanFonts');

                 }else{
                    $(".germanFont").remove("germanFonts");
                 }
            });
        };

        //init language
        setLocalization(self.currentLan());
    }

    /**
     * 获取语言项
     * @method getLanguage
     */
    function getLanguage() {
        return service.getLanguage();
    }

    /**
     * 初始化语言VM并绑定
     * @method init
     */
    function init() {
        ko.applyBindings(new LanguageVM(), $('#language')[0]);
    }

    return {
        init: init
    };
});
