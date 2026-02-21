import CarDetailClient from "./car-detail-client"

export function generateStaticParams() {
  return [{ id: "vehicle-1" }, { id: "vehicle-2" }, { id: "vehicle-3" }]
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailClient id={params.id} />
}
