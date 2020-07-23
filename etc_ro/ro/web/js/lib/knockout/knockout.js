define(['knockoutbase'],function(ko) {
	
	ko.bindingHandlers['slide'] = {
        'update': function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            var isCurrentlyVisible = !(element.style.display == "none");
            if (value && !isCurrentlyVisible)
                $(element).slideDown();
            else if ((!value) && isCurrentlyVisible)
                $(element).slideUp();
        }
    };
    window.ko = ko;
    require(['lib/knockout/knockout.simpleGrid']);
	return ko;
});