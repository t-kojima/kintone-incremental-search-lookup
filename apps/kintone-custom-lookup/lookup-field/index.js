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

function beforeSelectAction(lookup, id) {
  const fieldList = lookup.targetApp.schema.table.fieldList
  const fieldId = Object.values(fieldList).find(({ type }) => type === 'RECORD_ID').id
  lookup.listFields.push(fieldId)
  globalState.selectedId = id
  globalState.activeLookup = lookup
}

function afterSelectAction(lookup) {
  lookup.listFields.pop()
  globalState.selectedId = null
  globalState.activeLookup = null
}

function searchRecoedFromAllPages(dialog, fieldId) {
  const { activeLookup: lookup, selectedId } = globalState
  const records = dialog.getElementsByClassName('gaia-mobile-app-lookuplist-record')
  const record = Array.from(records).find(record => {
    const [row] = record.getElementsByClassName(`value-${fieldId}`)
    return row && row.textContent === selectedId
  })
  if (record) {
    simulateMouseClick(record)
    afterSelectAction(lookup)
  } else {
    const [left] = dialog.getElementsByClassName('navigation-header-left')
    const button = left.getElementsByClassName('gaia-mobile-ui-barbutton')[1]
    if (button && !button.className.includes('button-disabled-gaia')) {
      simulateMouseClick(button)
    } else {
      afterSelectAction(lookup)
    }
  }
}

new MutationObserver(() => {
  const { activeLookup: lookup } = globalState
  const [dialog] = document.getElementsByClassName('gaia-mobile-navigationcontroller gaia-mobile-ui-forms-lookupdialog')
  if (dialog && !dialog.className.includes('custom-modal') && lookup) {
    dialog.style.display = 'none'
    const fieldId = lookup.listFields[lookup.listFields.length - 1]

    new MutationObserver(mutationRecords => {
      const node = mutationRecords[0].removedNodes[0]
      if (node && node.className === 'cybozu-ui-loading-outer') {
        // 2ページ目以降の検索
        searchRecoedFromAllPages(dialog, fieldId)
      }
    }).observe(dialog, { childList: true })

    // 1ページ目の検索
    searchRecoedFromAllPages(dialog, fieldId)
  }
}).observe(document.getElementById('main'), { childList: true })

export default {
  name: 'LookupField',
  data() {
    return {
      input: '',
      modal: null,
      condition: null,
    }
  },
  props: {
    id: String,
    parent: HTMLDivElement,
    lookup: Object,
    schema: Object,
    value: String,
    sub: Object,
  },
  created() {
    this.input = this.value
    this.modal = createLookupModalViewModel(
      `${this.id}-modal`,
      this.lookup,
      this.schema,
      { app: this.targetAppId, query: this.query },
      this.onSelect,
      this.sub
    )
  },
  methods: {
    openModal() {
      this.modal.onSearch(this.input)
    },
    onClear() {
      this.input = ''
      const [clear] = this.parent.getElementsByClassName('forms-lookup-clear-gaia')
      clear.click()
    },
    onSelect(record) {
      const {
        keyMapping: { targetFieldId },
      } = this.lookup
      // カスタムルックアップへのフィールドコピー
      const targetField = this.targetFieldList[targetFieldId]
      this.input = record[targetField.var].value

      beforeSelectAction(this.lookup, record.$id.value)
      const [button] = this.parent.getElementsByClassName('forms-lookup-lookup-gaia')
      button.click()
    },
  },
  computed: {
    label() {
      return this.field.label
    },
    fieldCode() {
      return this.field.var
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
        .filter(_ => !isStatus(_))
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
