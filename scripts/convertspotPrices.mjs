import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const frontendRoot = path.resolve(__dirname, '..')
const rawDataDir = path.join(frontendRoot, 'raw-data')
const outputPath = path.join(frontendRoot, 'src', 'data', 'spotAssetPrices.js')

function excelSerialToISO(serial) {
  const serialNumber = Number(serial)

  if (!Number.isFinite(serialNumber)) {
    return null
  }

  const utcDays = Math.floor(serialNumber - 25569)
  const utcValue = utcDays * 86400 * 1000
  const date = new Date(utcValue)

  return date.toISOString().slice(0, 10)
}

function toISODate(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number') {
    return excelSerialToISO(value)
  }

  const text = String(value).trim()

  if (/^\d+(\.\d+)?$/.test(text)) {
    return excelSerialToISO(Number(text))
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/\$/g, '')
    .trim()

  const numberValue = Number(cleaned)

  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeKey(key) {
  return String(key)
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/\//g, '')
    .replace(/_/g, '')
}

function getValue(row, possibleKeys) {
  const rowKeys = Object.keys(row)

  for (const possibleKey of possibleKeys) {
    if (Object.prototype.hasOwnProperty.call(row, possibleKey)) {
      return row[possibleKey]
    }
  }

  const normalizedPossibleKeys = possibleKeys.map(normalizeKey)

  for (const rowKey of rowKeys) {
    if (normalizedPossibleKeys.includes(normalizeKey(rowKey))) {
      return row[rowKey]
    }
  }

  return null
}

function checkFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${filePath}`)
  }
}

function readPriceFile(fileName) {
  const filePath = path.join(rawDataDir, fileName)

  checkFileExists(filePath)

  const fileBuffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellDates: true,
  })

  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error(`${fileName} 안에 시트가 없습니다.`)
  }

  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: true,
  })

  return rows
    .map((row) => {
      const dateValue = getValue(row, ['Date', '날짜'])
      const closeValue = getValue(row, ['Close/Last', 'Close', 'Last', '종가'])
      const volumeValue = getValue(row, ['Volume', '거래량'])
      const openValue = getValue(row, ['Open', '시가'])
      const highValue = getValue(row, ['High', '고가'])
      const lowValue = getValue(row, ['Low', '저가'])

      return {
        date: toISODate(dateValue),
        close: toNumber(closeValue),
        volume: toNumber(volumeValue),
        open: toNumber(openValue),
        high: toNumber(highValue),
        low: toNumber(lowValue),
      }
    })
    .filter((row) => row.date && row.close !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

const goldPrices = readPriceFile('Gold_prices.xlsx')
const silverPrices = readPriceFile('Silver_prices.xlsx')

const fileContent = `// 이 파일은 scripts/convertSpotPrices.mjs로 자동 생성된 파일입니다.
// 원본 데이터: raw-data/Gold_prices.xlsx, raw-data/Silver_prices.xlsx

export const spotAssetMeta = {
  gold: {
    label: '금',
    unit: 'USD/oz',
  },
  silver: {
    label: '은',
    unit: 'USD/oz',
  },
}

export const spotAssetPrices = ${JSON.stringify(
  {
    gold: goldPrices,
    silver: silverPrices,
  },
  null,
  2,
)}

export default spotAssetPrices
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, fileContent, 'utf-8')

console.log('현물 자산 가격 데이터 변환 완료')
console.log('Gold rows:', goldPrices.length)
console.log('Silver rows:', silverPrices.length)
console.log('Output:', outputPath)