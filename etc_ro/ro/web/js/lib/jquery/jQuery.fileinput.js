/**
 * --------------------------------------------------------------------
 * jQuery customfileinput plugin
 * Author: Scott Jehl, scott@filamentgroup.com
 * Copyright (c) 2009 Filament Group 
 * licensed under MIT (filamentgroup.com/examples/mit-license.txt)
 * --------------------------------------------------------------------
 */
$.fn.customFileInput = function(){
	var isChanged = false;
    var maxLength = 32;
	//apply events and styles for file input element
	var fileInput = $(this)
		.addClass('customfile-input') //add class for CSS
		.mouseover(function(){ upload.addClass('customfile-hover'); })
		.mouseout(function(){ upload.removeClass('customfile-hover'); })
		.focus(function(){
			upload.addClass('customfile-focus');
			fileInput.data('val', fileInput.val());
		})
		.blur(function(){ 
			upload.removeClass('customfile-focus');
			$(this).trigger('checkChange');
		 })
		 .bind('disable',function(){
		 	fileInput.attr('disabled',true);
			upload.addClass('customfile-disabled');
		})
		.bind('enable',function(){
			fileInput.removeAttr('disabled');
			upload.removeClass('customfile-disabled');
		})
		.bind('checkChange', function(){
			if(fileInput.val() && fileInput.val() != fileInput.data('val')){
				fileInput.trigger('change');
			}
		})
		.bind('change',function(){
			isChanged = true;
			//get file name
			var fileName = $(this).val().split(/\\/).pop();
			//get file extension
			var fileExt = 'icon-' + getFileType(fileName);//'customfile-ext-' + fileName.split('.').pop().toLowerCase();
			//update the feedback
            var tmpFileName = '';
            var checkLen = 0;
            for(var i = 0; i < fileName.length && checkLen < maxLength; i++){
                var c = fileName.charAt(i);
                if(getEncodeType(c).encodeType == 'UNICODE'){
                    checkLen += 3;
                }else{
                    checkLen += 1;
                }
                tmpFileName += c;
            }
            if(fileName != tmpFileName){
                tmpFileName = tmpFileName + '...';
            } else {
                tmpFileName = fileName;
            }
			uploadFeedback
				.html(HTMLEncode(tmpFileName)) //set feedback text to filename
				.removeClass(uploadFeedback.data('fileExt') || '') //remove any existing file extension class
				.addClass(fileExt) //add file extension class
				.data('fileExt', fileExt) //store file extension for class removal on next change
				.addClass('customfile-feedback-populated'); //add class to show populated state
            upload.attr('title', fileName);
			//change text of button	
			uploadButton.html("<span id='uploadBtn' data-trans='change_btn'>"+$.i18n.prop('change_btn')+"</span>");
		})
		.click(function(){ //for IE and Opera, make sure change fires after choosing a file, using an async callback
			fileInput.data('val', fileInput.val());
			setTimeout(function(){
				fileInput.trigger('checkChange');
			},100);
		});
		
	//create custom control container
	var upload = $('<div class="customfile"></div>');
	//create custom control button
	var uploadButton = $('<span class="customfile-button" aria-hidden="true"><span  id="uploadBtn" data-trans="browse_btn">'+$.i18n.prop('browse_btn')+'</span></span>').appendTo(upload);
	//create custom control feedback
	var uploadFeedback = $('<span class="customfile-feedback" aria-hidden="true"><span data-trans="no_file_selected">'+$.i18n.prop("no_file_selected")+'</span></span>').appendTo(upload);
	
	//match disabled state
	if(fileInput.is('[disabled]')){
		fileInput.trigger('disable');
	}

	//on mousemove, keep file input under the cursor to steal click
	upload
		.mousemove(function(e){
			fileInput.css({
				'left': e.pageX - upload.offset().left - fileInput.outerWidth() + 20, //position right side 20px right of cursor X)
                'top': e.pageY - upload.offset().top - 14
			});	
		})
		.insertAfter(fileInput); //insert after the input
	
	fileInput.appendTo(upload);
		
	//return jQuery
	return $(this);
};