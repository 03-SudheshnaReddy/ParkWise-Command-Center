export const dashboardMetricDescriptions = {
  violations: "Total records analyzed",
  highRiskZones: "Priority enforcement clusters",
  officersOnDuty: "Active shift capacity",
  averageRiskScore: "City-wide enforcement intensity",
} as const;

const dashboardDisplayNames: Record<string, string> = {
  "Jabalpur Railway Station": "Railway Station Zone",
  "Gorakhpur Market Area": "Market Area",
  "Civic Center Junction": "Civic Center Junction",
  "Sadar Cantt Road": "Sadar Main Road",
};

export function getLocationDisplayName(name: string): string {
  return dashboardDisplayNames[name] ?? name;
}

export function getLocationDisplayText(text: string): string {
  const normalizedText = Object.entries(dashboardDisplayNames).reduce(
    (displayText, [source, replacement]) =>
      displayText.split(source).join(replacement),
    text
  );

  return normalizedText.split("Jabalpur").join("Bengaluru");
}
