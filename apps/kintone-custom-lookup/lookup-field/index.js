import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createLookupModalViewModel } from '../lookup-field-modal'

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

export default {
  name: 'LookupField',
  data() {
    return {
      input: '',
      disabled: true,
      modal: null,
    }
  },
  props: {
    id: String,
    parent: HTMLDivElement,
    lookup: Object,
    schema: Object,
    callback: Function,
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
          this.onSelect
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
        .map(({ key, value }) => value && { target: this.targetFieldList[key.slice(1)].var, filter: value.value })

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
      } = this.lookup
      // カスタムルックアップへのフィールドコピー
      const targetField = this.targetFieldList[targetFieldId]
      this.input = record[targetField.var].value

      // オリジナルルックアップへのフィールドコピー
      const _record = kintone.mobile.app.record.get()
      const field = this.schema.table.fieldList[fieldId]
      _record.record[field.var].value = record[targetField.var].value
      _record.record[field.var].lookup = true
      kintone.mobile.app.record.set(_record)

      this.callback(record)
    },
    isExtraFilter({ value }) {
      return Object.values(this.fieldList).find(_ => _.var === value.value)
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
      return this.fieldList[fieldId]
    },
    fieldList() {
      return this.schema.table.fieldList
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
