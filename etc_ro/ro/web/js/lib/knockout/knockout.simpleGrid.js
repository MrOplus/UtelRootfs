(function () {
    // Private function
    function getColumnsForScaffolding(data) {
        if ((typeof data.length !== 'number') || data.length === 0) {
            return [];
        }
        var columns = [];
        for (var propertyName in data[0]) {
            columns.push({ headerText:propertyName, headerTextTrans:propertyName, rowText:propertyName, columnType:propertyName, width:propertyName, sortable:propertyName });
        }
        return columns;
    }

    ko.simpleGrid = {
        // Defines a view model class you can use to populate a grid
        viewModel:function (configuration) {
            var self = this;
            self.sideNumber = 3; //当前页面左右页码数
            self.midNumber = 1 + 2 * self.sideNumber; //中间要显示的页码
            self.allNumber = self.midNumber + 2; //显示完整页码的最大页码

            self.showMenu = false;

            self.className = "table table-striped table-hover ko-grid colorHoverTable " + (configuration.tableClass ? configuration.tableClass : "");

            self.ellipsisLength = 16;
            self.searchInitStatus = ko.observable();
            self.searchKey = ko.observable();
            self.searchColumns = configuration.searchColumns;
            self.primaryColumn = configuration.primaryColumn;
            self.showPager = !!configuration.showPager;
            self.sortField = ko.observable(configuration.defaultSortField);
            self.sortDirection = ko.observable(configuration.defaultSortDirection);
            self.data = ko.observableArray(configuration.data);
			self.pageToGo = ko.observable();
            self.sortedData = ko.computed(function () {
                var exp = self.sortField();
                var dir = self.sortDirection();
                if (exp && dir) {
                    return self.data().sort(function (a, b) {
                        return dir == "ASC" ? a[exp].localeCompare(b[exp]) : b[exp].localeCompare(a[exp]);
                    });
                } else {
                    return self.data();
                }
            });
            self.checkedCount = ko.observable(0);
            self.translate = function () {
                $(".ko-grid").translate();
                if ($("#pblist tr").length >0 ){
                    $("#pblist-checkall").removeClass("disable");
                }else{
                    $("#pblist-checkall").addClass("disable");
                }
            };

            self.clearCheck = function () {
                $("#ko_grid_checkAll").removeAttr("checked");
                $("#pblist-checkall").removeClass("checkbox_selected");
                $("p:checkbox[target='pblist-checkall']").removeAttr("checked");
                $("p[id^='chk__'] ").removeClass("checkbox_selected");
                $("p[id^='chk__'] :checkbox").removeAttr("checked");
                self.checkedCount(0);
                self.translate();
            };

            self.searchText = ko.computed(function () {
                self.clearCheck();
                var text = "";
                if (!self.searchInitStatus()) {
                    text = $.trim(self.searchKey());
                }
                return text;
            });

            self.afterSearchData = ko.computed(function () {
                var key = $.trim(self.searchText()).toLowerCase();
                if (key == "") {
                    return self.sortedData();
                }
                else {
                    return _.filter(self.sortedData(), function (item) {
                        for (var i = 0; i < self.searchColumns.length; i++) {
                            var col = self.searchColumns[i];
                            if (item[col].toLowerCase().indexOf(key) != -1) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
            });
            self.currentPageIndex = ko.observable(0);
            self.pageSize = configuration.pageSize || 5;
            // If you don't specify columns configuration, we'll use scaffolding
            self.columns = configuration.columns || getColumnsForScaffolding(ko.utils.unwrapObservable(self.afterSearchData()));
            self.rowClickHandler = configuration.rowClickHandler;
            self.hasRowClickHandler = !!configuration.rowClickHandler;
            self.deleteHandler = configuration.deleteHandler;
            self.idName = configuration.idName;
            self.tmplType = configuration.tmplType;
            self.changeTemplateHandler = configuration.changeTemplateHandler;
            self.maxPageIndex = ko.computed(function () {
                return Math.ceil(ko.utils.unwrapObservable(self.afterSearchData()).length / self.pageSize) - 1;
            });
            self.radioClickExtend = configuration.radioClickHandler;
            self.radioChecked4Column = configuration.radioChecked4Column;
            self.radioChecked4Value = configuration.radioChecked4Value;

            self.fixCurrentPageIndex = function (oldIndex) {
                if (oldIndex < 0) return 0;
                var maxIndex = self.maxPageIndex();
                return oldIndex > maxIndex ? maxIndex : oldIndex;
            };

            self.pagerStart = ko.computed(function () {
                var index = self.fixCurrentPageIndex(self.currentPageIndex());
                var maxIndex = self.maxPageIndex();
                var retIndex = 0;
                if (index < self.midNumber || maxIndex <= self.allNumber) {
                    retIndex = 1;
                } else if (index + self.sideNumber >= maxIndex) {
                    retIndex = maxIndex - self.midNumber;
                } else {
                    retIndex = index - self.sideNumber;
                }
                return retIndex;
            });

            self.pagerEnd = ko.computed(function () {
                var index = self.fixCurrentPageIndex(self.currentPageIndex());
                var maxIndex = self.maxPageIndex();
                var retIndex = 0;
                if (index + self.sideNumber >= maxIndex || maxIndex <= self.allNumber) {
                    retIndex = maxIndex - 1;
                } else if (index < self.midNumber) {
                    retIndex = self.midNumber;
                } else {
                    retIndex = index + self.sideNumber;
                }
                if (maxIndex - retIndex == 2) {
                    retIndex = maxIndex -1;
                }
                return retIndex;
            });

            self.itemsOnCurrentPage = ko.computed(function () {
                self.translate();
                var pageIndex = self.fixCurrentPageIndex(self.currentPageIndex());
                var startIndex = self.pageSize * pageIndex;
                return self.afterSearchData().slice(startIndex, startIndex + self.pageSize);
            });

            self.changePage = function (pageIndex) {
                var pageIndex = self.fixCurrentPageIndex(pageIndex);
                self.currentPageIndex(pageIndex);
                self.clearCheck();
            };

            self.nextPage = function () {
                var pageIndex = self.fixCurrentPageIndex(self.currentPageIndex() + 1);
                self.currentPageIndex(pageIndex);
                self.clearCheck();
            };

            self.previousPage = function () {
                var pageIndex = self.fixCurrentPageIndex(self.currentPageIndex() - 1);
                self.currentPageIndex(pageIndex);
                self.clearCheck();
            };

            self.clearAllChecked = function () {
                $("#pblist-checkall").trigger("click");
                if ($("#pblist-checkall").hasClass("checkbox_selected")) {
                    $("#pblist-checkall").trigger("click");
                }
            }

            self.clickCheckAll = function () {
                if ($("#pblist-checkall").hasClass("checkbox_selected")) {
                    self.checkedCount(0);
                } else {
                    var checked = $("#pblist :checkbox").length;
                    self.checkedCount(checked);
                }
            };

            self.clickCheck = function (index) {
                var checkbox = $("#chk__" + index+" :checkbox");
                if (checkbox.attr("checked")) {
                    checkbox.removeAttr("checked");
                } else {
                    checkbox.attr("checked", "checked");
                }
                checkCheckbox(checkbox);

                var checked = $("#pblist p.checkbox_selected :checkbox").length;
                self.checkedCount(checked);
            };

            self.selectedItems = function (type) {
                var checks;
                if (self.tmplType == 'card') {
                    checks = $("#pblist :checkbox[checked='checked']");
                }
                else {
                    checks = $("#pblist :checkbox[checked='checked']");
                }

                var items = [];
                if (type == "primary") {
                    checks.each(function () {
                        items.push($(this).attr("primaryValue"));
                    });
                } else {
                    checks.each(function () {
                        items.push($(this).val());
                    });
                }
                return items;
            };

            self.selectedIds = function () {
                return  self.selectedItems("id");
            };

            self.selectedPrimaryValue = function () {
                return  self.selectedItems("primary");
            };

            self.radioSelectValue = function () {
                if ($.browser.msie && event && event.srcElement && event.srcElement.type == "radio") {
                    return event.srcElement.value;
                }
                return $("#pblist [name='ko_grid_radio']:checked").val();
            }

            self.radioSelectedPrimaryValue = function () {
                if ($.browser.msie && event && event.srcElement && event.srcElement.type == "radio") {
                    return event.srcElement.attribute("primaryValue");
                }
                return $("#pblist [name='ko_grid_radio']:checked").attr("primaryValue");
            }

            self.radioClick = function () {
                self.checkedCount(self.checkedCount() + 1);
            }

            self.clearRadioSelect = function () {
                $("#pblist [name='ko_grid_radio']:checked").removeAttr("checked");
                self.checkedCount(0);
            }

            self.setRadioSelect = function (val) {
                $("#pblist [name='ko_grid_radio'][value='" + val + "']").attr("checked", "checked");
                self.checkedCount(1);
            }

            self.sort = function (exp) {
                if (exp == undefined) {
                    return;
                }
                var sortExp = self.sortField();
                var dir = "ASC";
                if (exp == sortExp) {
                    dir = (self.sortDirection() == "ASC") ? "DESC" : "ASC";
                }
                self.sortField(exp);
                self.sortDirection(dir);

                self.data(self.data().sort(function (a, b) {
                    return dir == "ASC" ? a[exp].localeCompare(b[exp]) : b[exp].localeCompare(a[exp]);
                }));

                self.currentPageIndex(0);
                self.clearCheck();

                $(".ko-grid thead th.ko-grid-th-asc").removeClass("ko-grid-th-asc").addClass("ko-grid-th-sortable");
                $(".ko-grid thead th.ko-grid-th-desc").removeClass("ko-grid-th-desc").addClass("ko-grid-th-sortable");
                if (dir == "ASC") {
                    $("#ko_grid_th_" + exp).removeClass().addClass("ko-grid-th-asc");
                } else {
                    $("#ko_grid_th_" + exp).removeClass().addClass("ko-grid-th-desc");
                }
            };

            self.ellipsisText = function (txt) {
                if (!txt) return "";
                if ((txt.length * 2) < self.ellipsisLength) {
                    return txt;
                }
                var len = 0;
                for (var i = 0; i < txt.length; i++) {
                    if (txt.charCodeAt(i) > 256) {
                        len += 2;
                    } else {
                        len++;
                    }
                    if (len >= self.ellipsisLength) {
                        return txt.substring(0, i) + "...";
                    }
                }
                return txt;
            };
        }
    };

    // Templates used to render the grid
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        if ($('#' + templateName)[0]) {
            $('#' + templateName).remove();
        }
        $('#container').append("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    // The "simpleGrid" binding
    ko.bindingHandlers.simpleGrid = {
        init:function (element, viewModelAccessor) {

            var viewModel = viewModelAccessor();
            if (viewModel.rowClickHandler == undefined) {
                viewModel.rowClickHandler = function () {
                };
            }
            if (viewModel.deleteHandler == undefined) {
                viewModel.deleteHandler = function () {
                };
            }
            if (viewModel.radioClickExtend == undefined) {
                viewModel.radioClickHandler = function(){
                    viewModel.radioClick();
                    return true;
                }
            } else {
                viewModel.radioClickHandler = function () {
                    viewModel.radioClick();
                    viewModel.radioClickExtend();
                    return true;
                }
            }


            ko.utils.arrayMap(viewModel.columns, function (item) {
                if (item.columnType == undefined) {
                    item.columnType = 'text';
                }
                if (item.sortable == undefined) {
                    item.sortable = false;
                }
                if (item.headerTextTrans == undefined) {
                    item.headerTextTrans = '';
                }
                if (item.display == undefined) {
                    item.display = true;
                }
                if (item.needTrans == undefined) {
                    item.needTrans = false;
                }
            });

            if (viewModel.tmplType == 'card') {
                templateEngine.addTemplate("ko_simpleGrid_grid", "\
                <div class='ko-grid-container'>\
                    <div class='ko-grid-menu' data-bind='visible:showMenu'>\
                        <div class='ko-grid-option'>\
                            <img id='ko_grid_layout' class='cursor-pointer' src='img/list.png' data-bind='click:changeTemplateHandler'/>\
                            <p id=\"pblist-checkall\" target=\"pblist\" class=\"checkbox checkboxToggle\">\
                                <input type='checkbox' id='ko_grid_checkAll' data-bind='visible: tmplType==\"card\"&&data().length>0,click: clickCheckAll' />\
                            </p>\
                        </div>\
                        <div class='clean'></div>\
                    </div>\
                    <div id=\"pblist\" class=\"ko-grid\" data-bind=\"foreach: itemsOnCurrentPage\">\
                        <div class=\"ko-grid-card\" >\
                            <div class=\"ko-grid-card-content\" data-bind=\"foreach: $parent.columns ,click:function(){$root.rowClickHandler($data[$root.idName])}\">\
                                <!-- ko if: display==true -->\
                                <p data-bind=\"attr:{title:typeof rowText == 'function' ? rowText($parent) : $parent[rowText]},text: $root.ellipsisText(typeof rowText == 'function' ? rowText($parent) : $parent[rowText])\"></p>\
                                <!-- /ko -->\
                            </div>\
                            <div class=\"ko-grid-card-delete\" data-bind=\"click:function(){$root.deleteHandler($data[$root.idName]);}\" >×</div>\
                            <div class=\"ko-grid-card-check\" ><p class=\"checkbox\"><input type='checkbox' data-bind='value: $data[$root.idName],attr:{primaryValue:$data[$root.primaryColumn]}' target=\"pblist-checkall\"/></p></div>\
                        </div>\
                     <div>\
                </div>");
            } else {
                templateEngine.addTemplate("ko_simpleGrid_grid", "\
                <div class='ko-grid-container'>\
                    <div class='ko-grid-menu' data-bind='visible:showMenu'>\
                        <div class='ko-grid-option'>\
                            <img id='ko_grid_layout' class='cursor-pointer' src='img/card.png'  data-bind='click:changeTemplateHandler'/>\
                        </div>\
                        <div class='clean'></div>\
                    </div>\
                    <table data-bind=\"attr:{'class':className}\" cellspacing=\"0\" cellspadding='0'>\
                    <thead>\
                        <tr data-bind=\"foreach: columns\" >\
                           <!-- ko if: columnType=='checkbox' -->\
                               <th data-bind='attr:{width:width}, visible: display'>\
                                   <p id=\"pblist-checkall\" target=\"pblist\" class=\"checkbox checkboxToggle\" data-bind='click:$root.clickCheckAll'>\
                                       <input type='checkbox' id='ko_grid_checkAll'/>\
                                   </p>\
                               </th>\
                           <!-- /ko --> \
                           <!-- ko if: columnType=='text' || columnType=='image' -->\
                               <!-- ko if: sortable==true -->\
                               <th data-bind=\"visible: display, css: {'ko-grid-th-sortable':rowText!=$root.sortField(),'ko-grid-th-desc':(rowText==$root.sortField() && 'DESC'==$root.sortDirection()),'ko-grid-th-asc': (rowText==$root.sortField() && 'ASC'==$root.sortDirection())},attr:{id:'ko_grid_th_'+rowText,width:width},click:function(event,data){$root.sort(rowText)}\"><a href='#' data-bind=\"attr:{\'data-trans\': headerTextTrans}\"></a></th>\
                               <!-- /ko --> \
                               <!-- ko if: sortable==false -->\
                               <th nowrap='nowrap' data-bind=\"visible: display, attr:{width:width,\'data-trans\': headerTextTrans}\"></th>\
                               <!-- /ko --> \
                           <!-- /ko --> \
                           <!-- ko if: columnType=='radio' -->\
                               <th nowrap='nowrap' data-bind=\"visible: display, attr:{width:width,\'data-trans\': headerTextTrans}\"></th>\
                           <!-- /ko --> \
						   <!-- ko if: columnType=='button' -->\
                               <th nowrap='nowrap' data-bind=\"visible: display, attr:{width:width,\'data-trans\': headerTextTrans}\"></th>\
                           <!-- /ko --> \
                        </tr>\
                    </thead>\
                    <tbody id=\"pblist\" data-bind=\"foreach: itemsOnCurrentPage\">\
                        <tr data-bind=\"foreach: $parent.columns,css:{'odd': $index() % 2==1,'even':$index()%2==0 } \">\
                            <!-- ko if: columnType=='checkbox' -->\
                            <td class = 'ko-grid-center'><p class=\"checkbox\" manualControl='true' data-bind='attr:{id:\"chk__\"+ $parent[rowText]},click:function(){$root.clickCheck($parent[rowText])}'><input type='checkbox' data-bind='value: $parent[rowText],attr:{primaryValue:$parent[$root.primaryColumn]}' target=\"pblist-checkall\"/></p></td>\
                            <!-- /ko --> \
                            <!-- ko if: columnType=='radio' -->\
                            <td class = 'ko-grid-center'><input type='radio' name='ko_grid_radio' data-bind='click:$root.radioClickHandler,value: $parent[rowText],attr:{primaryValue:$parent[$root.primaryColumn]}'/></td>\
                            <!-- /ko --> \
                            <!-- ko if: columnType=='text' && !needTrans -->\
                            <td class = 'ko-grid-center' data-bind=\"visible: display, css:{'cursor-pointer':$root.hasRowClickHandler },text: typeof rowText == 'function' ? rowText($parent) : $parent[rowText], click:function(){$root.rowClickHandler($parent[$root.idName])}\"></td>\
                            <!-- /ko --> \
                            <!-- ko if: columnType=='text' && needTrans -->\
                            <td class = 'ko-grid-center' data-bind=\"visible: display, css:{'cursor-pointer':$root.hasRowClickHandler },click:function(){$root.rowClickHandler($parent[$root.idName])}\">\
                                <span data-bind=\"attr: {\'data-trans\': $parent[rowText]}\"></span>\
                            </td>\
                            <!-- /ko -->\
                            <!-- ko if: columnType=='image' -->\
                            <td class = 'ko-grid-center' data-bind=\"visible: display, css:{'cursor-pointer':$root.hasRowClickHandler },click:function(){$root.rowClickHandler($parent[$root.idName])}\">\
                                <img data-bind=\"attr: {src: $parent[rowText]}\"/>\
                            </td>\
                            <!-- /ko --> \
							<!-- ko if: columnType=='button' -->\
                            <td class = 'ko-grid-center' data-bind=\"visible: display\"><input type=\"button\" class=\"btn-1 btn-ex\" data-bind=\"visible:$parent[\'btnDisplay\'],enable:$parent[\'enabled\'],attr:{\'data-trans\':$parent[\'actionTrans\']},click:$parent['action']\"/></td>\
                            <!-- /ko --> \
                        </tr>\
                    </tbody>\
                </table>\
                </div>");
            }
            templateEngine.addTemplate("ko_simpleGrid_pageLinks", "\
                    <div class=\"ko-grid-pageLinks\">\
                        <a class='ko-grid-pager' href='javascript:void(0)' data-bind=\"click:previousPage,enable:$root.fixCurrentPageIndex($root.currentPageIndex())>0,visible:$root.afterSearchData().length>0,css:{'ko-grid-pager-disabled': $root.fixCurrentPageIndex($root.currentPageIndex())==0}\">&lt;&lt;</a>\
                        <a href='javascript:void(0)' data-bind=\"visible:$root.afterSearchData().length>0,text: 1, click: function() { $root.changePage(0); }, css: {'ko-grid-pager-selected': 0 == $root.fixCurrentPageIndex($root.currentPageIndex()),'ko-grid-pager':0 != $root.fixCurrentPageIndex($root.currentPageIndex()) }\"></a>\
                        <span data-bind='visible:pagerStart()>2'>...</span>\
                        <!-- ko foreach: ko.utils.range(pagerStart,pagerEnd) -->\
                            <a href='javascript:void(0)' data-bind=\"text: $data + 1, click: function() { $root.changePage($data); }, disable:$data == $root.fixCurrentPageIndex($root.currentPageIndex()) ,css: {'ko-grid-pager-selected': $data == $root.fixCurrentPageIndex($root.currentPageIndex()),'ko-grid-pager':$data != $root.fixCurrentPageIndex($root.currentPageIndex()) }\"></a>\
                        <!-- /ko -->\
                        <span data-bind='visible:pagerEnd()<maxPageIndex()-2'>...</span>\
                        <a href='javascript:void(0)' data-bind=\"visible:maxPageIndex()>0,text: maxPageIndex()+1, click: function() { $root.changePage(maxPageIndex());}, css: {'ko-grid-pager-selected':  maxPageIndex() == $root.fixCurrentPageIndex($root.currentPageIndex()),'ko-grid-pager': maxPageIndex() != $root.fixCurrentPageIndex($root.currentPageIndex()) }\"></a>\
                        <a class='ko-grid-pager' href='javascript:void(0)' data-bind=\"click:nextPage,enable:$root.fixCurrentPageIndex($root.currentPageIndex())<maxPageIndex(),visible:$root.afterSearchData().length>0,css:{'ko-grid-pager-disabled': $root.fixCurrentPageIndex($root.currentPageIndex())==maxPageIndex()}\">&gt;&gt;</a>\
                        <span style='display:none;'><span>(</span><span id='ko_simpleGrid_recordCount' data-bind='text:$root.afterSearchData().length'></span><span>)</span></span>\
						<div class=\"input-group margin-left-10\" data-bind=\"visible:$root.afterSearchData().length>0\" style='width: 170px;'><label class=\"input-group-addon\" data-trans=\"page\"></label>\
						<input id=\"ko-grid-input-page\" type=\"text\" data-bind=\"value:pageToGo,valueUpdate: 'afterkeydown'\" class=\"form-control\"/>\
						<label class=\"input-group-addon cursorhand\" data-trans=\"go\" data-bind=\"click:function() { if(/^[0-9]+$/.test(pageToGo()) && (parseInt(pageToGo())-1) <= maxPageIndex() && (parseInt(pageToGo())-1) >= 0){$root.changePage(parseInt(pageToGo())-1); pageToGo(''); }} \"></label></div>\
                    </div>");

            return { 'controlsDescendantBindings':true };
        },
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update:function (element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default templates to be overridden
            var gridTemplateName = allBindings.simpleGridTemplate || "ko_simpleGrid_grid",
                pageLinksTemplateName = allBindings.simpleGridPagerTemplate || "ko_simpleGrid_pageLinks";

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate(gridTemplateName, viewModel, { templateEngine:templateEngine }, gridContainer, "replaceNode");

            // Render the page links
            if (viewModel.showPager) {
                var pageLinksContainer = element.appendChild(document.createElement("DIV"));
                ko.renderTemplate(pageLinksTemplateName, viewModel, { templateEngine:templateEngine }, pageLinksContainer, "replaceNode");
            }
        }
    };
})();