/**
 * jQuery Validation Plugin 1.9.0
 *
 * http://bassistance.de/jquery-plugins/jquery-plugin-validation/
 * http://docs.jquery.com/Plugins/Validation
 *
 * Copyright (c) 2006 - 2011 Jörn Zaefferer
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function () {

    function stripHtml(value) {
        // remove html tags and space chars
        return value.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ')
            // remove numbers and punctuation
            .replace(/[0-9.(),;:!?%#$'"_+=\/-]*/g, '');
    }

    jQuery.validator.addMethod("maxWords", function (value, element, params) {
        return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length < params;
    }, jQuery.validator.format("Please enter {0} words or less."));

    jQuery.validator.addMethod("minWords", function (value, element, params) {
        return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length >= params;
    }, jQuery.validator.format("Please enter at least {0} words."));

    jQuery.validator.addMethod("rangeWords", function (value, element, params) {
        return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length >= params[0] && value.match(/bw+b/g).length < params[1];
    }, jQuery.validator.format("Please enter between {0} and {1} words."));

})();

jQuery.validator.addMethod("letterswithbasicpunc", function (value, element) {
    return this.optional(element) || /^[a-z-.,()'\"\s]+$/i.test(value);
}, "Letters or punctuation only please");

jQuery.validator.addMethod("alphanumeric", function (value, element) {
    return this.optional(element) || /^\w+$/i.test(value);
}, "Letters, numbers, spaces or underscores only please");

jQuery.validator.addMethod("lettersonly", function (value, element) {
    return this.optional(element) || /^[a-z]+$/i.test(value);
}, "Letters only please");

jQuery.validator.addMethod("nowhitespace", function (value, element) {
    return this.optional(element) || /^\S+$/i.test(value);
}, "No white space please");

jQuery.validator.addMethod("ziprange", function (value, element) {
    return this.optional(element) || /^90[2-5]\d\{2}-\d{4}$/.test(value);
}, "Your ZIP-code must be in the range 902xx-xxxx to 905-xx-xxxx");

jQuery.validator.addMethod("integer", function (value, element) {
    return this.optional(element) || /^-?\d+$/.test(value);
}, "A positive or negative non-decimal number please");

/**
 * Return true, if the value is a valid vehicle identification number (VIN).
 *
 * Works with all kind of text inputs.
 *
 * @example <input type="text" size="20" name="VehicleID" class="{required:true,vinUS:true}" />
 * @desc Declares a required input element whose value must be a valid vehicle identification number.
 *
 * @name jQuery.validator.methods.vinUS
 * @type Boolean
 * @cat Plugins/Validate/Methods
 */
jQuery.validator.addMethod(
    "vinUS",
    function (v) {
        if (v.length != 17)
            return false;
        var i, n, d, f, cd, cdv;
        var LL = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        var VL = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 7, 9, 2, 3, 4, 5, 6, 7, 8, 9];
        var FL = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
        var rs = 0;
        for (i = 0; i < 17; i++) {
            f = FL[i];
            d = v.slice(i, i + 1);
            if (i == 8) {
                cdv = d;
            }
            if (!isNaN(d)) {
                d *= f;
            }
            else {
                for (n = 0; n < LL.length; n++) {
                    if (d.toUpperCase() === LL[n]) {
                        d = VL[n];
                        d *= f;
                        if (isNaN(cdv) && n == 8) {
                            cdv = LL[n];
                        }
                        break;
                    }
                }
            }
            rs += d;
        }
        cd = rs % 11;
        if (cd == 10) {
            cd = "X";
        }
        if (cd == cdv) {
            return true;
        }
        return false;
    },
    "The specified vehicle identification number (VIN) is invalid."
);

/**
 * Return true, if the value is a valid date, also making this formal check dd/mm/yyyy.
 *
 * @example jQuery.validator.methods.date("01/01/1900")
 * @result true
 *
 * @example jQuery.validator.methods.date("01/13/1990")
 * @result false
 *
 * @example jQuery.validator.methods.date("01.01.1900")
 * @result false
 *
 * @example <input name="pippo" class="{dateITA:true}" />
 * @desc Declares an optional input element whose value must be a valid date.
 *
 * @name jQuery.validator.methods.dateITA
 * @type Boolean
 * @cat Plugins/Validate/Methods
 */
jQuery.validator.addMethod(
    "dateITA",
    function (value, element) {
        var check = false;
        var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        if (re.test(value)) {
            var adata = value.split('/');
            var gg = parseInt(adata[0], 10);
            var mm = parseInt(adata[1], 10);
            var aaaa = parseInt(adata[2], 10);
            var xdata = new Date(aaaa, mm - 1, gg);
            if (( xdata.getFullYear() == aaaa ) && ( xdata.getMonth() == mm - 1 ) && ( xdata.getDate() == gg ))
                check = true;
            else
                check = false;
        } else
            check = false;
        return this.optional(element) || check;
    },
    "Please enter a correct date"
);

jQuery.validator.addMethod("dateNL", function (value, element) {
        return this.optional(element) || /^\d\d?[\.\/-]\d\d?[\.\/-]\d\d\d?\d?$/.test(value);
    }, "Vul hier een geldige datum in."
);

jQuery.validator.addMethod("time", function (value, element) {
    return this.optional(element) || /^([01]\d|2[0-3])(:[0-5]\d){0,2}$/.test(value);
}, "Please enter a valid time, between 00:00 and 23:59");
jQuery.validator.addMethod("time12h", function (value, element) {
    return this.optional(element) || /^((0?[1-9]|1[012])(:[0-5]\d){0,2}(\ [AP]M))$/i.test(value);
}, "Please enter a valid time, between 00:00 am and 12:00 pm");

/**
 * matches US phone number format
 *
 * where the area code may not start with 1 and the prefix may not start with 1
 * allows '-' or ' ' as a separator and allows parens around area code
 * some people may want to put a '1' in front of their number
 *
 * 1(212)-999-2345
 * or
 * 212 999 2344
 * or
 * 212-999-0983
 *
 * but not
 * 111-123-5434
 * and not
 * 212 123 4567
 */
jQuery.validator.addMethod("phoneUS", function (phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 9 &&
        phone_number.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

jQuery.validator.addMethod('phoneUK', function (phone_number, element) {
    return this.optional(element) || phone_number.length > 9 &&
        phone_number.match(/^(\(?(0|\+44)[1-9]{1}\d{1,4}?\)?\s?\d{3,4}\s?\d{3,4})$/);
}, 'Please specify a valid phone number');

jQuery.validator.addMethod('mobileUK', function (phone_number, element) {
    return this.optional(element) || phone_number.length > 9 &&
        phone_number.match(/^((0|\+44)7(5|6|7|8|9){1}\d{2}\s?\d{6})$/);
}, 'Please specify a valid mobile number');

// TODO check if value starts with <, otherwise don't try stripping anything
jQuery.validator.addMethod("strippedminlength", function (value, element, param) {
    return jQuery(value).text().length >= param;
}, jQuery.validator.format("Please enter at least {0} characters"));

// same as email, but TLD is optional
jQuery.validator.addMethod("email2", function (value, element, param) {
    return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
}, jQuery.validator.messages.email);

// same as url, but TLD is optional
jQuery.validator.addMethod("url2", function (value, element, param) {
    return this.optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, jQuery.validator.messages.url);

// NOTICE: Modified version of Castle.Components.Validator.CreditCardValidator
// Redistributed under the the Apache License 2.0 at http://www.apache.org/licenses/LICENSE-2.0
// Valid Types: mastercard, visa, amex, dinersclub, enroute, discover, jcb, unknown, all (overrides all other settings)
jQuery.validator.addMethod("creditcardtypes", function (value, element, param) {

    if (/[^0-9-]+/.test(value))
        return false;

    value = value.replace(/\D/g, "");

    var validTypes = 0x0000;

    if (param.mastercard)
        validTypes |= 0x0001;
    if (param.visa)
        validTypes |= 0x0002;
    if (param.amex)
        validTypes |= 0x0004;
    if (param.dinersclub)
        validTypes |= 0x0008;
    if (param.enroute)
        validTypes |= 0x0010;
    if (param.discover)
        validTypes |= 0x0020;
    if (param.jcb)
        validTypes |= 0x0040;
    if (param.unknown)
        validTypes |= 0x0080;
    if (param.all)
        validTypes = 0x0001 | 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020 | 0x0040 | 0x0080;

    if (validTypes & 0x0001 && /^(51|52|53|54|55)/.test(value)) { //mastercard
        return value.length == 16;
    }
    if (validTypes & 0x0002 && /^(4)/.test(value)) { //visa
        return value.length == 16;
    }
    if (validTypes & 0x0004 && /^(34|37)/.test(value)) { //amex
        return value.length == 15;
    }
    if (validTypes & 0x0008 && /^(300|301|302|303|304|305|36|38)/.test(value)) { //dinersclub
        return value.length == 14;
    }
    if (validTypes & 0x0010 && /^(2014|2149)/.test(value)) { //enroute
        return value.length == 15;
    }
    if (validTypes & 0x0020 && /^(6011)/.test(value)) { //discover
        return value.length == 16;
    }
    if (validTypes & 0x0040 && /^(3)/.test(value)) { //jcb
        return value.length == 16;
    }
    if (validTypes & 0x0040 && /^(2131|1800)/.test(value)) { //jcb
        return value.length == 15;
    }
    if (validTypes & 0x0080) { //unknown
        return true;
    }
    return false;
}, "Please enter a valid credit card number.");

jQuery.validator.addMethod("ipv4", function (value, element, param) {
    return this.optional(element) || /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i.test(value);
}, "Please enter a valid IP v4 address.");

jQuery.validator.addMethod("ipv6", function (value, element, param) {
    return this.optional(element) || /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(value);
}, "Please enter a valid IP v6 address.");

/**
 * Return true if the field value matches the given format RegExp
 *
 * @example jQuery.validator.methods.pattern("AR1004",element,/^AR\d{4}$/)
 * @result true
 *
 * @example jQuery.validator.methods.pattern("BR1004",element,/^AR\d{4}$/)
 * @result false
 *
 * @name jQuery.validator.methods.pattern
 * @type Boolean
 * @cat Plugins/Validate/Methods
 */
jQuery.validator.addMethod("pattern", function (value, element, param) {
    return this.optional(element) || param.test(value);
}, "Invalid format.");

// PX Custom Validator
jQuery.validator.addMethod("ssid", function (value, element, param) {
    return this.optional(element) || (value.indexOf(" ") != 0 && value.lastIndexOf(" ") != (value.length - 1) && /^[0-9a-zA-Z!*#:\(\)\+\-\.\/%=\?@\^_\{|\}~\x20]{1,32}$/.test(value));
}, "Please enter a valid SSID.");

jQuery.validator.addMethod("ssid_ap", function (value, element, param) {
    return this.optional(element) || !(/[,;"\\]/.test(value));
}, "Please enter a valid SSID.");

jQuery.validator.addMethod("name_check", function (value, element, param) {
    return this.optional(element) || !(/[{}\|\[\]~`\\]/.test(value));
}, "Please enter a valid name.");

jQuery.validator.addMethod("phonenumber_check", function (value, element, param) {
    return this.optional(element) || /^[\d#\*\+pe\?][\d#\*pe\?]{0,}$/.test(value);
}, "Please enter a valid phone number.");

jQuery.validator.addMethod("sms_service_center_check", function (value, element, param) {
    return this.optional(element) || /^[\+|00][\d]{1,}$/.test(value);
}, "Please enter a valid phone number.");

jQuery.validator.addMethod("email_check", function (value, element, param) {
    return this.optional(element) || /^\w+(-\w+)*(.\w+)*@\w+(-\w+)*(\.[\da-zA-Z]{2,3})+$/.test(value);
}, "Please enter a valid email.");

jQuery.validator.addMethod("pin_check", function (value, element, param) {
    return this.optional(element) || /^[0-9]{4,8}$/.test(value);
}, "Please enter a valid PIN code.");
jQuery.validator.addMethod("pin_check_2", function (value, element, param) {
    return this.optional(element) || /^[\x00-\xff]{4,8}$/g.test(value);
}, "Please enter a valid PIN code.");

jQuery.validator.addMethod("puk_check", function (value, element, param) {
    return this.optional(element) || /^[0-9]{8}$/.test(value);
}, "Please enter a valid PUK code.");

jQuery.validator.addMethod("password_check", function (value, element, param) {
    return this.optional(element) || /^[0-9a-zA-Z!#$*\+,\-\.%:=\?@\[\]\^_\{|\}~]{1,32}$/.test(value);
}, "Please enter a valid password.");

jQuery.validator.addMethod("wps_pin_check", function (value, element, param) {
    function validateChecksum(PIN) {
        var accum = 0;
        accum += 3 * (parseInt(PIN / 10000000) % 10);
        accum += 1 * (parseInt(PIN / 1000000) % 10);
        accum += 3 * (parseInt(PIN / 100000) % 10);
        accum += 1 * (parseInt(PIN / 10000) % 10);
        accum += 3 * (parseInt(PIN / 1000) % 10);
        accum += 1 * (parseInt(PIN / 100) % 10);
        accum += 3 * (parseInt(PIN / 10) % 10);
        accum += 1 * (parseInt(PIN / 1) % 10);
        return ((accum % 10) == 0);
    }

    var result = value.length == 8 && validateChecksum(value);
    return this.optional(element) || result;
}, "Invalid PIN number");

jQuery.validator.addMethod("wps_pin_length_check", function (value, element, param) {
    return this.optional(element) || value.length == 4 || value.length == 8;
});
jQuery.validator.addMethod("lanip_check", function (value, element, param) {
    var isIp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i.test(value);
    var result = false;
    if(isIp) {
        var iparr = value.split(".");
        result =  checkRange(iparr[0], 1, 223) && !checkRange(iparr[0], 127, 127) && checkRange(iparr[1], 0, 255) && checkRange(iparr[2], 0, 255) && checkRange(iparr[3], 1, 254);
    }

    return this.optional(element) || result;
});

jQuery.validator.addMethod("comment_check", function (value, element, param) {
    //not include space from 92/93
    return this.optional(element) || /^[0-9a-zA-Z!#\(\)\+\-\.\/%=\?@\^_\{|\}~]{1,32}$/.test(value);
});

jQuery.validator.addMethod("check_file_path", function(value, element, param) {
	var result = true;
	if (value.length != 1 && (value.charAt(0) == '/' && value.charAt(1) == '/')) {
		result = false;
	}

	var chars = [ '\\', ':', '*', '|', '#', '<', '>', '"', '?', "'", '&', '~', '`', '+' ];
	for ( var i = 0; i < value.length; i++) {
		if ($.inArray(value[i], chars) != -1) {
			result = false;
		}
	}
	return this.optional(element) || result;
});

jQuery.validator.addMethod("speed_check", function (value, element) {
    return this.optional(element) || /^\d+$/.test(value);
}, "A positive number please");

jQuery.validator.addMethod("portCompare", function (value, element, param) {
    var endVal = parseInt(value, 10);
    var startVal = parseInt($(param).val(), 10);
    return param.indexOf("Start") != -1? startVal <= endVal : startVal >= endVal;
});

jQuery.validator.addMethod("mac_check", function (value, element, param) {
    var isMac = /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/.test(value);
    if(isMac) {
        var macArr = value.toUpperCase().split(':');
        var sub1 = '0x'+macArr[0];
        return !checkAllField(macArr, 'FF') && !checkAllField(macArr, '00') && ((sub1 & 1)!=1);
    }

    function checkAllField(itemArr, value) {
        return _.all(itemArr, function(item) {
            return item == value;
        });
    }

    return this.optional(element) || isMac;
});

jQuery.validator.addMethod("ip_check", function (value, element, param) {
    var isIp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i.test(value);
    var result = false;
    if(isIp) {
        var iparr = value.split(".");
        result =  checkRange(iparr[0], 1, 223) && checkRange(iparr[1], 0, 255) && checkRange(iparr[2], 0, 255) && checkRange(iparr[3], 1, 254);
    }

    return this.optional(element) || result;
});

jQuery.validator.addMethod("ipv4v6_check", function (value, element, param) {
    var isIp = /^(((((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])))|(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))[-]((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))[/]([0-9]|[1-2][0-9]|3[0-2]))))|((\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*)|((\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*)[-](\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*))|((\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*)[/]([0-9]|[1-9][0-9]|[1][0-1][0-9]|[1][2][0-8]))))$/g.test(value);
    var result = false;
    if(isIp) {
        var iparr = value.split(".");
        result =  checkRange(iparr[0], 1, 223) && checkRange(iparr[1], 0, 255) && checkRange(iparr[2], 0, 255) && checkRange(iparr[3], 1, 254);
    }

    return this.optional(element) || isIp;
});

jQuery.validator.addMethod("dmz_ip_check", function (value, element, param) {
    var isIp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i.test(value);
    var result = false;
    if(isIp) {
        var iparr = value.split(".");
        result =  checkRange(iparr[0], 1, 255) && checkRange(iparr[1], 0, 255) && checkRange(iparr[2], 0, 255) && checkRange(iparr[3], 1, 254);
    }

    return this.optional(element) || result;
});

jQuery.validator.addMethod("apn_check", function (value, element, param) {
    if (value.charAt(0) == '.' || value.charAt(0) == '-' || value.charAt(value.length - 1) == '-') {
        return false;
    }
    return this.optional(element) || (/^[0-9a-zA-Z\.-]{1,64}$/).test(value) && value.indexOf("($)") == -1;
});

jQuery.validator.addMethod("apn_profile_name_check", function (value, element, param) {
    return this.optional(element) || (/^[0-9a-zA-Z\.!#\(\)\*\+%\-=\?@\[\]\^_\{\}\|~:, ]{1,30}$/).test(value) && value.indexOf("($)") == -1;
});

jQuery.validator.addMethod("ppp_username_check", function (value, element, param) {
    return this.optional(element) || (/^[0-9a-zA-Z!#$&()*\+,\-\.\/%:;<=>?@\[\]^_\{|\}~ ]*$/.test(value) && value.indexOf("($)") == -1);
});
jQuery.validator.addMethod("ppp_password_check", function (value, element, param) {
    return this.optional(element) || (/^[0-9a-zA-Z!#$&()*\+,\-\.\/%:;<=>?@\[\]^_\{|\}~ ]*$/.test(value) && value.indexOf("($)") == -1);
});
jQuery.validator.addMethod("unlock_code_check", function (value, element, param) {
    return this.optional(element) || /^[0-9a-fA-F]{16}/.test(value);
});

jQuery.validator.addMethod("dlna_name_check", function (value, element, param) {
    return this.optional(element) || /^[0-9a-zA-Z_]*$/.test(value);
});
jQuery.validator.addMethod("wifi_password_check", function (value, element, param) {
    return this.optional(element) || /^[0-9a-zA-Z!#\(\)\+\-\.\/%=\?@\^_\{|\}~]*$/.test(value);
});
jQuery.validator.addMethod("wifi_wep_password_check", function (value, element, param) {
    return this.optional(element) || /^([0-9A-Fa-f]{10}|[0-9A-Fa-f]{26}|[\x00-\x7f]{5}|[\x00-\x7f]{13})$/.test(value);
});
jQuery.validator.addMethod("range_except", function (value, element, param) {
    return this.optional(element) || (( value >= param[0] && value < 32000 )||( value > 32007 && value <= param[1] ));
});
jQuery.validator.addMethod("any_digits", function (value, element, param) {
    return this.optional(element) || /^\d+$/.test(value);
});

jQuery.validator.addMethod("sntp_invalid_server_name", function(value, element, param){
	return this.optional(element) || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i.test(value) || /^[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62}(\.[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62})+$/.test(value);
});
jQuery.validator.addMethod("url_check", function(value, element, param){
	 var strRegex = "^((https|http|ftp|rtsp|mms)?://)"       
                    + "?(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?" //ftp的user@      
                    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184      
                    + "|" // 允许IP和DOMAIN（域名）      
                    + "([0-9a-zA-Z_!~*'()-]+\.)*" // 域名- www.      
                    + "([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\." // 二级域名      
                    + "[a-zA-Z]{2,6})" // first level domain- .com or .museum      
                    + "(:[0-9]{1,4})?" // 端口- :80      
                    + "((/?)|"       
                    + "(/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+/?)$";      
    var re=new RegExp(strRegex);    

	return this.optional(element) ||re.test(value);  ;
//^[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62}(\.[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62})+$/.test(value);
});
jQuery.validator.addMethod("url_filter_check", function(value, element, param){
	 var strRegex = "^((http|ftp|rtsp|mms|https)?://)"       
                    + "?(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?" //ftp的user@      
                    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184      
                    + "|" // 允许IP和DOMAIN（域名）      
                    + "([0-9a-zA-Z_!~*'()-]+\.)*" // 域名- www.      
                    + "([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\." // 二级域名      
                    + "[a-zA-Z]{2,6})" // first level domain- .com or .museum      
                    + "(:[0-9]{1,4})?" // 端口- :80      
                    + "((/?)|"       
                    + "(/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+/?)$";      
    var re=new RegExp(strRegex);    

	return this.optional(element) ||re.test(value);  ;
//^[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62}(\.[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62})+$/.test(value);
});
jQuery.validator.addMethod("tr069_name_check", function(value, element, param){
	return this.optional(element) || /^[a-zA-Z0-9]*$/.test(value);
});
jQuery.validator.addMethod("tr069_password_check", function(value, element, param){
	return this.optional(element) || /^[a-zA-Z0-9_\*]*$/.test(value);
});
jQuery.validator.addMethod("voip_outbound_port_check", function(value, element, param){
	var isNum = /^[0-9]{4,5}$/.test(value);
	var result = false;
	if(isNum) {
		if(parseInt(value) >= 1024 &&  parseInt(value) <= 65535) {
			return true;
		}
	}
	return this.optional(element) || result;
});
jQuery.validator.addMethod("voip_time_check", function(value, element, param){
	var isNum = /^[0-9]{1,4}$/.test(value);
	var result = false;
	if(isNum) {
		if(parseInt(value) >= 1 &&  parseInt(value) <= 3600) {
			return true;
		}
	}
	return this.optional(element) || result;
});
jQuery.validator.addMethod("voip_sip_port_check", function(value, element, param){
	var isNum = /^[0-9]{4,5}$/.test(value);
	var result = false;
	if(isNum) {
		if(parseInt(value) >= 1026 &&  parseInt(value) <= 65535) {
			return true;
		}
	}
	return this.optional(element) || result;
});
jQuery.validator.addMethod("voip_port_compare", function(value, element, param){
	var maxVal = parseInt(value, 10);
    var minVal = parseInt($(param).val(), 10);
    return param.indexOf("min") != -1? minVal <= maxVal : minVal >= maxVal;
});
jQuery.validator.addMethod("sip_domain_check", function (value, element, param) {
    return this.optional(element)|| /^[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62}(\.[a-zA-Z0-9](-?[a-zA-Z0-9]){0,62})+$/.test(value);
});
jQuery.validator.addMethod("sip_realm_check", function (value, element, param) {
    return this.optional(element)|| /^[0-9a-zA-Z.@:+-;?=%&]+$/.test(value);
});
jQuery.validator.addMethod("sip_proxy_server_check", function (value, element, param) {
    return this.optional(element)|| /^[0-9a-zA-Z.@:+-;?=%&]+$/.test(value);
});
jQuery.validator.addMethod("display_name_check", function (value, element, param) {
    return this.optional(element)|| /^[0-9a-zA-Z.@:+-;?=%&]+$/.test(value);
});
jQuery.validator.addMethod("authorized_username_check", function (value, element, param) {
    return this.optional(element)|| /^[0-9a-zA-Z.@:+-;?=%&]+$/.test(value);
});
jQuery.validator.addMethod("account_password_check", function (value, element, param) {
    return this.optional(element)|| /^[0-9a-zA-Z.@:+-;?=%&]+$/.test(value);
});
jQuery.validator.addMethod("forwarding_uri_check", function (value, element, param) {
	var unicodeReg = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
	if(unicodeReg.test(value)) {
		return false;
	} else {
		return /^[0-9\*#\+]+$/.test(value);
	}
});
jQuery.validator.addMethod("login_password_length_check", function (value, element, param) {
    return this.optional(element) || value.length >= 4;
});

jQuery.validator.addMethod("equalToPin", function (value, element, param) {
    return this.optional(element) || value == $(param).val();
});

jQuery.validator.addMethod("equalToPassword", function (value, element, param) {
    return this.optional(element) || value == $(param).val();
});

jQuery.validator.addMethod("wps_pin_validator", function (value, element, param) {
    return this.optional(element) || /^\d{4}$/.test(value) || /^\d{8}$/.test(value) || /^\d{4}[ -]\d{4}$/.test(value);
});

jQuery.validator.addMethod("decimalRange", function (value, element, param) {
	return this.optional(element) || /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value);
});

jQuery.validator.addMethod("ddns_hashvalue_check", function (value, element, param) {
    return this.optional(element) || /^[0-9a-zA-Z=]*$/.test(value);
});

jQuery.validator.addMethod("siteName_check", function (value, element, param) {
	var isSiteName = /[\*\$\[&:,;<>'"\\`\]￥\|\?\/]{1,32}/.test(value);
    return this.optional(element) || !isSiteName;
});

jQuery.validator.addMethod("siteLink_check", function (value, element, param) {
	var isSiteName = /^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
    return this.optional(element) || isSiteName;
});
jQuery.validator.addMethod("subnetmask_check", function (value, element, param) {
    var isSubnetmask = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/.test(value);
    return this.optional(element) || !isSubnetmask;
});

jQuery.validator.addMethod("netmask_check", function (value, element, param) {
    var isIp = /^((255|254|252|248|240|224|192|128|0)\.0\.0\.0)|(255\.(255|254|252|248|240|224|192|128|0)\.0\.0)|(255\.255\.(255|254|252|248|240|224|192|128|0)\.0)|(255\.255\.255\.(255|254|252|248|240|224|192|128|0))$/i.test(value);
    var result = false;
    if(isIp) {
        var iparr = value.split(".");
        result =  checkRange(iparr[0], 0, 255) && checkRange(iparr[1], 0, 255) && checkRange(iparr[2], 0, 255) && checkRange(iparr[3], 0, 255);
    }

    return this.optional(element) || result;
});
