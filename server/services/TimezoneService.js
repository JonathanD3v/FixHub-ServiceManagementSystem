class TimezoneService {
  static DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Yangon";
  static YANGON_OFFSET = "+06:30";

  static getDatePartsInTimezone(date = new Date(), timeZone = this.DEFAULT_TIMEZONE) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    return { year, month, day };
  }

  static getYangonDayRange(date = new Date()) {
    const { year, month, day } = this.getDatePartsInTimezone(date, "Asia/Yangon");
    const startUtc = new Date(`${year}-${month}-${day}T00:00:00${this.YANGON_OFFSET}`);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
    return { startUtc, endUtc };
  }

  static getPastDaysStart(days = 30, fromDate = new Date()) {
    const { startUtc } = this.getYangonDayRange(fromDate);
    return new Date(startUtc.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  }

  static formatForApi(date) {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Yangon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(date));
  }
}

module.exports = TimezoneService;
