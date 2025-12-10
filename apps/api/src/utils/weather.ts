export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
}

export async function getWeather(lat: number, lng: number): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn("OPENWEATHER_API_KEY not set, skipping weather fetch");
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Weather API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    return {
      temp: data.main.temp,
      condition: data.weather[0].main,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      city: data.name
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
}
