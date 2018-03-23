/**
 * Created by Ryan Berg on 5/17/15.
 * rberg2@hotmail.com
 */



//TODO: show loader on gpsButton clicked

var map;

var initialLocation = new google.maps.LatLng(47.609351, -122.325263);//Seattle
var browserSupportFlag =  false;

var userMarker;
var userMarkerIdentifier = 'User Location';
var lastOpenInfoWindow;

var isInfoWindowOpen = false;
var pinningLocation = false;

var businessMarkersArray = [];

var businessCirclePath ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'red',
    fillOpacity: .4,
    scale: 7,
    strokeColor: 'black',
    strokeWeight: 1
};

var userCirclePath ={
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: 'white',
    fillOpacity:.8,
    scale: 5.5,
    strokeColor: 'black',
    strokeWeight: 1
};

function addMarkerToMap(businessObject)
{
    var phoneNumberString = '';

    if(businessObject.phoneNumber)
    {
        var minPhoneNumber = businessObject.phoneNumber.replace(/[() ]*/g, '');
        phoneNumberString = '<br><a href="tel:+1'+minPhoneNumber+'">'+businessObject.phoneNumber+ '</a>';
    }

    var infowindow = new google.maps.InfoWindow({
        content: '<!DOCTYPE html><html><head lang="en"> <meta charset="UTF-8"></head><body><h4>'+
        businessObject.name+'</h4><p>'+businessObject.address.street+'<br>'+businessObject.address.city+
        ', '+businessObject.address.state+phoneNumberString+'</p><button class="btn btn-warning" id="check-wifi" style="outline: none">check wifi</button><a target="_blank" href="http://google.com/maps/dir/' +
        initialLocation.lat() + ',' + initialLocation.lng() + '/' + businessObject.address.fullAddress+
        '"><button class="btn btn-primary">get directions</button></a><a target="_blank" style="display: block; padding-top: 4px" href="http://yelp.com/biz/'+
        businessObject._id+'">More info on Yelp</a>'
    });

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(businessObject.latitude, businessObject.longitude),
        map: map,
        title: businessObject.name,
        icon: businessCirclePath
    });

    google.maps.event.addListener(marker, 'click', function()
    {
        if(lastOpenInfoWindow)
        {
            lastOpenInfoWindow.close();
        }
        infowindow.open(map, marker);
        isInfoWindowOpen = true;
        lastOpenInfoWindow = infowindow;

        google.maps.event.addListener(infowindow,'domready',function()
        {
            var wifiButton = document.getElementById("check-wifi");
            var wifiCheckWasClicked = false;



            $(wifiButton).on("click", function()
            {
                if(!wifiCheckWasClicked)
                {
                    wifiCheckWasClicked = true;

                    wifiButton.innerHTML = '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> checking';

                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", 'http://ryan-berg.com:10000/wifi_check?business_id='+businessObject._id, true);
                    xhr.onload = function ()
                    {
                        if (xhr.readyState === 4)
                        {
                            if (xhr.status === 200)
                            {
                                wifiButton.innerHTML = xhr.responseText;
                                wifiButton.className = 'btn btn-success';
                            }
                            else
                            {
                                console.error(xhr.statusText);
                            }
                        }
                    };
                    xhr.onerror = function ()
                    {
                        console.error(xhr.statusText);
                    };
                    xhr.send(null);
                }
            });
        });
    });

    businessMarkersArray.push(marker);
}

function setAllMap(map)
{
    for (var i = 0; i < businessMarkersArray.length; i++) {
        businessMarkersArray[i].setMap(map);
    }
}

function callWifiAPI(latitude, longitude, map)
{
    setAllMap(null);

    var wifiAPIString = 'http://ryan-berg.com:10000/search?latitude='+latitude+'&longitude='+longitude+'&radius=3';

    //console.log(wifiAPIString);

    $.get(wifiAPIString, function(data)
    {
        if(data)
        {
            for(var i = 0; i < data.length; i++)
            {
                addMarkerToMap(data[i]);
            }
        }
    });
}

function initialize()
{
    var myOptions = {
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true
    };

    map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);

    google.maps.event.addListener(map, 'click', function(event)
    {
        if(pinningLocation)
        {
            //initialLocation = event.latLng;
            pinningLocation = false;
            map.setOptions({draggableCursor: 'url(https://maps.google.com/mapfiles/openhand.cur), move'});
            map.panTo(event.latLng);
            callWifiAPI(event.latLng.lat(), event.latLng.lng());
            setUserMarker(event.latLng.lat(), event.latLng.lng())
        }
        if(lastOpenInfoWindow)
        {
            lastOpenInfoWindow.close();
            isInfoWindowOpen = false;
        }
    });


    var pinButton = document.getElementById('pinButton');
    var gpsButton = document.getElementById('gpsButton');


    $(pinButton).on("click", function()
    {
        pinningLocation = true;
        map.setOptions({draggableCursor: 'crosshair'});
        if(lastOpenInfoWindow)
        {
            lastOpenInfoWindow.close();
            isInfoWindowOpen = false;
        }
    });
    $(gpsButton).on("click", function()
    {
        geoLocate();
    });

    var input = /** @type {HTMLInputElement} */(
        document.getElementById('pac-input'));

    if(input)
    {
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);

        autocomplete.setTypes(['geocode'], ['address']);

        google.maps.event.addListener(autocomplete, 'place_changed', function ()
        {
            if (lastOpenInfoWindow) {
                lastOpenInfoWindow.close();
                isInfoWindowOpen = false;
            }

            var placesArray = autocomplete.getPlace();
            console.log(placesArray);

            processSearchBoxResults(placesArray);
        });
    }

    initMap(input);
}

function initMap(searchBox)
{
    document.getElementById("outer").style.visibility = 'hidden';
    document.getElementById("map-canvas").style.visibility = 'visible';
    document.getElementById('gpsButton').style.visibility = 'visible';
    pinButton.style.visibility = 'visible';
    if(searchBox)
    {
        searchBox.style.visibility = 'visible';
    }

    newLocation();
}

function newLocation()
{
    map.setCenter(initialLocation);

    setUserMarker(initialLocation.lat(), initialLocation.lng());

    callWifiAPI(initialLocation.lat(), initialLocation.lng(), map);
}

function processSearchBoxResults(placesArray)
{
    var latitude = placesArray.geometry.location.lat();
    var longitude = placesArray.geometry.location.lng();

    console.log(latitude + ', ' + longitude);

    map.panTo({lat:latitude, lng:longitude});
    callWifiAPI(latitude, longitude, map);
    userMarker.setPosition(new google.maps.LatLng(latitude, longitude));
}



function setUserMarker(lat, long)
{
    if(userMarker)
    {
        userMarker.setMap(null);
    }
    var infowindow = new google.maps.InfoWindow;
    infowindow.setContent('<h4>'+userMarkerIdentifier+'</h4>');

    userMarker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        map: map,
        title: 'User Location',
        icon: userCirclePath
    });

    google.maps.event.addListener(userMarker, 'click', function()
    {
        if(lastOpenInfoWindow)
        {
            lastOpenInfoWindow.close();
        }
        isInfoWindowOpen = true;
        lastOpenInfoWindow = infowindow;

        infowindow.open(map, userMarker);
    });
}



function geoLocate()
{
    // Try W3C Geolocation (Preferred)
    if(navigator.geolocation) {

        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position)
        {
            initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            newLocation(map);

        }, function()
        {
            document.getElementById("outer").style.visibility = 'hidden';
            //handleNoGeolocation(browserSupportFlag);
        });
    }
    else //Browser doesn't support Geolocation
    {
        browserSupportFlag = false;
        alert('Browser doesn\'t support Geolocation');
        //handleNoGeolocation(browserSupportFlag);
    }
}



google.maps.event.addDomListener(window, 'load', initialize);