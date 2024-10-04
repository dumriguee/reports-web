import { catchError, map, Observable, of, startWith } from 'rxjs';

interface Loading {
  state: 'loading';
}

interface Loaded<T> {
  state: 'loaded';
  data: T;
}

interface Errored {
  state: 'error';
  error: Error;
}

export type LoadingState<T = unknown> = Loading | Loaded<T> | Errored;

export function withLoadingState<T = unknown>(
  source: Observable<T>,
): Observable<LoadingState<T>> {
  return source.pipe(
    map((data) => ({ data, state: 'loaded' }) as Loaded<T>),
    startWith({ state: 'loading' } as Loading),
    catchError((error) => of({ error, state: 'error' } as Errored)),
  );
}
