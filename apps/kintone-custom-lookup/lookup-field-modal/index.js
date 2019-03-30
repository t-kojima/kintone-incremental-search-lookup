/* eslint no-irregular-whitespace: ["error", {"skipRegExps": true}] */
import Vue from 'vue'
import template from './template.html'
import style from './style.scss'
import loader from '../loader.css'
import kintoneUtility from 'kintone-utility'

style.use()
loader.use()

export function createLookupModalViewModel(id, lookup, schema, params, callback, sub) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records: [],
      input: '',
      active: false,
      extraFilter: null,
      isLoading: true,
    },
    created() {
      this.getRecords()
    },
    methods: {
      getRecords(offset) {
        const { app, query } = params
        kintoneUtility.rest
          .getRecords({ app, query: `${query} limit 500 offset ${offset || 0}` })
          .then(({ records }) => {
            this.records.push(...records)
            if (records.length) {
              this.getRecords((offset || 0) + records.length)
            } else {
              this.isLoading = false
            }
          })
      },
      onClickItem(record) {
        const [element] = document.getElementsByClassName(this.fieldCode)
        element.dispatchEvent(new CustomEvent('select-item', { detail: { record } }))
        callback(record)
        this.active = false
      },
      onSearch(value) {
        const [element] = document.getElementsByClassName(this.fieldCode)
        element.dispatchEvent(
          new CustomEvent('open-modal', {
            detail: {
              setFilter: f => {
                this.extraFilter = f
              },
            },
          })
        )
        this.input = value
        this.active = true
      },
      close() {
        this.active = false
      },
      labelItems(record) {
        const targetFieldIds = [lookup.keyMapping.targetFieldId, ...lookup.listFields]
        const targetFields = lookup.targetApp.schema.table.fieldList
        targetFieldIds.pop()
        return targetFieldIds.map(id => record[targetFields[id].var].value)
      },
    },
    computed: {
      fieldCode() {
        const fieldId = lookup.keyMapping.fieldId
        const fieldList = sub ? schema.subTable[sub.id].fieldList : schema.table.fieldList
        return fieldList[fieldId].var
      },
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
        return this.extraFilter ? this.extraFilter(filterFromInput(this.records)) : filterFromInput(this.records)
      },
    },
    template,
  })
}
