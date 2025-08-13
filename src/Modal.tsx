import React, { useState, ChangeEvent } from 'react';
import './Modal.css';

interface ModalProps {
  onLocationSubmit: (location: string, isGeolocation: boolean) => void;
  onUseMyLocation: () => void;
  isOpen: boolean;
  errorMessage: string | null;
}

const Modal: React.FC<ModalProps> = ({ onLocationSubmit, onUseMyLocation, isOpen, errorMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onLocationSubmit(inputValue, false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <img src="https://paviloche.com.br/wp-content/uploads/2024/01/paviloche-logo.png" alt="Paviloche Logo" className="modal-logo" />
        </div>
        <p>Onde você quer encontrar nossos produtos?</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Informe sua localização (CEP)"
            className="location-input"
          />
          <button type="submit" className="submit-button">Buscar</button>
        </form>
        <p className="or-separator">ou</p>
        <button className="use-location-button" onClick={onUseMyLocation}>
          Usar minha localização
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Modal;