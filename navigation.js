// Enhanced Navigation with High-Accuracy Location Detection
const config = {
  mapStyles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ],
  locationOptions: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
};

// Global variables
let map;
let route;
let userMarker;
let accuracyCircle;
let currentLocationMarker;
let watchPositionId;
let currentStepIndex = 0;
let voiceEnabled = true;
let voiceSynth = window.speechSynthesis;
let googleMapsReady = false;
let routeDataAvailable = false;
let geolocationRetries = 0;
const MAX_RETRIES = 3;

// Helper function to validate coordinates
function isValidCoordinate(coord) {
  return coord !== null && coord !== undefined && !isNaN(coord) && 
         Math.abs(coord) <= 90;
}

// Improved GPS status updates
function updateGpsStatus(message, statusClass) {
  const gpsStatus = document.getElementById('gps-status');
  if (!gpsStatus) return;
  
  gpsStatus.textContent = `GPS: ${message}`;
  gpsStatus.className = statusClass || '';
}

// Enhanced error handling
function handleGeolocationError(error) {
  console.error('Geolocation error:', error);
  
  let errorMessage = "Could not determine your location";
  let errorType = 'error';
  
  if (error.code === error.PERMISSION_DENIED) {
    errorMessage = "Location access denied. Please enable permissions in your browser settings.";
    errorType = 'permission-denied';
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    errorMessage = "Location unavailable. Check your GPS/WiFi connection.";
  } else if (error.code === error.TIMEOUT) {
    errorMessage = "Location detection timed out. Please try again in an open area.";
  } else if (error.message === 'GEOLOCATION_NOT_SUPPORTED') {
    errorMessage = "Geolocation is not supported by your browser.";
  } else if (error.message === 'INVALID_COORDINATES') {
    errorMessage = "Invalid location data received.";
  }
  
  updateGpsStatus(errorMessage, errorType);
}

// Improved address lookup
async function getAddressFromCoords(latLng) {
  try {
    const geocoder = new google.maps.Geocoder();
    const results = await new Promise((resolve) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        resolve(status === 'OK' ? results : null);
      });
    });
    
    if (results && results.length > 0) {
      const streetAddress = results.find(r => 
        r.types.includes('street_address') || 
        r.types.includes('route')
      );
      return streetAddress?.formatted_address || results[0].formatted_address;
    }
    return null;
  } catch (e) {
    console.warn("Geocoding failed:", e);
    return null;
  }
}

// Improved map update function
function updateLocationOnMap(latLng, accuracy) {
  if (!map) return;

  if (currentLocationMarker) {
    currentLocationMarker.setMap(null);
  }
  
  currentLocationMarker = new google.maps.Marker({
    position: latLng,
    map: map,
    title: 'Your Precise Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: 'white'
    },
    zIndex: 1000
  });

  if (!accuracyCircle) {
    accuracyCircle = new google.maps.Circle({
      map: map,
      fillColor: '#4285F4',
      fillOpacity: 0.2,
      strokeColor: '#4285F4',
      strokeOpacity: 0.4,
      strokeWeight: 1
    });
  }
  
  accuracyCircle.setCenter(latLng);
  accuracyCircle.setRadius(accuracy);
  
  map.panTo(latLng);
  if (accuracy < 100) {
    map.setZoom(17);
  } else {
    map.setZoom(15);
  }
}

// Improved current location function
async function getCurrentLocation(forceRefresh = false) {
  const btn = document.getElementById('currentLocationBtn');
  const fromInput = document.getElementById('from');
  
  if (!btn || !fromInput) return;

  // UI Feedback
  btn.classList.add('loading');
  btn.disabled = true;
  fromInput.disabled = true;
  updateGpsStatus("Detecting your precise location...", 'detecting');

  try {
    if (!navigator.geolocation) {
      throw new Error('GEOLOCATION_NOT_SUPPORTED');
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          if (error.code === error.TIMEOUT && geolocationRetries < MAX_RETRIES) {
            geolocationRetries++;
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { ...config.locationOptions, enableHighAccuracy: false }
            );
          } else {
            reject(error);
          }
        },
        forceRefresh ? 
          { ...config.locationOptions, maximumAge: 0 } : 
          config.locationOptions
      );
    });

    geolocationRetries = 0;
    const coords = position.coords;
    
    if (!isValidCoordinate(coords.latitude) || !isValidCoordinate(coords.longitude)) {
      throw new Error('INVALID_COORDINATES');
    }

    const latLng = {
      lat: coords.latitude,
      lng: coords.longitude
    };

    const address = await getAddressFromCoords(latLng);
    fromInput.value = address || `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;

    updateLocationOnMap(latLng, coords.accuracy);
    updateGpsStatus(`Location accurate to ${Math.round(coords.accuracy)}m`, 'connected');

  } catch (error) {
    handleGeolocationError(error);
    if (fromInput) {
      fromInput.placeholder = "Enter location manually";
      fromInput.focus();
    }
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    fromInput.disabled = false;
  }
}

function drawRoute() {
  const routePath = [];
  route.legs[0].steps.forEach(step => {
    routePath.push(...step.path.map(p => new google.maps.LatLng(p.lat, p.lng)));
  });

  new google.maps.Polyline({
    path: routePath,
    geodesic: true,
    strokeOpacity: 0.8,
    strokeWeight: 6,
    strokeColor: '#2e7d32',
    map: map
  });
}

function refreshLocation() {
  startTracking();
  updateGpsStatus("Refreshing...", 'detecting');
}

function startTracking() {
  if (watchPositionId) {
    navigator.geolocation.clearWatch(watchPositionId);
  }

  if (userMarker) userMarker.setMap(null);
  if (accuracyCircle) accuracyCircle.setMap(null);

  userMarker = new google.maps.Marker({
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeWeight: 3,
      strokeColor: 'white'
    },
    zIndex: 1000
  });

  accuracyCircle = new google.maps.Circle({
    map: map,
    fillColor: '#4285F4',
    fillOpacity: 0.2,
    strokeColor: '#4285F4',
    strokeOpacity: 0.4,
    strokeWeight: 1
  });

  if (navigator.geolocation) {
    updateGpsStatus("Acquiring location...", 'detecting');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updatePosition(position);
        watchPositionId = navigator.geolocation.watchPosition(
          updatePosition,
          handleGeolocationError,
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
          }
        );
      },
      handleGeolocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );
  } else {
    document.getElementById('currentStep').textContent = "Geolocation not supported";
  }
}

function updatePosition(position) {
  updateGpsStatus(`GPS: ${Math.round(position.coords.accuracy)}m accuracy`, 'connected');
  
  const pos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  userMarker.setPosition(pos);
  accuracyCircle.setCenter(pos);
  accuracyCircle.setRadius(position.coords.accuracy);

  map.setCenter(pos);
  updateNavigation(pos);
}
function loadGoogleMapsScript() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=_mapInitCallback`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

window.onload = loadGoogleMapsScript;


function findClosestStep(position, steps) {
  let closestIndex = currentStepIndex;
  let minDistance = Infinity;

  for (let i = Math.max(0, currentStepIndex - 2); 
       i < Math.min(steps.length, currentStepIndex + 3); 
       i++) {
    const stepPath = steps[i].path || [];
    for (const point of stepPath) {
      const pointLatLng = new google.maps.LatLng(point.lat, point.lng);
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        position,
        pointLatLng
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
  }
  return { index: closestIndex, distance: minDistance };
}

function speakInstruction(text) {
  if (!voiceSynth || !voiceEnabled) return;
  
  const cleanText = text.replace(/<[^>]*>/g, '');
  voiceSynth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  voiceSynth.speak(utterance);
}

function updateNavigation(userPos) {
  const steps = route.legs[0].steps;
  const closestStep = findClosestStep(userPos, steps);

  const progress = Math.min(100, Math.round((closestStep.index / steps.length) * 100));
  document.getElementById('progressBar').style.width = `${progress}%`;

  if (closestStep.index >= 0 && closestStep.index < steps.length) {
    document.getElementById('currentStep').innerHTML = steps[closestStep.index].instructions;
    document.getElementById('currentDistance').textContent = 
      `${steps[closestStep.index].distance.text} • ${steps[closestStep.index].duration.text}`;

    if (closestStep.index + 1 < steps.length) {
      document.getElementById('nextStep').innerHTML = steps[closestStep.index + 1].instructions;
    } else {
      document.getElementById('nextStep').textContent = "You will arrive at your destination";
    }

    if (closestStep.index !== currentStepIndex) {
      currentStepIndex = closestStep.index;
      if (voiceEnabled && voiceSynth) {
        speakInstruction(steps[currentStepIndex].instructions);
      }
    }
  }

  checkDestinationReached(userPos, route.legs[0].end_location);
}

function checkDestinationReached(userPos, destination) {
  const destLatLng = new google.maps.LatLng(destination.lat, destination.lng);
  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    userPos,
    destLatLng
  );

  if (distance < 20) {
    if (voiceEnabled && voiceSynth) {
      speakInstruction("You have reached your destination");
    }
    document.getElementById('currentStep').textContent = "You have reached your destination";
    document.getElementById('nextStep').textContent = "";
    document.getElementById('progressBar').style.width = '100%';

    setTimeout(endNavigation, 5000);
  }
}

function endNavigation() {
  if (watchPositionId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchPositionId);
  }
  if (voiceSynth) {
    voiceSynth.cancel();
  }
  window.close();
}

function initializeMapAndNavigation() {
  if (!route || !route.legs || route.legs.length === 0) {
    console.error('Invalid route data');
    return;
  }

  map.setCenter(route.legs[0].start_location);
  drawRoute();
  startTracking();
  
  document.getElementById('endBtn').addEventListener('click', endNavigation);
  document.getElementById('refreshLocation').addEventListener('click', refreshLocation);
  document.getElementById('voiceToggle').addEventListener('change', function() {
    voiceEnabled = this.checked;
  });
}

// Initialize when Google Maps API is loaded
function initMap() {
  googleMapsReady = true;
  
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: { lat: 0, lng: 0 },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: config.mapStyles
  });
  
  const currentLocationBtn = document.getElementById('currentLocationBtn');
  if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', () => {
      getCurrentLocation(true);
    });
  }
  
  if (routeDataAvailable) {
    initializeMapAndNavigation();
  }
}

// Initialize the navigation
function initNavigation() {
  const urlParams = new URLSearchParams(window.location.search);
  const routeData = urlParams.get('route');
  
  if (!routeData) {
    console.error('No route data provided');
    document.getElementById('currentStep').textContent = "Error: No route data provided";
    return;
  }

  try {
    route = JSON.parse(decodeURIComponent(routeData));
    routeDataAvailable = true;
    
    if (googleMapsReady) {
      initializeMapAndNavigation();
    }
  } catch (e) {
    console.error('Error parsing route data:', e);
    document.getElementById('currentStep').textContent = "Error: Invalid route data";
  }
}

// Start the navigation when the page loads
window.onload = function() {
  if (voiceSynth) {
    voiceSynth.onvoiceschanged = function() {
      console.log("Available voices:", voiceSynth.getVoices());
    };
  }
  
  initNavigation();
};

// Google Maps API callback
window._mapInitCallback = function() {
  if (window.google?.maps) {
    initMap();
  } else {
    updateGpsStatus("Google Maps failed to load", 'error');
  }
};
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sosBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Simulated alert (Replace this with a real backend POST request)
        alert(`🚨 SOS Alert Sent!\nYour location: ${lat}, ${lng}\nNearest police station will be alerted.`);

        // Example fetch to your backend (optional)
        /*
        fetch("/api/sos-alert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ latitude: lat, longitude: lng })
        })
        .then(res => res.json())
        .then(data => console.log("Alert sent:", data))
        .catch(err => console.error("Failed to send SOS:", err));
        */
      }, () => {
        alert("Unable to get your location.");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  });
});
