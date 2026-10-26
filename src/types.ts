export interface WeatherData {
current: {
temperature_2m: number;
relative_humidity_2m: number;
apparent_temperature: number;
is_day: number;
precipitation: number;
weather_code: number;
cloud_cover: number;
surface_pressure: number;
wind_speed_10m: number;
wind_direction_10m: number;
time: string;
};
hourly: {
time: string[];
temperature_2m: number[];
relative_humidity_2m: number[];
apparent_temperature: number[];
precipitation_probability: number[];
weather_code: number[];
visibility: number[];
dew_point_2m: number[];
uv_index: number[];
is_day: number[];
};
daily: {
time: string[];
weather_code: number[];
temperature_2m_max: number[];
temperature_2m_min: number[];
sunrise: string[];
sunset: string[];
uv_index_max: number[];
precipitation_sum: number[];
precipitation_probability_max: number[];
};
}

export interface AirQualityData {
current?: {
european_aqi?: number;
pm10?: number;
pm2_5?: number;
ozone?: number;
};
}

export interface LocationItem {
name: string;
country: string;
countryCode: string;
latitude: number;
longitude: number;
timezone?: string;
}