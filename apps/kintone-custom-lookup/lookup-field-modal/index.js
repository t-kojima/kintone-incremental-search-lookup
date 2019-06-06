/* eslint no-irregular-whitespace: ["error", {"skipRegExps": true}] */
import Vue from 'vue'
import { toast } from 'bulma-toast'
import template from './template.html'
import bulma from '../../bulma.scss'
import style from './style.scss'
import loader from '../loader.css'
import kintoneUtility from 'kintone-utility'

bulma.use()
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
      isLoading: false,
    },
    methods: {
      getRecords() {
        this.records = []
        this.isLoading = true

        const { app, query } = params
        kintoneUtility.rest
          .getRecords({ app, query: `${this.conditions} ${query} limit 100` })
          .then(({ records }) => {
            this.records = this.extraFilter ? this.extraFilter(records) : records
            toast({
              message: `<h2>取得件数 ${this.records.length} 件</h2>`,
              type: 'is-link',
              position: 'bottom-center',
            })
            this.isLoading = false
          })
          .catch(({ message }) => {
            toast({
              message: `<h2>${message}</h2>`,
              type: 'is-danger',
              position: 'bottom-center',
            })
            this.isLoading = false
          })
      },
      onClickItem(record) {
        const [element] = document.getElementsByClassName(this.fieldCode)
        element.dispatchEvent(new CustomEvent('select-item', { detail: { record } }))
        callback(record)
        this.active = false
      },
      open(value) {
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
        this.getRecords()
        this.active = true
      },
      search() {
        this.getRecords()
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
      conditions() {
        const words = this.input
          .replace(/　/g, ' ')
          .split(' ')
          .filter(_ => _)
        const targetFieldIds = [lookup.keyMapping.targetFieldId, ...lookup.listFields]
        targetFieldIds.pop()
        const targetFields = lookup.targetApp.schema.table.fieldList
        return words
          .map(word => {
            return `( ${targetFieldIds
              .filter(id => targetFields[id].type === 'SINGLE_LINE_TEXT')
              .map(id => `${targetFields[id].var} like "${word}"`)
              .join(' or ')} )`
          })
          .join(' and ')
      },
    },
    template,
  })
}
