export const SSR_FETCH_BUDGET_MS = 4000;
export const SSR_METADATA_BUDGET_MS = 2000;

export const withinBudget = async <T>(
  promise: Promise<T>,
  budgetMs = SSR_FETCH_BUDGET_MS,
): Promise<T | undefined> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), budgetMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};