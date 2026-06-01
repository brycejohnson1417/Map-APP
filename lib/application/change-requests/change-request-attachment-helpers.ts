export interface SignedUrlAttachmentInput {
  id: string;
  storagePath: string;
}

export interface SignedUrlBatchResult {
  path?: string | null;
  signedUrl?: string | null;
  signedURL?: string | null;
  error?: unknown;
}

function resultSignedUrl(result: SignedUrlBatchResult | null | undefined) {
  if (!result || result.error) {
    return null;
  }

  return result.signedUrl ?? result.signedURL ?? null;
}

export function createAttachmentSignedUrlMap(
  attachments: SignedUrlAttachmentInput[],
  results: SignedUrlBatchResult[] | null | undefined,
) {
  const urlByPath = new Map<string, string | null>();
  for (const result of results ?? []) {
    if (result?.path) {
      urlByPath.set(result.path, resultSignedUrl(result));
    }
  }

  return new Map(
    attachments.map((attachment, index) => [
      attachment.id,
      urlByPath.has(attachment.storagePath)
        ? urlByPath.get(attachment.storagePath) ?? null
        : resultSignedUrl(results?.[index]),
    ]),
  );
}

export async function runBoundedAttachmentTasks<Item, Result>(
  items: Item[],
  concurrency: number,
  task: (item: Item, index: number) => Promise<Result>,
) {
  const results: PromiseSettledResult<Result>[] = Array.from({ length: items.length });
  const workerCount = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        try {
          results[index] = {
            status: "fulfilled",
            value: await task(items[index], index),
          };
        } catch (reason) {
          results[index] = {
            status: "rejected",
            reason,
          };
        }
      }
    }),
  );

  return results;
}
