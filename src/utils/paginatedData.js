export function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

export async function loadAllPages(fetchPage) {
  const firstResponse = await fetchPage(1)
  const items = extractItems(firstResponse)
  const lastPage = Number(firstResponse?.meta?.last_page ?? 1)
  const pageCount = Number.isFinite(lastPage) ? Math.max(lastPage, 1) : 1

  for (let page = 2; page <= pageCount; page += 1) {
    const response = await fetchPage(page)
    items.push(...extractItems(response))
  }

  return items
}
