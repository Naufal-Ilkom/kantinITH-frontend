/**
 * Format tanggal dengan validasi
 * @param {string|Date} dateString - Tanggal dari database atau format lain
 * @returns {string} - Tanggal yang sudah diformat atau "N/A" jika invalid
 */
export const formatDate = (dateString) => {
  // Jika null atau undefined
  if (!dateString) {
    return 'N/A';
  }

  // Coba parse tanggal
  const date = new Date(dateString);

  // Cek apakah tanggal valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Return formatted date
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
