import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createLookupModalViewModel } from '../lookup-field-modal'

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
    field: Object
  },
  created() {
    kintoneUtility.rest
      .getAllRecordsByQuery({ app: 1, query: 'order by $id asc' })
      .then(({ records }) => {
        this.modal = createLookupModalViewModel(this, `${this.id}-modal`, this.field, records)
      })
      .then(() => {
        this.disabled = false
      })
  },
  methods: {
    onSelect() {
      this.modal.onSearch(this.input)
    },
    onClear() {},
  },
  computed: {
    label() {
      return this.field.label
    },
  },
  template,
}