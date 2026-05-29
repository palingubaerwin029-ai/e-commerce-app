import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function LeafletMap({
  latitude,
  longitude,
  markerTitle = 'Location',
  markerDescription = '',
  courierLatitude,
  courierLongitude,
  courierTitle = 'Courier',
  onPress,
  style
}) {
  // Gracefully sanitize coordinates to handle null/undefined/NaN
  const safeLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 14.5916;
  const safeLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 120.9734;

  const hasCourier = 
    typeof courierLatitude === 'number' && 
    typeof courierLongitude === 'number' && 
    !isNaN(courierLatitude) && 
    !isNaN(courierLongitude);

  // Define leaflet map html with inline SVG pins and sleek popups
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          background-color: #f5f5f7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        /* Custom Premium Popup Styles */
        .leaflet-popup-content-wrapper {
          background: #1e1e1e;
          color: #ffffff;
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .leaflet-popup-content {
          margin: 12px;
          font-size: 13px;
          line-height: 1.4;
        }
        .leaflet-popup-content b {
          color: #F44336; /* Tint color matching brand */
          font-size: 14px;
          display: block;
          margin-bottom: 2px;
        }
        .leaflet-popup-tip {
          background: #1e1e1e;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${safeLat}, ${safeLng}], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        // SVG string for destination marker (SwiftCart Coral-Red)
        var destSvg = '<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.625C11.8934 20.625 9.375 18.1066 9.375 15C9.375 11.8934 11.8934 9.375 15 9.375C18.1066 9.375 20.625 11.8934 20.625 15C20.625 18.1066 18.1066 20.625 15 20.625Z" fill="#F44336"/></svg>';

        // SVG string for courier/rider marker (Electric Blue)
        var courierSvg = '<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.625C11.8934 20.625 9.375 18.1066 9.375 15C9.375 11.8934 11.8934 9.375 15 9.375C18.1066 9.375 20.625 11.8934 20.625 15C20.625 18.1066 18.1066 20.625 15 20.625Z" fill="#2196F3"/></svg>';

        var destIcon = L.divIcon({
          html: destSvg,
          className: 'custom-marker',
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [0, -36]
        });

        var courierIcon = L.divIcon({
          html: courierSvg,
          className: 'custom-marker',
          iconSize: [30, 42],
          iconAnchor: [15, 42],
          popupAnchor: [0, -36]
        });

        // Destination Marker
        var destMarker = L.marker([${safeLat}, ${safeLng}], { icon: destIcon }).addTo(map);
        
        // Safely escape title and description using JSON stringification
        var title = ${JSON.stringify(markerTitle || '')};
        var desc = ${JSON.stringify(markerDescription || '')};
        if (title) {
          destMarker.bindPopup("<b>" + title + "</b>" + (desc ? "<br>" + desc : "")).openPopup();
        }

        var pathLine;
        var courierMarker;
        ${hasCourier ? `
          // Courier Marker
          courierMarker = L.marker([${courierLatitude}, ${courierLongitude}], { icon: courierIcon }).addTo(map);
          
          var courierTitle = ${JSON.stringify(courierTitle || 'Courier')};
          courierMarker.bindPopup("<b>" + courierTitle + "</b>").openPopup();

          // Fit bounds to show both markers
          var group = new L.featureGroup([destMarker, courierMarker]);
          map.fitBounds(group.getBounds().pad(0.15));

          // Draw dashed polyline route path
          var latlngs = [
            [${courierLatitude}, ${courierLongitude}],
            [${safeLat}, ${safeLng}]
          ];
          pathLine = L.polyline(latlngs, {
            color: '#F44336',
            weight: 4,
            dashArray: '5, 8'
          }).addTo(map);
        ` : ''}

        ${onPress ? `
          map.on('click', function(e) {
            destMarker.setLatLng(e.latlng);
            if (pathLine) {
              pathLine.setLatLngs([
                courierMarker ? courierMarker.getLatLng() : e.latlng,
                e.latlng
              ]);
            }
            
            // Post message to React Native WebView
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              }));
            }
          });
        ` : ''}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        onMessage={(event) => {
          if (onPress) {
            try {
              const coords = JSON.parse(event.nativeEvent.data);
              onPress(coords);
            } catch (err) {
              console.error('Leaflet message error:', err);
            }
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f5f5f7',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  }
});
