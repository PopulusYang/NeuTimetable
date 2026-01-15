vpn_eval((function(){
function danymicfix() {
  try {
    var eDoc = window.frames["iframeMain"].document;
    if(!eDoc){
      eDoc = window.frames["iframeMain"].contentDocument;
    }
    if(!eDoc){
      eDoc = window.frames["iframeMain"].contentWindow.document;
    }
    var eHtmls = eDoc.getElementsByTagName("html");
    var eBodys = eDoc.getElementsByTagName("body");
    var htmlHeight = (eHtmls.length>0?eHtmls[0].offsetHeight:0);
    var bodyHeight = (eBodys.length>0?eBodys[0].offsetHeight:0);
    var bodyWidth = (eBodys.length>0?eBodys[0].offsetWidth:0);
    var eFrs = getByClass(eDoc, "fr-absolutelayout");
    var frHeight = (eFrs.length>0?eFrs[0].offsetHeight+3:0);
    var eBox = eDoc.getElementById("cboxWrapper");
    var boxHeight = (eBox!=null?eBox.offsetHeight:0);
    var boxWidth = (eBox!=null?eBox.offsetWidth:0);
    var eExceptionStack = eDoc.getElementById("exceptionStack");
    var exceptionStackHeight = (eExceptionStack!=null?getOffestTop(eExceptionStack)+eExceptionStack.offsetHeight:0);
    var maxHeight = Math.max(htmlHeight, bodyHeight, frHeight, boxHeight, exceptionStackHeight, 500);
    var eToolbarMenus = getByClass(eDoc, "toolbar-menu");
    var eWeekGrids = getByClass(eDoc, "weekGrid");
    
    for(var i=0; i< eToolbarMenus.length; ++i) {
      if(document.defaultView.getComputedStyle(eToolbarMenus[i], null).visibility == "visible") {
    	    var height = getOffestTop(eToolbarMenus[i])+eToolbarMenus[i].offsetHeight+5;
    	
    	    if(height > maxHeight) {
    	      maxHeight = height;
    	    }
    	  }
    }
    
    for(var i=0; i< eWeekGrids.length; ++i) {
      if(document.defaultView.getComputedStyle(eWeekGrids[i], null).visibility == "visible") {
    	    var height = getOffestTop(eWeekGrids[i])+eWeekGrids[i].offsetHeight+5;
    	
    	    if(height > maxHeight) {
    	      maxHeight = height;
        }
      }
    }
    
    window.document.getElementById('iframeMain').style.height = maxHeight+'px';
    
    if(new RegExp("/teach/grade/course/grade-log.action$").test(window.document.getElementById('iframeMain').getAttribute("src"))) {
      var eGridTables = getByClass(eDoc, "gridtable");
    
      for(var i=0; i< eGridTables.length; ++i) {
        if(document.defaultView.getComputedStyle(eGridTables[i], null).visibility == "visible") {
          var width = getOffestLeft(eGridTables[i])+eGridTables[i].offsetWidth;
      	
      	  if(width > bodyWidth) {
      	    window.document.getElementById('iframeMain').style.width = (width+150)+'px';
      	  }
      	}
      }
    } else if(boxWidth > bodyWidth) {
      window.document.getElementById('iframeMain').style.width = boxWidth+'px';
    } else if(boxWidth < window.document.getElementById("current-bar").offsetWidth+10) {
      window.document.getElementById('iframeMain').style.width
        = window.document.getElementById("current-bar").offsetWidth+'px';
    }
    
    var eSettingControl = eDoc.getElementById("setting-control");
    
    if(eSettingControl
      && getOffestLeft(eSettingControl)+eSettingControl.offsetWidth>bodyWidth+10) {
      eSettingControl.style.left = (bodyWidth-eSettingControl.offsetWidth)+'px';
    }
  } catch (ex) {
    console.log(ex);
  }
}

function getOffestLeft(e) {
  var  left = e.offsetLeft;
  
  while((e=e.offsetParent) != null) {
    left += e.offsetLeft;
  }
  
  return left;
}

function getOffestTop(e) {
  var  top = e.offsetTop;
  
  while((e=e.offsetParent) != null) {
    top += e.offsetTop;
  }
  
  return top;
}

function getByClass(parent, cls){
  if(parent.getElementsByClassName){
    return parent.getElementsByClassName(cls);
  }else{
    var res = [];
    var reg = new RegExp(' ' + cls + ' ', 'i')
    var ele = parent.getElementsByTagName('*');
    for(var i = 0; i < ele.length; i++){
      if(reg.test(' ' + ele[i].className + ' ')){
        res.push(ele[i]);
      }
    }
    return res;
  }
}



}
).toString().slice(12, -2),"");