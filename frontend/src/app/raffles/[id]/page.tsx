import RaffleDetailClient from "./raffle-detail-client"

type PageProps = {
  params: { id: string }
}

export default function RaffleDetailPage({ params }: PageProps) {
  return <RaffleDetailClient id={params.id} />
}
