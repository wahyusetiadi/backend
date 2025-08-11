// helper.js
const formatToIndonesianTime = (utcTimestamp) => {
  if (!utcTimestamp) return null;
  
  // Pastikan timestamp dalam format yang benar
  const date = new Date(utcTimestamp);
  
  // Format ke waktu Indonesia (WIB/WITA/WIT)
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', // Untuk WIB
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Format 24 jam
  });
};

module.exports = { formatToIndonesianTime };