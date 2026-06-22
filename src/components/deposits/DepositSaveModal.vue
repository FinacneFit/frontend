<script setup>
import { computed, ref } from 'vue'
import { useDepositStore } from '@/stores/depositStore'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'saved'])

const depositStore = useDepositStore()

const amount = ref(1000000)
const selectedTerm = ref(props.product.term ?? '12개월')
const selectedOptionIndex = ref(0)
const memo = ref('')
const isSubmitting = ref(false)

const options = computed(() => {
  return Array.isArray(props.product.options) ? props.product.options : []
})

const selectedOption = computed(() => {
  if (options.value.length === 0) {
    return null
  }

  return options.value[selectedOptionIndex.value] ?? options.value[0]
})

const finalRate = computed(() => {
  if (selectedOption.value) {
    return Number(selectedOption.value.maxRate || selectedOption.value.baseRate || 0)
  }

  return Number(props.product.maxRate || props.product.baseRate || 0)
})

const expectedInterest = computed(() => {
  const principal = Number(amount.value) || 0
  const rate = Number(finalRate.value) || 0
  const months = termToMonths(selectedTerm.value)

  return Math.floor(principal * (rate / 100) * (months / 12))
})

const expectedTotal = computed(() => {
  return (Number(amount.value) || 0) + expectedInterest.value
})

function termToMonths(term) {
  return Number(String(term).replace('개월', '')) || 12
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`
}

function formatRate(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function onOptionChange() {
  const option = selectedOption.value

  if (option?.period) {
    selectedTerm.value = option.period
  }
}

async function submit() {
  if (!amount.value || Number(amount.value) <= 0) {
    return
  }

  isSubmitting.value = true

  try {
    await depositStore.saveProduct(props.product.id, {
      amount: Number(amount.value),
      final_rate: Number(finalRate.value),
      memo: memo.value,
    })

    emit('saved', props.product.productName)
    emit('close')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section class="modal-card">
      <header class="modal-header">
        <div>
          <p class="eyebrow">예금·적금 포트폴리오</p>
          <h2>상품 담기</h2>
        </div>

        <button class="close-btn" type="button" @click="emit('close')">×</button>
      </header>

      <div class="product-summary">
        <div>
          <p class="bank-name">{{ product.bankName }}</p>
          <h3>{{ product.productName }}</h3>
        </div>

        <span class="rate-badge">최고 {{ formatRate(product.maxRate) }}</span>
      </div>

      <div class="form-grid">
        <label class="form-field">
          <span>가입 금액</span>
          <input
            v-model.number="amount"
            type="number"
            min="10000"
            step="10000"
            placeholder="가입 금액을 입력하세요"
          />
        </label>

        <label v-if="options.length > 0" class="form-field">
          <span>금리 옵션</span>
          <select v-model.number="selectedOptionIndex" @change="onOptionChange">
            <option
              v-for="(option, index) in options"
              :key="`${option.period}-${option.interestType}-${index}`"
              :value="index"
            >
              {{ option.period }} / {{ option.interestType }} / 최고 {{ formatRate(option.maxRate) }}
            </option>
          </select>
        </label>

        <label v-else class="form-field">
          <span>가입 기간</span>
          <input v-model="selectedTerm" type="text" />
        </label>

        <label class="form-field full">
          <span>메모</span>
          <textarea
            v-model="memo"
            rows="3"
            placeholder="선택 사항입니다. 예: 비상금 목적, 단기 목돈 운용 등"
          />
        </label>
      </div>

      <div class="estimate-box">
        <div>
          <span>적용 금리</span>
          <strong>{{ formatRate(finalRate) }}</strong>
        </div>

        <div>
          <span>예상 이자</span>
          <strong>{{ formatWon(expectedInterest) }}</strong>
        </div>

        <div>
          <span>예상 만기 금액</span>
          <strong>{{ formatWon(expectedTotal) }}</strong>
        </div>
      </div>

      <footer class="modal-actions">
        <button class="cancel-btn" type="button" @click="emit('close')">
          취소
        </button>

        <button
          class="submit-btn"
          type="button"
          :disabled="isSubmitting || !amount || Number(amount) <= 0"
          @click="submit"
        >
          {{ isSubmitting ? '저장 중...' : '포트폴리오에 담기' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.42);
}

.modal-card {
  width: min(560px, 100%);
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 26px 18px;
  border-bottom: 1px solid #eef2f7;
}

.eyebrow {
  margin: 0 0 6px;
  color: #1b78fd;
  font-size: 12px;
  font-weight: 800;
}

.modal-header h2 {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 800;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  background: #e2e8f0;
}

.product-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 20px 26px;
  border-bottom: 1px solid #eef2f7;
}

.bank-name {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.product-summary h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.4;
}

.rate-badge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 7px 12px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 13px;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 22px 26px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-field.full {
  grid-column: 1 / -1;
}

.form-field span {
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  border: 1px solid #dbe3ec;
  border-radius: 12px;
  background: #fff;
  color: #111827;
  padding: 11px 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  outline: none;
}

.form-field textarea {
  resize: vertical;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  border-color: #1b78fd;
  box-shadow: 0 0 0 3px rgba(27, 120, 253, 0.12);
}

.estimate-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin: 0 26px 22px;
  border: 1px solid #dbe3ec;
  border-radius: 16px;
  overflow: hidden;
}

.estimate-box div {
  padding: 16px 12px;
  text-align: center;
  border-right: 1px solid #dbe3ec;
}

.estimate-box div:last-child {
  border-right: 0;
}

.estimate-box span {
  display: block;
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.estimate-box strong {
  color: #1b78fd;
  font-size: 15px;
  font-weight: 800;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 26px 24px;
  border-top: 1px solid #eef2f7;
}

.cancel-btn,
.submit-btn {
  border: 0;
  border-radius: 12px;
  padding: 11px 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
}

.submit-btn {
  background: #1b78fd;
  color: #fff;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-grid,
  .estimate-box {
    grid-template-columns: 1fr;
  }

  .estimate-box div {
    border-right: 0;
    border-bottom: 1px solid #dbe3ec;
  }

  .estimate-box div:last-child {
    border-bottom: 0;
  }

  .product-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .modal-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>