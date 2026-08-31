import HeroBanner from '../components/HeroBanner'
import StatsBar from '../components/StatsBar'
import CategorySection from '../components/CategorySection'
import FeaturedCollection from '../components/FeaturedCollection'
import OffersBanner from '../components/OffersBanner'
import NewArrivals from '../components/NewArrivals'
import RecommendedForYou from '../components/RecommendedForYou'
import FloatingAssistant from '../components/AIAssistant/FloatingAssistant'

function Home() {
  return (
    <main>
      <HeroBanner />
      <StatsBar />
      <CategorySection />
      <FeaturedCollection />
      <OffersBanner />
      <NewArrivals />
      <RecommendedForYou />
      <FloatingAssistant />
    </main>
  )
}

export default Home