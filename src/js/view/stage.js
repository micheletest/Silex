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
 * @fileoverview The stage is the area where the user drag/drops elements
 *   This class is in charge of listening to the DOM of the loaded publication
 *   and retrieve information about it
 *
 */


goog.provide('silex.view.Stage');

goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');

/**
 * the Silex stage class
 * @constructor
 * load the template and render to the given html element
 * @param  {Element}  element  DOM element to wich I render the UI
 *  has been changed by the user
 * @param  {silex.types.Controller} controller  structure which holds the controller classes
 */
silex.view.Stage = function(element, view , controller) {
  // store references
  this.element = element;
  this.view = view;
  this.controller = controller;

  // TODO: this should go in a controller
  // create an input element to get the focus
  this.focusInput = goog.dom.createElement('input');
  //this.focusInput.style.visibility = 'hidden';
  this.focusInput.style.left = '-1000px';
  this.focusInput.style.position = 'absolute';
  document.body.appendChild(this.focusInput);


  // Disable horizontal scrolling for Back page on Mac OS
  // on Silex UI
  var mwh = new goog.events.MouseWheelHandler(document.body);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, function (e) {
    if (e.deltaX < 0 && this.getScrollX() <= 0){
      e.preventDefault();
    }
  }, false, this);
  // Disable horizontal scrolling for Back page on Mac OS
  // on the iframe
  var mwh = new goog.events.MouseWheelHandler(element);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, function (e) {
    if (e.deltaX < 0 && this.getScrollX() <= 0){
      e.preventDefault();
    }
  }, false, this);

  // listen on body too because user can release
  // on the tool boxes
  goog.events.listen(document.body, 'mouseup', function(e){
    // if out of stage, release from drag of the plugin
    // simulate the mouse up on the iframe body
    var newEvObj = document.createEvent('MouseEvents');
    newEvObj.initEvent( 'mouseup', true, true);
    newEvObj.clientX = e.clientX;
    newEvObj.clientY = e.clientY;
    this.iAmClicking = true;
    this.bodyElement.dispatchEvent(newEvObj);
    this.iAmClicking = false;
  }, false, this);
  // listen on body too because user can release
  // on the tool boxes
  goog.events.listen(document.body, 'mousemove', function(e){
    var x = e.clientX;
    var y = e.clientY;
    this.handleMouseMove(e.target, x, y);
  }, false, this);
}


/**
 * class name for the stage element
 */
silex.view.Stage.STAGE_CLASS_NAME = 'silex-stage-iframe';

/**
 * input element to get the focus
 */
silex.view.Stage.BACKGROUND_CLASS_NAME = 'background';

/**
 * input element to get the focus
 */
silex.view.Stage.prototype.focusInput = null;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isResizing = false;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isDragging = false;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isDown = false;

/**
 * resize the iframe body to the size of its content
 * this is to always keep space between the elements (main container etc) and the stage border
 */
silex.view.Stage.prototype.bodyElementSizeToContent = function(event){
  if (this.bodyElement){
    var width = 0;
    var height = 0;
    var containers = goog.dom.getElementsByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, this.bodyElement);
    if (containers && containers.length > 0){
      var bb = silex.utils.Dom.getBoundingBox(containers);
      var viewportSize = this.viewport.getSize();
      var desiredBodyWidth = bb.width + 100;
      if (desiredBodyWidth < viewportSize.width) {
        // let the css handle a body of the size of the stage
        this.bodyElement.style.minWidth = '';
      }
      else {
        // we want the body to be this size
        // we use minWidth/minHeight in order to leave width/height to the user
        this.bodyElement.style.minWidth = desiredBodyWidth + 'px';
      }
      var desiredBodyHeight = bb.height + 100;
      if (desiredBodyHeight < viewportSize.height) {
        // let the css handle a body of the size of the stage
        this.bodyElement.style.minHeight = '';
      }
      else {
        // we want the body to be this size
        // we use minWidth/minHeight in order to leave width/height to the user
        this.bodyElement.style.minHeight = desiredBodyHeight + 'px';
      }
    }
  }
  else{
    // could not resize body to match content because this.bodyElement is undefined
    // this happens at startup
  }
}


/**
 * remove stage event listeners
 * @param {Element}  bodyElement   the element which contains the body of the website
 */
silex.view.Stage.prototype.removeEvents = function (bodyElement) {
  goog.events.removeAll(bodyElement);
};


/**
 * init stage events
 * handle mouse events for selection,
 * events of the jquery editable plugin,
 * double click to edit,
 * and disable horizontal scrolling for back page on Mac OS
 * @param {Element}  bodyElement   the element which contains the body of the website
 */
silex.view.Stage.prototype.initEvents = function (contentWindow) {
  this.bodyElement = contentWindow.document.body;

  // handle resize and the iframe body size
  if (this.viewport) {
    goog.events.removeAll(this.viewport);
  }
  this.viewport = new goog.dom.ViewportSizeMonitor(contentWindow);
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
    this.bodyElementSizeToContent, false, this);
  // init iframe body size
  this.bodyElementSizeToContent();

  // listen on body instead of element because user can release
  // on the tool boxes
  goog.events.listen(this.bodyElement, 'mouseup', function(e) {
    var x = e.clientX;
    var y = e.clientY;
    this.handleMouseUp(e.target, e.shiftKey);
  }, false, this);

  // move in the iframe
  var stagePosition = goog.style.getPosition(this.element);
  goog.events.listen(this.bodyElement, 'mousemove', function(e) {
    var x = e.clientX + stagePosition.x;
    var y = e.clientY + stagePosition.y;
    this.handleMouseMove(e.target, x, y);
  }, false, this);
  // detect mouse down
  goog.events.listen(this.bodyElement, 'mousedown', function(e) {
    this.lastClickWasResize = goog.dom.classes.has(e.target, 'ui-resizable-handle');
    var x = e.clientX;
    var y = e.clientY;
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(e.target, silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
    this.handleMouseDown(editableElement, x, y, e.shiftKey);
  }, false, this);
  // dispatch event when an element has been moved
  goog.events.listen(this.bodyElement, 'dragstop', function(e) {
    this.propertyChanged();
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element has been moved or resized
  goog.events.listen(this.bodyElement, 'resize', function(e) {
    this.propertyChanged();
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element is dropped in a new container
  goog.events.listen(this.bodyElement, 'newContainer', function(e) {
    var newContainer = e.target.parentNode;
    // move all selected elements to the new container
    goog.array.forEach(this.selectedElements, function(element) {
      if (element.parentNode !== newContainer){
        // store initial position
        var pos = goog.style.getPageOffset(element);
        // move to the new container
        goog.dom.appendChild(newContainer, element);
        // restore position
        goog.style.setPageOffset(element, pos);
      }
      this.controller.stageController.newContainer(element);
    }, this);
    // update property tool box
    this.propertyChanged();
  }, false, this);
  // when an element is dropped on the background
  // move it to the body
  goog.events.listen(this.bodyElement, 'droppedOutOfStage', function(e) {
    var element = e.target;
    // store initial position
    var pos = goog.style.getPageOffset(element);
    // move to the new container (the stage)
    goog.dom.appendChild(this.bodyElement, element);
    // restore position
    goog.style.setPageOffset(element, pos);
  }, false, this);
  // detect double click
  goog.events.listen(this.bodyElement, goog.events.EventType.DBLCLICK, function(e) {
    this.controller.stageController.editElement();
  }, false, this);
};

/**
 * redraw the properties
 * @param   {Array<element>} selectedElements the elements currently selected
 * @param   {HTMLDocument} document  the document to use
 * @param   {Array<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Stage.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
  // remember selection
  this.selectedElements = selectedElements;
  this.bodyElementSizeToContent();
};

/**
 * handle mouse up
 * notify the controller to select/deselect the element (multiple or single)
 * reset state:
 * - clicked DOM element
 * - mouse position
 * - scroll position
 * - isDown
 * @param   {element} target a DOM element clicked by the user
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.handleMouseUp = function(target, shiftKey) {
  // update state
  this.isDown = false;
  // handle selection
  if (this.isDragging || this.isResizing) {
    // update property tool box
    this.propertyChanged();
    // keep flags up to date
    this.isDragging = false;
    this.isResizing = false;
  }
  // if not dragging, and on stage, then change selection
  else if (this.iAmClicking != true){
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(target, silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
    // single or multiple selection
    if(shiftKey === true){
      // if the element is selected, then unselect it
      if (this.lastSelected != editableElement){
        this.controller.stageController.deselect(editableElement);
      }
    }
    else{
      // if the user did not move the element select it in case other elements were selected
      // check if selection has changed
      // ?? do not check if selection has changed, because it causes refresh bugs (apply border to the next selected element)
      var hasChanged = (this.selectedElements.length === 1 && this.selectedElements[0] === editableElement);
      if (!hasChanged){
        // update selection
        this.controller.stageController.select(editableElement);
      }
    }
  }
  if(this.iAmClicking != true){
    this.resetFocus();
  }
};


/**
 * remove the focus from text fields
 */
silex.view.Stage.prototype.resetFocus = function() {
  this.focusInput.focus();
  this.focusInput.blur();
}

/**
 * handle mouse move
 * if the mouse button isDown, then
 * - compute the offset of the mouse from the last known position
 * - handle the scroll position changes (while dragging an element near the border of the stage, it may scroll)
 * - apply the ofset to the dragged or resized element(s)
 * @param   {element} target a DOM element clicked by the user
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 */
silex.view.Stage.prototype.handleMouseMove = function(target, x, y) {
  // update states
  if (this.isDown){
    // update property tool box
    this.propertyChanged();
    // case of a drag directly after mouse down (select + drag)
    if (this.lastSelected === null) {
      var editableElement = goog.dom.getAncestorByClass(target, silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
      this.lastSelected = editableElement;
    }
    if (this.resizeDirection === null){
      this.resizeDirection = this.getResizeDirection(target);
    }
    // update states
    if (!this.isDragging && !this.isResizing){
      if (this.lastClickWasResize){
        this.isResizing = true;
      }
      else{
        this.isDragging = true;
      }
    }
    else{
      // keep the body size while dragging or resizing
      this.bodyElementSizeToContent();
    }
    // compute the offset compared to the last mouse move
    // take the scroll delta into account (changes when dragging outside the stage)
    var scrollX = this.getScrollX();
    var scrollY = this.getScrollY();
    var scrollMaxX = this.getScrollMaxX();
    var scrollMaxY = this.getScrollMaxY();
    var offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
    var offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
    // update the latest position and scroll
    this.lastPosX = x;
    this.lastPosY = y;
    this.lastScrollLeft = scrollX;
    this.lastScrollTop = scrollY;

    // apply offset to other selected element
    goog.array.forEach(this.selectedElements, function(element) {
      if (element !== this.lastSelected){
        if (this.isResizing){
          var size = goog.style.getSize(element);
          // depending on the handle which is dragged,
          // only width and/or height should be set
          if (this.resizeDirection === 's'){
            offsetX = 0;
          }
          else if (this.resizeDirection === 'n'){
            var pos = goog.style.getPosition(element);
            goog.style.setPosition(element, pos.x, pos.y + offsetY);
            offsetY = -offsetY;
            offsetX = 0;
          }
          else if (this.resizeDirection === 'w'){
            var pos = goog.style.getPosition(element);
            goog.style.setPosition(element, pos.x + offsetX, pos.y);
            offsetX = -offsetX;
            offsetY = 0;
          }
          else if (this.resizeDirection === 'e'){
            offsetY = 0;
          }
          goog.style.setSize(element, size.width + offsetX, size.height + offsetY);
        }
        else if (this.isDragging){
          // do not move an element if one of its parent is already being moved
          // TODO: do not need to set position if the element is the one draged by the editable plugin
          if (!goog.dom.getAncestorByClass(element.parentNode, silex.model.Element.SELECTED_CLASS_NAME))
          {
            var pos = goog.style.getPosition(element);
            goog.style.setPosition(element, pos.x + offsetX, pos.y + offsetY);
          }
        }
      }
    }, this);
    // handle the case where mouse is near a border of the stage
    // scroll accordingly
    var iframePosition = goog.style.getPosition(this.element);
    var iframeSize = goog.style.getSize(this.element);
    var xInStage = x - iframePosition.x;
    var yInStage = y - iframePosition.y;
    if (xInStage < 30){
      this.setScrollX(scrollX - 35);
    }
    else if(xInStage > iframeSize.width - 30){
      this.setScrollX(scrollX + 35);
    }
    if (yInStage < 30){
      this.setScrollY(scrollY - 35);
    }
    else if(yInStage > iframeSize.height - 30){
      this.setScrollY(scrollY + 35);
    }
  }
};


/**
 * handle mouse down
 * notify the controller to select the element (multiple or single)
 * store state:
 * - clicked DOM element
 * - mouse position
 * - scroll position
 * - isDown
 * @param   {element} element Silex element currently selected (text, image, html box...)
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.handleMouseDown = function(element, x, y, shiftKey) {
  this.lastSelected = null;
  this.resizeDirection = null;
  // if the element was not already selected
  if (!goog.dom.classes.has(element, silex.model.Element.SELECTED_CLASS_NAME)){
    this.lastSelected = element;
    // notify the controller
    if (shiftKey){
      this.controller.stageController.selectMultiple(element);
    }
    else{
      this.controller.stageController.select(element);
    }
  }
  // keep track of the last mouse position and body scroll
  this.lastPosX = x;
  this.lastPosY = y;
  this.lastScrollLeft = this.getScrollX();
  this.lastScrollTop = this.getScrollY();
  // update state
  this.isDown = true;
};


/**
 * check if the target is a UI handle to resize or move (draggable jquery plugin)
 * @param   {element} target a DOM element clicked by the user, which may be a handle to resize or move
 */
silex.view.Stage.prototype.getResizeDirection = function(target) {
  if(goog.dom.classes.has(target, 'ui-resizable-s')) return 's';
  else if (goog.dom.classes.has(target, 'ui-resizable-n')) return 'n';
  else if (goog.dom.classes.has(target, 'ui-resizable-e')) return 'e';
  else if (goog.dom.classes.has(target, 'ui-resizable-w')) return 'w';
  else if (goog.dom.classes.has(target, 'ui-resizable-se')) return 'se';
  else if (goog.dom.classes.has(target, 'ui-resizable-sw')) return 'sw';
  else if (goog.dom.classes.has(target, 'ui-resizable-ne')) return 'ne';
  else if (goog.dom.classes.has(target, 'ui-resizable-nw')) return 'nw';
  // Target is not a resize handle
  return null;
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.setScrollX = function(value) {
  var win = window.win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  win.document.documentElement.scrollLeft = value;
  win.document.body.scrollLeft = value;
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.setScrollY = function(value) {
  var win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  win.document.documentElement.scrollTop = value;
  win.document.body.scrollTop = value;
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.getScrollX = function() {
  var win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  return Math.max(win.document.documentElement.scrollLeft, win.document.body.scrollLeft);
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.getScrollY = function() {
  var win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  return Math.max(win.document.documentElement.scrollTop, win.document.body.scrollTop);
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.getScrollMaxX = function() {
  var win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  return Math.max(win.document.documentElement.scrollLeftMax, win.document.body.scrollWidth);
}


/**
 * get the scroll property, working around cross browser issues
 */
silex.view.Stage.prototype.getScrollMaxY = function() {
  var win = goog.dom.getFrameContentWindow(goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
  return Math.max(win.document.documentElement.scrollTopMax, win.document.body.scrollHeight);
}


/**
 * notify the controller that the properties of the selection have changed
 */
silex.view.Stage.prototype.propertyChanged = function() {
  // check position and size are int and not float
  goog.array.forEach(this.selectedElements, function(element) {
    // round position
    var position = goog.style.getPosition(element);
    var x = position.x ? Math.floor(position.x) : null;
    var y = position.y ? Math.floor(position.y) : null;
    if (goog.isDefAndNotNull(x) || goog.isDefAndNotNull(y)){
      goog.style.setPosition(element, x, y);
    }
    // round size
    var size = goog.style.getSize(element);
    var x = size.x ? Math.floor(size.x) : null;
    var y = size.y ? Math.floor(size.y) : null;
    if (goog.isDefAndNotNull(x) || goog.isDefAndNotNull(y)){
      goog.style.setSize(element, x, y);
    }
  }, this);
  // update property tool box
  this.controller.stageController.change();
}
