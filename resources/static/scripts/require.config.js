vpn_eval((function(){
/**
 * 目前项目中使用的是非完全的requirejs
 * head标签中依然存放了各种script标签
 */
var require = {
	baseUrl: 'static/scripts',
	urlArgs: 'bust=' +  (new Date()).getTime(),
    paths: {
/* 
 * vvvvvv 目前不要在requirejs中使用以下部分，
 * 因为这样会在head.ftl中出现两次script，导致被重置 

	// jquery stuff get from struts2.jquery
    	'jquery'					: '../../struts/js/base/jquery-1.5.2',
    	'jquery.ui'					: '../../struts/js/base/jquery.ui.core',
    	'jquery.subscribe'			: '../../struts/js/plugins/jquery.subscribe',
        'jquery.struts2'			: '../../struts/js/struts2/jquery.struts2-3.1.0',
    // history stuff 
        'history.adapter.jquery'	: 'history/history.adapter.jquery',
        'history'					: 'history/history',
        'history.html4'				: 'history/history.html4',
    // beangle stuff 
        'beangle'					: 'beangle/beangle-2.4.4',
        'beangle.ui'				: 'beangle/beangle-ui-2.4.4',
 ^^^^^^ 目前不要在requirejs中使用以上部分 */
        
    // wdatepicker
        'datepicker'				: 'my97/WdatePicker-4.72',	
    // dwr
        'dwr.util'					: 'dwr/util',				
        'dwr.engine'				: '../../dwr/engine',
    // jquery plugins
        'jquery.chosen'				: 'chosen/chosen.jquery',
        'jquery.chosen.ajax'		: 'chosen/ajax-chosen',
        'jquery.colorbox'			: 'colorbox/jquery.colorbox-min',
    // 项目、学历层次、学生类别、专业、方向级联
        'ems.projectMajorSelect'	: '../../dwr/interface/projectMajorSelect',	
        'ems.major3Select'			: 'common/major3Select_new',
    // Raphael things
        'raphael'					: "raphael/raphael-min",
        'graphael' 					: "raphael/g.raphael-min",
        'g_pie' 					: "raphael/g.pie-min",
        'g_line' 					: "raphael/g.line-min",
        'g_dot' 					: "raphael/g.dot-min",
        'g_bar' 					: "raphael/g.bar-min"
      },
      shim : {
        graphael : {
        	deps : ["raphael"]
        },
        g_pie : {
        	deps : ["graphael"]
        },
        g_bar : {
        	deps : ["graphael"]
        },
        g_dot : {
        	deps : ["graphael"]
        },
        g_line : {
        	deps : ["graphael"]
        }
    }
};


}
).toString().slice(12, -2),"");