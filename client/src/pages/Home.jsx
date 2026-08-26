import HeroBanner from '../components/HeroBanner'
import StatsBar from '../components/StatsBar'
import CategorySection from '../components/CategorySection'
import FeaturedCollection from '../components/FeaturedCollection'
import OffersBanner from '../components/OffersBanner'
import NewArrivals from '../components/NewArrivals'
import BestSellers from '../components/BestSellers'
import WhyChooseus from '../components/whychooseus'
import OurStory from '../components/OurStory'
import Testimonials from '../components/Testimonials'
function Home() {
  return (
    <main>
      <HeroBanner />
      <StatsBar />
      <CategorySection />
      <FeaturedCollection />
      <OffersBanner />
      <NewArrivals />
      <BestSellers />
      <WhyChooseus />
      <OurStory />
      <Testimonials />
    </main>
  )
}

export default Home