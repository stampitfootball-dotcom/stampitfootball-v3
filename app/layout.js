import './styles.css';
import './picks.css';
import SiteEnhancer from './site-enhancer';
import PredictionControls from './prediction-controls';

export const metadata = {
  title: 'Stamp It Football',
  description: 'Football news, live scores, predictions and community.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}<SiteEnhancer /><PredictionControls /></body></html>;
}
