import pandas as pd
import json

# ================== CONFIGURATION ==================
CSV_FILE = 'syria_data.csv'
GEOJSON_FILE = 'syria_governorates.geojson'
OUTPUT_FILE = 'syria_choropleth.html'

# ================== DATA LOADING ==================
df = pd.read_csv(CSV_FILE, sep=';')
value_dict = dict(zip(df['Governorate'], df['Value']))

non_zero_values = df[df['Value'] > 0]['Value']
vmin = non_zero_values.min() if len(non_zero_values) > 0 else 1
vmax = non_zero_values.max() if len(non_zero_values) > 0 else 100

with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)

for feature in geojson_data['features']:
    name = feature['properties']['shapeName']
    val = value_dict.get(name, 0)
    feature['properties']['value'] = val
    feature['properties']['status'] = 'not_available' if val == 0 else 'active'

geojson_str = json.dumps(geojson_data)

# ================== HTML TEMPLATE ==================
html_content = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        html, body {{
            width: 100%;
            height: 100%;
            background: transparent !important;
            overflow: hidden;
        }}
        #map {{
            width: 100%;
            height: 100%;
            background: transparent !important;
        }}
        .leaflet-container {{
            background: transparent !important;
        }}
        .leaflet-control-container,
        .leaflet-control-attribution,
        .leaflet-control-zoom {{
            display: none !important;
        }}
        
        .city-marker {{
            width: 10px;
            height: 10px;
            background: #a78bfa;
            border: 2px solid rgba(255,255,255,0.9);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(167, 139, 250, 0.7);
            transition: all 0.3s ease;
        }}
        .city-label {{
            color: rgba(220, 210, 240, 0.95);
            font-size: 11px;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            font-weight: 500;
            text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5);
            white-space: nowrap;
            pointer-events: none;
        }}
        
        .map-legend {{
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 20px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            z-index: 1000;
            background: rgba(20,20,35,0.7);
            backdrop-filter: blur(8px);
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid rgba(139,111,192,0.2);
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .legend-dot {{
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }}
        .legend-dot.active {{ 
            background: linear-gradient(135deg, #8b5fbf, #6a1b9a); 
            box-shadow: 0 0 6px rgba(139,95,191,0.5);
        }}
        .legend-dot.inactive {{ 
            background: #e8e0f0; 
            border: 1px solid rgba(139,111,192,0.3);
        }}
    </style>
</head>
<body>
    <div id="map"></div>
    
    <div class="map-legend">
        <div class="legend-item">
            <div class="legend-dot active"></div>
            <span>نشط</span>
        </div>
        <div class="legend-item">
            <div class="legend-dot inactive"></div>
            <span>قريباً</span>
        </div>
    </div>

    <script>
        var selectedGovernorate = null;
        var hoveredLayer = null;
        var geojsonLayer = null;
        
        var map = L.map('map', {{
            center: [35.0, 38.0],
            zoom: 6.5,
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: false,
            doubleClickZoom: false,
            attributionControl: false,
            touchZoom: false
        }});

        var geojsonData = {geojson_str};
        var vmin = {vmin};
        var vmax = {vmax};
        
        // Purple gradient color scale
        function getColor(value) {{
            if (value === 0) {{
                // Soft purple-gray for non-serviced areas
                return '#ede7f6';
            }}
            
            var normalized = Math.min(1, Math.max(0, (value - vmin) / (vmax - vmin)));
            
            // Purple gradient: light to dark
            var colors = [
                [209, 179, 232],  // #d1b3e8 - lightest active
                [179, 136, 212],  // #b388d4
                [149, 107, 191],  // #956bbf
                [119, 67, 168],   // #7743a8
                [89, 27, 145]     // #591b91 - darkest
            ];
            
            var idx = normalized * (colors.length - 1);
            var lower = Math.floor(idx);
            var upper = Math.min(colors.length - 1, Math.ceil(idx));
            var t = idx - lower;
            
            var r = Math.round(colors[lower][0] + t * (colors[upper][0] - colors[lower][0]));
            var g = Math.round(colors[lower][1] + t * (colors[upper][1] - colors[lower][1]));
            var b = Math.round(colors[lower][2] + t * (colors[upper][2] - colors[lower][2]));
            
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        }}
        
        function getDefaultStyle(feature) {{
            var value = feature.properties.value || 0;
            var isActive = value > 0;
            
            return {{
                fillColor: getColor(value),
                weight: isActive ? 1.5 : 1,
                opacity: isActive ? 0.8 : 0.5,
                color: isActive ? '#a78bfa' : '#c5b8d9',
                fillOpacity: isActive ? 0.85 : 0.6
            }};
        }}
        
        function getHoverStyle(feature) {{
            var value = feature.properties.value || 0;
            var isActive = value > 0;
            
            return {{
                weight: 3,
                color: '#ffffff',
                fillOpacity: 0.95,
                fillColor: isActive ? getColor(value) : '#e8e0f0'
            }};
        }}
        
        function getSelectedStyle(feature) {{
            var value = feature.properties.value || 0;
            var isActive = value > 0;
            
            return {{
                weight: 4,
                color: '#ffffff',
                fillOpacity: 1,
                fillColor: isActive ? getColor(value) : '#ddd5eb'
            }};
        }}
        
        function sendToParent(type, data) {{
            if (window.parent !== window) {{
                window.parent.postMessage({{ type: type, data: data }}, '*');
            }}
        }}
        
        function selectGovernorate(layer) {{
            // Reset previous selection
            if (selectedGovernorate && selectedGovernorate !== layer) {{
                geojsonLayer.resetStyle(selectedGovernorate);
            }}
            
            selectedGovernorate = layer;
            layer.setStyle(getSelectedStyle(layer.feature));
            layer.bringToFront();
            
            var props = layer.feature.properties;
            sendToParent('MAP_SELECT', {{
                governorate: props.shapeName,
                status: props.status,
                value: props.value
            }});
        }}
        
        function onMouseOver(e) {{
            var layer = e.target;
            hoveredLayer = layer;
            
            // Only apply hover style if not selected
            if (layer !== selectedGovernorate) {{
                layer.setStyle(getHoverStyle(layer.feature));
                layer.bringToFront();
            }}
            
            // Send hover event for preview (won't clear selection)
            var props = layer.feature.properties;
            sendToParent('MAP_HOVER', {{
                governorate: props.shapeName,
                status: props.status,
                value: props.value
            }});
        }}
        
        function onMouseOut(e) {{
            var layer = e.target;
            hoveredLayer = null;
            
            // Reset style only if not selected
            if (layer !== selectedGovernorate) {{
                geojsonLayer.resetStyle(layer);
            }}
            
            // Don't send HOVER_END - panel stays visible with last data
        }}
        
        function onClick(e) {{
            selectGovernorate(e.target);
        }}
        
        function onEachFeature(feature, layer) {{
            layer.on({{
                mouseover: onMouseOver,
                mouseout: onMouseOut,
                click: onClick
            }});
        }}
        
        geojsonLayer = L.geoJson(geojsonData, {{
            style: getDefaultStyle,
            onEachFeature: onEachFeature
        }}).addTo(map);
        
        // Fit bounds with padding for larger appearance
        map.fitBounds(geojsonLayer.getBounds(), {{
            padding: [5, 5],
            maxZoom: 7
        }});
        
        // City labels with optimized positions
        var cities = [
            {{name: 'حلب', lat: 36.35, lng: 37.16, offsetX: 40, offsetY: 18}},
            {{name: 'دمشق', lat: 33.45, lng: 36.29, offsetX: 40, offsetY: 22}},
            {{name: 'ريف دمشق', lat: 33.80, lng: 36.85, offsetX: 50, offsetY: 18}},
            {{name: 'حمص', lat: 34.85, lng: 36.72, offsetX: 35, offsetY: 18}},
            {{name: 'اللاذقية', lat: 35.65, lng: 35.79, offsetX: 45, offsetY: 18}},
            {{name: 'حماة', lat: 35.28, lng: 36.75, offsetX: 35, offsetY: 18}},
            {{name: 'الرقة', lat: 36.10, lng: 38.99, offsetX: 35, offsetY: 18}},
            {{name: 'دير الزور', lat: 35.48, lng: 40.30, offsetX: 45, offsetY: 18}},
            {{name: 'الحسكة', lat: 36.65, lng: 40.75, offsetX: 40, offsetY: 18}},
            {{name: 'درعا', lat: 32.50, lng: 36.10, offsetX: 35, offsetY: 22}},
            {{name: 'السويداء', lat: 32.60, lng: 36.70, offsetX: 40, offsetY: 22}},
            {{name: 'طرطوس', lat: 34.78, lng: 35.89, offsetX: 40, offsetY: 22}},
            {{name: 'إدلب', lat: 36.08, lng: 36.63, offsetX: 35, offsetY: 18}},
            {{name: 'القنيطرة', lat: 33.00, lng: 35.82, offsetX: 45, offsetY: 22}}
        ];
        
        cities.forEach(function(city) {{
            // نقطة المدينة
            var markerIcon = L.divIcon({{
                className: 'city-marker-container',
                html: '<div class="city-marker"></div>',
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            }});
            
            L.marker([city.lat, city.lng], {{icon: markerIcon, interactive: false}}).addTo(map);
            
            // تسمية المدينة - مع إزاحة مخصصة لكل مدينة
            var labelIcon = L.divIcon({{
                className: 'city-label',
                html: city.name,
                iconSize: [100, 20],
                iconAnchor: [city.offsetX, city.offsetY]
            }});
            L.marker([city.lat, city.lng], {{icon: labelIcon, interactive: false}}).addTo(map);
        }});
    </script>
</body>
</html>'''

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Map saved to {OUTPUT_FILE}")
print(f"Value range: {vmin} - {vmax}")
print(f"Non-serviced: {df[df['Value'] == 0]['Governorate'].tolist()}")