<script setup>
import { computed } from 'vue'
import PortfolioAllocationChart from '@/components/PortfolioAllocationChart.vue'

const props = defineProps({
  snapshot: { type: Object, default: () => ({}) },
  previewStocks: { type: Array, default: () => [] },
  previewDeposits: { type: Array, default: () => [] },
})

const stocks = computed(() => props.snapshot?.stocks?.items ?? props.previewStocks)
const deposits = computed(() => props.snapshot?.deposits?.items ?? props.previewDeposits)
const stockSummary = computed(() => props.snapshot?.stocks ?? null)
const depositSummary = computed(() => props.snapshot?.deposits ?? null)
const chartHoldings = computed(() => stocks.value.map((stock) => {
  const currentPrice = Number(stock.current_price ?? stock.currentPrice ?? 0)
  const buyPrice = Number(stock.buy_price ?? stock.buyPrice ?? 0)
  const qty = Number(stock.qty ?? 0)
  const value = Number(stock.value ?? currentPrice * qty)
  const invested = buyPrice * qty
  return {
    name: stock.name,
    value,
    returnRate: invested > 0 ? ((value - invested) / invested) * 100 : 0,
  }
}))

function won(value) {
  return `${Number(value ?? 0).toLocaleString()}원`
}

function rate(value) {
  const number = Number(value ?? 0)
  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`
}
</script>

<template>
  <div v-if="stocks.length || deposits.length" class="portfolio-card">
    <section v-if="stocks.length" class="portfolio-section">
      <div class="section-heading">
        <strong>주식 포트폴리오</strong>
        <span v-if="stockSummary">수익률 {{ stockSummary.return_rate >= 0 ? '+' : '' }}{{ stockSummary.return_rate }}%</span>
      </div>
      <PortfolioAllocationChart
        class="snapshot-chart"
        :holdings="chartHoldings"
        title="보유 종목 비중"
      />
      <div class="asset-list">
        <div v-for="(stock, index) in stocks" :key="stock.code ?? stock.id" class="asset-row stock-row">
          <div>
            <p class="asset-name">{{ stock.name }}</p>
            <p class="asset-meta">{{ stock.code }}</p>
          </div>
          <div class="holding-stat">
            <span class="stat-label">수량</span>
            <strong>{{ stock.qty }}주</strong>
          </div>
          <div class="holding-stat right">
            <span class="stat-label">수익률</span>
            <strong :class="chartHoldings[index].returnRate >= 0 ? 'positive' : 'negative'">
              {{ rate(chartHoldings[index].returnRate) }}
            </strong>
          </div>
        </div>
      </div>
      <div v-if="stockSummary" class="summary-row">
        <span>총 평가금액</span><strong>{{ won(stockSummary.total_value) }}</strong>
      </div>
    </section>

    <section v-if="deposits.length" class="portfolio-section">
      <div class="section-heading"><strong>예·적금 포트폴리오</strong></div>
      <div class="asset-list">
        <div v-for="item in deposits" :key="item.product_name ?? item.id" class="asset-row">
          <div>
            <p class="asset-name">{{ item.product_name ?? item.product?.productName }}</p>
            <p class="asset-meta">{{ item.bank_name ?? item.product?.bankName }} · {{ item.term ? `${item.term}개월` : (item.product?.term ?? '') }}</p>
          </div>
          <div class="asset-value">
            <p>{{ won(item.amount) }}</p>
            <p class="asset-meta">연 {{ item.rate ?? item.final_rate ?? item.product?.maxRate ?? 0 }}%</p>
          </div>
        </div>
      </div>
      <div v-if="depositSummary" class="summary-row">
        <span>총 가입금액</span><strong>{{ won(depositSummary.total_amount) }}</strong>
      </div>
    </section>
  </div>
</template>

<style scoped>
.portfolio-card { display: flex; flex-direction: column; gap: 14px; }
.portfolio-section { border: 1px solid #dbeafe; border-radius: 12px; overflow: hidden; background: #fff; }
.section-heading { display: flex; justify-content: space-between; padding: 11px 14px; background: #eff6ff; color: #1d4ed8; font-size: 13px; }
.asset-list { padding: 0 14px; }
.asset-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #f3f4f6; }
.stock-row { display: grid; grid-template-columns: minmax(0, 1fr) 70px 80px; }
.asset-row:last-child { border-bottom: none; }
.asset-name { font-size: 13px; font-weight: 700; color: #111827; }
.asset-meta { margin-top: 2px; font-size: 11px; color: #9ca3af; }
.asset-value { text-align: right; font-size: 13px; color: #374151; }
.snapshot-chart { padding: 14px; border-bottom: 1px solid #dbeafe; }
.holding-stat { display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
.holding-stat.right { text-align: right; }
.stat-label { font-size: 10px; color: #9ca3af; }
.positive { color: #ef4444; }
.negative { color: #2563eb; }
.summary-row { display: flex; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #dbeafe; font-size: 13px; }
</style>
