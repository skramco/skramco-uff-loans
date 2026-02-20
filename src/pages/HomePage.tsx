import Hero from '../components/home/Hero';
import PathCards from '../components/home/PathCards';
import CockpitPreview from '../components/home/CockpitPreview';
import ToolTiles from '../components/home/ToolTiles';
import Testimonials from '../components/home/Testimonials';
import EducationGrid from '../components/home/EducationGrid';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PathCards />
      <CockpitPreview />
      <ToolTiles />
      <Testimonials />
      <EducationGrid />
    </>
  );
}
