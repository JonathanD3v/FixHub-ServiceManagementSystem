class DateTimeFormatter {
  static YANGON_TZ = "Asia/Yangon";

  static formatDate(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: this.YANGON_TZ,
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(date));
  }

  static formatDateTime(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: this.YANGON_TZ,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(date));
  }
}

export default DateTimeFormatter;
