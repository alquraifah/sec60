import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Pricing from '../components/landing/Pricing';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Pricing />
      <Footer />
    </>
  );
}
