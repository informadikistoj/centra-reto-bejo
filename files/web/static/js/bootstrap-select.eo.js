/*!
 * Bootstrap-select v1.10.0 (http://silviomoreto.github.io/bootstrap-select)
 *
 * Copyright 2013-2016 bootstrap-select
 * Licensed under MIT (https://github.com/silviomoreto/bootstrap-select/blob/master/LICENSE)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["jquery"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    factory(jQuery);
  }
}(this, function (jQuery) {

(function ($) {
  $.fn.selectpicker.defaults = {
    noneSelectedText: 'Nenhum opção marcada',
    noneResultsText: 'Nenhum resultado para {0}',
    countSelectedText: function (numSelected, numTotal) {
      return (numSelected == 1) ? "{0} opção marcada" : "{0} opções marcadas";
    },
    maxOptionsText: function (numAll, numGroup) {
      return [
        (numAll == 1) ? 'Limite atingido (máx. {n} opções)' : 'Limite atingido (máx. {n} opções)',
        (numGroup == 1) ? 'Limite de grupo atingido (máx. {n} opções)' : 'Limite de grupo atingido (máx. {n} opções)'
      ];
    },
    selectAllText: 'Marcar todos',
    deselectAllText: 'Desmarcar todos',
    multipleSeparator: ', '
  };
})(jQuery);


}));
