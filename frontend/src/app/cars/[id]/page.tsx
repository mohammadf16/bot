import CarDetailClient from "./car-detail-client"

export default function CarDetailPage({ params }: { params: { id: string } }) {
  return <CarDetailClient id={params.id} />
}
