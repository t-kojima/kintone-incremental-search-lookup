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

const operators = {
  'SINGLE_LINE_TEXT': 'like',
  'MULTI_LINE_TEXT': 'like',
  'RICH_TEXT': 'like',
  'SINGLE_CHECK': 'in',
  'MULTIPLE_CHECK': 'in',
  'SINGLE_SELECT': 'in',
  'MULTIPLE_SELECT': 'in',
}

export function createLookupModalViewModel(id, lookup, schema, params, callback, sub) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records: [],
      input: '',
      active: false,
      extraQuery: '',
      isLoading: false,
    },
    methods: {
      getRecords() {
        this.records = []
        this.isLoading = true

        const { app, query } = params
        const queries = [this.extraQuery, this.conditions, query].filter(_ => _ && !_.startsWith('order'))
        kintoneUtility.rest
          .getRecords({ app, query: `${queries.join(' and ')} limit 100` })
          .then(({ records }) => {
            this.records = records
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
              addQuery: q => {
                this.extraQuery = q
              }
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
            return `( ${targetFieldIds.map(id => {
              const operator = operators[targetFields[id].type] || '='
              if (operator === 'in') {
                return `${targetFields[id].var} ${operator} ("${word}")`
              } else {
                return `${targetFields[id].var} ${operator} "${word}"`
              }
            }).join(' or ')} )`
          })
          .join(' and ')
      },
    },
    template,
  })
}
