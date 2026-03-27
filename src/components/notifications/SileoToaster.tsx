import { Toaster } from 'sileo';
import 'sileo/styles.css';
import { useTheme } from '../../context/ThemeContext';

const LIGHT_FILL = '#1a1a2e';
const DARK_FILL = '#f8f8f8';

export function SileoToaster() {
  const { dark } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      offset={{ bottom: 24, right: 24 }}
      options={{
        duration: 5000,
        fill: dark ? DARK_FILL : LIGHT_FILL,
        roundness: 14,
        styles: {
          title: dark ? 'sileo-text-dark' : 'sileo-text-light',
          description: dark ? 'sileo-text-dark' : 'sileo-text-light',
        },
      }}
    />
  );
}
