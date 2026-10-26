import { useState, useEffect, useRef } from 'react';
import {
Search,
Crosshair,
X,
Wind,
Droplets,
Eye,
Gauge,
Sunrise,
Sunset,
Calendar,
Clock,
ShieldCheck,
Flame,
History,
Sun,
CloudSun,
Cloud,
CloudFog,
CloudDrizzle,
CloudRain,
CloudLightning,
Snowflake,
Moon,
CloudMoon,
type LucideIcon
} from 'lucide-react';
import { WeatherData, AirQualityData, LocationItem } from './types';

interface GeocodingResult {
name: string;
country?: string;
country_code?: string;
latitude: number;
longitude: number;
timezone?: string;
}

const DEFAULT_LOCATION: LocationItem = {
name: 'Sahibzada Ajit Singh Nagar',
country: 'India',
countryCode: 'IN',
latitude: 30.7046,
longitude: 76.7179,
timezone: 'auto'
};

const POPULAR_CITIES = ['New York', 'Tokyo', 'London', 'Paris', 'Sydney'];

export default function App() {
const [unit, setUnit] = useState<'C' | 'F'>('C');
const [location, setLocation] = useState(DEFAULT_LOCATION);
const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
const [aqiData, setAqiData] = useState<AirQualityData | null>(null);
const [loading, setLoading] = useState(true);
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
const [showDropdown, setShowDropdown] = useState(false);
const [history, setHistory] = useState<LocationItem[]>(() => {
try {
const stored = localStorage.getItem('atmosphere_history');
return stored ? JSON.parse(stored) : [];
} catch {
return [];
}
});

const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const fetchWeather = async (loc: LocationItem) => {
setLoading(true);
try {
const weatherParams = new URLSearchParams({
latitude: loc.latitude.toString(),
longitude: loc.longitude.toString(),
current: [
'temperature_2m',
'relative_humidity_2m',
'apparent_temperature',
'is_day',
'precipitation',
'weather_code',
'cloud_cover',
'surface_pressure',
'wind_speed_10m',
'wind_direction_10m'
].join(','),
hourly: [
'temperature_2m',
'relative_humidity_2m',
'apparent_temperature',
'precipitation_probability',
'weather_code',
'visibility',
'dew_point_2m',
'uv_index',
'is_day'
].join(','),
daily: [
'weather_code',
'temperature_2m_max',
'temperature_2m_min',
'sunrise',
'sunset',
'uv_index_max',
'precipitation_sum',
'precipitation_probability_max'
].join(','),
timezone: loc.timezone || 'auto'
});

  const aqiParams = new URLSearchParams({
    latitude: loc.latitude.toString(),
    longitude: loc.longitude.toString(),
    current: ['european_aqi', 'pm10', 'pm2_5', 'ozone'].join(','),
    timezone: loc.timezone || 'auto'
  });

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams.toString()}`)
  ]);

  if (weatherRes.ok) {
    const wData = (await weatherRes.json()) as WeatherData;
    setWeatherData(wData);
  }
  if (aqiRes.ok) {
    const aData = (await aqiRes.json()) as AirQualityData;
    setAqiData(aData);
  }
} catch (err) {
  console.error('Weather load error:', err);
} finally {
  setLoading(false);
}


};

const handleSelectLocation = (loc: LocationItem) => {
setLocation(loc);
setQuery('');
setShowDropdown(false);
const updated = [loc, ...history.filter((h) => h.name.toLowerCase() !== loc.name.toLowerCase())].slice(0, 5);
setHistory(updated);
try {
localStorage.setItem('atmosphere_history', JSON.stringify(updated));
} catch (e) {
console.error(e);
}
fetchWeather(loc);
};

useEffect(() => {
if (query.trim().length < 2) {
setSuggestions([]);
setShowDropdown(false);
return;
}

if (searchDebounceRef.current) {
  clearTimeout(searchDebounceRef.current);
}

searchDebounceRef.current = setTimeout(async () => {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    const data = await res.json();
    if (data.results && Array.isArray(data.results)) {
      const items: LocationItem[] = data.results.map((r: GeocodingResult) => ({
        name: r.name,
        country: r.country || '',
        countryCode: r.country_code || '',
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone || 'auto'
      }));
      setSuggestions(items);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
}, 280);

return () => {
  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
};


}, [query]);

useEffect(() => {
fetchWeather(location);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const locateMe = () => {
if (!navigator.geolocation) return;
navigator.geolocation.getCurrentPosition(
async (pos) => {
const lat = pos.coords.latitude;
const lon = pos.coords.longitude;
try {
const res = await fetch(
`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
);
const geo = await res.json();
const detected: LocationItem = {
name: geo.locality || geo.city || 'Detected Location',
country: geo.countryName || '',
countryCode: geo.countryCode || '',
latitude: lat,
longitude: lon,
timezone: 'auto'
};
handleSelectLocation(detected);
} catch {
handleSelectLocation({
name: 'Your Location',
country: '',
countryCode: 'LOC',
latitude: lat,
longitude: lon,
timezone: 'auto'
});
}
},
(err) => {
console.warn('Geolocation denied or failed:', err);
}
);
};

const formatTemp = (c: number | undefined | null): string | number => {
if (c === null || c === undefined || isNaN(c)) return '--';
if (unit === 'F') return Math.round((c * 9) / 5 + 32);
return Math.round(c);
};

const formatWind = (kmh: number | undefined): string => {
if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
if (unit === 'F') return `${Math.round(kmh * 0.621371)} mph`;
return `${Math.round(kmh)} km/h`;
};

const getWeatherDetails = (
code: number,
isDayValue: number
): { desc: string; type: 'rain' | 'cloudy' | 'day' | 'night'; icon: LucideIcon } => {
if ([95, 96, 99].includes(code)) {
return { desc: 'Thunderstorm', type: 'rain', icon: CloudLightning };
}
if ([51, 53, 55].includes(code)) {
return { desc: 'Drizzle', type: 'rain', icon: CloudDrizzle };
}
if ([61, 63, 65, 80, 81, 82].includes(code)) {
return { desc: 'Rain & Showers', type: 'rain', icon: CloudRain };
}
if ([71, 73, 75, 77, 85, 86].includes(code)) {
return { desc: 'Snowfall', type: 'rain', icon: Snowflake };
}
if ([45, 48].includes(code)) {
return { desc: 'Fog & Mist', type: 'cloudy', icon: CloudFog };
}
if (code === 3) {
return { desc: 'Overcast', type: 'cloudy', icon: Cloud };
}
if (code === 2) {
return {
desc: 'Partly Cloudy',
type: 'cloudy',
icon: isDayValue ? CloudSun : CloudMoon
};
}
if (isDayValue) {
return { desc: 'Clear & Sunny', type: 'day', icon: Sun };
}
return { desc: 'Clear Night', type: 'night', icon: Moon };
};

const current = weatherData?.current;
const isDay = current?.is_day ?? 1;
const weatherCode = current?.weather_code ?? 0;
const cloudCover = current?.cloud_cover ?? 0;
const weatherDetails = getWeatherDetails(weatherCode, isDay);

let bgClass = 'bg-app-day';
if (weatherDetails.type === 'rain') {
bgClass = 'bg-app-rain';
} else if (weatherDetails.type === 'cloudy' || cloudCover >= 65) {
bgClass = 'bg-app-cloudy';
} else if (!isDay) {
bgClass = 'bg-app-night';
} else {
bgClass = 'bg-app-day';
}

const HeroIcon = weatherDetails.icon;

const todaySunrise = weatherData?.daily?.sunrise?.[0]
? new Date(weatherData.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
: '--';

const todaySunset = weatherData?.daily?.sunset?.[0]
? new Date(weatherData.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
: '--';

const todayMaxTemp = weatherData?.daily?.temperature_2m_max?.[0];
const todayMinTemp = weatherData?.daily?.temperature_2m_min?.[0];
const precipitationRisk = weatherData?.daily?.precipitation_probability_max?.[0] ?? 0;
const visibilityKm =
weatherData?.hourly?.visibility?.[0] !== undefined
? ((weatherData.hourly.visibility[0] ?? 10000) / 1000).toFixed(1)
: '10.0';

return (
<div className={`min-h-screen ${bgClass} text-slate-100 transition-all duration-700 relative overflow-x-hidden flex flex-col`}>
{/* Ambient background glows */}
<div className="pointer-events-none fixed inset-0 overflow-hidden">
<div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
<div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse-slow" />
</div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-screen gap-6 flex-1 w-full">
    {/* Navigation & Search */}
    <header className="flex flex-col md:flex-row gap-4 items-center justify-between pb-3 border-b border-white/10">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              Atmosphere
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-300">Precision Global Forecast</p>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={locateMe}
            className="p-2 rounded-xl glass-input hover:bg-white/15 text-slate-200"
            title="Locate Me"
          >
            <Crosshair className="w-5 h-5" />
          </button>
          <div className="flex items-center rounded-xl glass-input p-1">
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                unit === 'C' ? 'bg-cyan-500 text-white' : 'text-slate-300'
              }`}
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                unit === 'F' ? 'bg-cyan-500 text-white' : 'text-slate-300'
              }`}
            >
              °F
            </button>
          </div>
        </div>
      </div>

      {/* Autocomplete Search input */}
      <div className="w-full md:max-w-xl relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, district, or landmark..."
            className="w-full pl-11 pr-24 py-3 rounded-2xl glass-input text-sm text-white placeholder-slate-400 focus:outline-none transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={locateMe}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 border border-white/10 transition-all"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Locate</span>
            </button>
          </div>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 border border-white/20">
            {suggestions.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                onClick={() => handleSelectLocation(item)}
                className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <span className="font-semibold text-white">
                  {item.name}, <span className="text-slate-400">{item.country}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                  {item.countryCode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Units Switcher */}
      <div className="hidden md:flex items-center rounded-xl glass-input p-1 bg-black/20">
        <button
          type="button"
          onClick={() => setUnit('C')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            unit === 'C' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          °C
        </button>
        <button
          type="button"
          onClick={() => setUnit('F')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            unit === 'F' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          °F
        </button>
      </div>
    </header>

    {/* Quick Popular & History Buttons */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Popular:
        </span>
        {POPULAR_CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={async () => {
              try {
                const res = await fetch(
                  `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(c)}&count=1&language=en&format=json`
                );
                const data = await res.json();
                if (data.results?.[0]) {
                  const r = data.results[0];
                  handleSelectLocation({
                    name: r.name,
                    country: r.country || '',
                    countryCode: r.country_code || '',
                    latitude: r.latitude,
                    longitude: r.longitude,
                    timezone: r.timezone || 'auto'
                  });
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="px-2.5 py-1 rounded-lg glass-input hover:bg-white/20 transition-all text-slate-200 font-medium"
          >
            {c}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-cyan-400" /> Recent:
          </span>
          {history.map((h, idx) => (
            <button
              key={`${h.name}-${idx}`}
              type="button"
              onClick={() => handleSelectLocation(h)}
              className="px-2.5 py-1 rounded-lg glass-input hover:bg-white/20 transition-all text-slate-300 font-medium text-[11px]"
            >
              {h.name}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Main Weather View */}
    {loading ? (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading live forecast...</p>
      </div>
    ) : (
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 space-y-6">
          {/* Primary Weather Hero */}
          <section className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                  <span>{location.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                    {location.countryCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{new Date().toDateString()}</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-input text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{isDay ? 'Daytime' : 'Night Sky'}</span>
              </div>
            </div>

            <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="animate-float-icon">
                  <HeroIcon className="w-20 h-20 sm:w-24 sm:h-24 text-amber-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
                </div>
                <div>
                  <div className="flex items-start">
                    <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-white">
                      {formatTemp(current?.temperature_2m)}
                    </span>
                    <span className="text-2xl sm:text-3xl font-light text-cyan-300 mt-2">°{unit}</span>
                  </div>
                  <p className="text-lg font-medium text-slate-200">{weatherDetails.desc}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[200px] p-4 rounded-2xl bg-black/25 border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Feels Like</span>
                  <span className="font-bold text-white">{formatTemp(current?.apparent_temperature)}°{unit}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Today's High / Low</span>
                  <span className="font-bold text-white">
                    {formatTemp(todayMaxTemp)}° / {formatTemp(todayMinTemp)}°
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Precipitation Risk</span>
                  <span className="font-bold text-cyan-300">{precipitationRisk}%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>Wind: <strong className="text-white">{formatWind(current?.wind_speed_10m)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Humidity: <strong className="text-white">{current?.relative_humidity_2m ?? '--'}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Visibility: <strong className="text-white">{visibilityKm} km</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Pressure: <strong className="text-white">{Math.round(current?.surface_pressure ?? 1013)} hPa</strong></span>
              </div>
            </div>
          </section>

          {/* 24-Hour Slider */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Hourly Forecast (24h)
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {weatherData?.hourly?.time?.slice(0, 24).map((timeStr, idx) => {
                const temp = formatTemp(weatherData.hourly.temperature_2m[idx]);
                const hourDate = new Date(timeStr);
                const isNow = idx === 0;
                const rainProbability = weatherData.hourly.precipitation_probability?.[idx] ?? 0;
                return (
                  <div
                    key={timeStr}
                    className={`flex-shrink-0 w-20 py-3 px-2 rounded-2xl flex flex-col items-center justify-between border ${
                      isNow ? 'bg-cyan-500/25 border-cyan-400/40 shadow-lg' : 'bg-black/35 border-white/10'
                    }`}
                  >
                    <span className={`text-xs ${isNow ? 'font-bold text-cyan-200' : 'text-slate-300'}`}>
                      {isNow ? 'Now' : hourDate.toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                    </span>
                    <span className="text-sm font-bold text-white my-2">{temp}°</span>
                    <span className="text-[10px] text-cyan-300">{rainProbability}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Sun Schedule */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-amber-400" /> Sun Schedule
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sunrise className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Sunrise</p>
                  <p className="text-sm font-bold text-white">{todaySunrise}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Sunset className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Sunset</p>
                  <p className="text-sm font-bold text-white">{todaySunset}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Air Quality */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Air Quality (AQI)
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-emerald-300">
                  {aqiData?.current?.european_aqi ?? '--'}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-300">AQI</span>
              </div>
              <div>
                <p className="text-xs text-slate-300">European standard atmospheric quality score.</p>
              </div>
            </div>
          </section>

          {/* 7-Day Forecast */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> 7-Day Forecast
              </h2>
            </div>
            <div className="space-y-3">
              {weatherData?.daily?.time?.slice(0, 7).map((dStr, idx) => {
                const minT = formatTemp(weatherData.daily.temperature_2m_min[idx]);
                const maxT = formatTemp(weatherData.daily.temperature_2m_max[idx]);
                const dayLabel = idx === 0 ? 'Today' : new Date(dStr).toLocaleDateString([], { weekday: 'short' });
                return (
                  <div key={dStr} className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-black/35 border border-white/5">
                    <span className="w-12 font-semibold text-slate-200">{dayLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{minT}°</span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                        <div className="temp-range-track h-full w-full rounded-full" />
                      </div>
                      <span className="font-bold text-white">{maxT}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    )}

    {/* Footer Credit */}
    <footer className="mt-auto py-4 border-t border-white/10 flex items-center justify-center text-xs text-slate-400">
      <span className="text-slate-300 font-semibold tracking-wide">Ankit Kumar</span>
    </footer>
  </div>
</div>


);
}