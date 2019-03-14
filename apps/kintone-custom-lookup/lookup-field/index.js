import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createLookupModalViewModel } from '../lookup-field-modal'

// TODO フィールド名を表示しない
// TODO 必須項目にする
// TODO 絞り込みの初期設定（カスタム

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
  },
  computed: {
    label() {
      const {
        keyMapping: { fieldId },
      } = this.lookup
      return this.schema.table.fieldList[fieldId].label
    },
    targetAppId() {
      return this.lookup.targetApp.id
    },
    targetFieldList() {
      return this.lookup.targetApp.schema.table.fieldList
    },
    query() {
      // MEMO: type: 'STATUS' はサポートしない
      const isStatus = _ => this.targetFieldList[_.key.slice(1)].type === 'STATUS'
      const getValue = _ => {
        if (_.type === 'COMPARISON') {
          return `"${_.value.value}"`
        } else {
          const options = this.targetFieldList[_.key.slice(1)].properties.options
          return `(${_.values
            .map(_ => (_.value ? `"${options.find(option => option.id === _.value).label}"` : `""`))
            .join(',')})`
        }
      }
      const {
        query: { orders, condition },
      } = this.lookup
      const conditions = condition
        ? condition.children
            .filter(_ => !isStatus(_))
            .map(_ => `${this.targetFieldList[_.key.slice(1)].var} ${operators[_.op]} ${getValue(_)}`)
            .join(` ${condition.op.toLowerCase()} `)
        : ''
      const order = `order by ${orders
        .map(_ => `${this.targetFieldList[_.name.slice(1)].var} ${_.op.toLowerCase()}`)
        .join(',')}`
      console.log(`${conditions} ${order}`.trim())
      return `${conditions} ${order}`.trim()
    },
  },
  template,
}
