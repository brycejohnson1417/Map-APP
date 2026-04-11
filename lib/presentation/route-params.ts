export async function resolveRouteParams<T>(params: Promise<T> | T): Promise<T> {
  return Promise.resolve(params);
}
