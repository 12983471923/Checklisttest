import React, { useState, useEffect } from 'react';
import './weather.css';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Using a CORS-friendly weather service with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=55.6761&longitude=12.5683&current_weather=true&temperature_unit=celsius',
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        const current = data.current_weather;
        setWeather({
          main: { 
            temp: Math.round(current.temperature), 
            feels_like: Math.round(current.temperature) 
          },
          weather: [{ 
            main: getWeatherDescription(current.weathercode),
            description: getWeatherDescription(current.weathercode).toLowerCase(),
            icon: getWeatherIcon(current.weathercode, current.is_day)
          }],
          name: 'Copenhagen'
        });
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message);
        // Fallback to mock data for demo purposes
        setWeather({
          main: { temp: 18, feels_like: 16 },
          weather: [{ main: 'Cloudy', description: 'overcast clouds', icon: '☁️' }],
          name: 'Copenhagen'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Update weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
  };

  const getWeatherIcon = (code, isDay) => {
    const day = isDay ? 'd' : 'n';
    
    if (code === 0) return isDay ? '☀️' : '🌙';
    if (code === 1) return isDay ? '🌤️' : '🌙';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 86) return '🌧️';
    if (code >= 95 && code <= 99) return '⛈️';
    
    return '🌡️';
  };

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="weather-loading">
          <div className="weather-spinner"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-widget weather-error">
        <span>🌡️</span>
        <div>
          <div className="weather-temp">--°</div>
          <div className="weather-location">Copenhagen</div>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <span className="weather-icon">
        {weather?.weather?.[0]?.icon || '🌡️'}
      </span>
      <div className="weather-info">
        <div className="weather-temp">
          {Math.round(weather?.main?.temp || 0)}°C
        </div>
        <div className="weather-location">Copenhagen</div>
      </div>
    </div>
  );
};

export default WeatherWidget;
