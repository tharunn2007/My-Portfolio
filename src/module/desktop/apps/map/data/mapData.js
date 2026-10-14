import { profile } from "@constants";

const PRESET_PLACES = {
  home: {
    // Derived from the central profile config — edit src/constants/profile.js.
    name: profile.location.city,
    region: `${profile.location.region}, ${profile.location.country}`,
    desc: `Home in ${profile.location.city} — the Manchester of South India.`,
    lat: profile.location.latitude,
    lon: profile.location.longitude,
    bboxWidth: 0.12,
    weather: "28°C • Partly Cloudy",
    landmarks: ["Marudamalai Temple", "VOC Park", "Tidel Park"],
    steps: [
      "Head east on Avinashi Road toward the city centre.",
      "Continue onto Dr. Nanjappa Road for 2 km.",
      "Take the flyover and keep left onto Trichy Road.",
      "Arrive at Home.",
    ],
  },
  sf: {
    name: "San Francisco",
    region: "California, USA",
    desc: "The cultural, commercial, and financial center of Northern California, famous for tech innovation, Victorian houses, and rolling hills.",
    lat: 37.7749,
    lon: -122.4194,
    bboxWidth: 0.08,
    weather: "17°C • Sunny",
    landmarks: ["Golden Gate Bridge", "Fisherman's Wharf", "Alcatraz Island"],
    steps: [
      "Depart from San Francisco International Airport.",
      "Take US-101 North toward Golden Gate Bridge.",
      "Take exit 434B for Lombard Street.",
      "Turn left onto Van Ness Ave and arrive at Silicon Valley Hub.",
    ],
  },
  nyc: {
    name: "New York City",
    region: "New York, USA",
    desc: "The Big Apple. A global hub of finance, culture, art, fashion, and history, composed of 5 iconic boroughs where the Hudson meets the Atlantic.",
    lat: 40.7128,
    lon: -74.006,
    bboxWidth: 0.09,
    weather: "22°C • Clear",
    landmarks: ["Times Square", "Central Park", "Statue of Liberty"],
    steps: [
      "Start from Grand Central Terminal.",
      "Walk southwest toward Times Square.",
      "Turn right onto Broadway.",
      "Arrive at Central Park South entrance.",
    ],
  },
  london: {
    name: "London",
    region: "Greater London, UK",
    desc: "Capital of the United Kingdom. A 21st-century city with history stretching back to Roman times, anchored by the iconic River Thames.",
    lat: 51.5074,
    lon: -0.1278,
    bboxWidth: 0.06,
    weather: "14°C • Light Rain",
    landmarks: ["Big Ben & Parliament", "Tower Bridge", "London Eye"],
    steps: [
      "Depart from Heathrow Airport Terminals.",
      "Take the Piccadilly line eastbound to Piccadilly Circus.",
      "Walk down Whitehall toward Parliament Square.",
      "Arrive at the Westminster Palace Gate.",
    ],
  },
  tokyo: {
    name: "Tokyo",
    region: "Kanto, Japan",
    desc: "Japan's bustling capital, mixing ultra-modern skyscrapers with historic temples and shrines. Home to the world's busiest pedestrian crossing.",
    lat: 35.6762,
    lon: 139.6503,
    bboxWidth: 0.1,
    weather: "19°C • Humid",
    landmarks: ["Shibuya Crossing", "Tokyo Skytree", "Senso-ji Temple"],
    steps: [
      "Start from Tokyo Station.",
      "Take the Yamanote Line (Green) toward Shibuya.",
      "Exit via Hachiko gate.",
      "Cross Shibuya Crossing and arrive at your destination.",
    ],
  },
};

export default PRESET_PLACES;
