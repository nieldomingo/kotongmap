var KOTONGMAP = {baseurl: 'http://kotongmap.appspot.com/'}; // global object to hold all global objects


KOTONGMAP.generateSeconds = function () {
	var d = new Date();
    var seconds = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    
    return seconds;
};


KOTONGMAP.initialize = function () {
    var latlng = new google.maps.LatLng(14.586408,120.979214);
    var myOptions = {
      zoom: 15,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
    };
    KOTONGMAP.map = new google.maps.Map(document.getElementById("map_canvas"),
        myOptions);
        
    //KOTONGMAP.georsslayer = new google.maps.KmlLayer(KOTONGMAP.baseurl + 'incidents/');
    
    KOTONGMAP.georsslayer = new google.maps.KmlLayer(KOTONGMAP.baseurl + 'incidents/?s=' + KOTONGMAP.generateSeconds());
    
    // necessary to center the map to the georss layer
    //google.maps.event.addListenerOnce(KOTONGMAP.georsslayer, "defaultviewport_changed", function () {
    //	var bnd = KOTONGMAP.georsslayer.getDefaultViewport();
    //	KOTONGMAP.map.fitBounds(bnd);
    //});
    
	KOTONGMAP.georsslayer.setMap(KOTONGMAP.map);
	
	//setInterval(function () {
	//	if (KOTONGMAP.mode == 'view') {
	//		var gl = new google.maps.KmlLayer(KOTONGMAP.baseurl + 'incidents/?s=' + KOTONGMAP.generateSeconds(), {preserveViewport: true});
	//		gl.setMap(KOTONGMAP.map);
	//		KOTONGMAP.georsslayer.setMap(null);
	//		KOTONGMAP.georsslayer = gl;
	//	}
	//}, 60000);

  };
  
KOTONGMAP.infowindowaddhandler = function (event) {
	$("#addkotongpoint").click(function () {
		$("#addkotongdialog textarea[name='descrption']").val('');
		$("#addkotongdialog input[name='incidentdate']").val('');
		Recaptcha.reload();
		KOTONGMAP.adddialog.dialog('open');
	});
};
  
KOTONGMAP.editclickhandler = function (event) {
	if (KOTONGMAP.editmarker) {
		KOTONGMAP.editmarker.setMap(null);
		KOTONGMAP.editmarker = null;
	}
	KOTONGMAP.editmarker = new google.maps.Marker({
		position: event.latLng,
		map: KOTONGMAP.map
		});
	
	var infowindow = new google.maps.InfoWindow({
		content: '<a href="javascript: void(0);" id="addkotongpoint">Add Kotong Incident</a>',
	});
	
	google.maps.event.addListener(infowindow, 'domready', KOTONGMAP.infowindowaddhandler);
	
	infowindow.open(KOTONGMAP.map, KOTONGMAP.editmarker);
};
  
$(window).load(function() {
	KOTONGMAP.initialize(); // initialize map
		
	// event handler for the mode switcher display behaviour
	$("#modeswitcher li").click( function () {
		if (!$(this).hasClass('selected')) {
			$(this).siblings().removeClass('selected');
			$(this).addClass('selected');
		}
	});
	
	KOTONGMAP.mode = 'view';
	
	KOTONGMAP.messagebox = $("#message").dialog({ autoOpen: false,
		modal: true,
		buttons: {
			'Ok': function () {
				$(this).dialog("close");
			}
		} 
	});
	
	// initialize add dialog box
	KOTONGMAP.adddialog = $("#addkotongdialog").dialog({ autoOpen: false,
		modal: true,
		width: 450,
		buttons: {
			'Save': function () {
				var desc = $("#addkotongdialog textarea[name='descrption']").val();
				var dt = $("#addkotongdialog input[name='incidentdate']").val();
				var pos = KOTONGMAP.editmarker.getPosition();
				var challenge = Recaptcha.get_challenge();
				var response = Recaptcha.get_response();
				
				var that = this;
				
				$.post("/incidents/",
						{'description': desc, 'date': dt, lat: pos.lat(), lon: pos.lng(), challenge: challenge, response: response},
						function (data) {
							if (data['result'] == 'saved') {
								$(that).dialog("close");
								KOTONGMAP.mode = 'view';
								if (KOTONGMAP.editclicklistener) {
									google.maps.event.removeListener(KOTONGMAP.editclicklistener);
									KOTONGMAP.editclicklistener = null;
									KOTONGMAP.editmarker.setMap(null);
									KOTONGMAP.editmarker = null;
								}
								$("#viewmode").parent().siblings().removeClass('selected');
								$("#viewmode").parent().addClass('selected');
								
								KOTONGMAP.georsslayer = new google.maps.KmlLayer(KOTONGMAP.baseurl + 'incidents/?s=' + KOTONGMAP.generateSeconds(), {preserveViewport: true});
								KOTONGMAP.georsslayer.setMap(KOTONGMAP.map);
							}
							else {
								Recaptcha.reload();
								$("#messagecontent").html(data['message']);
								KOTONGMAP.messagebox.dialog("open");
							}
						}, 'json');
			},
			'Cancel': function () {
				$(this).dialog("close");
			}
		}
	});
		
	// initialize datepicker
	$("input[name='incidentdate']").datepicker();
	
	$("#viewmode").click( function () {
		if (KOTONGMAP.mode !== 'view') {
			KOTONGMAP.mode = 'view';
			if (KOTONGMAP.editclicklistener) {
				google.maps.event.removeListener(KOTONGMAP.editclicklistener);
				KOTONGMAP.editclicklistener = null;
			}
			if (KOTONGMAP.editmarker) {
				KOTONGMAP.editmarker.setMap(null);
				KOTONGMAP.editmarker = null;
			}
			KOTONGMAP.georsslayer = new google.maps.KmlLayer(KOTONGMAP.baseurl + 'incidents/?s=' + KOTONGMAP.generateSeconds(), {preserveViewport: true});
			KOTONGMAP.georsslayer.setMap(KOTONGMAP.map);
		}
	});
	
	$("#addmode").click( function () {
		if (KOTONGMAP.mode != 'add') {
			KOTONGMAP.mode = 'add';
			KOTONGMAP.georsslayer.setMap(null);
			KOTONGMAP.georsslayer = null;
			KOTONGMAP.editclicklistener = google.maps.event.addListener(KOTONGMAP.map, 'click', KOTONGMAP.editclickhandler);
		}
	});
		
});