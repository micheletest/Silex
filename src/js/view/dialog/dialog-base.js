//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview
 * base class for all dialogs
 * @see     http://ace.c9.io/
 *
 *
 */

goog.provide('silex.view.dialog.DialogBase');


goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');



/**
 * @constructor
 *
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.dialog.DialogBase = function(element, view, controller) {
  this.element = element;
  this.view = view;
  this.controller = controller;

  // store the background
  this.background = goog.dom.getElementByClass('dialogs-background');

  // flag to remember if the dialog is opened
  this.isOpened = false;

  // let time to build the UI (e.g. for file explorer)
  setTimeout(goog.bind(function() {
    // init the editor
    this.initUI();
  }, this), 1000);
};

/**
 * init the menu and UIs
 */
silex.view.dialog.DialogBase.prototype.initUI = function() {
  // handle escape key
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  shortcutHandler.registerShortcut('esc', goog.events.KeyCodes.ESC);
  goog.events.listen(
      shortcutHandler,
      goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
      goog.bind(this.closeEditor, this));
  // close button
  goog.events.listen(goog.dom.getElementByClass('close-btn', this.element), goog.events.EventType.CLICK, function() {
    this.closeEditor();
  }, false, this);
  // dialogs background
  goog.events.listen(this.background, goog.events.EventType.CLICK, function(e) {
    this.closeEditor();
  }, false, this);
};


/**
 * Open the editor
 */
silex.view.dialog.DialogBase.prototype.openEditor = function() {
  if (this.isOpened === false) {
    // show
    goog.dom.classes.remove(this.background, 'hidden-dialog');
    goog.dom.classes.remove(this.element, 'hidden-dialog');
    // flag to remember if the dialog is opened
    this.isOpened = true;
  }
};


/**
 * close text editor
 */
silex.view.dialog.DialogBase.prototype.closeEditor = function() {
  if (this.isOpened === true) {
    // flag to remember if the dialog is opened
    this.isOpened = false;
    // hide dialog and background
    goog.dom.classes.add(this.background, 'hidden-dialog');
    goog.dom.classes.add(this.element, 'hidden-dialog');
  }
};
