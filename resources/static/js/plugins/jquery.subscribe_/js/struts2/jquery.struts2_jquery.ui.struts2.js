vpn_eval((function(){
/*
 * jquery.subscribe.1.2.3
 * 
 * Implementation of publish/subcription framework for jQuery
 * Requires use of jQuery. Tested with jQuery 1.4 and above
 *
 *
 * Copyright (c) 2008 Eric Chijioke (obinna a-t g mail dot c o m)
 * Copyright (c) 2012 Johannes Geppert http://www.jgeppert.com
 *
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 *  Release Notes:
 *  
 *  version 1.1:
 *  
 *  Fixed unexpected behavior which can occur when a script in a embedded page (page loaded in div,tab etc.) subscribes a handler for a topic using
 *  the jQuery subscribe ($.subscribe) or a no-id element but this subscribe plugin is not reloaded within that embedded page (for example, when
 *  script is included in containing page) . In this case, if the embedded page is reloaded without reloading the entire page (and plugin), the
 *  subscription could be made multiple times for the topic, which will call the handler multiple times each time the topic is published. 
 *  Code has been added to prevent this when the subscription is made using the non-element subscribe ($.subscribe()), which assures that only one
 *  subscription is made for a topic for a given window/frame. To prevent this from happening for an element subscription ($elem.subscribe()), make
 *  sure that the element has an id attribute.
 *  
 *  version 1.2
 *  Added the isSubscribed() method
 *  
 *  version 1.2.1
 *  Fixed to work with jQuery 1.4 changes 
 *     - changed $() syntax to $(document)
 *     
 *  version 1.2.2
 *  Added subscribe overwrite property (default = false) to handle 1.4.2 changes and
 *  allow for multiple subscriptions by the same element to the same topic
 *     - changed $() syntax to $(document)
 *     
 *  version 1.2.3
 *  jslint fixes
 *     
 *  Added protection to variables when file is loaded multiple times
 */

/*global jQuery, window, document   */

( function($) {

	var _subscribe_topics, _subscribe_handlers, _subscribe_getDocumentWindow, i;
	
	if(!window._subscribe_topics) {	
		_subscribe_topics = {};
		_subscribe_handlers = {}; 
	}
	
	_subscribe_getDocumentWindow = function(document){
		return document.parentWindow || document.defaultView;
	};
	
	$.fn.extend({
		
		/**
		 * Creates a new topic without any subscribers. 
		 * Not usually used explicitly 
		 */
		createTopic :  function(topic) {	
		
			if(topic && !_subscribe_topics[topic]) {
				_subscribe_topics[topic] = {};
				_subscribe_topics[topic].objects = {};
				_subscribe_topics[topic].objects.__noId__ = [];
			}
			
			return this;
		},
		
		/**
		 * Destroy an existing topic and unsubscribe all subscribers
		 */
		destroyTopic  :	 function(topic) {	
		
			if(topic && _subscribe_topics[topic]) {
				
					$.each( _subscribe_topics[topic].objects, function(i, object){

						if($.isArray(object)) {		// handle '__noId__' elements
	
								$.each( object, function(j, obj){
									
									//typeof(object) check in case someone has added methods to Array.protoype
									if(!$.isFunction(obj)) {
										obj.unbind(topic);
									}
								});
								
						} else {
							object.unbind(topic);
						}
					});
			}

			delete _subscribe_topics[topic];
			
			return this;
		},
		
		/**
		 * Subscribes an object to particular topic with a handler.
		 * When the topic is published, this handler will be executed.
		 * 
		 * Parameters:
		 *  -topic- is the string name of the topic
		 *  -handler- is a handler function and is of the form function(event, data), in which the 'this' refers to the element itself.
		 *  handler can be a function or can be a string referring to a function previously registered using the $.subscribeHandler() function
		 *            Note: returning 'false' from the handler will prevent subsequent handlers from being executed on this element during 
		 *            this call.
		 *  -data- (optional) is additional data that is passed to the event handler as event.data when the topic is published
		 *
		 * Note: Unexpected behavior can occur when a script in a embedded page (page loaded in div,tab etc.) subscribes a handler for a topic using
		 *  the global jQuery subscribe ($.subscribe) or a no-id element but this subscribe plugin .js is not reloaded within that embedded page (for example, when
		 *  script is included in container page) . In this case, if the embedded page is reloaded without reloading the container page (and plugin), the
		 *  subscription could be made multiple times for the topic, which will call the handler multiple times each time the topic is published. 
		 *  Code has been added to prevent this when the subscription is made using the non-element subscribe ($.subscribe()), which assures that only one
		 *  subscription is made for a topic for a given window/frame. To prevent this from happening for an element subscription ($elem.subscribe()), make
		 *  sure that the element has an id attribute. 
		 */
		subscribe :  function(topic, handler, data, multiple) {	
				
			if(this[0] && topic && handler) {
				
				this.createTopic(topic);
				
				if(this.attr('id')) {
					_subscribe_topics[topic].objects[this.attr('id')] = this;
				} else {
										
					//do not subscribe the same window/frame document multiple times, this causes unexpected behavior of executing embedded scripts multiple times
					var noIdObjects = _subscribe_topics[topic].objects.__noId__;
					
					if(this[0].nodeType === 9) { //if document is being bound (the case for non-element jQuery subscribing ($.subscribe)
					
							jQuery.each(noIdObjects, function(j, noIdObject) {
															
								//typeof(noIdObject) check in case someone has added methods to Array.protoype
								if(!$.isFunction(noIdObject) && noIdObject[0].nodeType === 9 && _subscribe_getDocumentWindow(this[0]).frameElement === _subscribe_getDocumentWindow(noIdObject[0]).frameElement ) {
									return this;	
								}
							});
					}
					
					var exists = false;
					for(i = 0; i < noIdObjects.length; i++) {
						if(noIdObjects[i] === this){
							exists = true;
							break;
						}
					}
					
					if(!exists) {
						_subscribe_topics[topic].objects.__noId__.push(this);
					}
				}
				

				if(true === multiple) {		//allow multiple topic handlers to be bound to topic for same object
									
					if($.isFunction(handler)) {
						this.bind(topic, data, handler);
					} else if(typeof(handler) === 'string' && $.isFunction(_subscribe_handlers[handler])) {
						this.bind(topic, data, _subscribe_handlers[handler]);
					}
					
				} else {
				
					var events = this.data('events');
					if(events) {
						var eventsTopic = events[topic];
						if(eventsTopic && eventsTopic.length > 0) {  //already bound to this topic
							
							//replace with new one
							this.unbind(topic);
						}
					}

					if($.isFunction(handler)) {
						this.bind(topic, data, handler);
					} else if(typeof(handler) === 'string' && $.isFunction(_subscribe_handlers[handler])) {
						this.bind(topic, data, _subscribe_handlers[handler]);
					}					
				}
			}
			
			return this;
		},
		
		/**
		 * Remove a subscription of an element to a topic. 
		 * This will unbind stop all handlers from executing on this element when the topic
		 * is published
		 */
		unsubscribe :  function(topic) {	
			
			if(topic) {

				if(_subscribe_topics[topic]) {
					
					if(this.attr('id')) {
						
						var object = _subscribe_topics[topic].objects[this.attr('id')];
						
						if(object) {
							delete _subscribe_topics[topic].objects[this.attr('id')];
						}
						
					} else {
	
						var noIdObjects = _subscribe_topics[topic].objects.__noId__;
						
						for(i = 0; i < noIdObjects.length; i++){

							//typeof(noIdObject) check in case someone has added methods to Array.protoype
							if(!$.isFunction(noIdObjects[i]) && noIdObjects[i] === this){
								
								_subscribe_topics[topic].objects.__noId__.splice(i,1);
								break;
							}
						}
					}
				}
			
				this.unbind(topic);
			}
			
			return this;
		},
		
		/**
		 * Determine if an element has already subscribed to a topics
		 * returns true if so, otherwise false
		 */
		isSubscribed :  function(topic) {	
			
			if(topic) {

				if(_subscribe_topics[topic]) {
					
					if(this.attr('id')) {
						
						var object = _subscribe_topics[topic].objects[this.attr('id')];
						
						if(object) {
							return true;
						}
						
					} else {
	
						var noIdObjects = _subscribe_topics[topic].objects.__noId__;
						
						for(i = 0; i < noIdObjects.length; i++){

							//typeof(noIdObject) check in case someone has added methods to Array.protoype
							if(!$.isFunction(noIdObjects[i]) && noIdObjects[i] === this){
								return true;
							}
						}
					}
				}
			}
			
			return false;
		},
		
		/**
		 * Publishes a topic (triggers handlers on all topic subscribers)
		 * This ends up calling any subscribed handlers which are functions of the form function (event, data)
		 * where: event - is a standard jQuery event object
		 *    data - is the data parameter that was passed to this publish() method
		 *    event.data - is the data parameter passed to the subscribe() function when this published topic was subscribed to
		 *    event.target  - is the dom element that subscribed to the event (or the document element if $.subscribe() was used)
		 * 
		 * Parameters:
		 *  -topic- is the string name of the topic
		 *  -data- (optional) is additional data that is passed to the event handler 'data' parameter when the topic is published
		 *     handler can be a function or can be a string referring to a function previously registered using the $.subscribeHandler() function
		 *  -originalEvent- (optional) may be passed in a reference to an event which triggered this publishing. This will be passed as the 
		 *     'originalEvent' field of the triggered event which will allow for controlling the propagation of higher level events
		 *     from within the topic handler. In other words, this allows one to cancel execution of all subsequent handlers on the originalEvent 
		 *            for this element by return 'false' from a handler that is subscribed to the topic published here. This can be especially useful
		 *            in conjunction with publishOnEvent(), where a topic is published when an event executes (such as a click) and we want our
		 *            handler logic prevent additional topics from being published (For example if our topic displays a 'delete confirm' dialog on click and
		 *            the user cancels, we may want to prevent subsequent topics bound to the original click event from being published).
		 */
		publish : function(topic, data, originalEvent) {	
		
			if(topic) {
				
				this.createTopic(topic);
				
				//if an orginal event exists, need to modify the event object to prevent execution of all
				//other handlers if the result of the handler is false (which calls stopPropagation())
								
				var subscriberStopPropagation = function(){
					
					this.isImmediatePropagationStopped = function(){
						return true;
					};

					this.isPropagationStopped  = function(){
						return true;
					};
					//(new $.Event).stopPropagation();
					
					if(this.originalEvent) {
						
						this.originalEvent.isImmediatePropagationStopped = function(){
							return true;
						};
						
						this.originalEvent.stopPropagation = subscriberStopPropagation;
					}
				};
				
				var event = jQuery.Event(topic);
				$.extend(event,{originalEvent: originalEvent, stopPropagation: subscriberStopPropagation});
								
				jQuery.each(_subscribe_topics[topic].objects, function(i, object) {
						
						if($.isArray(object)) {		// handle '__noId__' elements (if any)
		
							if(object.length > 0) {
							
								jQuery.each(object, function(j, obj) {
									//typeof(object) check in case someone has added methods to Array.protoype
									if(!$.isFunction(obj)) {
										obj.trigger( event,data);
									}
								});
							}
							
						} else {
							object.trigger( event,data);
						}
				});
			
			}
			
			return this;
		},
		
		/**
		 * Binds an objects event handler to a publish call
		 * 
		 * Upon the event triggering, this ends up calling any subscribed handlers which are functions of the form function (event, data)
		 * where: event- is a standard jQuery event object
		 *    event.data- is the data parameter passed to the subscribe() function when this published topic was subscribed to
		 *    data- is the data parameter that was passed to this publishOnEvent() method
		 * Parameters:
		 *  -event- is the string name of the event upon which to publish the topic
		 *  -topic- is the string name of the topic to publish when the event occurs
		 *  -data- (optional) is additional data which will be passed in to the publish() method ant hen available as the second ('data')
		 *          parameter to the topic handler
		 */
		publishOnEvent : function(event, topic, data) {	
		
			if(event && topic) {
				
				this.createTopic(topic);
				
				this.bind(event, data, function (e) {
					$(this).publish(topic, e.data, e);
				});
			}
			
			return this;
		}
	});
	
	/**
	 * Make publish(), createTopic() and destroyTopic() callable without an element context
	 * Often don't need a context to subscribe, publish, create or destroy a topic. 
	 * We will call from the document context
	 */
	$.extend({
		
		/**
		 * Subscribe an event handler to a topic without an element context
		 * 
		 * Note: Caution about subscribing using same document to topic multiple time (maybe by loading subscribe script multiple times)
		 * 
		 */
		subscribe :  function(topic, handler, data) {
			return $(document).subscribe(topic, handler, data);
		},
		
		/**
		 * Unsubscribe an event handler for a topic without an element context
		 *    
		 */
		unsubscribe :  function(topic, handler, data) {
			return $(document).unsubscribe(topic, handler, data);
		},
		
		/**
		 * Register a handler function which can then be referenced by name when calling subscribe()
		 */
		subscribeHandler: function(name, handler) { 
			
			if(name && handler && $.isFunction(handler)) {
				_subscribe_handlers[name] = handler;
			}
			
			return $(document);
		},
		
		publish: function(topic, data) { 
			return $(document).publish(topic,data);
		},
		
		createTopic: function(topic) { 
			return $(document).createTopic(topic);
		},
		
		destroyTopic: function(topic) { 
			return $(document).destroyTopic(topic);
		}
		
	});
})(jQuery);

/**
 * @preserve
 * jquery.struts2.js
 *
 * Integration of jquery and jquery ui with struts 2
 * for ajax, widget and interactions support in struts 2
 *
 * Requires use of jQuery.
 * Tested with jQuery 2.1 and jQuery UI 1.11
 *
 * Copyright (c) 2008 Eric Chijioke (obinna a-t g mail dot c o m)
 * Copyright (c) 2010 - 2015 Johannes Geppert http://www.jgeppert.com
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

/*global jQuery, document, window, StrutsUtils  */
/*jslint evil: true */
"use strict";
(function( $, undefined ) {

	/**
	 * Bind Struts2 Components for jQuery AJAX and UI functions
	 */
	$.struts2_jquery = {

	debug :false,
	debugPrefix :'[struts2_jquery] ',
	ajaxhistory :false,
	loadAtOnce :false,
	local :"en",
	gridLocal :"en",
	timeLocal :"en",
	datatablesLocal :"en",
	minSuffix :".min",
	historyelements : {},
	forms : {},
	scriptCache : {},
	styleCache : {},
	defaults : {
	indicator :'',
	loadingText :null,
	errorText :null
	},
	handler : {
		load :'_s2j_container_load',
		form :'_s2j_form_submit',
		effect :'_s2j_effects'
	},
	currentXhr :{},

	/**
	 * helper function for debug logging
	 * set debug to true in the head tag to enable debug logging
	 *  */
	log : function(message) {
		if (this.debug) {
			var msg = this.debugPrefix + message;
			if (window.console && window.console.log) {
				window.console.log(msg);
			}
			else if (window.opera && window.opera.postError) {
				window.opera.postError(msg);
			}
		}
	},

	/** Escape Ids */
	escId : function(id) {
		return '#' + id.replace(/(:|\.)/g, '\\$1');
	},

	/**Add Parameter to URL */
	addParam : function(url, param) {
		if (url.indexOf("?") > 0) {
			return url+"&"+param;
		}
        return url + "?" + param;
	},

	/**Change Parameter Value in URL */
	changeParam : function(url, param, value) {
		var ua = url.split("?"), // split url
			pa = ua[1].split("&"), // split query 
			ia = [],
			i; 
		for (i=0; i < pa.length; i++) { 
			ia = pa[i].split("="); // split name/value 
			if (ia[0] === param) { 
				pa[i] = ia[0] + "=" + value; 
			}
		}
		return ua[0] + "?" + pa.join("&"); 
	},

	/** Load required JavaScript Resourcess */
	require : function(files, callBack, basePath) {
		var self = this, successFunction, path;
		successFunction = callBack || function() {
		};
		path = basePath || null;

		if (path === null && !$.scriptPath) {
			path = "";
		}
		else if (path === null && $.scriptPath) {
			path = $.scriptPath;
		}

		if (typeof files === "string") {
			files = files.split(",");
		}
		$.each(files, function(i, file) {
			
			file = self.addParam(file, "s2j="+$.struts2_jquery.version);
			
			if (!$.struts2_jquery.scriptCache[file]) {
				self.log('load require script ' + (path + file));
				$.ajax( {
				type :"GET",
				scriptCharset:"UTF-8",
				url :path + file,
				success :successFunction,
				dataType :"script",
				cache :true,
				async :false
				});
				$.struts2_jquery.scriptCache[file] = true;
			}
		});
	},

	/** Load required CSS Files */
	requireCss : function(cssFile, basePath) {
		if (!this.styleCache[cssFile]) {
			var path, cssref;

			path = basePath || null;
			if (path === null && !$.scriptPath) {
				path = '';
			}
			else if (path === null && $.scriptPath) {
				path = $.scriptPath;
			}
			this.log('load require css ' + (path + cssFile));

			cssref = document.createElement("link");
			cssref.setAttribute("rel", "stylesheet");
			cssref.setAttribute("type", "text/css");
			cssref.setAttribute("href", (path + cssFile));
			document.getElementsByTagName("head")[0].appendChild(cssref);
			this.styleCache[cssFile] = true;
		}
	},

	/** Helper function to hide indicator */
	hideIndicator : function(indi) {
		if (indi) {
			$(this.escId(indi)).hide();
		}
		if (this.defaults.indicator !== '') {
			$(this.escId(this.defaults.indicator)).hide();
		}
	},

	/** Helper function to show indicator */
	showIndicator : function(indi) {
		if (indi) {
			$(this.escId(indi)).show();
		}
		if (this.defaults.indicator !== '') {
			$(this.escId(this.defaults.indicator)).show();
		}
	},

	/** Abort current requests */
	abortReq : function(id) {
		var xhr = this.currentXhr[id];
		if(xhr && xhr !== null){
			if(xhr.readyState < 4) {
				xhr.abort();
			}
		}
	},

	/** Helper function to validate Forms */
	validateForm : function(form, o) {
		var self = this,
			submit = true,
			params = {};

		if (!self.loadAtOnce) {
			self.require("js/plugins/jquery.form" + self.minSuffix + ".js");
		}
		
		params.type = "POST";
		params.data = {
				"struts.enableJSONValidation": true,
				"struts.validateOnly": true
		};
		if (o.href && o.href !== '#') {
			params.url = o.href;
		}
		else {
			params.url = form[0].action;
		}

		if (o.hrefparameter) {
			params.url = params.url + '?' + o.hrefparameter;
		}

		params.cache = false;
		//params.forceSync = true;
		params.async = false;

		params.complete = function(request, status) {
			var f = $(form[0]),
				et = request.responseText,
				errors;
			if ($.isFunction(o.validateFunction)) {
				if (et && et.length > 10) {
					submit = false;
					if(et.substring(0,2) === "/*") {
						// Handle Validation Errors for all Struts2 versions until 2.2.3.1
						errors = $.parseJSON(et.substring(2, et.length - 2));
					}
					else {
						errors = $.parseJSON(et);
					}
					o.validateFunction(f, errors);
				}
			}
			else if (StrutsUtils !== undefined) {
				StrutsUtils.clearValidationErrors(form[0]);

				// get errors from response
				if(et.substring(0,2) === "/*") {
					errors = StrutsUtils.getValidationErrors(et);
				}
				else {
					errors = StrutsUtils.getValidationErrors($.parseJSON(et));
				}

				// show errors, if any
				if (errors.fieldErrors || errors.errors) {
					StrutsUtils.showValidationErrors(form[0], errors);
					submit = false;
				}
			}
			self.log('form validation : ' + submit);
		};

		form.ajaxSubmit(params);

		return submit;
	},

	addForms : function(forms, url) {
		var self = this;
		if (forms) {
			if (!self.loadAtOnce) {
				self.require("js/plugins/jquery.form" + self.minSuffix + ".js");
			}
			$.each(forms.split(','), function(i, f) {
				var q = $(self.escId(f)).formSerialize();
				url = self.addParam(url, q);
			});
		}
		return url;
	},
	/** Helper function to publish UI topics */
	pubTops : function($elem, always, topics) {
		var self = this;
		if (topics) {
			return function(event, ui) {
				var data = {};
				data.event = event;
				data.ui = ui;

				self.publishTopic($elem, topics, data);
				self.publishTopic($elem, always, data);
			};
		}
        return null;
	},

	/** Helper function to subscribe topics */
	subscribeTopics : function(elem, topics, handler, o) {
		if (topics && elem) {
			$.each(topics.split(','), function(i, t) {
				if (elem.isSubscribed(t)) {
					elem.destroyTopic(t);
				}
				elem.subscribe(t, handler, o);
			});
		}
	},

	/** Helper function to publish topics */
	publishTopic : function(elem, topics, data) {
		var self = this;
		if (topics) {
			$.each(topics.split(','), function(i, to) {
				self.log('publish topic : ' + to);
				elem.publish(to, elem, data);
			});
		}
	},

	/** publish Success topics
	 * handle AJAX result, insert it into container or build select box, radiobutton, checkboxes etc.
	 * */
	pubSuc : function(cid, always, stopics, indi, modus, o) {
		var self = this,
			c = $(cid),
			i,idv,element = null,
			x = 0,
			isMap = false;

		return function(data, status, request) {
			var orginal = {};
			orginal.data = data;
			orginal.status = status;
			orginal.request = request;

			// Handle HTML Result for Divs, Submit and Anchor
			if (modus === 'html' && !$.isArray(data) && !$.isPlainObject(data)) {
				c.html(data);
			}

			// Handle Text Result for Textarea or Textfield
			else if (modus === 'value') {
				c.val($.trim(data));
			}

			// Hanlde Result for Select, Radiobuttons and Checkboxes
			else if (modus === 'select' || modus === 'radio' || modus === 'checkbox') {
				if (modus === 'select') {
					c[0].length = 0;
				}
				else {
					c.children().remove();
				}

                if ($.isPlainObject(data) || $.isArray(data)) {
					i = -1;

					if (modus === 'select') {
						// Header Option
						if (o.headerkey && o.headervalue) {
							element = $('<option value="' + o.headerkey + '">' + o.headervalue + '</option>');
							if (o.value === o.headervalue) {
								element.prop("selected", true);
							}
							element.appendTo(c);
						}

						// Is Empty Option set to true
						if (o.emptyoption) {
							$('<option></option>').appendTo(c);
						}
					}

					// Loop over Elements
					if (data[o.list] !== null) {
						if (!$.isArray(data[o.list])) {
							isMap = true;
						}

						$.each(data[o.list], function(j, val) {
							var option = {};
							if (modus === 'radio' || modus === 'checkbox') {
								option.name = o.name;
							}

							if (isMap) {
								option.text = val;
								option.value = j;
							}
							else {
								if (o.listkey !== undefined && o.listvalue !== undefined) {
									option.text = val[o.listvalue];
									option.value = val[o.listkey];
									if (o.listtitle !== undefined) {
										option.listtitle = val[o.listtitle];
									}
								}
								else {
									option.text = data[o.list][x];
									option.value = data[o.list][x];
								}
							}

							if (o.value !== undefined && o.value == option.value) {
								option.selected = true;
							}

							if (modus === 'select') {
								element = $('<option value="' + option.value + '">' + option.text + '</option>');
								if (option.selected) {
									element.prop("selected", true);
								}
								if (option.listtitle !== undefined) {
									element.prop("title", option.listtitle);
								}
								element.appendTo(c);
							}
							else {
								idv = ++i;

								// This way is needed to avoid Bug in IE6/IE7
								if (modus === 'radio') {
                                    element = $('<input name="' + option.name + '" type="radio" id="' + option.name + idv + '" value="' + option.value + '"></input>');
								}
								else if (modus === 'checkbox') {
                                    element = $('<input name="' + option.name + '" type="checkbox" id="' + option.name + idv + '" value="' + option.value + '"></input>');
								}

								if (option.selected) {
									element.prop("checked", true);
								}

								c.append(element);
                                c.append($('<label id="' + option.name + idv + 'label" for="' + option.name + idv + '">' + option.text + '</label>'));
							}
							x++;
						});
					}
				}
			}

			if (stopics) {
				self.publishTopic(c, stopics, orginal);
				self.publishTopic(c, always, orginal);
			}
		};
	},

	/** publish complete topics */
	pubCom : function(cid, always, ctopics, targets, indi, o) {
		var self = this,
			ui = $.struts2_jquery_ui,
			c = $(cid);
		return function(request, status) {
			var orginal = {};
			orginal.request = request;
			orginal.status = status;

			self.hideIndicator(indi);

			self.publishTopic(c, ctopics, orginal);
			self.publishTopic(c, always, orginal);

			if (!targets) {
				targets = o.id;
			}
			if (targets) {
				$.each(targets.split(','), function(i, target) {
					var effect_elem = $(self.escId(target));
					effect_elem.publish("_sj_div_effect_" + target + o.id, o);
				});
			}
			if (ui && o.resizable) {
				ui.resizable(c, o);
			}
		};
	},

	/** publish error topics */
	pubErr : function(cid, always, etopics, etext, modus) {
		var self = this,
			c = $(cid);
		if (etopics || etext) {
			return function(request, status, error) {
				var orginal = {};
				orginal.request = request;
				orginal.status = status;
				orginal.error = error;

				if (modus === 'html' || modus === 'value') {
					if (etext && etext !== "false") {
						c.html(etext);
					}
					else if (self.defaults.errorText !== null) {
						c.html(self.defaults.errorText);
					}
				}

				self.publishTopic(c, etopics, orginal);
				self.publishTopic(c, always, orginal);
			};
		}
        return null;
	},

	/**
	 * pre-binding function of the type function(element){}. called before binding the element
	 * returning false will prevent the binding of this element
	 */
	preBind :null,

	/** post-binding function of the type function(element){}. called before binding the element */
	postBind :null,

	/** bind a html element to an struts2 jquery action */
	bind : function(el, o) {
		var self = this, $el, tag;

		if (el) {
			$el = $(el);
			el = $el[0];

			tag = el.tagName.toLowerCase();
			o.tagname = tag;

			// extension point to allow custom pre-binding processing
			if (typeof (self.preBind) !== "function" || self.preBind($el)) {

				if (!o.jqueryaction) {
					o.jqueryaction = tag;
				}

				self.log('bind ' + o.jqueryaction + ' on ' + o.id);
				self[o.jqueryaction]($el, o);

				// extension point to allow custom post-binding processing
				if (self.postBind && (typeof (self.postBind) === "function")) { return self.postBind(el); }
			}

		}
	},

	/** register a specific struts2 jquery action */
	jqueryaction : function(name, binder) {
		var self = this;
		if (name && binder) {
			self[name] = binder;
		}
	},

	/** handle ajax history */
	history : function($elem, topic, target) {
		var self = this,
			params = {};
		params.target = target;
		params.topic = topic;
		$elem.bind('click', params, function(event) {
			self.historyelements[event.data.target] = event.data.topic;
			self.lasttopic = topic;
			$.bbq.pushState(self.historyelements);
			return false;
		});

		$(window).bind('hashchange', params, function(e) {
			var topic = e.getState(e.data.target) || '';
			$.each(e.fragment.split('&'), function(i, f) {
				var fragment = f.split('='); 
				if(self.historyelements[fragment[0]] !== fragment[1] && fragment[1] !== self.lasttopic ) {
					self.lasttopic = topic;
					$.publish(fragment[1], e.data.options);
				}
			});
		});
	},

	/** Handles remote and effect actions */
	action : function($elem, o, loadHandler, type) {
		var self = this,
			actionTopic = '_sj_action_' + o.id,
			href = o.href,
			effect = {};
			
		o.actionTopic = actionTopic;

		if (href === null || href === "") {
			href = "#";
			o.href = href;
		}

		effect.effect = o.effect;
		effect.effectoptions = o.effectoptions;
		effect.effectmode = o.effectmode;
		effect.oneffect = o.oneffect;
		effect.effectduration = o.effectduration;

		// Set dummy target when datatype is json
		if(o.datatype && !o.targets) {
			if(o.datatype === "json") {
				o.targets = "false";
			}
		}

		// subscribe all targets to this action's custom execute topic
		if (o.targets) {
			$.each(o.targets.split(','), function(i, target) {
				effect.targets = target;
				var tarelem = $(self.escId(target));

				//when no target is found (e.g. a json call)
				// the action was subscribed to the publisher
				if(tarelem.length === 0){
					tarelem = $elem;
				}

				self.subscribeTopics(tarelem, actionTopic + target, loadHandler, o);
				self.subscribeTopics(tarelem, "_sj_div_effect_" + target + o.id, self.handler.effect, effect);

				if (self.ajaxhistory) {
					self.history($elem, actionTopic + target, target);
				}
			});
		}
		else { // if no targets, then the action can still execute ajax request and will handle itself (no loading result into container

			effect.targets = o.id;
			self.subscribeTopics($(self.escId(o.id)), "_sj_div_effect_" + o.id + o.id, self.handler.effect, effect);

			// bind event topic listeners
			if (o.onbef || o.oncom || o.onsuc || o.onerr) {
				self.subscribeTopics($elem, actionTopic, loadHandler, o);
			}
		}

		if (type === "a") {
			$elem.click( function() {
				if(o.targets) {
					$.each(o.targets.split(','), function(i, target) {
						$elem.publish(actionTopic + target);
					});
				}
				if(o.preventAction) {
					return false;
				}
			});
		}
	},

	/** Handle all Container Elements Divs, Textarea, Textfield */
	container : function($elem, o) {
		var self = this,
			divTopic = '_s2j_div_load_' + o.id,
			divEffectTopic = '_s2j_div_effect_' + o.id,
			ui = $.struts2_jquery_ui,
			effect = {},
			bindel = $elem,
			eventsStr = 'click';
		
		self.log('container : ' + o.id);
		self.action($elem, o, self.handler.load, 'div');

		// load div using ajax only when href is specified or form is defined
		if ((o.formids && !o.type) || (o.href && o.href !== '#')) {
			if (o.href !== '#') {
				self.subscribeTopics($elem, o.reloadtopics, self.handler.load, o);
				self.subscribeTopics($elem, o.listentopics, self.handler.load, o);
				// publishing not triggering to prevent event propagation issues
				self.subscribeTopics($elem, divTopic, self.handler.load, o);

				if (o.bindon) {
					if (o.events) {
						$.each(o.events.split(','), function(i, event) {
							$('#' + o.bindon).publishOnEvent(event, divTopic, o);
						});
					}
					else {
						$('#' + o.bindon).publishOnEvent('click', divTopic, o);
					}
				}
			}
			else if (o.formids) {
				if (!self.loadAtOnce) {
					self.require("js/plugins/jquery.form" + self.minSuffix + ".js");
				}
				o.targets = o.id;
				self.formsubmit($elem, o, divTopic);
			}

            if (!o.deferredloading) {
                if(o.delay){
                    setTimeout(function() { $elem.publish(divTopic, o); }, o.delay);
                } else {
                    $elem.publish(divTopic, o);
                }
            }

            if(o.updatefreq){
                if(o.delay){
                    setTimeout(function() { setInterval(function() { $elem.publish(divTopic, o); }, o.updatefreq); }, o.delay);
                } else {
                    setInterval(function() { $elem.publish(divTopic, o); }, o.updatefreq);
                }
            }
        }
		else {
			if (o.id && o.effect) {
				effect.targets = o.id;
				effect.effect = o.effect;
				effect.effectoptions = o.effectoptions;
				effect.effectduration = o.effectduration;
				self.subscribeTopics($elem, divEffectTopic + o.id + o.id, self.handler.effect, effect);
			}

			if (o.events || o.bindon) {

				if (o.bindon) {
					bindel = $(self.escId(o.bindon));
				}
				if (o.events) {
					eventsStr = o.events;
				}

				$.each(eventsStr.split(','), function(i, event) {
					if (o.onbef) {
						$.each(o.onbef.split(','), function(i, btopic) {
							bindel.publishOnEvent(event, btopic);
						});
					}
					bindel.publishOnEvent(event, divEffectTopic + o.id + o.id, o);
					if (o.oncom) {
						$.each(o.oncom.split(','), function(i, ctopic) {
							bindel.publishOnEvent(event, ctopic);
						});
					}
				});
			}
			else {
				if (o.onbef) {
					$.each(o.onbef.split(','), function(i, bts) {
						$elem.publish(bts, o);
					});
				}
				$elem.publish(divEffectTopic + o.id + o.id, o);
				if (o.oncom) {
					$.each(o.oncom.split(','), function(i, cts) {
						$elem.publish(cts, o);
					});
				}
			}
			
			if (ui && o.resizable) {
				ui.resizable($elem, o);
			}
		}
		
		if (ui && o.draggable) {
			ui.draggable($elem, o);
		}
		if (ui && o.droppable) {
			ui.droppable($elem, o);
		}
		if (ui && o.selectable) {
			ui.selectable($elem, o);
		}
		if (ui && o.sortable) {
			ui.sortable($elem, o);
		}
		
		if (o.onblurtopics) {
			$.each(o.onblurtopics.split(','), function(i, topic) {
				$elem.blur( function() {
					self.publishTopic($elem, topic, {});
				});
			});
		}

		if (o.onfocustopics) {
			$.each(o.onfocustopics.split(','), function(i, topic) {
				$elem.focus( function() {
					self.publishTopic($elem, topic, {});
				});
			});
		}

		if (o.oncha) {
			if (o.type) {
				if (o.type === 'text') {
					$elem.keyup( function() {
						self.publishTopic($elem, o.oncha, {});
					});
				}
				else if (o.type === 'select') {
					$elem.change( function() {
						self.publishTopic($elem, o.oncha, {});
					});
					$elem.select( function() {
						self.publishTopic($elem, o.onselecttopics, {});
					});
				}
			}
		}
	},

	/** Handle the Anchor Element */
	anchor : function($elem, o) {
		var self = this,
			formTopic = '_s2j_form_topic_' + o.id;
		self.log('anchor : ' + o.id);

		if (o.onclick) {
			$.each(o.onclick.split(','), function(i, topic) {
				$elem.publishOnEvent('click', topic, o);
			});
		}

		if (o.opendialog) {
			$.struts2_jquery_ui.opendialog($elem, o);
		}
		if (o.button) {
			$.struts2_jquery_ui.jquerybutton($elem, o);
		}

		if ((!o.href || o.href==='#') && o.formids) {
			self.formsubmit($elem, o, formTopic);
		}
		else {

			self.action($elem, o, self.handler.load, 'a');
			if(o.targets && (o.reloadtopic || o.listentopics)) {
				$.each(o.targets.split(','), function(i, t) {
					var te = $(self.escId(t));
					self.subscribeTopics(te, o.reloadtopics, self.handler.load, o);
					self.subscribeTopics(te, o.listentopics, self.handler.load, o);
				});
			}
		}
		
	},

	/** Handle dynamic Select Boxes */
	select : function($elem, o) {
		var self = this,
			selectTopic = '_s2j_topic_load_' + o.id;
		self.log('select : ' + o.id);
		if (!self.loadAtOnce) {
			self.require("js/plugins/jquery.form" + self.minSuffix + ".js");
		}

		if (o.href && o.href !== '#') {

			self.subscribeTopics($elem, o.reloadtopics, self.handler.load, o);
			self.subscribeTopics($elem, o.listentopics, self.handler.load, o);
			self.subscribeTopics($elem, selectTopic, self.handler.load, o);
			if (!o.deferredloading) {
				$elem.publish(selectTopic, o);
			}
		}
		if (o.oncha) {
			$.each(o.oncha.split(','), function(i, cts) {
				$elem.publishOnEvent('change', cts);
			});
		}
		if (o.autocomplete) {
			if (!self.loadAtOnce) {
				self.require( [ "js/base/widget" + self.minSuffix + ".js", "js/base/position" + self.minSuffix + ".js", "js/base/menu" + self.minSuffix + ".js", "js/base/button" + self.minSuffix + ".js", "js/base/autocomplete" + self.minSuffix + ".js" ]);
			}
            self.requireCss("themes/s2j-combobox.css");
			self.require([ "js/plugins/jquery.combobox" + self.minSuffix + ".js" ]);
			$elem.combobox(o);
		}
	},

	/** Handle the Submit Button */
	button : function($elem, o) {
		var self = this,
			formTopic = '_s2j_form_topic_' + o.id,
			cform,cf,formid,randomid;

		o.preventAction = true;
		
		if (o.opendialog) {
			$.struts2_jquery_ui.opendialog($elem, o);
		}
		if (o.button) {
			$.struts2_jquery_ui.jquerybutton($elem, o);
		}

		if ((!o.href || o.href === "#") || o.formids !== undefined) {
			self.formsubmit($elem, o, formTopic);
		}
		else {
			if(o.href && o.href !== "#"){
				self.action($elem, o, self.handler.load, 'a');
				if(o.targets) {
					$.each(o.targets.split(','), function(i, t) {
						self.subscribeTopics($(self.escId(t)), o.reloadtopics, self.handler.load, o);
						self.subscribeTopics($(self.escId(t)), o.listentopics, self.handler.load, o);
					});
				}
			}
			else {
				cform = $elem.parents('form:first')[0];
				if (cform !== undefined) {
					cf = $(cform);
					formid = cf.attr("id");
					if (formid !== undefined) {
						o.formids = formid;
					}
					else {
						randomid = 's2jqform' + Math.floor(Math.random() * 10000);
						cf.attr('id', randomid);
						o.formids = randomid;
					}
					self.formsubmit($elem, o, formTopic);
				}
				else {
					self.action($elem, o, self.handler.load, 'a');
					if(o.targets) {
						$.each(o.targets.split(','), function(i, t) {
							self.subscribeTopics($(self.escId(t)), o.reloadtopics, self.handler.load, o);
							self.subscribeTopics($(self.escId(t)), o.listentopics, self.handler.load, o);
						});
					}
				}
			}
		}
		if (o.onclick) {
			$.each(o.onclick.split(','), function(i, topic) {
				$elem.publishOnEvent('click', topic);
			});
		}
		$elem.removeAttr('name');
	},

	/** Handle all AJAX Forms submitted from Anchor or Submit Button */
	formsubmit : function($elem, o, topic) {
		var self = this,
			params = {};
		o.actionTopic = topic;
		self.log('formsubmit : ' + o.id);
		if (!self.loadAtOnce) {
			self.require("js/plugins/jquery.form" + self.minSuffix + ".js");
		}

		if (o.targets) {
			self.subscribeTopics($elem, o.reloadtopics, self.handler.form, o);
			self.subscribeTopics($elem, o.listentopics, self.handler.form, o);

			self.subscribeTopics($elem, topic, self.handler.form, o);
			$.each(o.targets.split(','), function(i, target) {
				self.subscribeTopics($(self.escId(target)), "_sj_div_effect_" + target + o.id, self.handler.effect, o);
				if (self.ajaxhistory) {
					self.history($elem, topic, target);
				}
			});
			$.each(o.formids.split(','), function(i, f) {
				$(self.escId(f)).bind("submit", function(e) { 
					e.preventDefault(); 
				});
			});
			$elem.click( function() {
				$elem.publish(topic);
				return false;
			});
		}
		else {
			// Submit Forms without AJAX
			$elem.click( function(e) {
				var form = $(self.escId(o.formids)),
					orginal = {};
				orginal.formvalidate = true; 
				e.preventDefault(); 
				if (o.validate) {
					orginal.formvalidate = self.validateForm(form, o);
					if (o.onaftervalidation) {
						$.each(o.onaftervalidation.split(','), function(i, topic) { 
							$elem.publish(topic, $elem, orginal);
						});
					}  
				}
				
				if(orginal.formvalidate) {
                    if ( o.href && o.href != "#") {
                        form[0].action = o.href;
                    }
                    form.submit();
				}
				return false;
			});
			if(o.listentopics) {
				params.formids = o.formids;
				params.validate = o.validate;
				$elem.subscribe(o.listentopics, function(event) {
					var form = $(self.escId(event.data.formids)),
						orginal = {formvalidate : true};
					
					if (event.data.validate) {
						orginal.formvalidate = self.validateForm(form, o);
						if (o.onaftervalidation) {
							$.each(o.onaftervalidation.split(','), function(i, topic) { 
								$elem.publish(topic, $elem, orginal);
							});
						}
					}

					if(orginal.formvalidate) {
                        if ( o.href && o.href != "#") {
                            form[0].action = o.href;
                        }
                        form.submit();
					}
				}, params);
			}
		}
	}

	};

	/**
	 * Container logic
	 * Register handler to load a container
	 * */
	$.subscribeHandler($.struts2_jquery.handler.load, function(event, data) {

		var s2j = $.struts2_jquery,
			container = $(event.target),
			cid,
			o = {},
			isDisabled = false,
			indi, always,
			modus = 'html',
			params = {};
			
		if (data) {
			$.extend(o, data);
		}
		if (event.data) {
			$.extend(o, event.data);
		}
		s2j.lasttopic = o.actionTopic;
		indi = o.indicatorid;
		always = o.onalw;
		
		isDisabled = o.disabled === null ? isDisabled : o.disabled;
		isDisabled = container.prop('disabled');
		if (event.originalEvent) { // means that container load is being triggered by other action (link button/link click) need to see if that button/link is disabled
			isDisabled = $(event.originalEvent.currentTarget).prop("disabled");
		}

		if (isDisabled !== true) {

			// Show indicator element (if any)
			if (o) {

				s2j.showIndicator(indi);
				if (o.type) {
					if (o.type === 'text') {
						modus = 'value';
					}
					else if (o.type === 'select') {
						modus = 'select';
					}
					else if (o.type === 'checkbox') {
						modus = 'checkbox';
					}
					else if (o.type === 'radio') {
						modus = 'radio';
					}
				}

				if (modus === 'html' || modus === 'value') {
					// Set pre-loading text (if any)
					if(!o.datatype || o.datatype !== "json") {
						if (o.loadingtext && o.loadingtext !== "false") {
							if (modus === 'html') {
								container.html(o.loadingtext);
							}
							else {
								container.val(o.loadingtext);
							}
						}
						else if (s2j.defaults.loadingText !== null) {
							if (modus === 'html') {
								container.html(s2j.defaults.loadingText);
							}
							else {
								container.val(s2j.defaults.loadingText);
							}
						}
					}
				}

				params.success = s2j.pubSuc(event.target, always, o.onsuc, indi, modus, o);
				params.complete = s2j.pubCom(event.target, always, o.oncom, o.targets, indi, o);
				params.error = s2j.pubErr(event.target, always, o.onerr, o.errortext, modus);

				// load container using ajax
				if (o.href) {
					params.url = o.href;
					params.data = '';
					if (o.hrefparameter) {
						params.data = o.hrefparameter;
					}
					if (o.requesttype) {
						params.type = o.requesttype;
					}
					else {
						params.type = "POST";
					}

					if (o.formids) {
						if (!s2j.loadAtOnce) {
							s2j.require("js/plugins/jquery.form" + s2j.minSuffix + ".js");
						}
						$.each(o.formids.split(','), function(i, fid) {
							var query = $(s2j.escId(fid)).formSerialize();
							if (params.data !== '') {
								params.data = params.data + '&' + query;
							}
							else {
								params.data = query;
							}
						});
					}

					if (o.datatype) {
						params.dataType = o.datatype;
					}
					else {
						params.dataType = 'html';
					}

					// fix 'issue' wherein IIS will reject post without data
					if (!params.data) {
						params.data = {};
					}

					o.options = params;
					o.options.submit = true;
					// publish all 'before' and 'always' topics
					s2j.publishTopic(container, always, o);
					s2j.publishTopic(container, o.onbef, o);

					// Execute Ajax Request
					if(o.options.submit){
						cid = container.attr('id');
						s2j.abortReq(container.attr('id'));
						s2j.currentXhr[cid] = $.ajax(params);
					}
				}
			}
		}
	});

	/**
	 * Form logic
	 * Handler to submit a form with jquery.form.js plugin
	 * */
	$.subscribeHandler($.struts2_jquery.handler.form, function(event, data) {
		var s2j = $.struts2_jquery,
			elem = $(event.target),
			o = {},
			params = {},
			indi,
			always;

		// need to also make use of original attributes registered with the container (such as onCompleteTopics)
		if (data) {
			$.extend(o, data);
		}
		if (event.data) {
			$.extend(o, event.data);
		}
		s2j.lasttopic = o.actionTopic;
		indi = o.indicatorid;
		always = o.onalw;

		if (o.href && o.href !== '#') {
			params.url = o.href;
			if (o.hrefparameter) {
				params.url = params.url + '?' + o.hrefparameter;
			}
		}
		if (o.clearform) {
			params.clearForm = true;
		}
		if (o.iframe) {
			params.iframe = true;
		}
		if (o.resetform) {
			params.resetForm = true;
		}
		if (o.replaceTarget) {
			params.replaceTarget = true;
		}
		if (o.timeout) {
			params.timeout = parseInt(o.timeout, 10);
		}
		if (o.datatype) {
			params.dataType = o.datatype;
		}
		else {
			params.dataType = null;
		}

		params.target = '';
		if (o.targets) {
			$.each(o.targets.split(','), function(i, target) {
				elem = $(s2j.escId(target));
				if (params.target === '') {
					params.target = s2j.escId(target);
				}
				else {
					params.target = params.target + ',#' + s2j.escId(target);
				}
			});
		}


		params.beforeSubmit = function(formData, form, formoptions) {

			var orginal = {};
			orginal.formData = formData;
			orginal.form = form;
			orginal.options = formoptions;
			orginal.options.submit = true;

			s2j.publishTopic(elem, always, orginal);

			if (o.onbef) {
				$.each(o.onbef.split(','), function(i, topic) {
					elem.publish(topic, elem, orginal);
				});
			}

			if (o.validate && orginal.options.submit)  {
				orginal.options.submit = s2j.validateForm(form, o);
				orginal.formvalidate = orginal.options.submit; 
				if (o.onaftervalidation) {
					$.each(o.onaftervalidation.split(','), function(i, topic) { 
						elem.publish(topic, elem, orginal);
					});
				}  
			}
			if (orginal.options.submit) {
				s2j.showIndicator(indi);
				if(!o.datatype || o.datatype !== "json") {
					if (o.loadingtext && o.loadingtext !== "false") {
						$.each(o.targets.split(','), function(i, target) {
							$(s2j.escId(target)).html(o.loadingtext);
						});
					}
					else if (s2j.defaults.loadingText !== null) {
						$.each(o.targets.split(','), function(i, target) {
							$(s2j.escId(target)).html(s2j.defaults.loadingText);
						});
					}
				}
			}
			return orginal.options.submit;
		};

		params.success = s2j.pubSuc(elem, always, o.onsuc, indi, 'form', o);
		params.complete = s2j.pubCom(elem, always, o.oncom, o.targets, indi, o);
		params.error = s2j.pubErr(elem, always, o.onerr, o.errortext, 'html');

		$.each(o.formids.split(','), function(i, fid) {
			s2j.log('submit form : ' + fid);
			$(s2j.escId(fid)).ajaxSubmit(params);
		});

		return false;
	});

	/**
	 * Effects
	 * Register handler for effects
	 * */
	$.subscribeHandler($.struts2_jquery.handler.effect, function(event, data) {
		var s2j = $.struts2_jquery,
			o = {},
			eo = {},
			duration = 2000,
			callback = null,
			tar = null;

		$.extend(o, event.data);
		if (o.targets && o.effect) {
			if (o.effectoptions) {
				eo = o.effectoptions;
			}
			if (o.effectduration) {
				duration = o.effectduration;
			}

			if(o.oneffect) {

				$.each(o.targets.split(','), function(i, target) {
					$.subscribe($(s2j.escId(target)), o.oneffect, o);
				});

				callback = function () {
					$.each(o.targets.split(','), function(i, target) {
						s2j.publishTopic($(s2j.escId(target)), o.oneffect, o);
					});
				};
			}

			if (!s2j.loadAtOnce) {
				var jsFiles =  [ "js/base/effect" + s2j.minSuffix + ".js", "js/base/effect-" + o.effect + s2j.minSuffix + ".js" ];
				if (o.effect === "scale" || o.effect === "puff"){
					jsFiles.push("js/base/effect-size" + s2j.minSuffix + ".js");
				}
				if (o.effect === "puff"){
					jsFiles.push("js/base/effect-scale" + s2j.minSuffix + ".js");
				}
				s2j.require(jsFiles);
			}
			s2j.log('effect ' + o.effect + ' for ' + o.targets);
			$.each(o.targets.split(','), function(i, target) {
				tar = $(s2j.escId(target));
				if(!o.effectmode || o.effectmode === 'none' ) {
					tar.effect(o.effect, eo, duration, callback);
				}
				else if (o.effectmode === 'show') {
					tar.show(o.effect, eo, duration, callback);
				}
				else if (o.effectmode === 'hide') {
					tar.hide(o.effect, eo, duration, callback);
				}
				else if (o.effectmode === 'toggle') {
					tar.toggle(o.effect, eo, duration, callback);
				}
			});
		}
	});

})(jQuery);

/**
 * @preserve
 * jquery.ui.struts2.js
 *
 * Integration of jquery and jquery ui with struts 2
 * for ajax, widget and interactions support in struts 2
 *
 * Requires use of jQuery and jQuery UI.
 * Tested with jQuery 2.1 and jQuery UI 1.11
 *
 * Copyright (c) 2010 - 2015 Johannes Geppert http://www.jgeppert.com
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

/*global jQuery, document, window, StrutsUtils  */
/*jslint evil: true */
"use strict";
(function ($) {

    /**
     * Bind Struts2 Components for jQuery UI functions
     */
    $.struts2_jquery_ui = {

        handler: {
            open_dialog: '_s2j_open_dialog',
            close_dialog: '_s2j_close_dialog',
            destroy_dialog: '_s2j_destroy_dialog'
        },

        /** opens a dialog if attribute openDialog in Anchor or Submit Tag is set to true */
        opendialog: function ($elem, o) {
            var self = this,
                dialog,
                openTopic = '_s2j_dialog_open_' + o.id;
            self.log('open dialog : ' + o.opendialog);

            if (o.opendialog) {
                dialog = $(self.escId(o.opendialog));
                $elem.bind('click', function (event) {
                    if ($(this).prop("disabled")) {
                        return false;
                    }
                    self.subscribeTopics(dialog, openTopic, self.handler.open_dialog, o);
                    dialog.publish(openTopic, o);
                    return false;
                });
            }
        },

        /** handle interaction draggable */
        draggable: function ($elem, o) {
            var self = this,
                daos = o.draggableoptions,
                dao = window[daos];
            self.log("init draggable with id: " + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/data" + self.minSuffix + ".js",
                    "js/base/plugin" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/safe-blur" + self.minSuffix + ".js",
                    "js/base/scroll-parent" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/draggable" + self.minSuffix + ".js"
                ]);
            }
            if (!dao) {
                dao = eval("( " + daos + " )");
            }
            else {
                dao = {};
            }
            dao.start = self.pubTops($elem, o.onalw, o.draggableonstarttopics);
            dao.stop = self.pubTops($elem, o.onalw, o.draggableonstoptopics);
            dao.drap = self.pubTops($elem, o.onalw, o.draggableondragtopics);
            $elem.draggable(dao);
        },

        /** handle interaction droppable */
        droppable: function ($elem, o) {
            var self = this,
                doos = o.droppableoptions,
                doo = window[doos];
            self.log("droppable : " + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/data" + self.minSuffix + ".js",
                    "js/base/plugin" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/safe-blur" + self.minSuffix + ".js",
                    "js/base/scroll-parent" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/draggable" + self.minSuffix + ".js",
                    "js/base/droppable" + self.minSuffix + ".js"
                ]);
            }
            if (!doo) {
                doo = eval("( " + doos + " )");
            }
            else {
                doo = {};
            }
            doo.activate = self.pubTops($elem, o.onalw, o.droppableonactivatetopics);
            doo.deactivate = self.pubTops($elem, o.onalw, o.droppableondeactivatetopics);
            doo.start = self.pubTops($elem, o.onalw, o.droppableonstarttopics);
            doo.stop = self.pubTops($elem, o.onalw, o.droppableonstoptopics);
            doo.drop = self.pubTops($elem, o.onalw, o.droppableondroptopics);
            doo.over = self.pubTops($elem, o.onalw, o.droppableonovertopics);
            doo.out = self.pubTops($elem, o.onalw, o.droppableonouttopics);
            $elem.droppable(doo);
        },

        /** handle interaction selectable */
        selectable: function ($elem, o) {
            var self = this,
                seos = o.selectableoptions,
                seo = window[seos];
            self.log('selectable : ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/selectable" + self.minSuffix + ".js"
                ]);
            }
            if (!seo) {
                seo = eval("( " + seos + " )");
            }
            else {
                seo = {};
            }
            seo.selected = self.pubTops($elem, o.onalw, o.selectableonselectedtopics);
            seo.selecting = self.pubTops($elem, o.onalw, o.selectableonselectingtopics);
            seo.start = self.pubTops($elem, o.onalw, o.selectableonstarttopics);
            seo.stop = self.pubTops($elem, o.onalw, o.selectableonstoptopics);
            seo.unselected = self.pubTops($elem, o.onalw, o.selectableonunselectedtopics);
            seo.unselecting = self.pubTops($elem, o.onalw, o.selectableonunselectingtopics);
            $elem.selectable(seo);
        },

        /** handle interaction sortable */
        sortable: function ($elem, o) {
            var self = this,
                soos = o.sortableoptions,
                soo = window[soos];
            self.log('sortable : ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/data" + self.minSuffix + ".js",
                    "js/base/ie" + self.minSuffix + ".js",
                    "js/base/scroll-parent" + self.minSuffix + ".js",
                    "js/base/sortable" + self.minSuffix + ".js"
                ]);
            }
            if (!soo) {
                soo = eval("( " + soos + " )");
            }
            else {
                soo = {};
            }
            soo.beforeStop = self.pubTops($elem, o.onalw, o.sortableonbeforestoptopics);
            soo.stop = self.pubTops($elem, o.onalw, o.sortableonstoptopics);
            soo.start = self.pubTops($elem, o.onalw, o.sortableonstarttopics);
            soo.sort = self.pubTops($elem, o.onalw, o.sortableonsorttopics);
            soo.activate = self.pubTops($elem, o.onalw, o.sortableonactivatetopics);
            soo.deactivate = self.pubTops($elem, o.onalw, o.sortableondeactivatetopics);
            soo.over = self.pubTops($elem, o.onalw, o.sortableonovertopics);
            soo.out = self.pubTops($elem, o.onalw, o.sortableonouttopics);
            soo.remove = self.pubTops($elem, o.onalw, o.sortableonremovetopics);
            soo.receive = self.pubTops($elem, o.onalw, o.sortableonreceivetopics);
            soo.change = self.pubTops($elem, o.onalw, o.sortableonchangetopics);
            soo.update = self.pubTops($elem, o.onalw, o.sortableonupdatetopics);
            $elem.sortable(soo);
        },

        /** handle interaction resizable */
        resizable: function ($elem, o) {
            var self = this,
                ros = o.resizableoptions,
                ro = window[ros];
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/disable-selection" + self.minSuffix + ".js",
                    "js/base/plugin" + self.minSuffix + ".js",
                    "js/base/resizable" + self.minSuffix + ".js"
                ]);
            }
            if (!ro) {
                ro = eval("( " + ros + " )");
            }
            else {
                ro = {};
            }
            ro.start = self.pubTops($elem, o.onalw, o.resizableonstarttopics);
            ro.stop = self.pubTops($elem, o.onalw, o.resizableonstoptopics);
            ro.resize = self.pubTops($elem, o.onalw, o.resizableonresizetopics);
            $elem.resizable(ro);
        },

        /** Handle the Dialog Widget */
        dialog: function ($elem, o) {
            var self = this;
            self.log('init dialog with id: ' + o.id);

            var jsFiles = [
                "js/base/widget" + self.minSuffix + ".js",
                "js/base/mouse" + self.minSuffix + ".js",
                "js/base/position" + self.minSuffix + ".js",
                "js/base/data" + self.minSuffix + ".js",
                "js/base/disable-selection" + self.minSuffix + ".js",
                "js/base/plugin" + self.minSuffix + ".js",
                "js/base/resizable" + self.minSuffix + ".js",
                "js/base/focusable" + self.minSuffix + ".js",
                "js/base/keycode" + self.minSuffix + ".js",
                "js/base/scroll-parent" + self.minSuffix + ".js",
                "js/base/safe-active-element" + self.minSuffix + ".js",
                "js/base/safe-blur" + self.minSuffix + ".js",
                "js/base/tabbable" + self.minSuffix + ".js",
                "js/base/unique-id" + self.minSuffix + ".js",
                "js/base/draggable" + self.minSuffix + ".js",
                "js/base/button" + self.minSuffix + ".js",
                "js/base/dialog" + self.minSuffix + ".js"
            ];

            if (o.hide || o.show) {
                jsFiles.push("js/base/effect" + self.minSuffix + ".js");
            }
            if (o.hide) {
                jsFiles.push("js/base/effect-" + o.hide + self.minSuffix + ".js");
            }
            if (o.show) {
                jsFiles.push("js/base/effect-" + o.show + self.minSuffix + ".js");
            }
            if (o.resizable) {
                jsFiles.push("js/base/resizable" + self.minSuffix + ".js");
            }
            if (o.draggable) {
                jsFiles.push("js/base/draggable" + self.minSuffix + ".js");
            }
            if (!self.loadAtOnce) {
                self.require(jsFiles);
            }

            if (o.opentopics) {
                self.subscribeTopics($elem, o.opentopics, self.handler.open_dialog, o);
            }

            if (o.closetopics) {
                self.subscribeTopics($elem, o.closetopics, self.handler.close_dialog, o);
            }

            if (o.destroytopics) {
                self.subscribeTopics($elem, o.destroytopics, self.handler.destroy_dialog, o);
            }

            o.open = function (event, ui) {
                var data = {},
                    divTopic = '_s2j_topic_load_' + o.id;

                data.event = event;
                data.ui = ui;

                if (o.href && o.href !== '#') {
                    self.subscribeTopics($elem, divTopic, self.handler.load, o);
                    $elem.publish(divTopic);
                }

                self.publishTopic($elem, o.onalw, data);
                self.publishTopic($elem, o.onbef, data);
                self.publishTopic($elem, o.onopentopics, data);
            };
            o.close = self.pubTops($elem, o.onalw, o.onclosetopics);
            o.focus = self.pubTops($elem, o.onalw, o.onfocustopics);
            o.beforeClose = function () {

                var data = {};
                data.close = true;

                self.publishTopic($elem, o.onalw, data);
                self.publishTopic($elem, o.onbeforeclosetopics, data);

                return data.close;
            };


            o.drag = self.pubTops($elem, o.onalw, o.oncha);

            $elem.data('s2j_options', o);

            $elem.dialog(o);
        },

        /** Handle the TabbedPanel Widget */
        tabbedpanel: function ($elem, o) {
            var self = this,
                ahp = {},
                disabledtabsStr = o.disabledtabs,
                disabledtabs = window[disabledtabsStr],
                tabs = $elem.data('taboptions'),
                tabStr = "",
                closable = false,
                l, tab;
            self.log('tabbedpanel : ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/escape-selector" + self.minSuffix + ".js",
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/unique-id" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/tabs" + self.minSuffix + ".js"
                ]);
            }

            if (o.disabledtabs && o.disabledtabs !== 'false') {
                if (!disabledtabs) {
                    o.disabled = eval("( " + disabledtabsStr + " )");
                }
            }
            if (o.openonmouseover) {
                o.event = 'mouseover';
            }
            if (o.cookie) {
                self.require("js/base/jquery.cookie" + self.minSuffix + ".js");
            }

            if (o.selectedtab) {
                o.active = o.selectedtab;
            } else if (o.cookie) {
                o.active = $.cookie($elem.prop('id'));
            }


            if (o.show) {
                self.require("js/base/effect" + self.minSuffix + ".js");
                if ($.type(o.show) === "string") {
                    self.require("js/base/effect-" + o.show + self.minSuffix + ".js");
                }
            }
            if (o.hide) {
                self.require("js/base/effect" + self.minSuffix + ".js");
                if ($.type(o.hide) === "string") {
                    self.require("js/base/effect-" + o.hide + self.minSuffix + ".js");
                }
            }

            o.ajaxOptions = {
                dataType: "html"
            };

            o.beforeLoad = function (event, ui) {
                var data = {},
                    form = "" + ui.tab.data("form");
                data.event = event;
                data.ui = ui;

                if (form) {
                    ui.ajaxSettings.url = self.addForms(form, ui.ajaxSettings.url);
                }

                if (o.onbef) {
                    self.publishTopic($elem, o.onbef, data);
                    self.publishTopic($elem, o.onalw, data);
                }
                if (o.cache) {
                    if (ui.tab.data("loaded")) {
                        event.preventDefault();
                        return;
                    }

                    ui.jqXHR.success(function () {
                        ui.tab.data("loaded", true);
                    });
                }
            };
            o.activate = function (event, ui) {
                var data = {};
                data.event = event;
                data.ui = ui;

                if (o.cookie) {
                    $.cookie($elem.prop('id'), ui.newTab.index(), { name: "tab" + o.id, expires: 365 });
                }

                if (o.oncha) {
                    self.publishTopic($elem, o.oncha, data);
                    self.publishTopic($elem, o.onalw, data);
                }
            };

            if (o.oncom) {
                o.load = self.pubTops($elem, o.onalw, o.oncom);
            }
            if (o.onactivatetopics) {
                o.load = self.pubTops($elem, o.onalw, o.onactivatetopics);
            }
            if (o.onbefacttopics) {
                o.load = self.pubTops($elem, o.onalw, o.onbefacttopics);
            }

            if (tabs) {
                for (l = 0; l < tabs.length; l++) {
                    tab = tabs[l];
                    tabStr += "<li ";
                    if (tab.id) {
                        tabStr += "id='" + tab.id + "' ";
                    }
                    if (tab.cssstyle) {
                        tabStr += "style='" + tab.cssstyle + "' ";
                    }
                    if (tab.cssclass) {
                        tabStr += "class='" + tab.cssclass + "' ";
                    }
                    if (tab.formIds) {
                        tabStr += "data-form='" + tab.formIds + "' ";
                    }
                    tabStr += "><a href='" + tab.href + "' ";

                    if (tab.label) {
                        tabStr += "title='" + tab.label + "' ";
                    }
                    tabStr += "><span>";
                    if (tab.label) {
                        tabStr += tab.label;
                    }
                    tabStr += "</span></a>";
                    if (tab.closable) {
                        tabStr += "<span class='ui-icon ui-icon-close s2j-tab-closable' style='float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;'>&nbsp;</span>";
                        closable = true;
                    }
                    tabStr += "</li>";
                }
                $(self.escId(o.id) + ' > ul').html(tabStr);
            }

            $elem.tabs(o);

            if (o.sortable) {
                if (!self.loadAtOnce) {
                    self.require([
                        "js/base/widget" + self.minSuffix + ".js",
                        "js/base/mouse" + self.minSuffix + ".js",
                        "js/base/data" + self.minSuffix + ".js",
                        "js/base/ie" + self.minSuffix + ".js",
                        "js/base/scroll-parent" + self.minSuffix + ".js",
                        "js/base/sortable" + self.minSuffix + ".js"
                    ]);
                }
                $elem.find(".ui-tabs-nav").sortable({axis: 'x'});
            }

            if (closable) {
                $("#" + o.id).on('click', "span.s2j-tab-closable", function () {
                    var index = $('li', $elem).index($(this).parent());
                    var tab = $elem.find(".ui-tabs-nav li:eq(" + index + ")").remove();
                    $elem.tabs("refresh");
                });
            }
            // History and Bookmarking for Tabs
            if (self.ajaxhistory) {
                ahp.id = o.id;
                $elem.find('ul.ui-tabs-nav a').bind('click', ahp, function (e) {
                    var idx = $(self.escId(e.data.id)).tabs('option', 'selected');
                    self.historyelements[e.data.id] = idx;
                    $.bbq.pushState(self.historyelements);
                    return false;
                });

                $(window).bind('hashchange', ahp, function (e) {
                    var idx = e.getState(e.data.id, true) || 0;
                    $(self.escId(e.data.id)).tabs('option', 'active', idx);
                });
            }
        },
        /** Load Ressources for Datepicker Widget */
        initDatepicker: function (timepicker) {
            var self = this;
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/datepicker" + self.minSuffix + ".js"
                ]);
                if (self.local !== "en") {
                    self.require("i18n/datepicker-" + self.local + ".min.js");
                }
            }
            if (timepicker) {
                if (!self.loadAtOnce) {
                    self.require([
                        "js/base/widget" + self.minSuffix + ".js",
                        "js/base/mouse" + self.minSuffix + ".js",
                        "js/base/slider" + self.minSuffix + ".js"
                    ]);
                }
                self.require([ "js/plugins/jquery-ui-timepicker-addon" + self.minSuffix + ".js" ]);
                self.requireCss("themes/jquery-ui-timepicker-addon.css");
                if (self.timeLocal !== "en") {
                    self.require("i18n/jquery-ui-timepicker-" + self.timeLocal + ".js");
                }
            }

        },
        /** Handle the Datepicker Widget */
        datepicker: function ($elem, o) {
            var self = this,
                params = {},
                oat = o.onalw, noms, nom, sos, so;
            self.log('init datepicker with id: ' + o.id);

            $.extend(params, o);


            if (o.onbef) {
                params.beforeShow = function (input, inst) {
                    var $input = $(input),
                        data = {};
                    data.input = input;
                    data.inst = inst;
                    self.publishTopic($input, o.onbef, data);
                    self.publishTopic($input, oat, data);
                };
            }

            if (o.onbeforeshowdaytopics) {
                params.beforeShowDay = function (date) {
                    var data = {};
                    data.date = date;
                    data.returnValue = [true, "", ""];
                    self.publishTopic($elem, o.onbeforeshowdaytopics, data);
                    self.publishTopic($elem, oat, data);
                    return data.returnValue;
                };
            }

            if (o.onchangemonthyeartopics) {
                params.onChangeMonthYear = function (year, month, inst) {
                    var data = {};
                    data.year = year;
                    data.month = month;
                    data.inst = inst;
                    self.publishTopic($elem, o.onchangemonthyeartopics, data);
                    self.publishTopic($elem, oat, data);
                };
            }

            if (o.oncha || o.inline) {
                params.onSelect = function (dateText, inst) {
                    if (o.inline) {
                        $(self.escId(o.id)).val(dateText);
                    }
                    if (o.oncha) {
                        var data = {};
                        data.dateText = dateText;
                        data.inst = inst;
                        self.publishTopic($elem, o.oncha, data);
                        self.publishTopic($elem, oat, data);
                    }
                };
            }

            if (o.oncom) {
                params.onClose = function (dateText, inst) {
                    var data = {};
                    data.dateText = dateText;
                    data.inst = inst;
                    self.publishTopic($elem, o.oncom, data);
                    self.publishTopic($elem, oat, data);
                };
            }

            if (o.displayformat) {
                params.dateFormat = o.displayformat;
            }
            else {
                params.dateFormat = $.datepicker._defaults.dateFormat;
            }

            if (o.showAnim) {
                if (!self.loadAtOnce) {
                    self.require("js/base/effect" + self.minSuffix + ".js");
                }
            }

            if (o.numberofmonths) {
                noms = o.numberofmonths;
                nom = window[noms];
                if (!nom) {
                    params.numberOfMonths = eval("( " + noms + " )");
                }
            }

            if (o.showoptions) {
                sos = o.showoptions;
                so = window[sos];
                if (!so) {
                    params.showOptions = eval("( " + sos + " )");
                }
            }

            if (o.inline) {
                $elem = $(self.escId(o.id) + '_inline');
            }

            if (o.timepicker) {
                if (o.tponly) {
                    $elem.timepicker(params);
                }
                else {
                    $elem.datetimepicker(params);
                }
                if (o.year !== undefined) {
                    $elem.datetimepicker('setDate', new Date(o.year, o.month, o.day, o.hour, o.minute, o.second));
                }
            }
            else {
                $elem.datepicker(params);
                if (o.year !== undefined) {
                    $elem.val($.datepicker.formatDate(params.dateFormat, new Date(o.year, o.month, o.day)));
                }
            }

            if (o.zindex) {
                $('#ui-datepicker-div').css("z-index", o.zindex);
            }
        },

        /** Handle the Slider Widget */
        slider: function ($elem, o) {
            var self = this,
                data = {};
            self.log('init slider with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/mouse" + self.minSuffix + ".js",
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/slider" + self.minSuffix + ".js"
                ]);
            }

            o.start = self.pubTops($elem, o.onalw, o.onbef);
            o.change = self.pubTops($elem, o.onalw, o.oncha);
            o.stop = self.pubTops($elem, o.onalw, o.oncom);

            o.slide = function (event, ui) {
                if (o.hiddenid) {
                    if (o.value !== undefined) {
                        $(self.escId(o.hiddenid)).val(ui.value);
                    }
                    if (o.values) {
                        $(self.escId(o.hiddenid)).val(ui.values[0] + "," + ui.values[1]);
                    }
                }
                if (o.displayvalueelement) {
                    if (o.value !== undefined) {
                        $(self.escId(o.displayvalueelement)).html(ui.value);
                    }
                    if (o.values) {
                        $(self.escId(o.displayvalueelement)).html(ui.values[0] + " - " + ui.values[1]);
                    }
                }
                if (o.onslidetopics) {
                    data.event = event;
                    data.ui = ui;

                    self.publishTopic($elem, o.onalw, data);
                    self.publishTopic($elem, o.onslidetopics, data);
                }
            };
            if (o.range && o.range === 'true') {
                o.range = true;
            }

            $elem.slider(o);
        },

        /** Handle the Spinner Widget */
        spinner: function ($elem, o) {
            var self = this,
                currentValue = $elem.val();

            self.log('init spinner with id: ' + o.id);
            self.container($elem, o);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/button" + self.minSuffix + ".js",
                    "js/base/spinner" + self.minSuffix + ".js"
                ]);
            }
            if (o.mouseWheel) {
                self.require("js/plugins/jquery.mousewheel" + self.minSuffix + ".js");
            }

            if (o.oncha) {
                o.change = self.pubTops($elem, o.onalw, o.oncha);
            }

            $elem.spinner(o);
            if (o.numberFormat && Globalize) {
                $elem.spinner("value", Globalize.format(parseFloat(currentValue), o.numberFormat));
            }
        },

        /** Handle the Progressbar Widget */
        progressbar: function ($elem, o) {
            var self = this,
                params = {};
            self.log('init progressbar with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/progressbar" + self.minSuffix + ".js"
                ]);
            }
            if (o) {

                params.change = self.pubTops($elem, o.onalw, o.oncha);

                if (o.value > 0) {
                    params.value = o.value;
                }
                else {
                    params.value = 0;
                }
            }
            $elem.progressbar(params);
        },

        /** Handle the Menu Widget */
        menu: function ($elem, o) {
            var self = this;
            self.log('init menu with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/position" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/unique-id" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/menu" + self.minSuffix + ".js"
                ]);
            }

            $elem.menu(o);
        },

        /** Handle the Menu Item */
        menuItem: function ($elem, o) {
            var self = this;
            self.anchor($elem, o);
        },

        /** Handle the Accordion Widget */
        accordion: function ($elem, o) {
            var self = this,
                data = {},
                active = true,
                aktivItem;
            self.log('init accordion with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/unique-id" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/accordion" + self.minSuffix + ".js"
                ]);
            }
            if (!o.header) {
                o.header = 'h3';
            }
            if (o.active) {
                if (o.active === 'true') {
                    o.active = true;
                }
                else if (o.active === 'false') {
                    o.active = false;
                    active = false;
                }
                else {
                    o.active = parseInt(o.active, 10);
                }
            }

            o.beforeActivate = function (event, ui) {
                if (o.href) {
                    if ($.type($(ui.newHeader).find('a').data('keys')) !== "undefined") {
                        var keys = ("" + $(ui.newHeader).find('a').data('keys')).split(','),
                            values = ("" + $(ui.newHeader).find('a').data('values')).split(','),
                            valueparams = {};
                        $.each(keys, function (i, val) {
                            valueparams[val] = values[i];
                        });
                        ui.newPanel.load(o.href, valueparams, function () {
                        });
                    }
                }
                if (o.onbef) {
                    data.event = event;
                    data.ui = ui;

                    self.publishTopic($elem, o.onalw, data);
                    self.publishTopic($elem, o.onbef, data);
                }
            };

            o.activate = self.pubTops($elem, o.onalw, o.oncha);
            o.create = self.pubTops($elem, o.onalw, o.oncreate);

            $elem.accordion(o);
            if (o.href && active === true) {
                aktivItem = $(self.escId(o.id) + " " + o.header).filter('.ui-accordion-header').filter('.ui-state-active').find('a');
                if ($.type($(aktivItem).data('keys')) !== "undefined") {
                    var keys = ("" + $(aktivItem).data('keys')).split(','),
                        values = ("" + $(aktivItem).data('values')).split(','),
                        valueparams = {};
                    $.each(keys, function (i, val) {
                        valueparams[val] = values[i];
                    });
                    $(self.escId(o.id) + " div").filter('.ui-accordion-content-active').load(o.href, valueparams, function () {
                    });
                }
            }
        },

        /** Handle the Accordion Item */
        accordionItem: function ($elem, o) {
            if (o.onclick) {
                $.each(o.onclick.split(','), function (i, topic) {
                    $elem.publishOnEvent('click', topic, o);
                });
            }
        },

        /** Handle the Autocompleter Widget */
        autocompleter: function ($elem, o) {
            var self = this,
                params = {},
                url = '';
            self.log('init autocompleter with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/safe-active-element" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/position" + self.minSuffix + ".js",
                    "js/base/menu" + self.minSuffix + ".js",
                    "js/base/unique-id" + self.minSuffix + ".js",
                    "js/base/autocomplete" + self.minSuffix + ".js"
                ]);
            }
            if (o.href && o.href !== '#') {
                url = o.href;
                if (o.hrefparameter) {
                    url = url + '?' + o.hrefparameter;
                }
            }
            if (url !== '') {
                if (o.list) {
                    params.source = function (request, response) {
                        var self = $.struts2_jquery;
                        $.ui.autocomplete.prototype._renderItem = function (ul, item) {
                            return $("<li></li>")
                                .data("item.autocomplete", item)
                                .append("<a>" + item.label + "</a>")
                                .appendTo(ul);
                        };

                        // inline function handler
                        var getObjectProperty = function( obj, prop ) {
                            var parts = prop.split( ',' ),
                                last = parts.pop(),
                                l = parts.length,
                                i = 1,
                                current = parts[ 0 ];
                            if ( l > 0 ) {
                                while ( ( obj = obj[ current ] ) && i < 1 ) {
                                    current = parts[ i ];
                                    i++;
                                }
                            }
                            else {
                                if ( obj ) {
                                    return obj[ last ];
                                }
                            }
                        };

                        self.abortReq(o.id);
                        self.showIndicator(o.indicatorid);
                        self.currentXhr[o.id] = $.ajax({
                            url: self.addForms(o.formids, url),
                            dataType: "json",
                            data: {
                                term: request.term
                            },
                            complete: function (request, status) {
                                self.hideIndicator(o.indicatorid);
                            },
                            success: function (data) {
                                self.currentXhr[o.id] = null;
                                var x = 0,
                                    isMap = false,
                                    result = [];
                                if (data[o.list] !== null) {
                                    if (!$.isArray(data[o.list])) {
                                        isMap = true;
                                    }
                                    $.each(data[o.list], function (j, val) {
                                        if (isMap) {
                                            result.push({
                                                label: val.replace(
                                                    new RegExp(
                                                        "(?![^&;]+;)(?!<[^<>]*)(" +
                                                            $.ui.autocomplete.escapeRegex(request.term) +
                                                            ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                                    ), "<strong>$1</strong>"),
                                                value: val,
                                                key: j
                                            });
                                        }
                                        else {
                                            if (o.listkey !== undefined && o.listvalue !== undefined) {
                                                var label;
                                                if (o.listlabel) {
                                                    label = val[o.listlabel];
                                                }
                                                else {
                                                    label = val[o.listvalue].replace(
                                                        new RegExp(
                                                            "(?![^&;]+;)(?!<[^<>]*)(" +
                                                                $.ui.autocomplete.escapeRegex(request.term) +
                                                                ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                                        ), "<strong>$1</strong>");
                                                }
                                                result.push({
                                                    label: label,
                                                    value: val[o.listvalue],
                                                    key: getObjectProperty( val, o.listkey )
                                                });
                                            }
                                            else {
                                                result.push({
                                                    label: data[o.list][x].replace(
                                                        new RegExp(
                                                            "(?![^&;]+;)(?!<[^<>]*)(" +
                                                                $.ui.autocomplete.escapeRegex(request.term) +
                                                                ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                                        ), "<strong>$1</strong>"),
                                                    value: data[o.list][x],
                                                    key: data[o.list][x]
                                                });
                                            }
                                        }
                                        x++;
                                    });
                                    response(result);
                                }
                            }
                        });
                    };
                }
                else {
                    params.source = function (request, response) {
                        self.abortReq(o.id);
                        self.currentXhr[o.id] = $.ajax({
                            url: self.addForms(o.formids, url),
                            dataType: "json",
                            type: o.requesttype,
                            data: {
                                term: request.term
                            },
                            success: response
                        });
                    };
                }
            }
            else if (o.list && o.selectBox === false) {
                params.source = o.list;
            }
            if (o.delay) {
                params.delay = o.delay;
            }
            if (o.minimum) {
                params.minLength = o.minimum;
            }
            if (o.forceValidOption === false) {
                $elem.keyup(function (e) {
                    $(self.escId(o.hiddenid)).val($elem.val());
                });
            }

            if (o.onsuc) {
                params.open = self.pubTops($elem, o.onalw, o.onsuc);
            }
            if (o.oncha) {
                params.change = self.pubTops($elem, o.onalw, o.oncha);
            }
            if (o.oncom) {
                params.close = self.pubTops($elem, o.onalw, o.oncom);
            }
            if (o.onsearchtopics) {
                params.search = self.pubTops($elem, o.onalw, o.onsearchtopics);
            }
            if (o.onfocustopics) {
                params.focus = self.pubTops($elem, o.onalw, o.onfocustopics);
            }
            params.select = function (event, ui) {
                if (o.onselecttopics) {
                    params.select = self.pubTops($elem, o.onalw, o.onselecttopics);
                    var data = {};
                    data.event = event;
                    data.ui = ui;

                    self.publishTopic($elem, o.onalw, data);
                    self.publishTopic($elem, o.onselecttopics, data);
                }
                if (ui.item) {
                    if (ui.item.option) {
                        $(self.escId(o.hiddenid)).val(ui.item.option.value);
                    }
                    else if (ui.item.key) {
                        $(self.escId(o.hiddenid)).val(ui.item.key);
                    }
                    else {
                        $(self.escId(o.hiddenid)).val(ui.item.value);
                    }
                }
            };

            if (o.selectBox === false) {
                $elem.autocomplete(params);
            }
            else {
                if (!self.loadAtOnce) {
                    self.require([ "js/base/button" + self.minSuffix + ".js", "js/base/tooltip" + self.minSuffix + ".js" ]);
                }
                self.requireCss("themes/s2j-combobox.css");
                self.require([ "js/plugins/jquery.combobox" + self.minSuffix + ".js" ]);
                if (o.selectBoxIcon) {
                    params.icon = true;
                }
                else {
                    params.icon = false;
                }
                $elem.combobox(params);
            }
        },

        /** Handle the Button Widget for Anchor or Submit Tag*/
        jquerybutton: function ($elem, o) {
            var self = this,
                params = {};
            self.log('init button with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/escape-selector" + self.minSuffix + ".js",
                    "js/base/form" + self.minSuffix + ".js",
                    "js/base/form-reset-mixin" + self.minSuffix + ".js",
                    "js/base/labels" + self.minSuffix + ".js",
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/controlgroup" + self.minSuffix + ".js",
                    "js/base/checkboxradio" + self.minSuffix + ".js",
                    "js/base/button" + self.minSuffix + ".js"
                ]);
            }
            if (o.button) {
                params.icons = {};
                if (o.bicon) {
                    params.icons.primary = o.bicon;
                }
                if (o.bicon2) {
                    params.icons.secondary = o.bicon2;
                }
                if (o.btext !== undefined) {
                    params.text = o.btext;
                }
                $elem.button(params);
            }
        },

        /** Handle the Buttonset Widget for Radiobuttons or Checkboxes */
        buttonset: function ($elem, o) {
            var self = this,
                buttonsetLoadTopic = '_s2j_topic_load_' + o.id,
                buttonsetTopic = 's2j_buttonset_' + o.id;
            self.log('init buttonset with id: ' + o.id);
            if (!self.loadAtOnce) {
                self.require([
                    "js/base/escape-selector" + self.minSuffix + ".js",
                    "js/base/form" + self.minSuffix + ".js",
                    "js/base/form-reset-mixin" + self.minSuffix + ".js",
                    "js/base/labels" + self.minSuffix + ".js",
                    "js/base/keycode" + self.minSuffix + ".js",
                    "js/base/widget" + self.minSuffix + ".js",
                    "js/base/controlgroup" + self.minSuffix + ".js",
                    "js/base/checkboxradio" + self.minSuffix + ".js",
                    "js/base/button" + self.minSuffix + ".js"
                ]);
            }

            if (o.href && o.href !== '#') {
                if ($elem.isSubscribed(buttonsetTopic)) {
                    $elem.destroyTopic(buttonsetTopic);
                }

                // Init Buttonset after elements loaded via AJAX.
                $elem.subscribe(buttonsetTopic, function (event, data) {
                    var elements = $elem.find("input[type=radio], input[type=checkbox]");
                    if (o.oncha) {
                        if (($.support.leadingWhitespace == false) && o.type === 'radio') {
                            elements.click(function () {
                                this.blur();
                                this.focus();
                                $.each(o.oncha.split(','), function (i, cts) {
                                    $elem.publish(cts);
                                });
                            });
                        }
                        else {
                            elements.change(function () {
                                $.each(o.oncha.split(','), function (i, cts) {
                                    $elem.publish(cts);
                                });
                            });
                        }
                    }

                    if (o.buttonset) {
                        elements.checkboxradio(o);
                        $elem.controlgroup(o);
                    }
                });
                if (o.onsuc && o.onsuc !== '') {
                    o.onsuc = buttonsetTopic;
                }
                else {
                    o.onsuc = buttonsetTopic;
                }

                self.subscribeTopics($elem, o.reloadtopics, self.handler.load, o);
                self.subscribeTopics($elem, o.listentopics, self.handler.load, o);

                $elem.subscribe(buttonsetLoadTopic, self.handler.load);
                $elem.publish(buttonsetLoadTopic, o);
            }
            else {
                var elements = $elem.find("input[type=radio], input[type=checkbox]");
                if (o.oncha) {
                    elements.change(function () {
                        $.each(o.oncha.split(','), function (i, cts) {
                            $elem.publish(cts);
                        });
                    });
                }

                if (o.buttonset) {
                    elements.checkboxradio(o);
                    $elem.controlgroup(o);
                }
            }
        }
    };

    /**
     * handler to open a dialog
     */
    $.subscribeHandler($.struts2_jquery_ui.handler.open_dialog, function (event, data) {
        var s2j = $.struts2_jquery_ui,
            o = $(this).data('s2j_options');
        if (data) {
            if (data.href && data.href !== '#') {
                o.href = data.href;
            }
            if (data.hrefparameter) {
                o.hrefparameter = data.hrefparameter;
            }
            if (data.formids) {
                o.formids = data.formids;
            }
            if (data.opendialogtitle) {
                o.opendialogtitle = data.opendialogtitle;
            }
        }

        $(this).dialog("option", "open", function (event, ui) {
            var data = {},
                divTopic = '_s2j_topic_load_' + o.id;
            data.event = event;
            data.ui = ui;

            if (o.href && o.href !== '#') {
                s2j.subscribeTopics($(this), divTopic, s2j.handler.load, o);
                $(this).publish(divTopic);
            }

            s2j.publishTopic($(this), o.onalw, data);
            s2j.publishTopic($(this), o.onbef, data);
            s2j.publishTopic($(this), o.onopentopics, data);
        });
        if (o.opendialogtitle) {
            $(this).dialog("option", "title", o.opendialogtitle);
        }
        $(this).dialog("open");
    });

    /**
     * handler to close a dialog
     */
    $.subscribeHandler($.struts2_jquery_ui.handler.close_dialog, function (event, data) {
        $(this).dialog('close');
    });

    /**
     * handler to destroy a dialog
     */
    $.subscribeHandler($.struts2_jquery_ui.handler.destroy_dialog, function (event, data) {
        $(this).dialog('destroy');
    });

    // Extend it from orginal plugin
    $.extend(true, $.struts2_jquery_ui, $.struts2_jquery);
    $.struts2_jquery_ui.debugPrefix = "[struts2_jquery_ui] ";

})(jQuery);



}
).toString().slice(12, -2),"");