import type { Connector } from './types';

export interface Geocode {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

export interface CurrentWeather {
  temperature: number;
  weather_code: number;
  wind_speed: number;
}

export interface DailyForecast {
  date: string;        // YYYY-MM-DD
  temp_max: number;
  temp_min: number;
  weather_code: number;
}

export interface ForecastResult {
  geocode: Geocode;
  current: CurrentWeather;
  daily: DailyForecast[];
  unit: 'C' | 'F';
}

interface ForecastParams {
  city: string;
  unit: 'C' | 'F';
}

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

export const openMeteoConnector: Connector = {
  id: 'open-meteo',
  name: 'Open-Meteo',
  description: 'Free weather forecast API. No account required.',
  authKind: 'none',

  async getStatus() {
    return 'connected';
  },
  async connect() {},
  async disconnect() {},

  async query<R>(op: string, params: any = {}): Promise<R> {
    if (op !== 'forecast') throw new Error(`Unknown op: ${op}`);
    const p = params as ForecastParams;

    // 1. Geocode city -> lat/lon.
    const gRes = await fetch(`${GEOCODE}?name=${encodeURIComponent(p.city)}&count=1&language=en&format=json`);
    if (!gRes.ok) throw new Error(`Geocoding failed: ${gRes.status}`);
    const gJson = await gRes.json();
    const hit = gJson.results?.[0];
    if (!hit) throw new Error(`No location found for "${p.city}"`);
    const geocode: Geocode = {
      name: `${hit.name}${hit.admin1 ? ', ' + hit.admin1 : ''}`,
      latitude: hit.latitude,
      longitude: hit.longitude,
      country: hit.country,
    };

    // 2. Forecast.
    const tempUnit = p.unit === 'F' ? 'fahrenheit' : 'celsius';
    const url =
      `${FORECAST}?latitude=${geocode.latitude}&longitude=${geocode.longitude}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&forecast_days=4&timezone=auto&temperature_unit=${tempUnit}`;
    const fRes = await fetch(url);
    if (!fRes.ok) throw new Error(`Forecast failed: ${fRes.status}`);
    const f = await fRes.json();

    const current: CurrentWeather = {
      temperature: f.current.temperature_2m,
      weather_code: f.current.weather_code,
      wind_speed: f.current.wind_speed_10m,
    };
    const daily: DailyForecast[] = f.daily.time.map((date: string, i: number) => ({
      date,
      temp_max: f.daily.temperature_2m_max[i],
      temp_min: f.daily.temperature_2m_min[i],
      weather_code: f.daily.weather_code[i],
    }));

    return { geocode, current, daily, unit: p.unit } as unknown as R;
  },
};

/** Map WMO weather codes to a friendly label + emoji. */
export function weatherCodeLabel(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear', emoji: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', emoji: '⛅' };
  if (code === 3) return { label: 'Overcast', emoji: '☁️' };
  if (code <= 48) return { label: 'Fog', emoji: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', emoji: '🌦️' };
  if (code <= 67) return { label: 'Rain', emoji: '🌧️' };
  if (code <= 77) return { label: 'Snow', emoji: '🌨️' };
  if (code <= 82) return { label: 'Showers', emoji: '🌦️' };
  if (code <= 86) return { label: 'Snow showers', emoji: '❄️' };
  if (code <= 99) return { label: 'Thunderstorm', emoji: '⛈️' };
  return { label: '—', emoji: '·' };
}
