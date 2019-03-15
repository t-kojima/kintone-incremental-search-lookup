/* eslint no-irregular-whitespace: ["error", {"skipRegExps": true}] */
import Vue from 'vue'
import template from './template.html'
import style from './style.scss'

style.use()

export function createLookupModalViewModel(self, id, lookup, schema, records, callback, sub) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records,
      input: '',
      active: false,
      extraFilter: [],
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
        const targetFields = lookup.targetApp.schema.table.fieldList
        return targetFieldIds.map(id => record[targetFields[id].var].value)
      },
    },
    computed: {
      filterdRecords() {
        const filterFromInput = records => {
          const words = this.input
            .replace(/　/g, ' ')
            .split(' ')
            .filter(_ => _)
          return words.length
            ? records.filter(_ => {
                const text = this.labelItems(_).join(' ')
                return words.every(word => text.includes(word))
              })
            : records
        }
        const filterFromExtra = records => {
          return this.extraFilter.length
            ? records.filter(_ => {
                const record = kintone.mobile.app.record.get().record
                const subRecord = sub && record[sub.var].value[sub.index].value
                return this.extraFilter.every(
                  extra =>
                    _[extra.target].value === (subRecord ? subRecord[extra.filter].value : record[extra.filter].value)
                )
              })
            : records
        }
        return filterFromExtra(filterFromInput(this.records))
      },
    },
    template,
  })
}
