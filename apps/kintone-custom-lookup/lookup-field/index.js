import kintoneUtility from 'kintone-utility'
import template from './template.html'
import style from '../../51-modern-default.min.css'
import { createLookupModalViewModel } from '../lookup-field-modal'

style.use()

// TODO 他フィールドへの反映（callback
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
    field: Object,
    callback: Function,
  },
  created() {
    kintoneUtility.rest
      .getAllRecordsByQuery({ app: this.targetAppId, query: 'order by $id asc' })
      .then(({ records }) => {
        this.modal = createLookupModalViewModel(this, `${this.id}-modal`, this.lookup, this.field, records, this.onSelect)
      })
      .then(() => {
        this.disabled = false
      })
  },
  methods: {
    openModal() {
      this.modal.onSearch(this.input)
    },
    onClear() {},
    onSelect(record) {
      const { keyMapping: { targetFieldId } } = this.lookup 
      const targetField = this.lookup.targetApp.schema.table.fieldList[targetFieldId];
      this.input = record[targetField.var].value
      // this.callback(record)
    }
  },
  computed: {
    label() {
      return this.field.label
    },
    targetAppId() {
      return this.lookup.targetApp.id
    },
  },
  template,
}
