export function AboutPage(){
  return (
    <div className="prose prose-invert max-w-2xl">
      <h1>About This Prototype</h1>
      <p>This UI prototype showcases a possible interface for integrating NASA TEMPO near real-time atmospheric composition data with ground monitoring networks (e.g., OpenAQ, Pandora) and weather feeds to produce localized air quality insights and alerts.</p>
      <h2>Planned Data Sources</h2>
      <ul>
        <li>TEMPO Level 2 products (NO₂, O₃, HCHO, etc.)</li>
        <li>OpenAQ aggregated station readings</li>
        <li>Pandora / TolNet (where available)</li>
        <li>Global & regional weather model outputs (temperature, wind, PBL height)</li>
      </ul>
      <h2>Key Features Roadmap</h2>
      <ul>
        <li>Layer toggle (satellite columns vs ground AQI)</li>
        <li>Model fusion forecast (collaboration with data/model team)</li>
        <li>Health-based alert personalization</li>
        <li>Historical trend exploration and anomaly detection</li>
      </ul>
      <p>All trademarks and data copyrights belong to their respective owners. This is not an official NASA product.</p>
    </div>
  )
}
