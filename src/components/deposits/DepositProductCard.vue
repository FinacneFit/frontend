<script setup>
import DepositTooltip from './DepositTooltip.vue'
import DepositDetailPanel from './DepositDetailPanel.vue'

const props = defineProps({
  product: { type: Object, required: true },
  isExpanded: { type: Boolean, default: false },
  isSaved: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle', 'save'])

const TYPE_LABEL = { deposit: '예금', savings: '적금' }
const TYPE_STYLE = { deposit: 'tag-deposit', savings: 'tag-savings' }
</script>

<template>
  <div class="product-card" :class="{ expanded: isExpanded }">
    <div class="card-main">
      <!-- 왼쪽: 상품 정보 -->
      <div class="card-left">
        <div class="card-title-row">
          <span class="type-tag" :class="TYPE_STYLE[product.productType]">
            {{ TYPE_LABEL[product.productType] }}
          </span>
          <span class="bank-name">{{ product.bankName }}</span>
        </div>
        <h3 class="product-name">{{ product.productName }}</h3>
        <p class="product-desc">{{ product.description }}</p>
        <div class="join-meta">
          <span class="meta-item">가입기간 {{ product.joinPeriod }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-item">{{ product.joinWay }}</span>
        </div>
      </div>

      <!-- 오른쪽: 금리 + 버튼 -->
      <div class="card-right">
        <div class="rate-group">
          <div class="rate-item">
            <span class="rate-label">
              기본금리
              <DepositTooltip text="우대 조건 없이 적용되는 기본 이자율입니다." />
            </span>
            <span class="rate-value base">{{ product.baseRate }}<em>%</em></span>
          </div>
          <div class="rate-divider" />
          <div class="rate-item">
            <span class="rate-label">
              최고금리
              <DepositTooltip text="우대 조건을 모두 충족했을 때 받을 수 있는 최고 이자율입니다." />
            </span>
            <span class="rate-value max">{{ product.maxRate }}<em>%</em></span>
          </div>
        </div>

        <div class="card-actions">
          <button
            class="btn-detail"
            :class="{ active: isExpanded }"
            @click="emit('toggle')"
          >
            {{ isExpanded ? '접기' : '상세보기' }}
          </button>
          <button
            class="btn-save"
            :class="{ saved: isSaved }"
            @click="emit('save')"
          >
            {{ isSaved ? '저장됨' : '관심 저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 상세 패널 (확장 시) -->
    <Transition name="slide">
      <DepositDetailPanel v-if="isExpanded" :product="product" />
    </Transition>
  </div>
</template>

<style scoped>
.product-card {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  border-color: #c7d9fd;
  box-shadow: 0 4px 16px rgba(27, 120, 253, 0.08);
}
.product-card.expanded {
  border-color: #1b78fd;
  box-shadow: 0 4px 20px rgba(27, 120, 253, 0.12);
}

.card-main {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 22px 24px;
}

/* ── 왼쪽 ── */
.card-left {
  flex: 1;
  min-width: 0;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.type-tag {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.tag-deposit {
  background: #dbeafe;
  color: #1d4ed8;
}
.tag-savings {
  background: #dcfce7;
  color: #166534;
}
.bank-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #9ca3af;
}
.product-name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}
.product-desc {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.5;
  word-break: keep-all;
}
.join-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.meta-item {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #9ca3af;
}
.meta-sep { color: #d1d5db; }

/* ── 오른쪽 ── */
.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  flex-shrink: 0;
}
.rate-group {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.rate-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 11px;
  color: #9ca3af;
}
.rate-value {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #374151;
}
.rate-value em {
  font-size: 14px;
  font-weight: 500;
  font-style: normal;
  margin-left: 1px;
}
.rate-value.max {
  color: #1b78fd;
}
.rate-divider {
  width: 1px;
  height: 36px;
  background: #e5e7eb;
}

.card-actions {
  display: flex;
  gap: 8px;
}
.btn-detail {
  height: 36px;
  padding: 0 16px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-detail:hover, .btn-detail.active {
  border-color: #1b78fd;
  color: #1b78fd;
}
.btn-save {
  height: 36px;
  padding: 0 16px;
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
}
.btn-save:hover { opacity: 0.88; }
.btn-save.saved {
  background: #e5e7eb;
  color: #6b7280;
  cursor: default;
}

/* ── 상세 슬라이드 ── */
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.28s ease, opacity 0.2s ease;
  max-height: 600px;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
