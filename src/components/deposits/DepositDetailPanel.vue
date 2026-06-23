<script setup>
defineProps({
  product: { type: Object, required: true },
})
</script>

<template>
  <div class="detail-panel">
    <div class="detail-item">
      <span>은행 최종 공시일</span>
      <strong>{{ product.disclosureDate }}</strong>
    </div>
    <div class="detail-item">
      <span>만기 후 금리</span>
      <strong>{{ product.afterMaturityRate }}</strong>
    </div>
    <div class="detail-item">
      <span>가입제한</span>
      <strong>{{ product.restriction }}</strong>
    </div>
    <div class="detail-item">
      <span>가입대상</span>
      <strong>{{ product.target }}</strong>
    </div>
    <div class="detail-item">
      <span>기타 유의사항</span>
      <strong>{{ product.note }}</strong>
    </div>
    <div class="detail-item">
      <span>최고 한도</span>
      <strong>{{ product.maxLimit }}</strong>
    </div>
  </div>
</template>

<style scoped>
.detail-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 32px;
}
.detail-item {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 14px;
  align-items: start;
}
.detail-item span {
  font-family: 'Noto Sans KR', sans-serif;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 400;
  padding-top: 1px;
}
.detail-item strong {
  font-family: 'Noto Sans KR', sans-serif;
  color: #374151;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
}
</style>
