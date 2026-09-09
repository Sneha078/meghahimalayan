import HeroBanner from '../components/HeroBanner'
import StatsBar from '../components/StatsBar'
import CategorySection from '../components/CategorySection'
import FeaturedCollection from '../components/FeaturedCollection'
import OffersBanner from '../components/OffersBanner'
import NewArrivals from '../components/NewArrivals'
import RecommendedForYou from '../components/RecommendedForYou'
import BestSellers from '../components/BestSellers'
import WhyChooseUs from '../components/WhyChooseUs'
import OurStory from '../components/OurStory'
import Testimonials from '../components/Testimonials'
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
      <BestSellers />
      <WhyChooseUs />
      <OurStory />
      <Testimonials />
      <FloatingAssistant />
    </main>
  )
}

export default Home