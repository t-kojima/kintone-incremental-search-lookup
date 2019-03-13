import kintoneUtility from 'kintone-utility'
import template from './template.html'
import style from '../../51-modern-default.min.css'
import { createLookupModalViewModel } from '../lookup-field-modal'

style.use()

const callback = () => {}

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
  },
  created() {
    kintoneUtility.rest
      .getAllRecordsByQuery({ app: this.targetAppId, query: 'order by $id asc' })
      .then(({ records }) => {
        this.modal = createLookupModalViewModel(this, `${this.id}-modal`, this.lookup, this.field, records, callback)
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
    targetAppId() {
      return this.lookup.targetApp.id
    },
  },
  template,
}
