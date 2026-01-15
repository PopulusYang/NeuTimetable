/* 
Simple JQuery menu.
HTML structure to use:

Notes: 

Each menu MUST have a class 'menu' set. If the menu doesn't have this, the JS won't make it dynamic
If you want a panel to be expanded at page load, give the containing LI element the classname 'expand'.
Use this to set the right state in your page (generation) code.

Optional extra classnames for the UL element that holds an accordion:

noaccordion : no accordion functionality
collapsible : menu works like an accordion but can be fully collapsed

<ul class="menu [optional class] [optional class]">
<li><a href="#">Sub menu heading</a>
<ul>
<li><a href="http://site.com/">Link</a></li>
<li><a href="http://site.com/">Link</a></li>
<li><a href="http://site.com/">Link</a></li>
...
...
</ul>
// This item is open at page load time
<li class="expand"><a href="#">Sub menu heading</a>
<ul>
<li><a href="http://site.com/">Link</a></li>
<li><a href="http://site.com/">Link</a></li>
<li><a href="http://site.com/">Link</a></li>
...
...
</ul>
...
...
</ul>

Copyright 2007-2010 by Marco van Hylckama Vlieg

web: http://www.i-marco.nl/weblog/
email: marco@i-marco.nl

Free to use any way you like.
*/

		



jQuery.fn.initMenu = function() {  
    return this.each(function(){
        var theMenu = $(this).get(0);
        $('.acitem', this).hide();
        $('li.expand > .acitem', this).show();
        var liobj = $('li.expand > .acitem', this).prev();
        liobj.addClass('active');
        //liobj.html("∨" + liobj.html().substring(4));
        
        var angleleft = liobj.find('.fa-angle-left')
        angleleft.removeClass('fa-angle-left');
        angleleft.addClass('fa-angle-down');
        
        $('li a', this).click(
            function(e) {
                e.stopImmediatePropagation();
                var theElement = $(this).next();
                var parent = this.parentNode.parentNode;
				//alert(parent);
                if($(parent).hasClass('noaccordion')) {
                    if(theElement[0] === undefined) {
                        window.location.href = this.href;
                    }
                    $(theElement).slideToggle('normal', function() {
                        if ($(this).is(':visible')) {
                            $(this).prev().addClass('active');
							
                        }
                        else {
                            $(this).prev().removeClass('active');
                        }    
                    });
                    return false;
                }
                else {
                    if(theElement.hasClass('acitem') && theElement.is(':visible')) {
                        if($(parent).hasClass('collapsible') || $(parent).hasClass('scroll_box')) {
                            $('.acitem:visible', parent).first().slideUp('normal', 
                            function() {
                            	var liobj = $(this).prev();
                            	liobj.removeClass('active');
                                //liobj.html("&gt;" + liobj.html().substring(1));
                                var angleleft = liobj.find('.fa-angle-down')
                                angleleft.removeClass('fa-angle-down');
                                angleleft.addClass('fa-angle-left');
								//alert('1');
                            }
							
                        );
                        return false;  
                    }
                    return false;
                }
                if(theElement.hasClass('acitem') && !theElement.is(':visible')) {         
                    $('.acitem:visible', parent).first().slideUp('normal', function() {
                    	var liobj = $(this).prev();
                    	liobj.removeClass('active');
                        //liobj.html("&gt;" + liobj.html().substring(1));
                        var angleleft = liobj.find('.fa-angle-down')
                        angleleft.removeClass('fa-angle-down');
                        angleleft.addClass('fa-angle-left');
						//alert('1');
                    });
                    theElement.slideDown('normal', function() {
                    	var liobj = $(this).prev();
                    	liobj.addClass('active');
                    	//liobj.html("∨" + liobj.html().substring(4));
                        var angleleft = liobj.find('.fa-angle-left')
                        angleleft.removeClass('fa-angle-left');
                        angleleft.addClass('fa-angle-down');
                    });
                    return false;
                }
            }
        }
    );
});
};

 $(document).ready(function() {
						   
						   
					
						  $('.menu').initMenu();
			
});






