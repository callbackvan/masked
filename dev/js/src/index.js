/**
 * @var mixed doc
 * @var null type_null
 */

var Global = {
    initialization: true,
    instances: [],
    countries: [] // коды стран которые необходимо дополнительно подключить
};

var plugin = function (options) {
    var self        = this;
    self.elements   = [];
    self.options    = {
        lang:       MConf('lang'),
        country:    MConf('country')
    };

    self.init(options);

    if(typeof MaskedReady.use === type_undefined) {
        alternativeReady.init();
    }
    
    return self;
};

/**
 * После отгрузки всех масок проинициализируем все еще раз с доп масками если есть
 */
plugin.postload = function () {
    var i,
        c,
        object,
        country,
        pc = phoneCodes,
        g = Global,
        ge = g.instances,
        gc = g.countries;

    for(i in gc) {
        if(gc.hasOwnProperty(i)) {
            country = gc[i];
            if (isset(pc[country.iso_code]) && empty(pc[country.iso_code])) {
                pc.loadMasks(country.iso_code, country.lang, function () {
                    for (i in ge) {
                        if(ge.hasOwnProperty(i)) {
                            object = ge[i];
                            c = {'iso_code': object.opt.country, 'lang': object.opt.lang };


                            if(languageIsset(gc, c)) {
                                object.maskFinder(object.opt.phone, object.opt.country);
                            }

                        }
                    }
                });
            }
        }
    }

    g.initialization = false;
};

/**
 * Получить инстанс
 * @param e
 * @returns {*}
 */
plugin.getInst = function (e) {
    return Global.instances[e.className.match(new RegExp(MConf('prefix') + '[0-9a-zA-Z]+'))];
};

/**
 * Открываем доступ из вне для обращения к Masked.phoneCodes
 */
plugin.phoneCodes = phoneCodes;


plugin.getById = function (id) {
    var el = document.getElementById(id);
    if (el !== null) {
        return this.getInst(el);
    }
    return false;
};

plugin.getPhone = function (value) {
    return value ? plugin.prototype.getPhone(value) : false;
};

plugin.isValid = function (value) {
    return value ? plugin.prototype.isValid(value) : false;
};

plugin.checkCountryBinding = function (value, country) {
  return value && country ? plugin.prototype.checkCountryBinding(value, country) : false;
};

plugin.validationErrors = function (element, callback) {
    return element ? plugin.prototype.validationErrors(element, callback) : false;
};
plugin.Popover = Popover;


/**
 * Переключение статуса
 * @param e Элемент или класс
 */
plugin.toggle = function(e) {
    var self = this.getInst(e),
        opt  = self.opt;

    if (!empty(e.parentNode) && e.parentNode.className === 'CBH-masks') {
        e.parentNode.outerHTML = opt.oldState;
    } else {
        opt.element = e;
        self.setTemplate();
        opt.element.value       = opt.value;
        self.addActions(opt.element);
    }
};


plugin.prototype = {
    init:  function(options) {
        var self      = this;

        if (options) {
            if (typeof options === 'string') {
                options = {
                    selector: options
                };
            }
            self.options = generalMaskedFn.extend(self.options, options);
        }

        if (typeof options.selector !== type_undefined) {

            /**
             * Вернет массив елементов
             *
             * @param options
             */
            function select(options) {
                var i,
                    elem,
                    first_digit,
                    elements = [],
                    selector = options.selector;

                if ( typeof selector === 'string' ) {
                    first_digit = selector[0];

                    if ( (first_digit === '.') || (first_digit === '#') ) {
                        selector = selector.substr(1);
                    }

                    if (first_digit === '.') {
                        elem = doc.getElementsByClassName( selector );
                        for(i in elem) {
                            if (elem.hasOwnProperty(i) && elem[i] !== type_null) {
                                elements[elem[i].id||i] = elem[i];
                            }
                        }
                    } else if (first_digit === '#') {
                        elem = doc.getElementById( selector );
                        if (elem !== type_null) {
                            elements.push(elem);
                        }
                    } else {
                        console.log('selector finder empty');
                    }
                } else if (selector.nodeType) {
                    if (selector !== type_null) {
                        elements.push(selector);
                    }
                }
                return elements;
            }

            self.elements = select(options);
        }
        
        if (Object.keys(self.elements).length) {
            MaskedObserver.add(self);
        }

        return self;
    },

    start: function () {
        var i,
            el,
            opt,
            object,
            self     = this,
            elements = self.elements;

        for(i in elements) {
            if (elements.hasOwnProperty(i)) {
                el   = elements[i];
                if (el && !el.className.match(new RegExp(MConf('prefix') + '[0-9a-zA-Z]+'))) {
                    opt = generalMaskedFn.extend(generalMaskedFn.extend({}, self.options), getDataSet(el));

                    object = new Mask(el, opt);
                    Global.instances[object.opt.instId] = object;
                }
            }
        }
    },

    setPhone: function (value) {
        var instance,
            elements = this.elements;
        for(var i in elements) {
            if (elements.hasOwnProperty(i)) {
                instance = plugin.getInst(elements[i]);
                if (!empty(instance)) {
                    instance.maskFinder(value ? value : false);
                }
            }
        }
    },

    /**
     * Получить форматированную маску по номеру телефона, или объекту/объектам макси
     * вернет строку или массив, можно вернуть номер без маски
     * @param value
     * @param _with_mask
     * @returns {string}|{object}
     */
    getPhone: function (value, _with_mask) {
        var phone,
            inst,
            phones   = [],
            elements   = [],
            hs         = hardSearch,
            with_mask  = _with_mask || true;

        if (value) {
            value = getPhone(value);
            phone = hs(value);

            if (phone) {
                phone = getNewMaskValue(value, phone.mask);
            }
            if (!with_mask) {
                phone = getPhone(phone);
            }
            phones.push(phone);
        } else {
            elements = this.elements;

            for(var i in elements) {
                if (elements.hasOwnProperty(i)) {
                    if (!empty(plugin.getInst(elements[i]))) {
                        phone = plugin.getInst(elements[i]).opt.value;

                        phone = getNewMaskValue(phone, hs(getPhone(phone)).mask);
                        if (!with_mask) {
                            phone = getPhone(phone);
                        }
                        phones.push(phone);
                    }
                }
            }
        }

        return (
            value || !value && (Object.keys(elements).length == 1)
        ) ? phones[0] : phones;
    },

    isValid: function (value) {
        var phone,
            valid = false,
            hs         = hardSearch,
            elements   = [];

        if (value) {
            var mask = hs(getPhone(value));

            if (mask) {
              valid = getNewMaskValue(getPhone(value), hs(getPhone(value)).mask).indexOf('_') === -1;
            }
        } else {
             elements = this.elements;

             if (Object.keys(elements).length) {
                 phone = plugin.getInst(elements[0]).opt.value;

                 valid = getNewMaskValue(getPhone(phone), hs(getPhone(phone)).mask).indexOf('_') === -1;
             } else {
                 valid = false;
             }
        }
        return valid;
    },
    checkCountryBinding: function(value, country) {
      return checkCountryBinding(value, country)
    },
    validationErrors: function(element, callback) {
        var value = element.value,
            phone = getPhone(value);

        var errors = [];

        var inst = plugin.getInst(element),
        opt = null;

        if (inst) {
            opt = inst.opt;
        }

        var i18n = opt ? opt.i18n : MaskedConfig('i18n');
        var lang = opt ? opt.lang : MaskedConfig('lang');
        var country = opt ? opt.country : MaskedConfig('country');
        var country_binding = opt ? opt.country_binding : MaskedConfig('country_binding');

        if (
            this.checkCountryBinding(value, country) === false && country_binding ||
            /(.)\1{6,}/i.test(phone.replace(/\D+/g, ""))
        ) {
            errors.push({type:'phone_not_exists', message: i18n[lang].errors.phone_not_exists});
        }

        if (
            phone === '' || (value.indexOf('_') !== -1)
        ) {
            errors.push({type:'phone_is_empty', message: i18n[lang].errors.phone_is_empty});
        }

        Popover.hide();

        if(!onValidationError(errors, element)) {
            return callback();
        }

        return false;
    }
};
