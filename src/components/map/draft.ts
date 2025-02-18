

interface IGetOptimalRouteProps {
	startPoint: Poi;
	deliveries: Poi[];
}

const getDistanceToPoints = useCallback(
  async ({ destinations, origin }: { origin: Poi; destinations: Poi[] }) => {
    const response = await axios.get<google.maps.DistanceMatrixResponse>(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          destinations: destinations
            .map((destiny) => Object.values(destiny.location).join(","))
            .join("|"),
          origins: Object.values(origin.location).join(","),
          units: "metric",
          language: "pt-BR",
          key: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
        },
      },
    );

    console.log(response);
  },
  [],
);

const getOptimalRoute = useCallback(
  async ({ startPoint, deliveries }: IGetOptimalRouteProps) => {
    const unvisitedPoints = [...deliveries];
    const route: Poi[] = [];
    let currentPoint = startPoint;

    while (unvisitedPoints.length > 0) {
      const distances = await getDistanceToPoints({
        origin: currentPoint,
        destinations: unvisitedPoints,
      });

      const nearestPointIndex = distances.indexOf(Math.min(...distances));
      const nearestPoint = unvisitedPoints[nearestPointIndex];

      route.push(nearestPoint);
      currentPoint = nearestPoint;
      unvisitedPoints.splice(nearestPointIndex, 1);
    }
  },
  [getDistanceToPoints],
);