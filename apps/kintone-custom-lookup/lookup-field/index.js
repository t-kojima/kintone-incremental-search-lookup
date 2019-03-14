import kintoneUtility from 'kintone-utility'
import template from './template.html'
import style from '../../51-modern-default.min.css'
import { createLookupModalViewModel } from '../lookup-field-modal'

style.use()

// TODO query order by
// TODO クリア

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
    lookup: Object,
    schema: Object,
    callback: Function,
  },
  created() {
    kintoneUtility.rest
      .getAllRecordsByQuery({ app: this.targetAppId, query: 'order by $id asc' })
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
      // TODO: CLEAR
    },
    onSelect(record) {
      const {
        keyMapping: { fieldId, targetFieldId },
        fieldMappings,
        targetApp: {
          schema: {
            table: { fieldList },
          },
        },
      } = this.lookup
      // カスタムルックアップへのフィールドコピー
      const targetField = fieldList[targetFieldId]
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
      const {
        table: { fieldList },
      } = this.schema
      return fieldList[fieldId].label
    },
    targetAppId() {
      return this.lookup.targetApp.id
    },
  },
  template,
}
