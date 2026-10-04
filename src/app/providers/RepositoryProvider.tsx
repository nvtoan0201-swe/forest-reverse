/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createRepositories, type Repositories } from '../../data/repositories';

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({
  children,
  repositories,
}: {
  children: ReactNode;
  repositories?: Repositories;
}) {
  const value = useMemo(() => repositories ?? createRepositories(), [repositories]);
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepos(): Repositories {
  const repos = useContext(RepositoryContext);
  if (!repos) throw new Error('RepositoryProvider missing');
  return repos;
}
