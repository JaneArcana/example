define([
    'jquery',
    'class/service',
    'underscore',
    'view/global/popup',
    'service/async',
    'service/translator'
], function ($, Service, _, PopupTemplate, Async, Translator) {
    return Service.extend({
        view: new PopupTemplate(),

        popupBaseView: null,
        popupBodyView: null,
        popupMenuView: null,
        openedPopupBodyId: null,
        lastPopupBasePath: "",
        defaultPopupBasePath: "popupBase",

        isPopupBaseLoaded: false,
        currentFloatType: "",
        floatTypes: {LEFT: "left", RIGHT: "right"},
        floatClasses: {LEFT: "popupWrapperFloatLeft", RIGHT: "popupWrapperFloatRight"},

        initialize: function () {
            var context = this;

            this.view.setContainer("body > #container");
            this.view.render();

            context.on("popup:popupBaseLoaded", function () {
                context.isPopupBaseLoaded = true;
            });

            context.on("popup:popupBodyLoaded", function () {
                context.showPopup();
            });

            context.on("popup:close", function () {
                context.closePopup();
            });

            this.loadBasePopup("popupBase");
        },

        loadBasePopup: function (basePopupPath) {
            if (this.lastPopupBasePath != basePopupPath) {
                if (this.popupBodyView) {
                    if (typeof(this.popupBodyView.remove) == 'function')
                        this.popupBodyView.remove();
                    delete this.popupBodyView;
                }

                var context = this;
                context.isPopupBaseLoaded = false;

                require(['view/popup/' + basePopupPath], function (PopupBaseTemplate) {
                    if (context.popupBaseView)
                        context.popupBaseView.remove();

                    context.popupBaseView = new PopupBaseTemplate();
                    context.view.addChild(".popupWrapper", context.popupBaseView);
                    context.lastPopupBasePath = basePopupPath;
                });
            }
        },

        setFloat: function (direction, otherClass) {
            $popupWrapper = this.view.$myel.find(".popupWrapper");

            $popupWrapper.removeAttr('class');
            $popupWrapper.addClass('popupWrapper').addClass(otherClass);

            if (direction == this.floatTypes.LEFT) {
                this.view.$myel.find(".popupWrapper").addClass(this.floatClasses.LEFT);
            }
            else if (direction == this.floatTypes.RIGHT) {
                this.view.$myel.find(".popupWrapper").addClass(this.floatClasses.RIGHT);
            }
            else
                alert("Wrong popup float direction");
        },

        loadPopupBody: function (callback) {
            this.popupBaseView.addChild(".popupContentWrapper", this.popupBodyView, callback);
        },

        loadPopupMenu: function (callback) {
            this.popupBaseView.addChild(".header > .links", this.popupMenuView, callback);
        },

        openPopup: function (popupBodyView, openedPopupBodyId, popupMenuView, popupCallback, floatType) {
            if (!this.isPopupBaseLoaded) {
                var me = this;
                Async.call(function (callback) {
                    setTimeout(callback, 100);
                }, [
                    function () {
                        me.openPopup(popupBodyView, openedPopupBodyId, popupMenuView, popupCallback, floatType);
                    }
                ], [
                    Async.criteria.viewCurrent(popupBodyView),
                    Async.criteria.viewCurrent(popupMenuView)
                ]);
                //return;
            }
            if (!_.isNull(this.openedPopupBodyId)) {
                if (this.openedPopupBodyId == openedPopupBodyId) {
                    //console.log("exit");
                    //return;
                }
            }

            if (this.popupBodyView)
                this.closePopup();

            if (this.popupMenuView)
                this.closePopup();

            this.openedPopupBodyId = openedPopupBodyId;
            var myregRight = /\bright\b/;
            var myregLeft = /\b\left\b/;

            var rght = myregRight.exec(floatType);
            if (rght != null) {
                var newStr = floatType.replace(myregRight, '');
                this.setFloat("right", newStr);
            } else {
                var lft = myregLeft.exec(floatType);
                var newStr = (lft != null) ? floatType.replace(myregLeft, '') : floatType;
                this.setFloat("left", newStr);
            }
            this.popupBodyView = popupBodyView;
            this.popupMenuView = popupMenuView;

            this.loadPopupBody(popupCallback);
            this.loadPopupMenu(popupCallback);

        },

        showPopup: function () {
            this.view.$myel.find(".popupWrapper").show();
            this.trigger('popup:opened');
        },

        closePopup: function () {

            this.view.$myel.find(".popupWrapper").hide();
            this.openedPopupBodyId = null;
            if (this.popupBodyView) {
                // this.popupBodyView.remove();
                // this.popupBodyView = false;

                if (typeof(this.popupBodyView.remove) == 'function') {
                    this.popupBodyView.remove();
                }
                delete this.popupBodyView;
            }

            if (this.lastPopupBasePath != this.defaultPopupBasePath) {
                this.loadBasePopup(this.defaultPopupBasePath);
            }
            this.trigger('popup:closed');

        },

        bindMenu: function (view, linkClass, header, contentClass) {
            var self = this;
            view.$myel.on('click', linkClass, function () {
                self.setHeader(header, view.translationdomain);
                self.showContent(contentClass);
            });
        },

        showContent: function (divClass) {
            var container = $('.popupContentWrapper .defaultContentBox');
            container.find('> div').hide();
            container.find(divClass).show();
        },

        setHeader: function (header, translationdomain) {
            var self = this;
            Translator.translate(translationdomain, [
                {name: header}
            ], function (translate) {
                self.trigger("popup:popupBodyLoaded");
                self.trigger("popup:setHeaderText", translate[0]);
            });

        },

        processPopupLists: function (view) {
            view.$myel.find("ul").click(function (e) {
                var target = e && e.target || e.srcElement;

                $(this).find('li').removeClass('active');

                while (target.tagName != 'UL') {
                    if (target.tagName == 'LI') {
                        $(target).addClass('active');
                        break;
                    }
                    target = target.parentNode;
                }
            });
        }
    });
});