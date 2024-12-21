export const pagination = (query: any) => {
  
  const page = query.page ? Number(query.page) : 1;

  const PAGE_SIZE = query.limit ? Number(query.limit) : 20;

  const offset = (page - 1) * PAGE_SIZE;

  const limit = PAGE_SIZE;

  return {
    offset,
    limit
  }
}



export const paginated_data = (items: any, current_page: number, per_page_items: number) => {
  const page: number = +current_page > 0 ? +current_page : 1;
  const per_page: number = +per_page_items || 20;
  const offset = (page - 1) * per_page;
  const paginatedItems = items.slice(offset).slice(0, per_page_items);
  const total_pages = Math.ceil(items.length / per_page);

  return {
    docs: paginatedItems,
    totalDocs: items.length,
    page: page,
    limit: per_page,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: (total_pages > page) ? page + 1 : null,
    totalPages: total_pages,
    hasPrevPage: !!(page - 1),
    hasNextPage: (total_pages > page),
  };
};
