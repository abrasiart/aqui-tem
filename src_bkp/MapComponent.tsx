import React, { useRef, useEffect } from 'react';
import mapboxgl, { Marker, Popup, LngLatLike, Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PointOfSale } from './interfaces'; // Importando apenas a interface necessária

// ATENÇÃO: COLOQUE SEU TOKEN REAL DO MAPBOX AQUI
mapboxgl.accessToken = 'pk.eyJ1IjoiYWJyYXNpbGFydCIsImEiOiJjbWQzaWd1MWYwNTZ2Mm1xNGpmaDRidGdkIn0.0fOq0GcKZhlP2ZZrjPR08w';

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    points: PointOfSale[];
    isBlurred?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, points, isBlurred }) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<Map | null>(null);
    const markers = useRef<Marker[]>([]);

    useEffect(() => {
        if (map.current) return;

        if (!mapContainer.current) {
            console.error('MapComponent: mapContainer.current é null.');
            return;
        }
        
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: center as LngLatLike,
            zoom: zoom,
            doubleClickZoom: false
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

        console.log('Mapbox: Mapa inicializado.');

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (!map.current) return;

        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        points.forEach(point => {
            const popupContent = `
                <h3>${point.nome}</h3>
                <p>${point.endereco}</p>
                <p>Distância: ${point.distancia_km} km</p>
            `;

            const newMarker = new mapboxgl.Marker()
                .setLngLat([point.longitude, point.latitude] as LngLatLike)
                .setPopup(new Popup({ offset: 25 }).setHTML(popupContent))
                .addTo(map.current!);
            
            markers.current.push(newMarker);
        });
        console.log(`Mapbox: ${points.length} marcadores adicionados.`);
    }, [points, map.current]);

    useEffect(() => {
        if (map.current) {
            map.current.flyTo({ center: center as LngLatLike, zoom: zoom });
        }
    }, [center, zoom, map.current]);

    return (
        <div className={`map-area ${isBlurred ? 'blurred' : ''}`} style={{ height: '600px' }}>
            <div ref={mapContainer} className="map-container" />
        </div>
    );
};

export default MapComponent;