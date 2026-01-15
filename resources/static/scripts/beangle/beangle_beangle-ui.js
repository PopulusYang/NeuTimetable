vpn_eval((function(){
/**
 * Beangle, Agile Java/Scala Development Scaffold and Toolkit
 *
 * Copyright (c) 2005-2013, Beangle Software.
 *
 * Beangle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Beangle is distributed in the hope that it will be useful.
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Beangle.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Version 3.3.4
 */
(function( window ) {
  if(beangle) return;
  var beangle=function (){
    return true;
  };

  var $ = jQuery;

  /** extend function */
  beangle.extend= function(map){
    for(attr in map){
      var attrs=attr.split("."),obj=beangle,i;
      for(i=0 ;i<attrs.length-1;i++){
        obj[attrs[i]]=obj[attrs[i]]||{};
        obj=obj[attrs[i]];
      }
      obj[attrs[attrs.length-1]]=map[attr];
    }
  }
  window.beangle=beangle;
  window.bg=beangle;

  /**
   * beangle国际化
   * @type {{}}
   */
  var I18N_MESSAGES = {};
  I18N_MESSAGES['zh'] = {
    'please.select' : '请选择一个或多个进行操作',
    'please.select.one' : '请选择一个进行操作',
    'please.select.only.one' : '请仅选择一个',
    'page.no.is' : '输入分页的页码是:',
    'page.size.is' : '输入分页的页长是:',
    'not.a.integer' : ',它不是个整数',
    'back': '返回',
    'help': '帮助',
    'print': '打印',
    'close': '关闭',
    'under.construction': '施工中..',
    'can.not.find.ordering.table':'无法找到元素对应的排序表格！',
    'click.to.order.by1': '点击按 [',
    'click.to.order.by2': '] 排序',
    'no.item.selected': '你没有选择要操作的记录！',
    'confirm.delete': '确认删除?',
    'selected': '已选',
    'item.amount.pl': '条'
  };
  I18N_MESSAGES['en'] = {
    'please.select' : 'Please choose one or more items to operate',
    'please.select.one' : 'Please choose one item to operate',
    'please.select.only.one' : 'Please choose only one item',
    'page.no.is' : 'Inputed page number is:',
    'page.size.is' : 'Inputed page size is:',
    'not.a.integer' : ',it\'s not a integer number',
    'back': 'Back',
    'help': 'Help',
    'print': 'Print',
    'close': 'Close',
    'under.construction': 'Under construction..',
    'can.not.find.ordering.table':'Can\'t find element ordering table',
    'click.to.order.by1': 'Click to order by [',
    'click.to.order.by2': '] ',
    'no.item.selected': 'You haven\'t choose any item to operate',
    'confirm.delete': 'Confirm delete?',
    'selected': 'Selected',
    'item.amount.pl': 'Items'
  };
  I18N_MESSAGES['zh_CN'] = I18N_MESSAGES['zh'];
  I18N_MESSAGES['en_US'] = I18N_MESSAGES['en'];

  window.$BG_LANG = window.$BG_LANG in I18N_MESSAGES ? window.$BG_LANG : 'zh';
  beangle.i18n = function(key) {
    return I18N_MESSAGES[window.$BG_LANG][key] || key;
  }
  /**
   * beangle国际化结束
   */

  beangle.contextPath=null;

  beangle.ajaxhistory=(typeof History!="undefined" && typeof History.Adapter !="undefined" && HistoryEnhance != undefined);

  beangle.displayAjaxMessage=function() {
    var loadingMessage = "Loading...";
    var mz = document.getElementById('messageZone');
    if (!mz) {
      var mz = document.createElement('div');
      mz.setAttribute('id', 'messageZone');
      mz.style.position = "absolute";
      mz.style.zIndex = "1000";
      mz.style.top = "0px";
      mz.style.right = "0px";
      mz.style.width = "55px";
      mz.style.height = "20px"
      mz.style.background = "#F9EDBE";
      mz.style.padding = "2px";
      document.body.appendChild(mz);
      var text = document.createTextNode(loadingMessage);
      mz.appendChild(text);
    }else {
      mz.innerHTML=loadingMessage;
      mz.style.visibility = 'visible';
    }
  };
  beangle.hideAjaxMessage=function(){
    var mz = document.getElementById('messageZone');
    if(mz)mz.style.visibility='hidden';
  };

  //History--------------------------
  beangle.history = {
    //最多存储20个状态
    maxStates:20,
    init : function(){
      if (document.location.protocol === 'file:') {
        alert('The HTML5 History API (and thus History.js) do not work on files, please upload it to a server.');
        return;
      }

      History.Adapter.bind(window, 'statechange', function () {
        if (History.savedStates.length > bg.history.maxStates) {
          //History.reset();
        }
      });

      /*
       HistoryState的数据格式是这样的：
       {
       // 方法，GET或POST
       method : "GET/POST",
       // 局部页面刷新的目标element
       container: "container for new content",
       // post请求时所提交的参数
       postData: "",
       // 扩展信息，可以利用这个重建ui外观(开发人员需自己实现这个功能)
       // 可以在自己的页面里调用History.getState().data.extData来获得这个信息，然后利用它来实现相应的逻辑
       extData: { }
       };
       */
      var navigationHandler = function(event, prevState, currentState) {
        if(!(currentState)) {
          return;
        }
        if(!currentState.data) {
          return;
        }
        if(!currentState.data.container) {
          window.location = currentState.url;
        }
        var $target = $('#' + currentState.data.container);
        if (currentState.data.method == 'GET') {
          $.ajax({
            url: currentState.url,
            cache: false,
            type: "GET",
            dataType: "html",
            beforeSend : beangle.displayAjaxMessage,
            complete: function (jqXHR) {
              beangle.hideAjaxMessage();
              try {
                currentState.data.timestamp = new Date().getTime()
                History.replaceState(currentState.data, currentState.title, currentState.url);
                $target.empty();
                $target.html(jqXHR.responseText);
                $target.ready(beangle.history.restoreUI);
                beangle.hideAjaxMessage();
              } catch (e) {
                $target.html(e);
              }
            }
          });
        } else if (currentState.data.method == 'POST') {
          $.ajax({
            type: 'POST',
            url: currentState.url,
            cache : false,
            data: currentState.data.postData,
            beforeSend : beangle.displayAjaxMessage,
            complete: function (jqXHR) {
              try {
                currentState.data.timestamp = new Date().getTime()
                History.replaceState(currentState.data, currentState.title, currentState.url);
                $target.empty();
                $target.html(jqXHR.responseText);
                $target.ready(beangle.history.restoreUI);
                beangle.hideAjaxMessage();
              } catch(e) {
                $target.html(e);
              }
            }
          });
        }
      };

      // 浏览器前进时，根据history state中的信息重新发起请求
      History.Adapter.bind(window, "navigation-forward", navigationHandler);
      // 浏览器后退时，根据history state还原之前的内容
      History.Adapter.bind(window, "navigation-backward", navigationHandler);

    },

    /*
     根据extData重建ui的，目前只针对checkbox做处理
     */
    restoreUI : function() {
      var currentState = History.getState();
      // 还原checkbox的勾选状态
      if(currentState.data.extData.boxes){
        jQuery(currentState.data.extData.boxes).each(function(index, value) {
          jQuery('#' + currentState.data.container +' .box[value=' + value + ']').prop('checked', true);
        });
      }
    },

    addHistory: function(historyState, title, url, historyMode) {
      if (historyState == undefined || historyMode == false || historyMode == 'false') {
        return;
      }
      if(historyState.timestamp - History.getState().data.timestamp < 1000) {
        History.replaceState(historyState, title, url);
        return;
      }
      if (historyMode == undefined || historyMode == null || historyMode == 'true' || historyMode == true || historyMode == 'p' || historyMode == 'push' || historyMode == 'pushState') {
        History.pushState(historyState, title, url);
        return;
      }
      if (historyMode == 'r' || historyMode == 'replace' || historyMode == 'replaceState') {
        History.replaceState(historyState, title, url);
        return;
      }

      throw new Error(
          "Unsupported history mode. Supported history mode: " +
          "record history: undefined, true, 'p', 'push', 'pushState'\n" +
          "don't record history: false\n" +
          "replace history: 'r', 'replace', 'replaceState'"
      );
    },

    /*
     构造部分的History State
     */
    makePartialHistory : function(method, container, extData) {
      var currentState = History.getState();
      // 记住页面原来勾选的checkbox
      if(currentState.data.container) {
        var _t = [];
        $('#' + currentState.data.container + ' .box:checked').each(function (index, e) {
          _t[_t.length] = e.value;
        });
        currentState.data.extData.boxes = _t;
        History.replaceState(currentState.data, currentState.title, currentState.url);
      }

      var historyState = {};
      historyState.method = method;
      historyState.container = container;
      if (extData != undefined) {
        historyState.extData = JSON.parse(JSON.stringify(extData));
      } else {
        historyState.extData = {};
      }
      historyState.timestamp = (new Date()).getTime();
      return historyState;
    }

  };

  //Go and ajax---------------------------------
  beangle.extend({
    //jump to href or anchor
    Go : function (obj,target, historyMode, historyData){
      var url=obj;
      if(typeof obj =="object" && obj.tagName.toLowerCase()=="a"){
        url=obj.href;
        if(!target){
          target=bg.findTarget(obj);
        }
      }
      if(!target) target="_self";
      if("_self"==target){ self.location=url;}
      else if("_parent"==target){self.parent.location=url;}
      else if("_top" ==target){self.top.location=url;}
      else if("_new" ==target || "_blank" ==target  ){window.open(url);}
      else{
        if(!bg.isAjaxTarget(target)){
          document.getElementById(target).src=url;
        }else{
          var $target = $('#' + target);
          if(beangle.ajaxhistory){
            $.ajax({
              url: url,
              cache: false,
              type: "GET",
              dataType: "html",
              beforeSend : beangle.displayAjaxMessage,
              complete: function (jqXHR) {
                beangle.hideAjaxMessage();
                try {
                  var historyState = beangle.history.makePartialHistory('GET', target, historyData);
                  $target.empty();
                  $target.html(jqXHR.responseText);
                  if(jqXHR.getResponseHeader('beangle-redirect-url')) {
                    beangle.history.addHistory(historyState, null, jqXHR.getResponseHeader('beangle-redirect-url'), historyMode);
                  } else {
                    beangle.history.addHistory(historyState, null, url, historyMode);
                  }
                } catch (e) {
                  $target.html(e);
                }
              }
            });
          }else {
            //using post ,hack ie8 get cache
            jQuery('#'+target).load(url,{});
          }
        }
      }
      return false;
    },
    getContextPath : function (){
      if(null===beangle.contextPath){
        return self.location.pathname.substring(0,self.location.pathname.substring(1).indexOf('/')+1);
      }else{
        return beangle.contextPath;
      }
    },
    ready:function (fn){
      jQuery(document).ready(fn);
    },
    isAjaxTarget : function (target){
      if(!target) return false;
      if(target==""||target=="_new"||target=="_blank"||target=="_self"||target=="_parent"||target=="_top"){
        return false;
      }
      targetEle=document.getElementById(target);
      if(!targetEle) return false;
      tagName=targetEle.tagName.toLowerCase();
      if(tagName=="iframe" || tagName=="object"){
        return false;
      }
      return true;
    },
    normalTarget : function(target){
      if(target==""||target=="new"||target=="_blank"||target=="_self"||target=="_parent"){
        return target;
      }
      var targetObj = document.getElementById(target);
      if(!targetObj || targetObj.tagName.toLowerCase()!="iframe") return "_self";
      else return target;
    },
    findTarget : function(ele){
      var p = ele.parentNode,finalTarget = "_self";
      while(p){
        //FIXME ui-tabs-panel
        if(p.id && p.className  && (p.className.indexOf("ajax_container")>-1 )){//||p.className.indexOf("ui-tabs-panel")>-1
          finalTarget = p.id;
          break;
        }else{
          if(p==p.parentNode) p=null;
          else p=p.parentNode;
        }
      }
      ele.target=finalTarget;
      return finalTarget;
    }
  });

  // Assert------------------------
  beangle.extend({
    assert:{
      notNull : function(object,message){
        if(null==object)  alert(message);
      }
    }
  });
  bg.extend({
    randomInt:function(){
      var num=Math.random()*10000000;
      num -= num%1;
      return num;
    }
  });
  // Logger----------------------------
  beangle.extend({
    logger:{
      // debug=0;info=1;warn=2;error=3;fatal=4;disabled=5
      level : 1,
      debug : function(message){
        if(beangle.logger.level<=0){
          var msg = '[beangle] ' + message;
          if (window.console && window.console.log) {
            window.console.log(message);
          }else if (window.opera && window.opera.postError) {
            window.opera.postError(msg);
          }else{
            alert(msg);
          }
        }
      }
    }
  });

  // Event--------------------------------------------------
  beangle.extend({
    event:{
      portable: function (e){
        if(!e) return window.event;
        else return e;
      },
      /**获得事件背后的元素*/
      getTarget: function (e){
        e=bg.event.portable(e);
        return e.target || e.srcElement;
      }
    }
  });

  // Input----------------------------------------------------
  beangle.extend({
    input:{
      toggleCheckBox : function (chk,event){
        bg.input.boxAction(chk, "toggle",event);
      },
      /**
       * 返回单选列表中选择的值
       * @return 没有选中时,返回""
       */
      getRadioValue : function (radioName){
        return bg.input.boxAction(document.getElementsByName(radioName), "value");
      },

      /**
       * 返回多选列表中选择的值
       * @return 多个值以,相隔.没有选中时,返回""
       */
      getCheckBoxValues : function (chkname){
        var tmpIds= bg.input.boxAction(document.getElementsByName(chkname), "value");
        if(tmpIds==null)return "";
        else return tmpIds;
      },
      /**
       * modify by chaostone 2006-8-2
       * 将反选取消,改为全选或者全部取消
       */
      boxAction : function (box, action,event){
        var val = "",srcElement,i;
        if (box){
          if (! box[0]){
            if (action == "selected"){
              return box.checked;
            } else if (action == "value"){
              if (box.checked)
                val = box.value;
            } else if (action == "toggle"){
              srcElement = beangle.event.getTarget(event);
              box.checked = srcElement.checked;
              if(typeof box.onchange =="function"){
                box.onchange();
              }
            }
          } else{
            for (i=0; i<box.length; i++){
              if (action == "selected"){
                if (box[i].checked)
                  return box[i].checked;
              } else if (action == "value"){
                if (box[i].checked){
                  if (box[i].type == "radio"){
                    val = box[i].value;
                  } else if (box[i].type == "checkbox"){
                    if (val != "")
                      val = val + ",";
                    val = val + box[i].value;
                  }
                }
              } else if (action == "toggle"){
                srcElement = beangle.event.getTarget(event);
                box[i].checked = srcElement.checked;
                if(typeof box[i].onchange =="function"){
                  box[i].onchange();
                }
              }
            }
          }
        }
        if (action == "selected")
          return false;
        else
          return val;
      }
    }
  });

  //IFrame--------------------------------------------------------
  beangle.extend({
    iframe:{
      adaptSelf:function (){
        bg.iframe.adapt(self);
      },
      /** iframe 页面自适应大小
       * @targObj    iframe
       * @extraHight
       */
      adapt: function (targObj,extraHight){
        var frames, targWin, totalHeight, myHeight;
        if(null==targObj || targObj.name=="")
          return;
        if(targObj.parent == targObj)return;
        if (targObj.parent == window.top) {
          if(targObj.parent.document.body.style.overflowY=="hidden") return;
        }
        frames = targObj.parent.document.getElementsByName(targObj.name);
        if(frames.length<1) return;
        targWin=frames[0];
        if(targWin != null && (targWin.scrolling=="no" || targWin.className=="autoadapt")) {
          totalHeight = targObj.document.body.scrollHeight + ((null==extraHight)?0:extraHight);
          myHeight = 0;
          if(targWin.style.height){
            myHeight=parseInt(targWin.style.height.substring(0,targWin.style.height.length-2));
          }
          if((totalHeight>0) &&  totalHeight> myHeight){
            targWin.style.height = totalHeight+"px";
            bg.logger.debug('adapt frame:'+targObj.name+" height "+targWin.style.height);
          }
        }
        bg.iframe.adapt(targObj.parent);
      }
    }
  });
  //About From
  beangle.extend({
    form:{
      /**
       * 提交form表单，如果target是一个ajax container，那么就采用局部页面刷新技术
       * @param myForm
       * @param action
       * @param target
       * @param onsubmit
       * @param ajax
       * @param historyMode
       * @param historyData
       */
      submit : function (myForm,action,target,onsubmit,ajax,historyMode,historyData){
        var submitTarget, rs,origin_target, origin_action;
        if((typeof myForm)=='string') myForm = document.getElementById(myForm);
        //First native onsubmit will benefit to user's onsubmit hook on data validation.
        //1.native onsubmit
        if(myForm.onsubmit){
          rs=null;
          try{rs=myForm.onsubmit();}catch(e){alert(e);return;}
          if(!rs){
            return;
          }
        }
        //2. submit hook
        if(onsubmit){
          rs=null;
          if(typeof onsubmit == "function"){
            try{rs=onsubmit(myForm);}catch(e){alert(e);return;}
          }else{
            rs=eval(onsubmit);
          }
          if(!rs){
            return;
          }
        }
        //3. check target and action
        submitTarget = (null!=target)?target:myForm.target;

        if(!submitTarget) submitTarget=bg.findTarget(myForm);

        if(action==null) action=myForm.action;

        if(action.indexOf("http://")==0) action=action.substring(action.indexOf("/",7));

        if(null==ajax || ajax) ajax=bg.isAjaxTarget(submitTarget);

        // 4. fire
        if(ajax){
          if(null==myForm.id||''==myForm.id){
            myForm.setAttribute("id",myForm.name);
          }
          if(beangle.ajaxhistory){

            var historyState, $target = $('#' + submitTarget);

            if (historyMode != false) {
              historyState = beangle.history.makePartialHistory('POST', submitTarget, historyData);
              historyState.postData = $(myForm).formSerialize();
            }

            var submitSuccess = function (responseText, statusText, xhr, $form) {
              beangle.hideAjaxMessage();
              try {
                $target.empty();
                $target.html(responseText);
                if(xhr.getResponseHeader('beangle-redirect-url')) {
                  historyState.method = 'GET';
                  delete historyState.postData;
                  beangle.history.addHistory(historyState, null, xhr.getResponseHeader('beangle-redirect-url'), historyMode);
                } else {
                  var isIE8 = beangle.getInternetExplorerVersion() > -1 && beangle.getInternetExplorerVersion() <= 9;
                  if (isIE8 && jQuery("input:file", myForm).length) {
                    /*
                    在涉及到文件上传的时候，jquery-form在IE8,9下是通过iframe来提交的，
                    因此这里的xhr是伪造的，也就获得不到beangle-redirect-url header，
                    只能通过找到那个iframe来获得redirect url
                     */
                    if (jQuery('iframe[name^="jqFormIO"]').length) {
                      var tmpSubmitIFrame = jQuery('iframe[name^="jqFormIO"]')[0];
                      historyState.method = 'GET';
                      delete historyState.postData;
                      var redirectURL = "";
                      if (tmpSubmitIFrame.contentWindow) {
                        redirectURL = tmpSubmitIFrame.contentWindow.location.href;
                      } else if (tmpSubmitIFrame.contentDocument) {
                        redirectURL = tmpSubmitIFrame.contentDocument.location.href;
                      }
                      beangle.history.addHistory(historyState, null, redirectURL, historyMode);
                    }
                  } else {
                    beangle.history.addHistory(historyState, null, action, historyMode);
                  }
                }
              } catch (e) {
                $target.html(e);
              }
            };

            var options = {
              url: action,
              beforeSubmit : beangle.displayAjaxMessage,
              success: submitSuccess,
              error : function(jqXHR) {
                beangle.hideAjaxMessage();
                try {
                  $target.html(jqXHR.responseText);
                } catch (e) {
                  $target.html(e);
                }
              }
            };

            $(myForm).ajaxSubmit(options);
          }else{
            beangle.form.ajaxSubmit(myForm.id,action,submitTarget);
          }
        }else{
          origin_target=myForm.target;
          origin_action=myForm.action;
          myForm.action=action;
          myForm.target = bg.normalTarget(submitTarget);
          myForm.submit();
          myForm.target = origin_target;
          myForm.action = origin_action;
        }
      },
      ajaxSubmit : function(formId,action,target){
        if(!action) action=document.getElementById(formId).action;
        jQuery('#'+formId).ajaxForm({
          success:function(result) {try{jQuery('#'+target).html(result);}catch(e){alert(e)}},
          error:function (response) {try{jQuery('#'+target).html(response.responseText);}catch(e){alert(e)}},
          url:action
        });
        jQuery('#'+formId).submit();
      },
      /**
       * 在提交到ajax container的时候，在container里构造一个iframe，将内容放到iframe里
       * @param myForm
       * @param action
       * @param target
       * @param onsubmit
       * @param ajax
       * @param historyMode
       * @param historyData
       */
      submitFrame : function(myForm,action,target,onsubmit,ajax,historyMode,historyData) {
        var submitTarget;
        if((typeof myForm)=='string') myForm = document.getElementById(myForm);
        submitTarget = (null!=target)?target:myForm.target;
        if(!submitTarget) submitTarget = bg.findTarget(myForm);
        if(bg.isAjaxTarget(submitTarget)) {
          var _submitTarget  = submitTarget
          var $appendTo      = jQuery("#" + submitTarget);
          var frameId        = "iframe" + new Date().getTime();
          var $progressFrame = jQuery("<iframe id='" + frameId + "' name='" + frameId + "'></iframe>");
          $progressFrame
              .css('width','100%').css('height', '900px')
              .attr('marginwidth','0').attr('marginheight','0')
              .attr('frameborder','0').attr('scrolling', 'no')
          ;
          $progressFrame.hide();
          $progressFrame.appendTo($appendTo);
          submitTarget = frameId;

          bg.form.submit(myForm,action,submitTarget,onsubmit,ajax,historyMode,historyData);

          $appendTo.children(":not(#" + frameId + ")").remove();
          $progressFrame.show();

          var state = History.getState();
          History.pushState(state.data,null,state.url + "?iframe" + new Date().getTime());
        } else {
          bg.form.submit(myForm,action,target,onsubmit,ajax,historyMode,historyData);
        }
      },
      /**
       * 提交要求含有id的表单
       * @param form 带提交的表单
       * @param id 要提交id的名称
       * @param isMulti(可选)是否允许多个id选择,默认支持一个
       * @param action (可选) 指定form的action
       */
      submitId : function (form,id,isMulti,action,promptMsg,ajax){
        var selectId = bg.input.getCheckBoxValues(id);
        if(null==isMulti) isMulti=false;

        if(""==selectId){
          alert(isMulti?bg.i18n('please.select'):bg.i18n('please.select.one'));
          return;
        }
        if(!isMulti && (selectId.indexOf(",")>0)){
          alert(bg.i18n('please.select.only.one'));
          return;
        }
        if(null!=action){
          form.action=action;
        }else{
          action=form.action;
        }
        bg.form.addInput(form,(isMulti?(id+'s'):id),selectId,"hidden");
        if(null!=promptMsg){
          if(!confirm(promptMsg))return;
        }
        bg.form.submit(form,action,null,null,ajax);
      },
      /**
       * 向form中添加一个input。
       * @param form 要添加输入的form
       * @param name input的名字
       * @param value input的值
       * @param type input的类型，默认为hidden
       * @author chaostone 2006-4-7
       */
      addInput : function (form,name,value,type){
        //防止设置form的属性
        if(form[name]!=null && (typeof form[name].tagName)!="undefined"){
          form[name].value=value;
        }else{
          if(null==type)
            type="hidden";
          var input = document.createElement('input');
          input.setAttribute("name",name);
          input.setAttribute("value",value);
          input.setAttribute("type",type);
          form.appendChild(input);
        }
      },
      ecodeParams : function (params){
        if(""==params)return "";
        var paramsPair=params.split("&"), newParams="", i, eqIndex;
        for(i=0;i<paramsPair.length;i++){
          if(paramsPair[i]!=""){
            eqIndex = paramsPair[i].indexOf("=");
            newParams+="&"+paramsPair[i].substr(0,eqIndex);
            if(-1!=eqIndex){
              newParams+="=";
              newParams+=escape(paramsPair[i].substr(eqIndex+1));
            }
          }
        }
        return newParams;
      },
      /**
       * 从form表单中，抽出含有指定前缀的输出参数，
       * 将其作为一个参数加入到to表单中。
       */
      setSearchParams : function (from,to,prefix){
        bg.form.addInput(to,'params',"");
        var params=bg.form.getInputParams(from,prefix,false);
        bg.form.addInput(to,'params',params);
      },

      addHiddens : function (form,paramSeq){
        bg.assert.notNull(paramSeq,"paramSeq for addHiddens must not be null");
        var params = paramSeq.split("&"), i, name, value;
        for(i=0;i<params.length;i++){
          if(params[i]!=""){
            name = params[i].substr(0,params[i].indexOf("="));
            value =params[i].substr(params[i].indexOf("=")+1);
            bg.form.addInput(form,name,value,"hidden");
          }
        }
      },

      addParamsInput : function (form,value){
        bg.form.addInput(form,"params",value,"hidden");
      },
      transferParams : function (from ,to,prefix,getEmpty){
        if(getEmpty==null)
          getEmpty=true;
        var params = bg.form.getInputParams(from,prefix,getEmpty);
        bg.form.addHiddens(to,params);
      },

      /**
       * 收集给定form中的input||select参数（不论input的类型）.<b>
       * 但不收集params的input,这个作为保留名称
       * @param form
       * @param prefix 指明所有input||select的前缀，如果没有前缀可以忽略
       * @param getEmpty 是否收集值为空的属性
       * @return 返回参数列表串形如：&input1=...&input2=...
       * @author chaostone 2006-4-7
       *
       */
      getInputParams : function (form,prefix,getEmpty){
        var elems = form.elements, params = "", i;
        if(null==getEmpty) getEmpty=true;

        for(i = 0;i < elems.length; i++){
          if(""!=elems[i].name){
            if("params"==elems[i].name) continue;
            //alert(elems[i].tagName+":"+elems[i].value);
            if((elems[i].value=="")&&(!getEmpty)) continue;
            if(null!=prefix){
              if(elems[i].name.indexOf(prefix)==0&&elems[i].name.indexOf(".")>1){
                if((elems[i].type=="radio" ||elems[i].type=="checkbox")&& !elems[i].checked)
                  continue;
                if(elems[i].value.indexOf('&')!=-1){
                  params+="&" + elems[i].name + "=" + escape(elems[i].value);
                }else{
                  params+="&" + elems[i].name + "=" + elems[i].value;
                }
              }
            }else{
              if((elems[i].type=="radio" ||elems[i].type=="checkbox")&& !elems[i].checked)
                continue;
              if(elems[i].value.indexOf('&')!=-1){
                params+="&" + elems[i].name + "=" + escape(elems[i].value);
              }else{
                params+="&" + elems[i].name + "=" + elems[i].value;
              }
            }
          }
        }
        //alert("[getInputParams]:"+params);
        return params;
      },
      goToPage : function (form,pageNo,pageSize,orderBy){
        if((typeof form)!="object"){alert("[goToPage:]form is not well defined.");return;}
        //form.method="post"; for avoid "method" input
        if(null!=pageNo){
          if(!/^[1-9]\d*$/.test(pageNo)){
            alert(bg.i18n('page.no.is')+pageNo+bg.i18n('not.a.integer'));
            return;
          }
          bg.form.addInput(form,"pageNo",pageNo,"hidden");
        }else{
          bg.form.addInput(form,"pageNo",1,"hidden");
        }
        if(null!=pageSize){
          if(!/^[1-9]\d*$/.test(pageSize)){
            alert(bg.i18n('page.no.is')+pageSize+bg.i18n('not.a.integer'));
            return;
          }
          bg.form.addInput(form,"pageSize",pageSize,"hidden");
        }else{
          bg.form.addInput(form,"pageSize","","hidden");
        }
        if(null!=orderBy&&orderBy!="null"){
          bg.form.addInput(form,"orderBy",orderBy,"hidden");
        }else{
          bg.form.addInput(form,"orderBy","","hidden");
        }
        //alert("in goToPage");
        form.submit();
      },
      goToFirstPage : function (form){
        bg.form.goToPage(form,1);
      }
    }
  });

  //select---------------------
  beangle.extend({
    select:{
      getValues : function (select){
        var val = "", i, options = select.options;
        for (i = 0; i< options.length; i++){
          if (val != "")
            val = val + ",";
          val = val + options[i].value;
        }
        return val;
      },
      getSelectedValues : function (select){
        var val = "", i, options = select.options;
        for (i = 0; i < options.length; i++){
          if (options[i].selected){
            if (val != "")
              val = val + ",";
            val = val + options[i].value;
          }
        }
        return val;
      },
      hasOption : function (select, op){
        for (var i = 0; i< select.length; i++ ){
          if (select.options[i].value == op.value)
            return true;
        }
        return false;
      },

      moveSelected : function (srcSelect, destSelect){
        var i, op;
        for (i = 0; i < srcSelect.length; i++){
          if (srcSelect.options[i].selected){
            op = srcSelect.options[i];
            if (!bg.select.hasOption(destSelect, op)){
              destSelect.options[destSelect.length]= new Option(op.text, op.value);
            }
          }
        }
        bg.select.removeSelected(srcSelect);
        bg.select.clearStatus(srcSelect);
      },

      clearStatus : function (select){
        for (var i=0; i<select.options.length; i++)
          select.options[i].selected = false;
      },
      selectAll : function(select){
        for (var i=0; i<select.options.length; i++)
          select.options[i].selected = true;
        return select.options.length>0;
      },
      removeSelected : function (select){
        var options = select.options, i;
        for (i = options.length-1; i >= 0; i--){
          if (options[i].selected){
            options[i] = null;
          }
        }
      },
      /**
       * 设定选择框中的选择项(单项)
       */
      setSelected : function (select,idSeq){
        if(idSeq.indexOf(',')!=0){
          idSeq=","+idSeq;
        }
        if(idSeq.lastIndexOf(',')!=idSeq.length-1){
          idSeq=idSeq+",";
        }
        for(var i=0;i<select.options.length;i++){
          if(idSeq.indexOf(','+select.options[i].value+',')!=-1)
            select.options[i].selected=true;
        }
      }
    }
  });

  // Cookie----------------------------------------------------------------------------------------
  beangle.extend({
    cookie:{
      get : function (cookieName) {
        var cookieString = document.cookie , start = cookieString.indexOf(cookieName + '='), end;
        // 加上等号的原因是避免在某些 Cookie 的值里有
        // 与 cookieName 一样的字符串。
        if (start == -1) // 找不到
          return null;
        start += cookieName.length + 1;
        end = cookieString.indexOf(';', start);
        if (end == -1) return unescape(cookieString.substring(start));
        return unescape(cookieString.substring(start, end));
      },
      set : function (name, value, path){
        if(null==path)
          path="/";
        var expires=new Date();
        expires.setTime(expires.getTime()+(86400*30));
        document.cookie=name+"="+value+"; expires="+expires.toGMTString()+"; path="+path;
      }
    }
  });

  // Page---------------------------------------------------------------------
  function Page(action,target,pageNo,pageSize,total){
    this.formid = "form_" + bg.randomInt();
    this.actionurl=action;
    this.target=target;
    this.paramMap={};
    this.params = function(){ return this.paramMap;}

    this.pageInfo = function(pageNo,pageSize,total){
      this.pageNo=pageNo;
      this.pageSize=pageSize;
      this.total=total;
      if(null!=total && null!=pageSize && null!=pageNo){
        quotient=Math.floor(total/pageSize);
        this.maxPageNo = (0 == total%pageSize) ? quotient : (quotient + 1);
        this.startNo=(pageNo-1)*pageSize+1;
        this.endNo=(this.startNo+pageSize-1)<=total?(this.startNo+pageSize-1):total;
      }else{
        this.maxPageNo=1;
      }
    }

    this.pageInfo(pageNo,pageSize,total);

    this.action=function(actionurl){
      this.actionurl=actionurl;
      return this;
    }
    this.orderBy=function(newstring){
      this.orderby=newstring;
      return this;
    }
    this.target=function(givenTarget,elemId){
      if(givenTarget){
        this.target=givenTarget;
      }else if(elemId){
        this.target=bg.findTarget(document.getElementById(elemId));
      }
      return this;
    }

    this.getForm = function(){
      myForm=document.getElementById(this.formid);
      if(null==myForm){
        myForm=document.createElement("form");
        myForm.setAttribute("id",this.formid);
        myForm.setAttribute("action",this.actionurl);
        myForm.setAttribute("method","POST");
        if(document.getElementById(this.target)){
          document.getElementById(this.target).appendChild(myForm);
        }else{
          document.body.appendChild(myForm);
        }
      }
      return myForm;
    }
    this.addParams = function(paramSeq){
      bg.assert.notNull(paramSeq,"paramSeq for addHiddens must not be null");
      this.paramstr=paramSeq;
      var paramArray = paramSeq.split("&"), i, name, value;
      for(i=0;i<paramArray.length;i++){
        oneParam=paramArray[i];
        if(oneParam!=""){
          name = oneParam.substr(0,oneParam.indexOf("="));
          value = oneParam.substr(oneParam.indexOf("=")+1);
          this.paramMap[name]=decodeURIComponent(value);
        }
      }
      return this;
    }
    // 检查分页参数
    this.checkPageParams = function (pageNo, pageSize,orderBy){
      if(null!=pageNo){
        if(!/^[1-9]\d*$/.test(pageNo)){
          bg.alert(bg.i18n('page.no.is')+pageNo+bg.i18n('not.a.integer'));
          return false;
        }
        if(this.maxPageNo!=null){
          if(pageNo>this.maxPageNo){
            pageNo=this.maxPageNo;
          }
        }
        this.paramMap['pageNo']=pageNo;
      }
      if(null!=pageSize){
        if(!/^[1-9]\d*$/.test(pageSize)){
          bg.alert(bg.i18n('page.size.is')+pageSize+bg.i18n('not.a.integer'));
          return false;
        }
        this.paramMap["pageSize"]=pageSize;
      }
      if(null!=orderBy && orderBy!="null"){
        this.paramMap["orderBy"]=orderBy;
      }
      return true;
    }
    this.goPage = function (pageNo,pageSize,orderBy){
      var myForm=this.getForm(), key, value;
      if(this.checkPageParams(pageNo,pageSize,orderBy)){
        for(key in this.paramMap){
          value=this.paramMap[key];
          if(value!="")  bg.form.addInput(myForm,key,value,"hidden");
        }
        if(this.target && document.getElementById(this.target)){
          bg.form.submit(this.formid,this.actionurl,this.target);
        }else{
          myForm.submit();
        }
      }
    }
  }

  bg.extend({
    page:function (action,target){return new Page(action,target);}
  });

  bg.onReturn = function(event, action) {
    if (!event) {
      event = window.event;
    }
    if (event && event.keyCode && event.keyCode == 13) {
      action();
    }
  };

  beangle.getInternetExplorerVersion = function() {
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat( RegExp.$1 );
    }
    return rv;
  };

  beangle.ready(beangle.iframe.adaptSelf);
  if(beangle.ajaxhistory) {
    beangle.history.init();
  }
})(window);

// fix jquery ready bug
(function(){
  var jqReady = jQuery.prototype.ready;
  jQuery.prototype.ready = function( fn ) {
    return jqReady(function(){
      try{
        fn();
      }catch(e){
        alert(e);
      }
    });
  }
})();

/**
 * Beangle, Agile Java/Scala Development Scaffold and Toolkit
 *
 * Copyright (c) 2005-2013, Beangle Software.
 *
 * Beangle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Beangle is distributed in the hope that it will be useful.
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Beangle.  If not, see <http://www.gnu.org/licenses/>.
 */
/*----------------------------------------------
 * Beangle UI
 * include ToolBar,Grid,EntityAction
 */
(function( bg, undefined ) {
  bg.alert=function(msg){
    alert(msg);
  }
  bg.uitheme="default"

  function NamedFunction(name,func,objectCount){
    this.name=name;
    this.func=func;
    this.objectCount=(null==objectCount)?'ge0':objectCount;
  }
  /**
   * 生成一个工具栏
   * @param divId 工具栏对应的div
   * @param title  工具栏的标题
   * @param imageName  工具栏顶头的图片名称
   */
  function ToolBar(divId,title,imageName){
    this.itemCount=0;
    this.bar=document.getElementById(divId);
    if(null==this.bar){
      //bg.alert("cannot find div with id " + divId);
      return;
    }
    this.bar.innerHTML="";
    this.id=divId;
    this.separator="&nbsp;";
    this.bar.className="toolbar notprint";
    var imageRoot=beangle.getContextPath()+"/static/themes/"+ bg.uitheme +"/icons/",
      imagePath=imageRoot + "16x16/actions/";

    this.setTitle=function(newTitle,imageName){
      if(!newTitle) return;
      if(imageName==null)imageName="action-info";
      this.title_div.innerHTML=genIconElement(null,imageName) + '<strong>'+newTitle+"</strong>";
    }
    this.setSeparator=function(separator){
      this.separator=separator;
    }
    /**
     * 设置抬头
     */
    this.init = function (title,imageName){
      var title_div = document.createElement('div'), msg_div, items_div;
      title_div.className="toolbar-title";
      this.bar.appendChild(title_div);
      this.title_div=title_div;
      this.setTitle(title,imageName);
      items_div = document.createElement('div');
      items_div.className="toolbar-items";
      items_div.id=this.id+"_items";
      this.items_div=items_div;
      this.bar.appendChild(items_div);
      msg_div = document.createElement('div');
      msg_div.className="toolbar-msg";
      msg_div.style.display="none";
      msg_div.id=this.id+"_msg";
      this.bar.appendChild(msg_div);
    }
    this.init(title,imageName);

    this.addHr=function(){
      hrdiv=this.appendDiv(null,"toolbar-line");
      hrdiv.innerHTML='<img height="1" width="100%" align="top" src="' + imagePath + 'keyline.png" />';
    }

    function genIconElement(action,cssClassOrIconPath){
      var cssClass ="action-default";
      if(null != cssClassOrIconPath){
        if(cssClassOrIconPath.indexOf('.')>-1){
          if(cssClassOrIconPath.charAt(0)!='/'){
            cssClassOrIconPath=imagePath+cssClassOrIconPath;
          }
          return '<img class="toolbar-img" src="'+cssClassOrIconPath+'"/>';
        }
        else cssClass=cssClassOrIconPath;
      }
      if(null==cssClassOrIconPath && null != action){
        if(typeof action == "object") action = action.name;
        if(typeof action=="string"){
          if(action.indexOf("add")==0 || action.indexOf("batchAdd")==0 ||action.indexOf("new")==0) cssClass= "action-new";
          else if(action.indexOf("remove")==0||action.indexOf("delete")==0) cssClass="action-edit-delete";
          else if(action.indexOf("update")==0||action.indexOf("edit")==0||action.indexOf("batchEdit")==0) cssClass= "action-update";
          else if(action.indexOf("export")==0) cssClass="action-excel";
          else if(action.indexOf("copy")==0) cssClass="action-edit-copy";
          else if(action.indexOf("print")==0) cssClass= "action-print";
          else if(action.indexOf("refresh")==0) cssClass="action-refresh";
          else if(action.indexOf("close")==0) cssClass="action-close";
          else if(action.indexOf("save")==0) cssClass= "action-save";
          else if(action.indexOf("download")==0) cssClass="action-download";
        }
      }
      return '<span class="toolbar-icon ' + cssClass + '" ></span>';
    }
    /**
     * 设置按钮的动作
     */
    function setAction(item,action){
      if(null==action){
        bg.alert("action should not be null");
        return;
      }
      if(typeof action=='function'){
        item.onclick=action;
        return;
      }
      if(typeof action=='string'){
        if (action.indexOf('(')!=-1){
          item.onclick= function (){eval(action);}
        }
        else if(action.indexOf('.action')!=-1){
          item.onclick=function (){Go(action)}
        }else{
          bg.alert("unsuported action description:"+action);
        }
      }
      if(typeof action=='object'){
        item.onclick=action.func;
        return;
      }
    }

    this.addBack = function (title){
      if(null==title){
        this.addItem(bg.i18n("back"),function (){history.back(-1)},'action-backward');
      }else{
        this.addItem(title,function (){history.back(-1)},'action-backward');
      }
    }
    this.addHelp = function (module){
      this.addItem(bg.i18n("help"),function (){
        if(null==module) bg.alert(bg.i18n("under.construction"));
        else window.open("help.action?helpId="+module);
        },'action-help-contents');
    }

    this.addPrint = function (msg){
      if(null==msg) this.addItem(bg.i18n("print"),"print()");
      else this.addItem(msg,"print()");
    }

    this.addClose = function (msg){
      if(''==msg|| null==msg)  msg=bg.i18n("close");
      this.addItem(msg,"window.close()",'action-close');
    }
    /**
     * 添加按钮
     */
    this.addItem = function(title,action,imageName,alt,objectCount,id,display){
      this.addSeparatorAsNeed();
      var item_div = document.createElement('div');
      item_div.innerHTML=genIconElement(action,imageName)+title;
      item_div.onmouseout=MouseOutItem;
      item_div.onmouseover=MouseOverItem;
      setAction(item_div,action);
      if(!objectCount) { if(typeof action=='object'){objectCount=action.objectCount;}}
      if(!objectCount) objectCount='ge0';
      item_div.className=("toolbar-item toolbar-item-"+objectCount) + ((objectCount!='ge0')?" toolbar-item-disabled":"");
      item_div.title=(alt==null?title:alt);
      if (id) {
          item_div.id = id;
      }
      if (display) {
          item_div.style.display = display;
      }
      this.items_div.appendChild(item_div);
      this.itemCount++;
      return item_div;
    }
    this.addDiv=function(className){
      var newDiv = document.createElement('div');
      if(className)newDiv.className=className;
      this.items_div.appendChild(newDiv);
      return newDiv;
    }
    this.appendDiv=function(id,className){
      var newDiv = document.createElement('div');
      if(id)newDiv.setAttribute("id",id);
      if(className)newDiv.className=className;
      document.getElementById(this.id).appendChild(newDiv);
      return newDiv;
    }
    /**
     * 添加分隔符
     *
     */
    this.addSeparator = function (){
      if(this.separator){
        this.addDiv("toolbar-separator").innerHTML=this.separator;
      }
    }

    this.addSeparatorAsNeed = function (){
      if(this.itemCount!=0){
        this.addSeparator();
      }
    }
    this.addBackOrClose = function (backCaption, closeCaption) {
      if (parent.location == self.location && (window.history.length <= 1 || window.history.length == null)) {
        this.addClose((null == closeCaption) ? bg.i18n("close") : closeCaption);
      } else {
        this.addBack((null == backCaption) ? bg.i18n("back") : backCaption);
      }
    }
    // 增加空白功能点
    this.addBlankItem = function () {
      this.addDiv("toolbar-group-separator").innerHTML="&nbsp;";
      this.itemCount++;
    }
    /**
     * 设置工具栏的消息区
     *
     */
    this.setMessage = function (msg){
      if (typeof msg == "undefined") return;
      document.getElementById(this.id+"_msg").innerHTML=msg;
    }

    /**
     * 在工具栏中添加一个菜单
     */
    this.addMenu = function(title,action,imageName,alt){
      this.addSeparatorAsNeed();
      var item_div = document.createElement('div');
      item_div.className="toolbar-item";
      var menuTableId=this.id+this.itemCount+"_menu";
      item_div.id=menuTableId;
      item_div.tabIndex = 0;
      item_div.title=alt||title;
      item_div.onmouseout=MouseOutItem;
      item_div.onmouseover=MouseOverItem;
      this.items_div.appendChild(item_div);
      if(action == null){
        item_div.innerHTML=genIconElement(null,imageName) + title + '&nbsp;'+ genIconElement(null,'action-downarrow');
        item_div.onclick=function (event){displayMenu(event);};
      }else{
        var span1 = document.createElement("span");
        span1.innerHTML=genIconElement(action,imageName)+title;
        setAction(span1,action);
        var span2 = document.createElement("span");
        span2.innerHTML=genIconElement(action,"action-downarrow");
        span2.onclick = function (event){displayMenu(event);};
        item_div.appendChild(span1);
        item_div.appendChild(span2);
      }
      item_div.onblur = function (event){hiddenMenu(event);};
      var menu = new Menu(menuTableId,item_div);
      this.itemCount++;
      return menu;
    }

    function hiddenMenu(event){
      var div=bg.event.getTarget(event);
      while(div && div.tagName.toLowerCase()!='div'){
        div=div.parentNode;
      }
      var menu=div.lastElementChild || div.lastChild;
      if(null==menu || menu.tagName.toLowerCase()!='table'){alert('menu is null then return and target is '+div);return;}
      if(menu.style.visibility!=""&&menu.style.visibility!="hidden"){
        for(var i = 0;i < menu.rows.length;i++){
          if(menu.rows[i].cells[0].className=='toolbar-menuitem-transfer'){
            return;
          }
        }
        menu.style.visibility="hidden";
      }
    }

    function displayMenu(event){
      var div=bg.event.getTarget(event);
      while(div && div.tagName.toLowerCase()!='div'){
        div=div.parentNode;
      }
      var menu=div.lastElementChild || div.lastChild;
      if(null==menu){alert('menu is null then return and target is '+div);return;}
      if(menu.style.visibility!=""&&menu.style.visibility!="hidden"){
        menu.style.visibility="hidden";
        div.className="toolbar-item-transfer";
      }else{
        menu.style.visibility="visible";
        div.className="toolbar-item-selected";
      }
    }
    /**
     * 生成一个菜单
     */
    function Menu(id,item_div){
      var table=document.createElement("table");
      table.className="toolbar-menu";
      table.id=id+"Table";
      var mytablebody = document.createElement("tbody");
      table.appendChild(mytablebody);
      if (jQuery("#" + id).find("span").length>0) {
        table.onclick = function (event){displayMenu(event);};
      }
      item_div.appendChild(table);
      this.table=table;
      /**
       * 在菜单中添加一个条目
       */
      this.addItem = function (title,action,imageName,alt){
        var itemTd = document.createElement('td');
        itemTd.innerHTML=genIconElement(action,imageName)+title;
        itemTd.onmouseout=MouseOutMenuItem;
        itemTd.onmouseover=MouseOverMenuItem;
        itemTd.title=alt||title;
        setAction(itemTd,action);
        itemTd.className="toolbar-menuitem";
        itemTd.width="100%";
        var tr = document.createElement('tr');
        tr.appendChild(itemTd);
        if(this.table.tBodies.length==0) this.table.appendChild(document.createElement("tbody"));
        this.table.tBodies[0].appendChild(tr);
      }
    }

    // /菜单条目的鼠标进入和离开事件响应方法
    function MouseOutMenuItem(e){
      var o=bg.event.getTarget(e);
      while (o && o.tagName.toLowerCase()!="td"){o=o.parentNode;}
      if(o)o.className="toolbar-menuitem";
    }

    function MouseOverMenuItem(e){
      var o=bg.event.getTarget(e);
      while (o && o.tagName.toLowerCase()!="td"){o=o.parentNode;}
      if(o)o.className="toolbar-menuitem-transfer";
    }
    /**
     * 当鼠标经过工具栏的按钮时
     *
     */
    function MouseOverItem(e){
      var o=bg.event.getTarget(e);
      while (o&&o.tagName.toLowerCase()!="div"){o=o.parentNode;}
      if(o) jQuery(o).removeClass("toolbar-item").addClass("toolbar-item-transfer");
    }
    /**
     * 当鼠标离开工具栏的按钮时
     */
    function MouseOutItem(e){
      var o=bg.event.getTarget(e);
      while (o&&o.tagName.toLowerCase()!="div"){o=o.parentNode;}
      if(o) jQuery(o).removeClass("toolbar-item-transfer").removeClass("toolbar-item-selected").addClass("toolbar-item");
    }
  }
  bg.extend({'ui.toolbar':function (divId,title,imageName){
    return new ToolBar(divId,title,imageName);
    }
  });

  bg.extend({'ui.gridbar':function(divIds,title){
    this.divIds=divIds;
    this.pageId=null;
    this.title=title;
    this.toolbars=[];
    for(var i=0;i<divIds.length;i++){
      this.toolbars[i]=bg.ui.toolbar(divIds[i],title);
      this.toolbars[i].setSeparator("");
      document.getElementById(divIds[i]).className="gridbar";
      document.getElementById(divIds[i]+"_items").className="gridbar-items";
    }
    this.pageId=function(givenId){
      this.pageId=givenId;
      return this;
    }
    this.addItem=function(title,action,imageName,alt){
      for(var i=0;i<this.toolbars.length;i++){
        this.toolbars[i].addItem(title,action,imageName,alt);
      }
    }
    this.addBack=function(title,action){
      for(var i=0;i<this.toolbars.length;i++){
        this.toolbars[i].addBack(title);
      }
    }
    this.addBackOrClose=function(){
      for(var i=0;i<this.toolbars.length;i++){
        this.toolbars[i].addBackOrClose();
      }
    }
    this.addBlankItem=function(title,action,imageName,alt){
      for(var i=0;i<this.toolbars.length;i++){
        this.toolbars[i].addBlankItem(title,action,imageName,alt);
      }
    }
    this.addPage=function(onePage,ranks,titles){
      this.myPage=onePage;
      for(var i=0;i<this.toolbars.length;i++){
        pageDiv=this.toolbars[i].appendDiv(divIds[i]+'_page',"girdbar-pgbar");
        bg.ui.pagebar(onePage,pageDiv,ranks,titles);
      }
      return this;
    }
    this.addEntityAction=function(entity,onePage){
      return new bg.entityaction(entity,onePage);
    }
    this.addPrint=function(msg){
      for(var i=0;i<this.toolbars.length;i++){
        this.toolbars[i].addPrint(msg);
      }
    }
    this.addMenu=function(title,action,imageName,alt){
      return new menus(title,action,imageName,alt,this.toolbars);
    }
    function menus(title,action,imageName,alt,bars){
      var menu = new Array();
      for(var i=0;i<bars.length;i++){
        menu[i] = bars[i].addMenu(title,action,imageName,alt);
      }
      this.addItem = function (title,action,imageName,alt){
        for(var i=0;i<menu.length;i++){
          menu[i].addItem(title,action,imageName,alt)
        }
      }
    }
  }});

  bg.extend({'ui.pagebar':function (onePage,pageDiv,ranks,titles){
    if(onePage.total==0) return;

    if(!ranks) ranks=[10,20,30,50,70,100,200,500,1000];
    else if(ranks.length==0) ranks=[onePage.pageSize];

    if(!titles) titles={first:'« First',previous:'‹ Previous',next:'Next ›',last:'Last »',no:'No:',size:'Size:',change:'Click me to change page size',pagesize:'Page Size'};
    var maxPageNo = onePage.maxPageNo;
    addAnchor=function(text,pageNumber){
      var pageHref=document.createElement('a');
      pageHref.setAttribute("href","javascript:void(0)");
      pageHref.innerHTML=text;
      pageHref.style.padding="0px 2px 0px 2px";
      pageDiv.appendChild(pageHref);
      jQuery(pageHref).click(function(){onePage.goPage(pageNumber)});
    }
    if(onePage.pageNo>1){
      addAnchor(titles['first'],1);
      addAnchor(titles['previous'],onePage.pageNo-1);
    }
    var labelspan=document.createElement('span');
    labelspan.innerHTML="<strong>" + onePage.startNo +"</strong> - <strong>"+ onePage.endNo + "</strong> of <strong>" + onePage.total + "</strong>";
    labelspan.style.padding="0px 2px 0px 2px";
    pageDiv.appendChild(labelspan);
    var numSpan=jQuery(labelspan)
    numSpan.attr('title',titles['change'])
    numSpan.mouseover(function (){this.className='pgbar-label'});
    numSpan.mouseout(function(){this.className=''});
    // 为了防止其他信息上下移动错误
    numSpan.click(function(){this.parentNode.style.marginTop="0px";this.nextSibling.style.display='';this.style.display='none'});

    var pagespan=document.createElement('span');
    pagespan.style.display="none";
    //add pagesize select
    if(ranks && (ranks.length>0)){
      var pageNoSelect=document.createElement('select');
      pageNoSelect.id=pageDiv.id+"_select";
      pagespan.appendChild(pageNoSelect);
      pageNoSelect.className="pgbar-selbox";
      pageNoSelect.title=titles['pagesize']||'Page Size';
      var selectIndex=0;
      for(var i=0;i<ranks.length;i++){
        if(ranks[i]==onePage.pageSize) selectIndex=i;
        pageNoSelect.options.add(new Option(titles['size']+ranks[i], ranks[i]));
      }
      pageNoSelect.selectedIndex = selectIndex;
    }

    //add pageno input
    var pageInput=document.createElement('input');
    pageInput.className="pgbar-input";
    pagespan.appendChild(pageInput);

    var pageInputLabel = document.createElement('label');
    pagespan.appendChild(pageInputLabel);

    jQuery(pageInputLabel).attr("for",pageDiv.id+"_input").text("/"+maxPageNo+" ").toggleClass("pgbar-input-label");

    var pageInputJ=jQuery(pageInput)
    pageInputJ.attr("value",onePage.pageNo);
    pageInputJ.attr("id",pageDiv.id+"_input");
    pageInputJ.attr('title',(onePage.startNo +" - " + onePage.endNo + " of " + onePage.total));
    pageInputJ.focus(function(){this.value=''});
    pageInputJ.blur(function(){if(!this.value) this.value= onePage.pageNo});

    //add go button
    var submitBtn = document.createElement('input');
    submitBtn.setAttribute("type",'button');
    submitBtn.setAttribute("name",'gogo');
    submitBtn.value="Go"
    submitBtn.className="pgbar-go";
    pagespan.appendChild(submitBtn);
    var changePage=function(){
      var pageNo=document.getElementById(pageDiv.id+'_input').value;var endIndex=pageNo.indexOf("/"+onePage.maxPageNo);
      if(-1!=endIndex){pageNo=pageNo.substring(0,endIndex)}
      onePage.goPage(pageNo,document.getElementById(pageDiv.id+'_select').value);
    }
    jQuery(submitBtn).click(function (){changePage()});

    pageDiv.appendChild(pagespan);
    jQuery(pagespan).keypress(function(event){
      if (!event) {event = window.event;}
      if (event && event.keyCode && event.keyCode == 13) {changePage();return false;}
    });

    if(onePage.pageNo<onePage.maxPageNo){
      addAnchor(titles['next'],onePage.pageNo+1);
      addAnchor(titles['last'],onePage.maxPageNo);
    }
  }
  });
  bg.extend({
    'ui.grid':{
      enableSingleRowSelect : false,
      enableDynaBar:false,
      enableSelectTip:true,
      // 鼠标经过和移出排序表格的表头时
      overSortTableHeader : function  (){
        this.style.color='';
        this.style.backgroundColor ='#f7f7f7';
      },
      outSortTableHeader : function (){
        this.style.borderColor='';
        this.style.color='';
        this.style.backgroundColor ='';
      },
      // 鼠标经过数据行的效果
      mouseOverGrid : function (){
        if((typeof this.className)=="undefined") return;
        var myclass=this.className;
        selectIndex=myclass.indexOf("griddata-selected");
        if(-1 != selectIndex) return;
        overIndex=myclass.indexOf("griddata-over");
        if(-1 == overIndex){
          this.className=myclass+" "+ "griddata-over"
        }else{
          this.className=myclass.substring(0,overIndex);
        }
      },
      setGridMessage : function (gridId,message){
        var msgDiv1=document.getElementById(gridId+'_bar1_msg');
        var msgDiv2=document.getElementById(gridId+'_bar2_msg');
        if(msgDiv1){
          msgDiv1.style.display=(message?"":"none");
          msgDiv1.innerHTML=(message?message:"");
        }
        if(msgDiv2){
          msgDiv2.style.display=(message?"":"none");
          msgDiv2.innerHTML=(message?message:"");
        }
      },
      toggleAll : function(event){
        var ele =  bg.event.getTarget(event);
        //find fired grid table
        var ownGridTable=ele;
        while(ownGridTable.tagName != null && ownGridTable.tagName.toLowerCase()!="table"){
          ownGridTable=ownGridTable.parentNode;
          if(null==ownGridTable) break;
        }
        var firstCell=ele.parentNode;

        if(null==ownGridTable) return;
        var selectedCount=0;
        jQuery("#"+ownGridTable.id + " .gridselect").each(function(){
          var inputs=jQuery(this).find("input");
          if(inputs.length==0)return;
          if(ele.checked){
            inputs.prop("checked",true);
            jQuery(this).parent("tr").addClass("griddata-selected");
            selectedCount++;
          }else{
            if(inputs.is(":checked")){
              inputs.prop("checked",false);
              jQuery(this).parent("tr").removeClass("griddata-selected");
            }
          }
        });
        bg.ui.grid.notifyGridbar(ownGridTable.id,selectedCount);
      },
      /**通知gridbar中的按钮,更新是否显示等状态*/
      notifyGridbar: function (gridId,selectedCount){
        //change toolbar item
        var changeToolbarItem=function(){
          if(selectedCount>=2) {
            if(jQuery(this).hasClass("toolbar-item-e1")) jQuery(this).addClass('toolbar-item-disabled');
            else jQuery(this).removeClass('toolbar-item-disabled');
          } else if(selectedCount==1) {
            if(jQuery(this).hasClass("toolbar-item-ge2"))  jQuery(this).addClass('toolbar-item-disabled');
            else jQuery(this).removeClass('toolbar-item-disabled');
          } else{
            if(jQuery(this).hasClass("toolbar-item-ge0"))  jQuery(this).removeClass('toolbar-item-disabled');
            else jQuery(this).addClass('toolbar-item-disabled');
          }
        };
        if(bg.ui.grid.enableDynaBar){
          jQuery('#'+gridId+'_bar1_items .toolbar-item').each(changeToolbarItem);
          jQuery('#'+gridId+'_bar2_items .toolbar-item').each(changeToolbarItem);
        }
        if(bg.ui.grid.enableSelectTip){
          if(selectedCount>1) bg.ui.grid.setGridMessage(gridId,bg.i18n('selected') + " <b>"+selectedCount+"</b> " + bg.i18n("item.amount.pl"));
          else  bg.ui.grid.setGridMessage(gridId,"");
        }
      },
      /**
       * 行选函数。单击行内的任一处，可以选定行头的checkbox或者radio 用法:onclick="toggleRow(event)"
       */
      toggleRow : function (event){
        var ele =  bg.event.getTarget(event);
        //find fired grid table
        var ownGridTable=ele;
        while(ownGridTable.tagName != null && ownGridTable.tagName.toLowerCase()!="table"){
          ownGridTable=ownGridTable.parentNode;
          if(null==ownGridTable) break;
        }
        var changed=true;
        var firstCell=null;
        var isFireOnBoxCell=false;
        if(null!=ele && ele.tagName.toLowerCase()=="td"){
          firstCell = ele.parentNode.firstChild;
          //find first cell
          while(firstCell.tagName == null || firstCell.tagName.toLowerCase()!="td"){
            firstCell=firstCell.nextSibling;
          }
          isFireOnBoxCell=(ele==firstCell);
          //shall we reserve other select
          // find box input
          ele=firstCell.firstChild;
          while(((typeof ele.tagName)=="undefined")||ele.tagName.toLowerCase()!="input"){
            ele=ele.nextSibling;
            if(ele==null)return;
          }
          ele.checked = !ele.checked;
        }else if((ele.type=="checkbox")||(ele.type=="radio")){
          firstCell=ele.parentNode;
          isFireOnBoxCell=true;
        }else{
          changed=false;
        }
        if(null==ele || null==firstCell || null==ownGridTable || !changed) return;

        // 改变选定行的颜色
        var row=firstCell.parentNode;
        if((typeof row.className)=="undefined") return;
        if(ele.checked) jQuery(row).removeClass("griddata-over").addClass("griddata-selected");
        else jQuery(row).removeClass("griddata-selected").addClass("griddata-over");

        var selectedCount=0;
        if(ele.type=="radio") {
          if(ele.checked)  selectedCount=1;
        }else{
          var isReserveOtherSelect = !bg.ui.grid.enableSingleRowSelect || isFireOnBoxCell || event.ctrlKey ;
          jQuery("#"+ownGridTable.id + " .gridselect").each(function(){
            if(jQuery(this).find("input").is(":checked")){
              if(firstCell != this && !isReserveOtherSelect){
                jQuery(this).find("input").prop("checked",false);
                jQuery(this).parent("tr").removeClass("griddata-selected");
              }else{
                selectedCount++;
              }
            }
          });
          if(!isReserveOtherSelect){
            jQuery("#"+ownGridTable.id + " .gridselect-top").each(function(){
              jQuery(this).find("input").prop("checked",false);
            });
          }
        }

        bg.ui.grid.notifyGridbar(ownGridTable.id,selectedCount);
        // 激发自定义事件
        if(typeof ele.onchange =="function") ele.onchange();
      },
      //列排序对应的onePage和选中的列
      sort : function (onePage,ele){
        if(null==onePage){
          bg.alert(bg.i18n("can.not.find.ordering.table"));return;
        }
        var orderByStr=null;
        if(ele.className=="gridhead-sortable"){
          if(typeof ele.asc!="undefined"){
            orderByStr=ele.asc;
          }
          else{
            orderByStr=ele.id+" asc";
          }
        }else if(ele.className=="gridhead-asc"){
          if(typeof ele.desc!="undefined"){
            orderByStr=ele.desc;
          }
          else{
            orderByStr=ele.id.replace(/\,/g," desc,")+" desc";
          }
        }else{
          orderByStr="";
        }
        onePage.goPage(1,null,orderByStr);
      },

      /**
       * 初始化排序表格<br/>
       * 此函数主要是向已经待排序表格的列头1)添加鼠标事件响应和显示效果. 2)负责将事件传递到用户定义的函数中.
       *
       * 凡是要排序的列,请注名排序单元格的id 和class. 其中id是排序要传递的字段,class为定值gridhead-kable.
       * 除此之外,用户(使用该方法的人)需要自定义一个钩子函数"sortBy(what)",以备调用.
       *
       * @param tableId 待排序表格的id
       * @param onePage 与表格对应的page对象
       */
      init : function (tableId,onePage){
        var table= document.getElementById(tableId), thead = table.tHead, tbody, orderBy, columnSort ,i ,j, head, row, cell, desc, asc, orignRowCls;
        if(!thead || thead.rows.length==0){
          //bg.alert("sortTable ["+tableId+"] without thead");
          return;
        }
        orderBy=onePage.orderby;
        columnSort = function(){// this is a td/th
          bg.ui.grid.sort(onePage,this);
        }
        for(j=0;j<thead.rows.length;j++){
          head=thead.rows[j];
          for(i=0;i<head.cells.length;i++){
            cell=head.cells[i];
            if(cell.className=="gridhead-sortable" && null!=cell.id){
              cell.onclick = columnSort;
              cell.onmouseover=bg.ui.grid.overSortTableHeader;
              cell.onmouseout=bg.ui.grid.outSortTableHeader;
              cell.title=bg.i18n("click.to.order.by1")+cell.innerHTML+bg.i18n("click.to.order.by2");
              desc=cell.id.replace(/\,/g," desc,")+" desc";
              if(typeof cell.desc !="undefined"){
                desc=cell.desc;
              }
              if(orderBy.indexOf(desc)!=-1){
                cell.className="gridhead-desc"
                  cell.innerHTML=cell.innerHTML+'<span class="gridhead-icon action-sort-desc"></span>'
                continue;
              }
              asc = cell.id+" asc";
              if(typeof cell.asc !="undefined"){
                asc = cell.asc;
              }
              if(orderBy==asc){
                cell.className="gridhead-asc"
                  cell.innerHTML=cell.innerHTML+'<span class="gridhead-icon action-sort-asc"></span>'
                continue;
              }
            }
          }
        }
        tbody=document.getElementById(tableId+"_data");
        if(!tbody)  return;
        for(j=0;j<tbody.rows.length;j++){
          row=tbody.rows[j];
          orignRowCls=row.className;
          if(orignRowCls){
            orignRowCls=" "+orignRowCls;
          }else{
            orignRowCls="";
          }
          if(j%2==1){
            row.className="griddata-odd" + orignRowCls;
          }else{
            row.className="griddata-even" + orignRowCls;
          }
          row.onclick = bg.ui.grid.toggleRow;
          row.onmouseover=bg.ui.grid.mouseOverGrid;
          row.onmouseout=bg.ui.grid.mouseOverGrid;
        }
      },
      fillEmpty : function (divId,pageSize,size,msg){
        var emptydiv=document.getElementById(divId), emptyCnt=pageSize-size, heightpx, emptyLabel;
        if(emptyCnt>7) emptyCnt=7;
        heightpx=emptyCnt*16;
        if(size==0){
          emptyLabel=document.createElement("div");
          emptyLabel.innerHTML=(msg||'No result matched your search.');
          emptyLabel.style.paddingTop=heightpx/2-16 +"px";
          emptydiv.appendChild(emptyLabel);
        }
        emptydiv.style.height=heightpx+"px";
      }
    }
  });

  // Action---------------------------------------------------------------------
  //this.action,this.paramstring,this.target
  function EntityAction(entity,onePage){
    this.entity=entity;
    this.page=onePage;
    this.formid="form_" + bg.randomInt();

    //record self for closure method
    var selfaction = this;

    function applyMethod(action,method){
      var last1=action.lastIndexOf("!"), lastDot=action.lastIndexOf("."), shortAction=action, sufix="";
      if(-1 == last1) last1 = lastDot;
      if(-1!=last1){
        shortAction=action.substring(0,last1);
      }
      if(-1!=lastDot){
        sufix=action.substring(lastDot);
      }
      return shortAction+"!"+method+sufix;
    }
    this.getForm=function (){
      return this.page.getForm();
    };
    this.addParam = function(name,value){
      bg.form.addInput(this.getForm(),name,value);
    }
    if(null!=this.page.target&&''!=this.page.target){
      var fm = this.getForm();
      if(null!=fm) fm.target=this.page.target;
    }

    this.beforeSubmmitId = function(method) {
      var ids = bg.input.getCheckBoxValues(entity+".id");
      if (ids == null || ids == "") {
        bg.alert(bg.i18n("no.item.selected"));
        return false;
      }
      var form=this.getForm();
      form.action = applyMethod(this.page.actionurl, method);
      if(this.page.paramstr){
        bg.form.addHiddens(form,this.page.paramstr);
        bg.form.addParamsInput(form,this.page.paramstr);
      }
      return true;
    }
    this.submitIdAction=function (method,multiId,confirmMsg,ajax){
      if (this.beforeSubmmitId(method)) {
        if(null!=confirmMsg && ''!=confirmMsg){
          if(!confirm(confirmMsg))return;
        }
        bg.form.submitId(this.getForm(),this.entity + ".id",multiId,null,null,ajax);
      }
    }
    this.remove=function(confirmMsg){
      confirmMsg=confirmMsg||bg.i18n('confirm.delete');
      return new NamedFunction('remove',function(){
        selfaction.submitIdAction('remove',true,confirmMsg);
      },bg.ui.grid.enableDynaBar?'ge1':'ge0');
    }
    this.add = function(){
      return new NamedFunction('add',function(){
        var form=selfaction.getForm();
        if(""!=selfaction.page.paramstr) bg.form.addHiddens(form,selfaction.page.paramstr);
        bg.form.addInput(form,selfaction.entity + '.id',"");
        if(""!=selfaction.page.paramstr) bg.form.addParamsInput(form,selfaction.page.paramstr);
        bg.form.submit(form,applyMethod(selfaction.page.actionurl,"edit"));
      });
    }

    this.info = function(){
      return new NamedFunction('info',function(){
        selfaction.submitIdAction('info',false)
      },bg.ui.grid.enableDynaBar?'e1':'ge0');
    }

    this.edit = function (){
      return new NamedFunction('edit',function(){
        selfaction.submitIdAction('edit',false);
      },bg.ui.grid.enableDynaBar?'e1':'ge0');
    }

    this.single = function(methodName,confirmMsg,extparams){
      return new NamedFunction(methodName,function(){
        var form=selfaction.getForm();
        if(null!=extparams) bg.form.addHiddens(form,extparams);
        selfaction.submitIdAction(methodName,false,confirmMsg);
      },bg.ui.grid.enableDynaBar?'e1':'ge0');
    }

    this.multi = function(methodName,confirmMsg,extparams,ajax){
      return new NamedFunction(methodName,function(){
        try {
          var form = selfaction.getForm();
          if(null!=extparams) bg.form.addHiddens(form, extparams);
          selfaction.submitIdAction(methodName, true, confirmMsg,ajax);
        }catch(e){
          bg.alert(e)
        }
      },bg.ui.grid.enableDynaBar?'ge1':'ge0');
    }
    this.method=function(methodName,confirmMsg,extparams,ajax){
      return  new NamedFunction(methodName,function(){
        var form=selfaction.getForm();
        if(null!=confirmMsg && ''!=confirmMsg){
          if(!confirm(confirmMsg))return;
        }
        if(null!=extparams){
          bg.form.addHiddens(form,extparams);
        }
        if(""!=selfaction.page.paramstr){
          bg.form.addHiddens(form,selfaction.page.paramstr);
          bg.form.addParamsInput(form,selfaction.page.paramstr);
        }
        bg.form.submit(form,applyMethod(selfaction.page.actionurl ,methodName),null,null,ajax);
      });
    }

    this.exportData=function(properties,format,extparams){
      format = format || "xls";
      properties = properties||"";
      extparams = extparams||"";
      if(extparams.indexOf("&") != 0) extparams = "&" + extparams;
      extparams = "&format=" + format +"&properties=" + properties + extparams;
      return selfaction.method('export',null,extparams,false);
    }
  }

  bg.extend({entityaction:EntityAction});

  bg.extend({'ui.module':{
    moduleClick:function (moudleId){
      var id= document.getElementById(moudleId);
      if(id.className=="module collapsed"){
        id.className="module expanded";
      }else{
        id.className="module collapsed";
      }
    }
  }
  });

  bg.extend({'ui.load':
    function (module,callback){
      var base="/static";
      if(bg.getContextPath().length>1)
        base = bg.getContextPath() + base;
      if(module=="validity"){
        jQuery.struts2_jquery.requireCss("/themes/" + bg.uitheme + "/jquery.validity.css",base);
        jQuery.struts2_jquery.require("/scripts/plugins/jquery-validity.js",null,base);
        if(window.$BG_LANG) {
          if(window.$BG_LANG != 'en' && window.$BG_LANG != 'en_US') {
            jQuery.struts2_jquery.require("/scripts/i18n/zh_CN/jquery.validity.js",callback,base);
          }
        } else {
          jQuery.struts2_jquery.require("/scripts/i18n/zh_CN/jquery.validity.js",callback,base);
        }
      }else if(module=="tabletree"){
        jQuery.struts2_jquery.requireCss("/themes/" + bg.uitheme + "/beangle-ui-tabletree.css",base);
        jQuery.struts2_jquery.require("/scripts/beangle/beangle-ui-tabletree.js",callback,base);
      }else if(module=="colorbox"){
        jQuery.struts2_jquery.requireCss("/themes/" + bg.uitheme + "/colorbox.css",base);
        jQuery.struts2_jquery.require("/scripts/plugins/jquery-colorbox.min.js",callback,base);
      }else if(module=="jquery.pstrength"){
        jQuery.struts2_jquery.requireCss("/themes/" + bg.uitheme + "/jquery-pstrength.css",base);
        jQuery.struts2_jquery.require("/scripts/plugins/jquery-pstrength.js",callback,base);
        jQuery.struts2_jquery.require("/scripts/i18n/zh_CN/jquery-pstrength.js",callback,base);
      }
    }
  });
})(beangle);




}
).toString().slice(12, -2),"");