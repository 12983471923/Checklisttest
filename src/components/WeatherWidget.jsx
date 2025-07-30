import React, { useState, useEffect } from 'react';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using OpenWeatherMap API - you'll need to get a free API key from openweathermap.org
      // For now, I'll use a public weather API that doesn't require a key
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=55.6761&longitude=12.5683&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FCopenhagen'
      );
      
      if (!response.ok) {
        throw new Error('Weather data unavailable');
      }
      
      const data = await response.json();
      
      // Weather code mapping for open-meteo
      const getWeatherIcon = (code) => {
        if (code === 0) return '☀️'; // Clear sky
        if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, overcast
        if (code >= 45 && code <= 48) return '🌫️'; // Fog
        if (code >= 51 && code <= 67) return '🌧️'; // Rain
        if (code >= 71 && code <= 77) return '🌨️'; // Snow
        if (code >= 80 && code <= 82) return '🌦️'; // Rain showers
        if (code >= 85 && code <= 86) return '🌨️'; // Snow showers
        if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
        return '🌤️'; // Default
      };

      const getWeatherDescription = (code) => {
        if (code === 0) return 'Clear sky';
        if (code === 1) return 'Mainly clear';
        if (code === 2) return 'Partly cloudy';
        if (code === 3) return 'Overcast';
        if (code >= 45 && code <= 48) return 'Foggy';
        if (code >= 51 && code <= 67) return 'Rainy';
        if (code >= 71 && code <= 77) return 'Snowy';
        if (code >= 80 && code <= 82) return 'Rain showers';
        if (code >= 85 && code <= 86) return 'Snow showers';
        if (code >= 95 && code <= 99) return 'Thunderstorm';
        return 'Cloudy';
      };
      
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        icon: getWeatherIcon(data.current.weather_code),
        description: getWeatherDescription(data.current.weather_code),
        windSpeed: Math.round(data.current.wind_speed_10m)
      });
    } catch (err) {
      setError('Unable to load weather');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="weather-widget weather-minimal">
        <span className="weather-spinner">�️</span>
        <span className="weather-temp-minimal">--°</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget weather-minimal weather-error">
        <span className="weather-icon">❌</span>
        <span className="weather-temp-minimal">--°</span>
      </div>
    );
  }

  return (
    <div className="weather-widget weather-minimal" title={`Copenhagen: ${weather.description}, ${weather.temperature}°C, Wind: ${weather.windSpeed} km/h`}>
      <span className="weather-icon">{weather.icon}</span>
      <span className="weather-temp-minimal">{weather.temperature}°</span>
    </div>
  );
};

export default WeatherWidget;
