import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createLookupModalViewModel } from '../lookup-field-modal'
import { simulateMouseClick } from '../../utils'

const operators = {
  LIKE: 'like',
  NOT_LIKE: 'not like',
  EQ: '=',
  NE: '!=',
  LE: '<=',
  GE: '>=',
  IN: 'in',
  NOT_IN: 'not in',
}

const globalState = {
  // アクティブ（モーダルが開いてる）ルックアップ
  activeLookup: null,
  selectedId: null,
}

new MutationObserver(() => {
  const { activeLookup: lookup, selectedId } = globalState
  const [dialog] = document.getElementsByClassName('gaia-mobile-navigationcontroller gaia-mobile-ui-forms-lookupdialog')
  if (dialog && !dialog.className.includes('custom-modal') && lookup) {
    dialog.style.display = 'none'
    const fieldId = lookup.listFields[lookup.listFields.length - 1]

    const searchRecoedWithNextPage = (fieldId) => {
      const records = document.getElementsByClassName('gaia-mobile-app-lookuplist-record')
      const record = Array.from(records).find(record => {
        const [row] = record.getElementsByClassName(`value-${fieldId}`)
        return row.textContent === selectedId
      })
      if (record) {
        simulateMouseClick(record)
        lookup.listFields.pop()
      } else {
        const button = document.getElementsByClassName('gaia-mobile-ui-barbutton')[3]
        if (!button.className.includes('button-disabled-gaia')) {
          simulateMouseClick(button)
        } else {
          console.log(button.className)
        }
      }
    }

    new MutationObserver(mutationRecords => {
      const node = mutationRecords[0].removedNodes[0]
      if (node && node.className === 'cybozu-ui-loading-outer') {
        searchRecoedWithNextPage(fieldId)
      }
    }).observe(dialog, { childList: true })

    searchRecoedWithNextPage(fieldId)
  }
}).observe(document.getElementById('main'), { childList: true })

export default {
  name: 'LookupField',
  data() {
    return {
      input: '',
      disabled: true,
      modal: null,
      condition: null,
    }
  },
  props: {
    id: String,
    parent: HTMLDivElement,
    lookup: Object,
    schema: Object,
    callback: Function,
    sub: Object,
  },
  created() {
    kintoneUtility.rest
      .getAllRecordsByQuery({ app: this.targetAppId, query: this.query })
      .then(({ records }) => {
        this.modal = createLookupModalViewModel(
          this,
          `${this.id}-modal`,
          this.lookup,
          this.schema,
          records,
          this.onSelect,
          this.sub
        )
      })
      .then(() => {
        this.disabled = false
      })
  },
  methods: {
    openModal() {
      const {
        query: { condition },
      } = this.lookup
      const children = condition ? (condition.children ? condition.children : [condition]) : []
      // 拡張フィルタをモーダルに設定
      this.modal.extraFilter = children
        .filter(_ => this.isExtraFilter(_))
        .map(
          ({ key, op, value }) => value && { target: this.targetFieldList[key.slice(1)].var, filter: value.value, op }
        )

      globalState.activeLookup = this.lookup
      this.modal.onSearch(this.input)
    },
    onClear() {
      this.input = ''
      const [clear] = this.parent.getElementsByClassName('forms-lookup-clear-gaia')
      clear.click()

      this.callback()
    },
    onSelect(record) {
      const {
        keyMapping: { fieldId, targetFieldId },
        query,
      } = this.lookup
      // カスタムルックアップへのフィールドコピー
      const targetField = this.targetFieldList[targetFieldId]
      this.input = record[targetField.var].value

      // オリジナルルックアップへのフィールドコピー（確定はできなくとも絞り込み）
      const _record = kintone.mobile.app.record.get()
      const field = this.fieldList[fieldId] || this.subFieldList[fieldId]
      if (this.sub) {
        const values = _record.record[this.sub.var].value
        values[this.sub.index].value[field.var].value = record[targetField.var].value
        // values[this.sub.index].value[field.var].lookup = true
      } else {
        _record.record[field.var].value = record[targetField.var].value
        // _record.record[field.var].lookup = true
      }
      kintone.mobile.app.record.set(_record)

      // オリジナルルックアップへのボタンをクリック、MutationObserverで値を挿入
      // this.condition = query.condition
      const key = Object.values(this.targetFieldList).find(({ type }) => type === 'RECORD_ID').id
      // query.condition = {
      //   key,
      //   nest: 0,
      //   op: 'EQ',
      //   type: 'COMPARISON',
      //   value: { args: null, type: 'STRING', value: record.$id.value },
      // }
      this.lookup.listFields.push(key)
      globalState.selectedId = record.$id.value
      // this.lookup.query.condition = null
      const [button] = this.parent.getElementsByClassName('forms-lookup-lookup-gaia')
      button.click()

      this.callback(record)
    },
    isExtraFilter({ value }) {
      return (
        Object.values(this.fieldList).find(_ => _.var === value.value) ||
        (this.subFieldList && Object.values(this.subFieldList).find(_ => _.var === value.value))
      )
    },
  },
  computed: {
    label() {
      return this.field.label
    },
    required() {
      return JSON.parse(this.field.properties.required)
    },
    noLabel() {
      return JSON.parse(this.field.properties.noLabel)
    },
    field() {
      const {
        keyMapping: { fieldId },
      } = this.lookup
      return this.fieldList[fieldId] || this.subFieldList[fieldId]
    },
    fieldList() {
      return this.schema.table.fieldList
    },
    subFieldList() {
      return this.sub && this.schema.subTable[this.sub.id].fieldList
    },
    targetAppId() {
      return this.lookup.targetApp.id
    },
    targetFieldList() {
      return this.lookup.targetApp.schema.table.fieldList
    },
    query() {
      // MEMO: type: 'STATUS' はサポートしない
      const isStatus = ({ key }) => this.targetFieldList[key.slice(1)].type === 'STATUS'
      const getValue = ({ key, type, value, values }) => {
        if (type === 'COMPARISON') {
          return `"${value.value}"`
        } else {
          const options = this.targetFieldList[key.slice(1)].properties.options
          return `(${values
            .map(_ => (_.value ? `"${options.find(option => option.id === _.value).label}"` : `""`))
            .join(',')})`
        }
      }
      const {
        query: { orders, condition },
      } = this.lookup
      const children = condition ? (condition.children ? condition.children : [condition]) : []
      const conditions = children
        .filter(_ => !isStatus(_) && !this.isExtraFilter(_))
        .map(_ => `${this.targetFieldList[_.key.slice(1)].var} ${operators[_.op]} ${getValue(_)}`)
        .join(` ${condition && condition.op.toLowerCase()} `)
      const order = `order by ${orders
        .map(_ => `${this.targetFieldList[_.name.slice(1)].var} ${_.op.toLowerCase()}`)
        .join(',')}`
      return `${conditions} ${order}`.trim()
    },
  },
  template,
}
