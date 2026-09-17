import nextConfig from 'eslint-config-next';

const config = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...nextConfig,
  {
    rules: {
      // Standard "fetch on mount" client-side data loading (used throughout
      // this app's pages) legitimately calls setState from an async function
      // invoked inside useEffect — this rule flags that idiomatic pattern.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
