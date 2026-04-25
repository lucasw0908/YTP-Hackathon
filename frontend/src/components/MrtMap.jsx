import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import classNames from 'classnames';
import stationsData from '../assets/stations.json';
import './MrtMap.css';
import mapImg from "../assets/metro.png";

export default function MrtMap() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [scale, setScale] = useState(1);
  const transformRef = useRef(null);

  const handleStationClick = (station) => {
    setCurrentLocation(station);
  };

  const handleSliderChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    if (transformRef.current) {
      transformRef.current.setTransform(
        transformRef.current.state.positionX,
        transformRef.current.state.positionY,
        newScale,
        0
      );
    }
  };

  return (
    <div className="mrt-map-container">
      <div className="mrt-header">
        <h1>
          <Navigation size={24} className="text-blue-500" />
          台北捷運大富翁
        </h1>
        <div className="subtitle">MRT Monoploy</div>
      </div>

      <div className="mrt-interactive-area">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }}
          pinch={{ step: 5 }}
          onInit={(ref) => setScale(ref.state.scale)}
          onTransformed={(ref) => setScale(ref.state.scale)}
          ref={transformRef}
        >
          <TransformComponent
            wrapperClass="react-transform-wrapper"
            contentClass="react-transform-component"
          >
            <div className="map-content">
              {/* background map image */}
              <img
                src={mapImg}
                alt="Taipei MRT Map"
                className="map-image"
              />

              {/* station interactive buttons overlay */}
              {stationsData.map((station) => (
                <button
                  key={station.id}
                  className={classNames('station-button', {
                    active: currentLocation?.id === station.id,
                  })}
                  style={{
                    left: `${station.x}px`,
                    top: `${station.y}px`,
                  }}
                  onClick={() => handleStationClick(station)}
                  title={station.name}
                  aria-label={`Mark location at ${station.name}`}
                >
                  {/* optionally render something inside the invisible button, we just keep it transparent to use the image's dots */}
                </button>
              ))}

              {/* current location map pin */}
              {currentLocation && (
                <div
                  className="user-marker"
                  style={{
                    left: `${currentLocation.x}px`,
                    top: `${currentLocation.y}px`,
                  }}
                >
                  <MapPin size={32} fill="#e53e3e" color="white" />
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {currentLocation && (
        <div className="current-station-info">
          <MapPin size={20} className="icon" />
          <span>當前位置：{currentLocation.name}站</span>
        </div>
      )}
    </div>
  );
}
