import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import './App.css';
import { LatLngExpression } from 'leaflet';
import MapComponent from './MapComponent';
import Modal from './Modal';
import ProductList from './ProductList';
import { Product, PointOfSale } from './interfaces';

const BACKEND_URL = '/api';

const App: React.FC = () => {
    const [stores, setStores] = useState<PointOfSale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([-26.3045, -48.8454]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [addressFound, setAddressFound] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(true);

    const fetchCoordinates = useCallback(async (location: string, isGeolocation: boolean = false) => {
    setLoading(true);
    setError(null);
    let nominatimUrl = '';
    
    if (isGeolocation) {
        const [lat, lon] = location.split(',');
        nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    } else {
        // Nova lógica para CEPs:
        const cleanCep = location.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            setError('CEP inválido. Deve conter 8 dígitos.');
            setLoading(false);
            return null;
        }

        try {
            const cepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const cepData = await cepResponse.json();

            if (cepData.erro) {
                setError('CEP não encontrado. Tente novamente.');
                setLoading(false);
                return null;
            }

            // Usando os dados do ViaCEP para construir a busca do Nominatim
            const { logradouro, localidade, uf } = cepData;
            nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(logradouro + ', ' + localidade + ', ' + uf)}&countrycodes=br`;
        } catch (cepErr) {
            setError('Erro ao buscar dados do CEP. Tente novamente.');
            setLoading(false);
            return null;
        }
    }

    try {
        const response = await fetch(nominatimUrl);
        const data = await response.json();
        
        if (data.error) {
            setError(`Erro da API de geocodificação: ${data.error}. Tente novamente.`);
            return null;
        }

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const coords: [number, number] = [parseFloat(lon), parseFloat(lat)];
            setMapCenter(coords);
            setAddressFound(data[0].display_name);
            setUserLocation(coords);
            setIsModalOpen(false);
            return coords;
        } else {
            setError('Localização não encontrada. Tente novamente.');
            return null;
        }
    } catch (err) {
        setError('Erro ao buscar as coordenadas.');
        return null;
    } finally {
        setLoading(false);
    }
}, []);



    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/products`);
            if (!response.ok) {
                throw new Error('Erro ao buscar a lista de produtos.');
            }
            const data: Product[] = await response.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchStoresByProduct = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);
        if (!userLocation) {
            setError('Localização do usuário não definida.');
            return;
        }
        const [lat, lon] = userLocation as [number, number];
        const apiUrl = `${BACKEND_URL}/stores-by-product?productId=${productId}&lat=${lat}&lon=${lon}`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erro ao buscar lojas. Verifique se o backend está rodando e a URL está correta.');
            }
            const data: PointOfSale[] = await response.json();
            setStores(data);
        } catch (err) {
            setError('Erro ao buscar as lojas. Verifique a conexão com o servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userLocation]);

    const handleUseMyLocation = useCallback(() => {
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const coords = `${latitude},${longitude}`;
                    fetchCoordinates(coords, true);
                },
                (err) => {
                    console.error("Erro ao obter a localização do usuário:", err);
                    setError("Não foi possível obter sua localização. Usando localização padrão.");
                    setIsModalOpen(false);
                }
            );
        } else {
            setError("Geolocalização não é suportada. Usando localização padrão.");
            setIsModalOpen(false);
        }
        setLoading(false);
    }, [fetchCoordinates]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (selectedProductId && userLocation) {
            fetchStoresByProduct(selectedProductId);
        }
    }, [selectedProductId, userLocation, fetchStoresByProduct]);

    const handleFindProduct = (productId: string) => {
        setSelectedProductId(productId);
    };

    return (
        <div className="App">
            <Modal isOpen={isModalOpen} onLocationSubmit={(loc: string) => fetchCoordinates(loc, false)} onUseMyLocation={handleUseMyLocation} errorMessage={error} />
            <header className="App-header">
                <h1>Onde Encontrar</h1>
                <p>Encontre lojas próximas a você</p>
            </header>
            <main className="App-main">
                {error && <p className="error-message">{error}</p>}
                {addressFound && <p className="address-found">Endereço encontrado: <strong>{addressFound}</strong></p>}
                
                <div className="content-container">
                    <div className="product-list-wrapper">
                        <ProductList products={products} onFindProduct={handleFindProduct} />
                    </div>
                    <div className="map-container">
                        {!isModalOpen && userLocation && (
                            <MapComponent
                                center={mapCenter}
                                zoom={13}
                                points={stores}
                                isBlurred={isModalOpen}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
