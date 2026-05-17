// In-memory location store (replace with DB in production)
const locationStore = new Map<string, {
  driver_lat: number;
  driver_lng: number;
  driver_heading: number;
  location_updated_at: string;
}>();

// GET — passengers poll this to get driver's live location
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const location = locationStore.get(tripId);
  return Response.json(location ?? { driver_lat: null, driver_lng: null });
}

// PATCH — driver sends their current location
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const body = await req.json() as {
    driver_lat: number;
    driver_lng: number;
    driver_heading?: number;
  };

  locationStore.set(tripId, {
    driver_lat:          body.driver_lat,
    driver_lng:          body.driver_lng,
    driver_heading:      body.driver_heading ?? 0,
    location_updated_at: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}
