import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// In Docker/prod nginx proxies /api to the Go backend's /graphql.
// In local dev, point at the GraphQL server directly via VITE_API_URL.
const API = import.meta.env.VITE_API_URL || '/api';

const httpLink = createHttpLink({ uri: `${API}/graphql` });

// Attach the JWT (if present) to every request. Read from localStorage so this
// stays decoupled from the api module's token state.
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('unspam_token');
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apollo = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  // The app uses an imperative facade (see api.ts) and expects fresh data on
  // every call, mirroring the previous fetch-based behaviour.
  defaultOptions: {
    query: { fetchPolicy: 'network-only' },
    watchQuery: { fetchPolicy: 'network-only' },
  },
});
