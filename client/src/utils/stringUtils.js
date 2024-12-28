export function formatNumber(num) { 

  const preProcessNum = typeof num === 'string' ? parseFloat(num) : num;

  return preProcessNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function convertToUTCWithLocalTimezone(dateString, isStartOfDay = true) {
  // Get the local time zone offset in minutes
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

  // Convert the offset to ±HH:mm format
  const offsetSign = timezoneOffsetMinutes <= 0 ? "+" : "-";
  const offsetHours = String(Math.floor(Math.abs(timezoneOffsetMinutes) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(timezoneOffsetMinutes) % 60).padStart(2, "0");
  const localTimezone = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  // Create the ISO string with the local time zone
  const time = isStartOfDay ? "T00:00:00" : "T23:59:59";
  const localDateString = `${dateString}${time}${localTimezone}`;

  // Convert to UTC
  const utcDate = new Date(localDateString);
  return utcDate.toISOString();
}