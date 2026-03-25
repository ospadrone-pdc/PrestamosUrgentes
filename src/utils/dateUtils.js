export const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  
  // Handle YYYY-MM-DD format (from TO_CHAR)
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  
  // Fallback for full ISO strings or Date objects
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Use UTC methods to avoid timezone shift for "date-only" values
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};
