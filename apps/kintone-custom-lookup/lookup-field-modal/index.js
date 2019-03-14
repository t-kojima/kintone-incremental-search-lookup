import Vue from 'vue'
import template from './template.html'
import style from './style.scss'

style.use()

// TODO デフォルトのフィルタ
// TODO order by

export function createLookupModalViewModel(self, id, lookup, schema, records, callback) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records,
      input: '',
      active: false,
    },
    methods: {
      onClickItem(record) {
        callback(record)
        this.active = false
      },
      onSearch(value) {
        this.input = value
        this.active = true
      },
      close() {
        this.active = false
      },
      labelItems(record) {
        const targetFieldIds = [lookup.keyMapping.targetFieldId, ...lookup.listFields]
        const targetFields = lookup.targetApp.schema.table.fieldList;
        return targetFieldIds.map(id => record[targetFields[id].var].value)
      },
    },
    computed: {
      filterdRecords() {
        const words = this.input
          .replace(/　/g, ' ')
          .split(' ')
          .filter(_ => _)
        return words.length
          ? this.records.filter(_ => {
              const text = this.labelItems(_).join(' ')
              return words.every(word => text.includes(word))
            })
          : this.records
      },
    },
    template,
  })
}
