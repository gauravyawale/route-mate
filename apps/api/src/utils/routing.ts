import https from "https";

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

export async function getRoutePolyline(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<[number, number][]> {
  // OSRM public demo server — free, no API key needed
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log("OSRM status:", json.code);
          if (json.code !== "Ok" || !json.routes?.length) {
            console.log("OSRM fallback to straight line");
            resolve([
              [originLng, originLat],
              [destLng, destLat],
            ]);
            return;
          }
          const encoded = json.routes[0].geometry;
          const points = decodePolyline(encoded);
          console.log("Route points count:", points.length);
          resolve(points);
        } catch (e) {
          console.log("OSRM parse error:", e);
          resolve([
            [originLng, originLat],
            [destLng, destLat],
          ]);
        }
      });
      res.on("error", (e) => {
        console.log("OSRM request error:", e);
        resolve([
          [originLng, originLat],
          [destLng, destLat],
        ]);
      });
    });
  });
}
