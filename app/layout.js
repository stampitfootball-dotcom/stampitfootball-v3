import './styles.css';
export const metadata = {
  title: 'Stamp It Football',
  description: 'Football news, live scores, predictions and community.'
};
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
