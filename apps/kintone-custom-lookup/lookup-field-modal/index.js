/* eslint no-irregular-whitespace: ["error", {"skipRegExps": true}] */
import Vue from 'vue'
import template from './template.html'
import style from './style.scss'

style.use()

const comparison = {
  LIKE: (target, filter) => filter ? target.includes(filter) : true,
  NOT_LIKE: (target, filter) => !target.includes(filter),
  EQ: (target, filter) => target === filter,
  NE: (target, filter) => target !== filter,
}

export function createLookupModalViewModel(self, id, lookup, schema, records, callback, sub) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records,
      input: '',
      active: false,
      // extraFilter: [],
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
        // const filterFromExtra = records => {
        //   return this.extraFilter.length
        //     ? records.filter(_ => {
        //         const record = kintone.mobile.app.record.get().record
        //         const subRecord = sub && record[sub.var].value[sub.index].value
        //         return this.extraFilter.every(({ target, filter, op }) =>
        //           comparison[op](_[target].value, subRecord ? subRecord[filter].value : record[filter].value)
        //         )
        //       })
        //     : records
        // }
        return filterFromInput(this.records)
        // return filterFromExtra(filterFromInput(this.records))
      },
    },
    template,
  })
}
