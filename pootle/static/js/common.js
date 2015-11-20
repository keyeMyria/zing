/*
 * Copyright (C) Pootle contributors.
 *
 * This file is a part of the Pootle project. It is distributed under the GPL3
 * or later license. See the LICENSE file for a copy of the license and the
 * AUTHORS file for copyright and authorship information.
 */

'use strict';

import cookie from 'utils/cookie';
import diff from 'utils/diff';

import configureStore from './store';

// Aliased non-commonJS modules

// Major libraries
var $ = require('jquery');

// jQuery plugins
require('jquery-cookie');
require('jquery-magnific-popup');
require('jquery-select2');
require('jquery-tipsy');

// Backbone plugins
require('backbone-safesync');

// Other plugins
var Spinner = require('spin');


Spinner.defaults = {
  lines: 11,
  length: 2,
  width: 5,
  radius: 11,
  rotate: 0,
  corners: 1,
  color: '#000',
  direction: 1,
  speed: 1,
  trail: 50,
  opacity: 1/4,
  fps: 20,
  zIndex: 2e9,
  className: 'spinner',
  top: 'auto',
  left: 'auto',
  position: 'relative'
};


// Pootle-specifics. These need to be kept here until:
// 1. they evolve into apps of their own
// 2. they're only used directly as modules from other apps (and they are
//    not referenced like `PTL.<module>.<method>`)

window.PTL = window.PTL || {};

PTL.auth = require('./auth');
PTL.agreement = require('./agreement.js');
PTL.browser = require('./browser.js');
PTL.captcha = require('./captcha.js');
PTL.contact = require('./contact.js');
PTL.dropdown = require('./dropdown.js');
PTL.msg = require('./msg.js');
PTL.search = require('./search.js');
PTL.score = require('./score.js');
PTL.stats = require('./stats.js');
PTL.utils = require('./utils.js');
PTL.utils.diff = diff;


var helpers = require('./helpers.js');
var utils = require('./utils.js');


PTL.store = configureStore();


PTL.common = {

  init: function (opts) {
    PTL.auth.init();
    PTL.browser.init();

    $(window).load(function () {
      $('body').removeClass('preload');
    });

    if (opts.hasSidebar) {
      helpers.fixSidebarHeight();
      $(window).on('resize', helpers.fixSidebarHeight);
    }

    helpers.updateRelativeDates();
    setInterval(helpers.updateRelativeDates, 6e4);

    // Tipsy setup
    $(document).tipsy({
      gravity: $.fn.tipsy.autoBounds2(150, 'n'),
      html: true,
      fade: true,
      delayIn: 750,
      opacity: 1,
      live: '[title], [original-title]'
    });
    setInterval($.fn.tipsy.revalidate, 1000);

    $(".js-select2").select2({
      width: "resolve"
    });

    // Set CSRF token for XHR requests (jQuery-specific)
    $.ajaxSetup({
      traditional: true,
      crossDomain: false,
      beforeSend: function (xhr, settings) {
        if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type)) {
          xhr.setRequestHeader('X-CSRFToken', cookie('csrftoken'));
        }
      }
    });

    /* Collapsing functionality */
    // XXX: crappy code, only used in `term_edit.html`
    $(document).on("click", ".collapse", function (e) {
      e.preventDefault();
      $(this).siblings(".collapsethis").slideToggle("fast");

      if ($("textarea", $(this).next("div.collapsethis")).length) {
        $("textarea", $(this).next("div.collapsethis")).focus();
      }
    });

    /* Page sidebar */
    // TODO: create a named function
    $(document).on('click', '.js-sidebar-toggle', function () {
      var $sidebar = $('.js-sidebar'),
          openClass = 'sidebar-open',
          cookieName = 'pootle-browser-sidebar',
          cookieData = JSON.parse($.cookie(cookieName)) || {};

      $sidebar.toggleClass(openClass);

      cookieData.isOpen = $sidebar.hasClass(openClass);
      $.cookie(cookieName, JSON.stringify(cookieData), {path: '/'});
    });

    /* Popups */
    $(document).magnificPopup({
      type: 'ajax',
      delegate: '.js-popup-ajax',
      mainClass: 'popup-ajax'
    });

    /* Generic toggle */
    $(document).on("click", ".js-toggle", function (e) {
      e.preventDefault();
      var target = $(this).attr("href") || $(this).data("target");
      $(target).toggle();
    });

    /* Sorts language names within select elements */
    var ids = ["id_languages", "id_alt_src_langs", "-language",
               "-source_language"];

    $.each(ids, function (i, id) {
      var $selects = $("select[id$='" + id + "']");

      $.each($selects, function (i, select) {
        var $select = $(select);
        var options = $("option", $select);
        var selected;

        if (options.length) {
          if (!$select.is("[multiple]")) {
            selected = $(":selected", $select);
          }

          var opsArray = $.makeArray(options);
          opsArray.sort(function (a, b) {
            return utils.strCmp($(a).text(), $(b).text());
          });

          options.remove();
          $select.append($(opsArray));

          if (!$select.is("[multiple]")) {
            $select.get(0).selectedIndex = $(opsArray).index(selected);
          }
        }
      });
    });
  }

};
