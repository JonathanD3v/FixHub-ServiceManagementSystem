class DashboardPresenter {
  constructor(stats) {
    this.stats = stats || {};
  }

  money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  get todaySales() {
    return Number(this.stats?.sales?.today?.total || 0);
  }

  get monthlySales() {
    return Number(this.stats?.sales?.monthly?.total || 0);
  }

  get averageOrderValue() {
    const count = Number(this.stats?.sales?.monthly?.count || 0);
    if (!count) return 0;
    return this.monthlySales / count;
  }

  get inventoryRiskPercent() {
    const total = Number(this.stats?.products?.total || 0);
    const lowStock = Number(this.stats?.products?.lowStock || 0);
    if (!total) return 0;
    return (lowStock / total) * 100;
  }

  get facts() {
    return [
      `Average order value this month: ${this.money(this.averageOrderValue)}`,
      `${Number(this.stats?.products?.lowStock || 0)} products need restocking soon`,
      `${Number(this.stats?.sales?.monthly?.count || 0)} completed orders in the last 30 days`,
      `Inventory risk level: ${this.inventoryRiskPercent.toFixed(1)}%`,
    ];
  }
}

export default DashboardPresenter;
