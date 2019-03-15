/* eslint-disable no-undef */
import Vue from 'vue'
import { createId } from '../utils'
import LookupField from './lookup-field'

const { lookups, schema } = cybozu.data.page.FORM_DATA
console.log(cybozu.data.page.FORM_DATA)

kintone.events.on('mobile.app.record.create.show', event => {
  lookups.forEach(lookup => {
    const {
      keyMapping: { fieldId },
    } = lookup
    const [baseLookup] = document.getElementsByClassName(`field-${fieldId}`)
    const field = schema.table.fieldList[fieldId]
    if (baseLookup && field) {
      createLookupViewModel(baseLookup, lookup, schema)
    }
  })
  return event
})

Object.values(schema.subTable).forEach(sub => {
  kintone.events.on(`mobile.app.record.create.change.${sub.var}`, event => {
    // TODO: サブテーブルのViewModelの増減はここでやる
    return event
  })
})

function createLookupViewModel(parent, lookup, schema) {
  const id = `js-lookup-field-${createId()}-${lookup.keyMapping.fieldId}`
  parent.insertAdjacentHTML('afterend', `<div id="${id}" />`)
  parent.style.display = 'none'
  new Vue({
    el: `#${id}`,
    data: { id, parent, lookup, schema },
    components: { 'lookup-field': LookupField },
    methods: {
      onSelect(record) {
        // TODO: このレコードを外から取得したいよね
        // EventListener -> kintone.app.record.getFieldElementがモバイルで使えない
        // EventEmitter -> イベントのインスタンスをどこに置く？window？
      },
    },
    template: `<lookup-field id="id" :parent="parent" :lookup="lookup" :schema="schema" :callback="onSelect"></lookup-field>`,
  })
}

kintone.events.on('mobile.app.record.create.change.部署', event => {
  console.log('fire!')
})
