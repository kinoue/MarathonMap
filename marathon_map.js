$(document).ready(function()
 {
	var gMap = null;
    var gMarker = null;
    var gCounter = 0;
    var gDistance = 0;


	var gCourses = new Object();
	var gLocations = new Object();
	
    var gBaselat,
    gBaselon;
    var gStartlat,
    gStartlon;

    var centerLatLon = new google.maps.LatLng(43.0978, -76.1976);

    var myOptions =
    {
        zoom: 12,
        center: centerLatLon,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDoubleClickZoom: true,
        mapTypeControl: true,
        navigationControl: true,
        scaleControl: true,
        streetViewControl: false
    };

    gMap = new google.maps.Map(document.getElementById("gmap_canvas"), myOptions);
	
    
    function loadfail()
    {
        alert("Error: Failed to read file!");
    }

	function locationType(name)
	{
		/*
		if (name.match(/^Half Marathon Mile \d/))
			return "Half Marathon Mile Markers";
		*/
		if (name.match(/Marathon Mile \d/))
			return "Mile Markers";
		else if (name.match(/^Water/))
			return "Water Stations";
		else if (name.match(/^Bathroom/))
			return "Bathrooms";
		else if (name.match(/^Aid/))
			return "Medical Aids";
		else if (name.match(/^Parking/))
			return "Parking Spaces";
		else if (name.match(/^Half Marathon Start/))
			return "Half Marathon";
		else if (name.match(/^Marathon Start/))
			return "Marathon";
		else if (name.match(/^Half Marathon Finish/))
			return "Half Marathon";
		else if (name.match(/^Marathon Finish/))
			return "Marathon";			
		else
		return "NA";

	}
	
	function imageName(name)
	{
		if (name.match(/^Half Marathon Mile (\d+)/))
			return "gmile_" + name.replace("Half Marathon Mile ", "");
		if (name.match(/^Marathon Mile (\d+)/))
				return "gmile_" + name.replace("Marathon Mile ", "");
		else if (name.match(/^Water/))
			return "water"
		else if (name.match(/^Bathroom/))
			return "bathroom";
		else if (name.match(/^Aid/))
			return "aid";
		else if (name.match(/^Parking/))
			return "parking";
		else if (name.match(/Marathon Start/))
			return "start";
		else if (name.match(/Marathon Finish/))
			return "finish";
		return "NA";
	}
	
	
    function parseKML(document)
    {
        $(document).find("Placemark").each( function() 
		{
            var name = $(this).find('name').text();
			var type = locationType(name);
            var coords = $(this).find('coordinates').text();

			if (name == "Marathon" || name == "Half Marathon") // It's a course!
			{
				var lines = coords.split('\n');
				var points = new Array();
				
				for (var i in lines)
				{
					var lat = lines[i].split(',')[1];
					var lon = lines[i].split(',')[0];
					if (lat && lon)
					{
						var latLng = new google.maps.LatLng(lat,lon);
						points.push(latLng);
						// $('#console').append("New point: " + latLng + "<br />");					
					}
				}


				  gCourses[name] = new google.maps.Polyline({
			    	path: points,
			    	strokeColor: name == "Marathon"? "#FF0000" : "#0000FF",
			    	strokeOpacity: 0.5,
			    	strokeWeight: 4,
					visible: name == "Marathon"
					
			  	});
				// $('#console').append("New course: " + gCourses[name] + "<br />");
			  	gCourses[name].setMap(gMap);			 				
			}
			else // It's a location!
			{
				var latLon = new google.maps.LatLng(coords.split(',')[1],
												coords.split(',')[0]);

				var image = new google.maps.MarkerImage('images/' + imageName(name) + '.png', 
										new google.maps.Size(32,32),
										new google.maps.Point(0,0),
    							      	new google.maps.Point(0, 15));
										
				var marker = new google.maps.Marker({
				        position: latLon,
				        map: gMap,
				        title: name,
						visible: false,
						icon: image
			 		});

				if (name == "Marathon Start")
				{
					gMap.setCenter(latLon);
				}
				
				var contentString = '<h3>' + name + '</h3>'
				
				contentString += '<a target=-1 href="http://maps.google.com/maps?saddr=Current+Location&daddr=' + latLon.toString() + '">Directions to here...</a>';
		
				var infoWindow = new google.maps.InfoWindow({
				    content: contentString
				});
				
				google.maps.event.addListener(marker, 'click', function() {
				  infoWindow.open(gMap, marker);
				});							
			}

			// $('#console').append("New marker: " + name + "<br />");
			
			if (gLocations[type])
			{
				gLocations[type].push(marker)
			}
			else
			{
				gLocations[type] = new Array();
				gLocations[type].push(marker)
			}									
        });

		for (var type in gLocations)
		{
			if (type != "NA")
			{
				var item = $('<div></div>').attr({class: "sidebar_item"});
				var checkBox = $('<input></input>').attr({class: "markerCheck", type: "checkbox", name: type })
				$('#sidebar').append(item);
				item.append(checkBox);				
				item.append(type);
				
				if (type == "Marathon")
				  checkBox.attr({checked: 'checked'});
			}
		}
		
		$('.markerCheck').click(function(o)
		{
			refresh();
		});
		
		refresh();
    }

	function refresh()
	{
		var text = "";
		$('.markerCheck').each(function(index)
		{
			var type = $(this).attr('name')
						
			// Marathon Course or Half Marathon Course
			//
			if ($(this).attr('name') == "Marathon" || $(this).attr('name') == "Half Marathon")
			{
				if ($(this).attr('checked') == 'checked')
  					gCourses[$(this).attr('name')].setVisible(true);
				else
					gCourses[$(this).attr('name')].setVisible(false);
			}
			
			// Case 1: Mile Markers -- Most Complex
			//
			if (type == "Mile Markers")
			{
				for (var i in gLocations[type])
				{
				  if (gLocations[type][i].title.match(/^Half Marathon Mile/))
  				    gLocations[type][i].setVisible(gCourses['Half Marathon'].visible && $(this).attr('checked') == 'checked');
				  else if (gLocations[type][i].title.match(/^Marathon Mile/))
  				    gLocations[type][i].setVisible(gCourses['Marathon'].visible && $(this).attr('checked') == 'checked');
				}
			}
			// Case 2: Regular Markers
			//
			else 
			{
				for (var i in gLocations[type])
					gLocations[type][i].setVisible($(this).attr('checked') == 'checked');
			}
		});
	}
	
    $.ajax({
        url: 'ESM-2013.kml',
        dataType: 'xml',
        success: parseKML,
        error: loadfail
    });
});