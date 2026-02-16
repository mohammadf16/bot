import RaffleDetailClient from "./raffle-detail-client"

type PageProps = {
  params: { id: string }
}

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }]
}

export default function RaffleDetailPage({ params }: PageProps) {
  return <RaffleDetailClient id={params.id} />
}
